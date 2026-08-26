import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { desc, eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

const SOURCES = ['return', 'warranty', 'defect', 'exchange_pickup'] as const;
const REVIEW_ACTIONS = ['restock', 'vendor_return', 'scrap'] as const;

interface IntakeBody {
  variantId?: string;
  locationId?: string;
  quantity?: number;
  source?: (typeof SOURCES)[number];
  notes?: string | null;
}

interface ReviewBody {
  action?: (typeof REVIEW_ACTIONS)[number];
  /**
   * Restock target — defaults to the item's own variant; pass the
   * matching `-AS` variant to move it into as-is stock instead.
   */
  targetVariantId?: string;
  notes?: string | null;
}

interface AsIsRow {
  id: string;
  variantId: string;
  productName: string | null;
  variantName: string | null;
  sku: string | null;
  locationId: string;
  locationName: string | null;
  quantity: number;
  source: string;
  status: string;
  referenceType: string | null;
  referenceId: string | null;
  restockedVariantId: string | null;
  notes: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

/**
 * The As-Is review queue (PLAN-POS-OPERATIONS §10): returned,
 * warranty, and defect units wait here — outside sellable stock —
 * until a manager or warehouse reviews them. Disposition: restock
 * (same variant or the `-AS` variant), return to vendor, or scrap.
 */
@TenantScoped()
@Controller('v1/as-is')
export class AsIsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('inventory.view')
  async list(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('status') status?: string,
  ): Promise<AsIsRow[]> {
    const rows = await this.db
      .select({
        id: schema.asIsItems.id,
        variantId: schema.asIsItems.variantId,
        productName: schema.products.name,
        variantName: schema.productVariants.name,
        sku: schema.productVariants.sku,
        locationId: schema.asIsItems.locationId,
        locationName: schema.locations.name,
        quantity: schema.asIsItems.quantity,
        source: schema.asIsItems.source,
        status: schema.asIsItems.status,
        referenceType: schema.asIsItems.referenceType,
        referenceId: schema.asIsItems.referenceId,
        restockedVariantId: schema.asIsItems.restockedVariantId,
        notes: schema.asIsItems.notes,
        reviewedAt: schema.asIsItems.reviewedAt,
        createdAt: schema.asIsItems.createdAt,
      })
      .from(schema.asIsItems)
      .leftJoin(schema.productVariants, eq(schema.productVariants.id, schema.asIsItems.variantId))
      .leftJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .leftJoin(schema.locations, eq(schema.locations.id, schema.asIsItems.locationId))
      .where(status ? eq(schema.asIsItems.status, status) : undefined)
      .orderBy(desc(schema.asIsItems.createdAt))
      .limit(200);
    return rows;
  }

  /** Manual intake — warranty/defect units walking in outside a return. */
  @Post()
  @RequirePermission('inventory.adjust')
  async intake(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: IntakeBody,
  ): Promise<AsIsRow> {
    if (!body.variantId) throw new BadRequestException('variantId is required');
    if (!body.locationId) throw new BadRequestException('locationId is required');
    if (!Number.isInteger(body.quantity) || (body.quantity ?? 0) <= 0) {
      throw new BadRequestException('quantity must be a positive integer');
    }
    const source = body.source ?? 'warranty';
    if (!SOURCES.includes(source)) {
      throw new BadRequestException(`source must be one of ${SOURCES.join(', ')}`);
    }
    const [variant] = await this.db
      .select({ id: schema.productVariants.id })
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, body.variantId))
      .limit(1);
    if (!variant) throw new NotFoundException('Variant not found');

    const [row] = await this.db
      .insert(schema.asIsItems)
      .values({
        businessId: tenant.businessId!,
        variantId: body.variantId,
        locationId: body.locationId,
        quantity: body.quantity!,
        source,
        referenceType: 'manual',
        notes: body.notes ?? null,
      })
      .returning();
    if (!row) throw new BadRequestException('failed to record as-is item');
    await this.audit.log({
      action: 'as_is.intake',
      targetType: 'as_is_item',
      targetId: row.id,
      after: { variantId: row.variantId, quantity: row.quantity, source },
    });
    return this.load(row.id);
  }

  /**
   * The §10 review: restock puts the units into sellable stock (the
   * original variant, or the `-AS` variant when passed); vendor_return
   * and scrap close the row without touching inventory. One-shot — a
   * reviewed row is final.
   */
  @Post(':id/review')
  @RequirePermission('inventory.adjust')
  async review(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: ReviewBody,
  ): Promise<AsIsRow> {
    if (!body.action || !REVIEW_ACTIONS.includes(body.action)) {
      throw new BadRequestException(`action must be one of ${REVIEW_ACTIONS.join(', ')}`);
    }
    const [item] = await this.db
      .select()
      .from(schema.asIsItems)
      .where(eq(schema.asIsItems.id, id))
      .limit(1);
    if (!item) throw new NotFoundException('As-Is item not found');
    if (item.status !== 'pending_review') {
      throw new BadRequestException(`Item is already ${item.status}`);
    }

    let restockedVariantId: string | null = null;
    if (body.action === 'restock') {
      restockedVariantId = body.targetVariantId ?? item.variantId;
      if (restockedVariantId !== item.variantId) {
        const [target] = await this.db
          .select({ id: schema.productVariants.id })
          .from(schema.productVariants)
          .where(eq(schema.productVariants.id, restockedVariantId))
          .limit(1);
        if (!target) throw new NotFoundException('Target variant not found');
      }
      await this.db.insert(schema.inventoryMovements).values({
        businessId: tenant.businessId!,
        variantId: restockedVariantId,
        locationId: item.locationId,
        delta: item.quantity,
        reason: 'as_is_restock',
        referenceType: 'as_is_item',
        referenceId: item.id,
        actorUserId: actor.id,
        notes: body.notes ?? null,
      });
      await this.db
        .insert(schema.inventoryLevels)
        .values({
          businessId: tenant.businessId!,
          variantId: restockedVariantId,
          locationId: item.locationId,
          onHand: item.quantity,
        })
        .onConflictDoUpdate({
          target: [schema.inventoryLevels.variantId, schema.inventoryLevels.locationId],
          set: {
            onHand: sql`${schema.inventoryLevels.onHand} + ${item.quantity}`,
            updatedAt: new Date(),
          },
        });
    }

    const status =
      body.action === 'restock'
        ? 'restocked'
        : body.action === 'vendor_return'
          ? 'vendor_return'
          : 'scrapped';
    await this.db
      .update(schema.asIsItems)
      .set({
        status,
        restockedVariantId,
        reviewedByUserId: actor.id,
        reviewedAt: new Date(),
        notes: body.notes ?? item.notes,
      })
      .where(eq(schema.asIsItems.id, id));

    await this.audit.log({
      action: 'as_is.review',
      targetType: 'as_is_item',
      targetId: id,
      after: { action: body.action, status, restockedVariantId, quantity: item.quantity },
    });
    return this.load(id);
  }

  private async load(id: string): Promise<AsIsRow> {
    const rows = await this.db
      .select({
        id: schema.asIsItems.id,
        variantId: schema.asIsItems.variantId,
        productName: schema.products.name,
        variantName: schema.productVariants.name,
        sku: schema.productVariants.sku,
        locationId: schema.asIsItems.locationId,
        locationName: schema.locations.name,
        quantity: schema.asIsItems.quantity,
        source: schema.asIsItems.source,
        status: schema.asIsItems.status,
        referenceType: schema.asIsItems.referenceType,
        referenceId: schema.asIsItems.referenceId,
        restockedVariantId: schema.asIsItems.restockedVariantId,
        notes: schema.asIsItems.notes,
        reviewedAt: schema.asIsItems.reviewedAt,
        createdAt: schema.asIsItems.createdAt,
      })
      .from(schema.asIsItems)
      .leftJoin(schema.productVariants, eq(schema.productVariants.id, schema.asIsItems.variantId))
      .leftJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .leftJoin(schema.locations, eq(schema.locations.id, schema.asIsItems.locationId))
      .where(inArray(schema.asIsItems.id, [id]))
      .limit(1);
    if (!rows[0]) throw new NotFoundException('As-Is item not found');
    return rows[0];
  }
}
