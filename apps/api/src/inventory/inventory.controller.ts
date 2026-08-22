import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common';
import { and, asc, eq, gte, lt, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import {
  buildPage,
  clampLimit as clampPageLimit,
  decodeCursor,
  timestampCursorOrder,
  timestampCursorWhere,
  type PageResponse,
} from '../common/pagination';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { WebhookDispatcher } from '../webhooks/webhook-dispatcher.service';

const ADJUST_REASONS = new Set(['count_correction', 'damage', 'theft', 'other']);

interface LevelRow {
  variantId: string;
  locationId: string;
  productId: string;
  productName: string;
  variantSku: string | null;
  variantName: string | null;
  variantBarcode: string | null;
  onHand: number;
  reserved: number;
  available: number;
  updatedAt: Date;
}

interface MovementRow {
  id: string;
  variantId: string;
  locationId: string;
  delta: number;
  reason: string;
  referenceType: string | null;
  referenceId: string | null;
  actorUserId: string | null;
  actorEmail: string | null;
  notes: string | null;
  createdAt: Date;
}

interface AdjustBody {
  variantId?: string;
  locationId?: string;
  delta?: number;
  reason?: string;
  notes?: string;
}

interface ReceiveBody {
  locationId?: string;
  notes?: string;
  lines?: { variantId?: string; quantity?: number }[];
}

@TenantScoped()
@Controller('v1/inventory')
export class InventoryController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(WebhookDispatcher) private readonly webhooks: WebhookDispatcher,
  ) {}

  /**
   * List on-hand levels for a location. If locationId is omitted, returns
   * all locations' rows for the current business. The available column is
   * computed as on_hand - reserved (clamped to ≥0).
   */
  @Get('levels')
  @RequirePermission('inventory.view')
  async levels(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('locationId') locationId?: string,
  ): Promise<LevelRow[]> {
    const where = locationId ? eq(schema.inventoryLevels.locationId, locationId) : undefined;
    const rows = await this.db
      .select({
        variantId: schema.inventoryLevels.variantId,
        locationId: schema.inventoryLevels.locationId,
        productId: schema.products.id,
        productName: schema.products.name,
        variantSku: schema.productVariants.sku,
        variantName: schema.productVariants.name,
        variantBarcode: schema.productVariants.barcode,
        onHand: schema.inventoryLevels.onHand,
        reserved: schema.inventoryLevels.reserved,
        updatedAt: schema.inventoryLevels.updatedAt,
      })
      .from(schema.inventoryLevels)
      .innerJoin(
        schema.productVariants,
        eq(schema.productVariants.id, schema.inventoryLevels.variantId),
      )
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(where)
      .orderBy(asc(schema.products.name), asc(schema.productVariants.sku));
    return rows.map((r) => ({
      ...r,
      available: Math.max(0, r.onHand - r.reserved),
    }));
  }

  @Get('movements')
  @RequirePermission('inventory.view')
  async movements(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('variantId') variantId?: string,
    @Query('locationId') locationId?: string,
    @Query('since') since?: string,
    @Query('until') until?: string,
    @Query('limit') limitStr?: string,
    @Query('cursor') cursorStr?: string,
  ): Promise<PageResponse<MovementRow>> {
    const limit = clampPageLimit(limitStr);
    const conditions = [] as ReturnType<typeof eq>[];
    if (variantId) conditions.push(eq(schema.inventoryMovements.variantId, variantId));
    if (locationId) conditions.push(eq(schema.inventoryMovements.locationId, locationId));
    if (since) {
      const d = new Date(since);
      if (!Number.isNaN(d.getTime())) conditions.push(gte(schema.inventoryMovements.createdAt, d));
    }
    if (until) {
      const d = new Date(until);
      if (!Number.isNaN(d.getTime())) conditions.push(lt(schema.inventoryMovements.createdAt, d));
    }
    const cursor = decodeCursor(cursorStr);
    if (cursor) {
      conditions.push(
        timestampCursorWhere(
          schema.inventoryMovements.createdAt,
          schema.inventoryMovements.id,
          cursor,
        )!,
      );
    }
    const rows = await this.db
      .select({
        id: schema.inventoryMovements.id,
        variantId: schema.inventoryMovements.variantId,
        locationId: schema.inventoryMovements.locationId,
        delta: schema.inventoryMovements.delta,
        reason: schema.inventoryMovements.reason,
        referenceType: schema.inventoryMovements.referenceType,
        referenceId: schema.inventoryMovements.referenceId,
        actorUserId: schema.inventoryMovements.actorUserId,
        actorEmail: schema.users.email,
        notes: schema.inventoryMovements.notes,
        createdAt: schema.inventoryMovements.createdAt,
      })
      .from(schema.inventoryMovements)
      .leftJoin(schema.users, eq(schema.users.id, schema.inventoryMovements.actorUserId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(
        ...timestampCursorOrder(schema.inventoryMovements.createdAt, schema.inventoryMovements.id),
      )
      .limit(limit + 1);
    const enriched = rows.map((r) => ({ ...r, actorEmail: r.actorEmail ?? null }));
    return buildPage(enriched, limit, (r) => r.createdAt);
  }

  /**
   * Manual adjustment. Reason is one of: count_correction, damage, theft,
   * other. The delta can be negative (loss) but on_hand floors at 0.
   * Writes one inventory_movements row + upserts the inventory_levels row.
   */
  @Post('adjust')
  @RequirePermission('inventory.adjust')
  async adjust(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: AdjustBody,
  ): Promise<{ onHand: number; movementId: string }> {
    const { variantId, locationId, delta, reason } = body;
    if (!variantId) throw new BadRequestException('variantId is required');
    if (!locationId) throw new BadRequestException('locationId is required');
    if (typeof delta !== 'number' || !Number.isInteger(delta) || delta === 0) {
      throw new BadRequestException('delta must be a non-zero integer');
    }
    if (!reason || !ADJUST_REASONS.has(reason)) {
      throw new BadRequestException(`reason must be one of: ${[...ADJUST_REASONS].join(', ')}`);
    }

    const result = await this.applyDelta(tenant, actor, {
      variantId,
      locationId,
      delta,
      reason,
      notes: body.notes,
    });

    await this.audit.log({
      action: 'inventory.adjust',
      targetType: 'product_variant',
      targetId: variantId,
      metadata: { delta, reason, locationId, notes: body.notes ?? null },
    });

    void this.webhooks.fire({
      businessId: tenant.businessId!,
      eventType: 'inventory.adjusted',
      payload: {
        variantId,
        locationId,
        delta,
        reason,
        onHand: result.onHand,
        movementId: result.movementId,
      },
    });

    return result;
  }

  /**
   * Receive a batch of variants at a location. Each line is positive.
   * Writes one inventory_movements row per line and upserts the matching
   * inventory_levels row. The whole batch lives inside the request's RLS
   * transaction, so a partial failure rolls back cleanly.
   */
  @Post('receive')
  @RequirePermission('inventory.receive')
  async receive(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: ReceiveBody,
  ): Promise<{
    locationId: string;
    lines: { variantId: string; quantity: number; onHand: number }[];
  }> {
    const { locationId } = body;
    if (!locationId) throw new BadRequestException('locationId is required');
    const lines = body.lines ?? [];
    if (lines.length === 0) throw new BadRequestException('lines must contain at least one entry');
    for (const l of lines) {
      if (!l.variantId) throw new BadRequestException('lines[].variantId is required');
      if (typeof l.quantity !== 'number' || !Number.isInteger(l.quantity) || l.quantity <= 0) {
        throw new BadRequestException('lines[].quantity must be a positive integer');
      }
    }

    const out: { variantId: string; quantity: number; onHand: number }[] = [];
    for (const l of lines) {
      const result = await this.applyDelta(tenant, actor, {
        variantId: l.variantId!,
        locationId,
        delta: l.quantity!,
        reason: 'receive',
        notes: body.notes,
      });
      out.push({ variantId: l.variantId!, quantity: l.quantity!, onHand: result.onHand });
    }

    await this.audit.log({
      action: 'inventory.receive',
      targetType: 'location',
      targetId: locationId,
      metadata: {
        lineCount: lines.length,
        totalUnits: lines.reduce((sum, l) => sum + (l.quantity ?? 0), 0),
        notes: body.notes ?? null,
      },
    });

    return { locationId, lines: out };
  }

  private async applyDelta(
    tenant: RequestTenantContext,
    actor: CurrentUserPayload,
    args: {
      variantId: string;
      locationId: string;
      delta: number;
      reason: string;
      notes?: string;
      referenceType?: string;
      referenceId?: string;
    },
  ): Promise<{ onHand: number; movementId: string }> {
    // Verify variant + location belong to the active business (RLS would
    // also catch cross-tenant attempts, but a friendly 404 beats a 0-row
    // result).
    const [variant] = await this.db
      .select({ id: schema.productVariants.id })
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, args.variantId))
      .limit(1);
    if (!variant) throw new NotFoundException('Variant not found');
    const [location] = await this.db
      .select({ id: schema.locations.id })
      .from(schema.locations)
      .where(eq(schema.locations.id, args.locationId))
      .limit(1);
    if (!location) throw new NotFoundException('Location not found');

    // Append the ledger row.
    const [movement] = await this.db
      .insert(schema.inventoryMovements)
      .values({
        businessId: tenant.businessId!,
        variantId: args.variantId,
        locationId: args.locationId,
        delta: args.delta,
        reason: args.reason,
        referenceType: args.referenceType ?? null,
        referenceId: args.referenceId ?? null,
        actorUserId: actor.id,
        notes: args.notes ?? null,
      })
      .returning({ id: schema.inventoryMovements.id });
    if (!movement) throw new BadRequestException('failed to record movement');

    // Upsert inventory_levels.on_hand. We GREATEST(0, ...) so we never
    // record a negative on_hand even if a careless adjustment overshoots.
    const [level] = await this.db
      .insert(schema.inventoryLevels)
      .values({
        businessId: tenant.businessId!,
        variantId: args.variantId,
        locationId: args.locationId,
        onHand: Math.max(0, args.delta),
      })
      .onConflictDoUpdate({
        target: [schema.inventoryLevels.variantId, schema.inventoryLevels.locationId],
        set: {
          onHand: sql`GREATEST(0, ${schema.inventoryLevels.onHand} + ${args.delta})`,
          updatedAt: new Date(),
        },
      })
      .returning({ onHand: schema.inventoryLevels.onHand });
    if (!level) throw new BadRequestException('failed to update inventory level');

    return { onHand: level.onHand, movementId: movement.id };
  }
}
