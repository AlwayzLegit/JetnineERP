import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
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
  storageBinId: string | null;
  storageBinCode: string | null;
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
        storageBinId: schema.inventoryLevels.storageBinId,
        storageBinCode: schema.storageBins.code,
        updatedAt: schema.inventoryLevels.updatedAt,
      })
      .from(schema.inventoryLevels)
      .innerJoin(
        schema.productVariants,
        eq(schema.productVariants.id, schema.inventoryLevels.variantId),
      )
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .leftJoin(schema.storageBins, eq(schema.storageBins.id, schema.inventoryLevels.storageBinId))
      .where(where)
      .orderBy(asc(schema.products.name), asc(schema.productVariants.sku));
    return rows.map((r) => ({
      ...r,
      available: Math.max(0, r.onHand - r.reserved),
    }));
  }

  /**
   * Storage bins (STORIS Tracked Storage Location parity, lean). Bins are
   * per-location named slots; stock levels optionally point at one so the
   * pick list and receiving know where to walk. Convention: managed under
   * `inventory.adjust` — the people who correct stock own where it sits.
   */
  @Get('bins')
  @RequirePermission('inventory.view')
  async bins(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('locationId') locationId?: string,
  ): Promise<
    {
      id: string;
      locationId: string;
      code: string;
      description: string | null;
      isActive: boolean;
    }[]
  > {
    const where = locationId ? eq(schema.storageBins.locationId, locationId) : undefined;
    return this.db
      .select({
        id: schema.storageBins.id,
        locationId: schema.storageBins.locationId,
        code: schema.storageBins.code,
        description: schema.storageBins.description,
        isActive: schema.storageBins.isActive,
      })
      .from(schema.storageBins)
      .where(where)
      .orderBy(asc(schema.storageBins.code));
  }

  @Post('bins')
  @RequirePermission('inventory.adjust')
  async createBin(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: { locationId?: string; code?: string; description?: string | null },
  ): Promise<{ id: string; locationId: string; code: string }> {
    const code = body.code?.trim().toUpperCase();
    if (!code) throw new BadRequestException('code is required');
    if (code.length > 24) throw new BadRequestException('code must be 24 characters or fewer');
    if (!body.locationId) throw new BadRequestException('locationId is required');
    const [loc] = await this.db
      .select({ id: schema.locations.id })
      .from(schema.locations)
      .where(eq(schema.locations.id, body.locationId))
      .limit(1);
    if (!loc) throw new NotFoundException('Location not found');
    const [dup] = await this.db
      .select({ id: schema.storageBins.id })
      .from(schema.storageBins)
      .where(
        and(eq(schema.storageBins.locationId, body.locationId), eq(schema.storageBins.code, code)),
      )
      .limit(1);
    if (dup) throw new ConflictException(`Bin "${code}" already exists at this location`);
    const [row] = await this.db
      .insert(schema.storageBins)
      .values({
        businessId: tenant.businessId!,
        locationId: body.locationId,
        code,
        description: body.description?.trim() || null,
      })
      .returning();
    if (!row) throw new BadRequestException('failed to create bin');
    await this.audit.log({
      action: 'inventory.bin.create',
      targetType: 'storage_bin',
      targetId: row.id,
      after: { locationId: row.locationId, code: row.code },
    });
    return { id: row.id, locationId: row.locationId, code: row.code };
  }

  @Patch('bins/:id')
  @RequirePermission('inventory.adjust')
  async updateBin(
    @Param('id') id: string,
    @Body() body: { code?: string; description?: string | null; isActive?: boolean },
  ): Promise<{ updated: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.storageBins)
      .where(eq(schema.storageBins.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Bin not found');
    const update: Partial<typeof schema.storageBins.$inferInsert> = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    if (body.code !== undefined) {
      const code = body.code.trim().toUpperCase();
      if (!code) throw new BadRequestException('code cannot be empty');
      if (code.length > 24) throw new BadRequestException('code must be 24 characters or fewer');
      if (code !== existing.code) {
        update.code = code;
        before.code = existing.code;
        after.code = code;
      }
    }
    if (body.description !== undefined) {
      const description = body.description?.trim() || null;
      if (description !== existing.description) {
        update.description = description;
        before.description = existing.description;
        after.description = description;
      }
    }
    if (body.isActive !== undefined && body.isActive !== existing.isActive) {
      update.isActive = body.isActive;
      before.isActive = existing.isActive;
      after.isActive = body.isActive;
    }
    if (Object.keys(after).length === 0) return { updated: true };
    if (update.code) {
      const [dup] = await this.db
        .select({ id: schema.storageBins.id })
        .from(schema.storageBins)
        .where(
          and(
            eq(schema.storageBins.locationId, existing.locationId),
            eq(schema.storageBins.code, update.code),
          ),
        )
        .limit(1);
      if (dup && dup.id !== id) {
        throw new ConflictException(`Bin "${update.code}" already exists at this location`);
      }
    }
    await this.db.update(schema.storageBins).set(update).where(eq(schema.storageBins.id, id));
    await this.audit.log({
      action: 'inventory.bin.update',
      targetType: 'storage_bin',
      targetId: id,
      before,
      after,
    });
    return { updated: true };
  }

  /**
   * Point a stock level at the bin holding it (or null to unbin). The
   * level row must already exist — a bin assignment for stock that has
   * never had a level is meaningless — and the bin must be an active bin
   * of the same location.
   */
  @Post('levels/assign-bin')
  @RequirePermission('inventory.adjust')
  async assignBin(
    @Body() body: { variantId?: string; locationId?: string; storageBinId?: string | null },
  ): Promise<{ updated: true }> {
    if (!body.variantId || !body.locationId) {
      throw new BadRequestException('variantId and locationId are required');
    }
    const [level] = await this.db
      .select()
      .from(schema.inventoryLevels)
      .where(
        and(
          eq(schema.inventoryLevels.variantId, body.variantId),
          eq(schema.inventoryLevels.locationId, body.locationId),
        ),
      )
      .limit(1);
    if (!level) throw new NotFoundException('No stock level exists for that variant and location');
    const storageBinId = body.storageBinId ?? null;
    if (storageBinId) {
      const [bin] = await this.db
        .select()
        .from(schema.storageBins)
        .where(eq(schema.storageBins.id, storageBinId))
        .limit(1);
      if (!bin) throw new NotFoundException('Bin not found');
      if (bin.locationId !== body.locationId) {
        throw new BadRequestException('Bin belongs to a different location');
      }
      if (!bin.isActive) throw new BadRequestException('Bin is inactive');
    }
    if (storageBinId === level.storageBinId) return { updated: true };
    await this.db
      .update(schema.inventoryLevels)
      .set({ storageBinId, updatedAt: new Date() })
      .where(eq(schema.inventoryLevels.id, level.id));
    await this.audit.log({
      action: 'inventory.bin.assign',
      targetType: 'inventory_level',
      targetId: level.id,
      before: { storageBinId: level.storageBinId },
      after: { storageBinId, variantId: body.variantId, locationId: body.locationId },
    });
    return { updated: true };
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
