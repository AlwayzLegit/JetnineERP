import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { and, desc, eq, inArray, lt, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';

const fromLoc = alias(schema.locations, 'from_loc');
const toLoc = alias(schema.locations, 'to_loc');
import { AuditService } from '../audit/audit.service';
import { ExceptionsService } from '../controls/exceptions.service';
import {
  SecurityOverrideService,
  type OverrideCredentials,
} from '../controls/security-override.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { WebhookDispatcher } from '../webhooks/webhook-dispatcher.service';

interface TransferLineInput {
  variantId?: string;
  quantity?: number;
}

const TRANSFER_TYPES = ['replenishment', 'floor_sample', 'customer', 'as_is', 'auto'] as const;

interface CreateBody {
  fromLocationId?: string;
  toLocationId?: string;
  transferType?: (typeof TRANSFER_TYPES)[number];
  notes?: string | null;
  lines?: TransferLineInput[];
  /**
   * Whether to ship immediately on create. Defaults to false — most
   * users create the transfer, then click Ship after picking the
   * stock. Pass true to skip the draft step.
   */
  ship?: boolean;
}

interface ReceiveBody {
  notes?: string | null;
  lines?: { lineId?: string; quantity?: number }[];
}

interface ListRow {
  id: string;
  number: string;
  status: string;
  transferType: string;
  /** XFR-053 schedule date — set on auto transfers only. */
  scheduledFor: string | null;
  /** The sales order whose shortfall generated an auto transfer. */
  orderId: string | null;
  fromLocationId: string;
  fromLocationName: string | null;
  toLocationId: string;
  toLocationName: string | null;
  shippedAt: Date | null;
  receivedAt: Date | null;
  canceledAt: Date | null;
  createdAt: Date;
}

interface LineRow {
  id: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantityShipped: number;
  quantityReceived: number;
}

interface Detail extends ListRow {
  notes: string | null;
  createdByUserId: string | null;
  /** From/to store blocks + letterhead for the printed ticket (§11). */
  fromLocationAddressJson: unknown;
  toLocationAddressJson: unknown;
  businessName: string | null;
  lines: LineRow[];
}

@TenantScoped()
@Controller('v1/stock-transfers')
export class TransfersController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(WebhookDispatcher) private readonly webhooks: WebhookDispatcher,
    @Inject(SecurityOverrideService) private readonly overrides: SecurityOverrideService,
    @Inject(ExceptionsService) private readonly exceptions: ExceptionsService,
  ) {}

  @Get()
  @RequirePermission('inventory.transfer')
  async list(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('status') status?: string,
    @Query('limit') limitStr?: string,
  ): Promise<ListRow[]> {
    const limit = clampLimit(limitStr, 50);
    const where = status ? eq(schema.stockTransfers.status, status) : undefined;
    return this.db
      .select({
        id: schema.stockTransfers.id,
        number: schema.stockTransfers.number,
        status: schema.stockTransfers.status,
        transferType: schema.stockTransfers.transferType,
        scheduledFor: schema.stockTransfers.scheduledFor,
        orderId: schema.stockTransfers.orderId,
        fromLocationId: schema.stockTransfers.fromLocationId,
        fromLocationName: fromLoc.name,
        toLocationId: schema.stockTransfers.toLocationId,
        toLocationName: toLoc.name,
        shippedAt: schema.stockTransfers.shippedAt,
        receivedAt: schema.stockTransfers.receivedAt,
        canceledAt: schema.stockTransfers.canceledAt,
        createdAt: schema.stockTransfers.createdAt,
      })
      .from(schema.stockTransfers)
      .leftJoin(fromLoc, eq(fromLoc.id, schema.stockTransfers.fromLocationId))
      .leftJoin(toLoc, eq(toLoc.id, schema.stockTransfers.toLocationId))
      .where(where)
      .orderBy(desc(schema.stockTransfers.createdAt))
      .limit(limit);
  }

  /**
   * G8 aging: goods "in transit" that never arrive are the classic
   * multi-store shrink channel. Anything on the road longer than
   * `days` (default 3) is the standing alert dispatch works from.
   */
  @Get('aging')
  @RequirePermission('inventory.transfer')
  async aging(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('days') daysStr?: string,
  ): Promise<(ListRow & { daysInTransit: number })[]> {
    const days = Math.min(90, Math.max(1, Number(daysStr) || 3));
    const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.db
      .select({
        id: schema.stockTransfers.id,
        number: schema.stockTransfers.number,
        status: schema.stockTransfers.status,
        transferType: schema.stockTransfers.transferType,
        scheduledFor: schema.stockTransfers.scheduledFor,
        orderId: schema.stockTransfers.orderId,
        fromLocationId: schema.stockTransfers.fromLocationId,
        fromLocationName: fromLoc.name,
        toLocationId: schema.stockTransfers.toLocationId,
        toLocationName: toLoc.name,
        shippedAt: schema.stockTransfers.shippedAt,
        receivedAt: schema.stockTransfers.receivedAt,
        canceledAt: schema.stockTransfers.canceledAt,
        createdAt: schema.stockTransfers.createdAt,
      })
      .from(schema.stockTransfers)
      .leftJoin(fromLoc, eq(fromLoc.id, schema.stockTransfers.fromLocationId))
      .leftJoin(toLoc, eq(toLoc.id, schema.stockTransfers.toLocationId))
      .where(
        and(
          eq(schema.stockTransfers.businessId, tenant.businessId!),
          eq(schema.stockTransfers.status, 'in_transit'),
          lt(schema.stockTransfers.shippedAt, cutoff),
        ),
      )
      .orderBy(schema.stockTransfers.shippedAt);
    return rows.map((r) => ({
      ...r,
      daysInTransit: r.shippedAt
        ? Math.floor((Date.now() - r.shippedAt.getTime()) / 86_400_000)
        : 0,
    }));
  }

  @Get(':id')
  @RequirePermission('inventory.transfer')
  async get(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<Detail> {
    return this.hydrate(id);
  }

  @Post()
  @RequirePermission('inventory.transfer')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: CreateBody,
  ): Promise<Detail> {
    if (!body.fromLocationId) throw new BadRequestException('fromLocationId is required');
    if (!body.toLocationId) throw new BadRequestException('toLocationId is required');
    if (body.fromLocationId === body.toLocationId) {
      throw new BadRequestException('fromLocationId and toLocationId must differ');
    }
    if (!body.lines || body.lines.length === 0) {
      throw new BadRequestException('lines must contain at least one entry');
    }
    const transferType = body.transferType ?? 'replenishment';
    if (!TRANSFER_TYPES.includes(transferType)) {
      throw new BadRequestException(`transferType must be one of ${TRANSFER_TYPES.join(', ')}`);
    }

    const locs = await this.db
      .select({ id: schema.locations.id })
      .from(schema.locations)
      .where(inArray(schema.locations.id, [body.fromLocationId, body.toLocationId]));
    if (locs.length !== 2) throw new NotFoundException('One or both locations not found');

    const variantIds: string[] = [];
    for (const l of body.lines) {
      if (!l.variantId) throw new BadRequestException('lines[].variantId is required');
      if (!Number.isInteger(l.quantity) || (l.quantity ?? 0) <= 0) {
        throw new BadRequestException('lines[].quantity must be a positive integer');
      }
      variantIds.push(l.variantId);
    }
    const variants = await this.db
      .select({ id: schema.productVariants.id })
      .from(schema.productVariants)
      .where(inArray(schema.productVariants.id, variantIds));
    if (variants.length !== new Set(variantIds).size) {
      throw new NotFoundException('One or more variants not found');
    }

    const number = await this.generateNumber(tenant.businessId!);
    const ship = body.ship === true;

    const [transfer] = await this.db
      .insert(schema.stockTransfers)
      .values({
        businessId: tenant.businessId!,
        fromLocationId: body.fromLocationId,
        toLocationId: body.toLocationId,
        number,
        status: ship ? 'in_transit' : 'draft',
        transferType,
        notes: body.notes ?? null,
        createdByUserId: actor.id,
        shippedAt: ship ? new Date() : null,
      })
      .returning();
    if (!transfer) throw new BadRequestException('failed to create transfer');

    await this.db.insert(schema.stockTransferLines).values(
      body.lines.map((l) => ({
        businessId: tenant.businessId!,
        transferId: transfer.id,
        variantId: l.variantId!,
        quantityShipped: l.quantity!,
      })),
    );

    if (ship) {
      await this.deductOrigin(
        tenant.businessId!,
        actor.id,
        transfer.id,
        transfer.fromLocationId,
        body.lines.map((l) => ({ variantId: l.variantId!, quantity: l.quantity! })),
        body.notes ?? null,
      );
    }

    await this.audit.log({
      action: 'stock_transfer.create',
      targetType: 'stock_transfer',
      targetId: transfer.id,
      after: {
        number: transfer.number,
        fromLocationId: transfer.fromLocationId,
        toLocationId: transfer.toLocationId,
        status: transfer.status,
        lineCount: body.lines.length,
      },
    });
    return this.hydrate(transfer.id);
  }

  /**
   * Ship a draft transfer: deduct each line's `quantityShipped` from
   * the origin location's inventory and flip the status to
   * `in_transit`. We refuse to ship if any line would go negative —
   * the cashier hasn't physically moved the stock yet, and a negative
   * on-hand suggests a stale count.
   */
  @Post(':id/ship')
  @RequirePermission('inventory.transfer')
  async ship(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { notes?: string | null },
  ): Promise<Detail> {
    const [transfer] = await this.db
      .select()
      .from(schema.stockTransfers)
      .where(eq(schema.stockTransfers.id, id))
      .limit(1);
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'draft') {
      throw new ForbiddenException(`Cannot ship a ${transfer.status} transfer`);
    }

    const lines = await this.db
      .select()
      .from(schema.stockTransferLines)
      .where(eq(schema.stockTransferLines.transferId, id));

    // Snapshot origin levels and refuse if any line would go negative.
    const variantIds = lines.map((l) => l.variantId);
    const originLevels = await this.db
      .select({
        variantId: schema.inventoryLevels.variantId,
        onHand: schema.inventoryLevels.onHand,
      })
      .from(schema.inventoryLevels)
      .where(
        and(
          eq(schema.inventoryLevels.locationId, transfer.fromLocationId),
          inArray(schema.inventoryLevels.variantId, variantIds),
        ),
      );
    const onHandByVariant = new Map(originLevels.map((r) => [r.variantId, r.onHand]));
    for (const l of lines) {
      const onHand = onHandByVariant.get(l.variantId) ?? 0;
      if (onHand < l.quantityShipped) {
        throw new BadRequestException(
          `Insufficient stock for variant ${l.variantId} at origin: have ${onHand}, need ${l.quantityShipped}.`,
        );
      }
    }

    await this.deductOrigin(
      tenant.businessId!,
      actor.id,
      transfer.id,
      transfer.fromLocationId,
      lines.map((l) => ({ variantId: l.variantId, quantity: l.quantityShipped })),
      body.notes ?? transfer.notes,
    );

    await this.db
      .update(schema.stockTransfers)
      .set({ status: 'in_transit', shippedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.stockTransfers.id, id));

    await this.audit.log({
      action: 'stock_transfer.ship',
      targetType: 'stock_transfer',
      targetId: id,
      after: { lineCount: lines.length },
    });
    return this.hydrate(id);
  }

  @Post(':id/receive')
  @RequirePermission('inventory.transfer')
  async receive(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: ReceiveBody,
  ): Promise<Detail> {
    if (!body.lines || body.lines.length === 0) {
      throw new BadRequestException('lines must contain at least one entry');
    }
    const [transfer] = await this.db
      .select()
      .from(schema.stockTransfers)
      .where(eq(schema.stockTransfers.id, id))
      .limit(1);
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'in_transit') {
      throw new ForbiddenException(`Cannot receive a ${transfer.status} transfer`);
    }

    const lines = await this.db
      .select()
      .from(schema.stockTransferLines)
      .where(eq(schema.stockTransferLines.transferId, id));
    const byId = new Map(lines.map((l) => [l.id, l]));

    const validated: { line: (typeof lines)[number]; qty: number }[] = [];
    for (const r of body.lines) {
      if (!r.lineId) throw new BadRequestException('lines[].lineId is required');
      const line = byId.get(r.lineId);
      if (!line) throw new NotFoundException(`Transfer line not found: ${r.lineId}`);
      if (!Number.isInteger(r.quantity) || (r.quantity ?? 0) <= 0) {
        throw new BadRequestException('lines[].quantity must be a positive integer');
      }
      const remaining = line.quantityShipped - line.quantityReceived;
      if (r.quantity! > remaining) {
        throw new BadRequestException(
          `Cannot receive ${r.quantity} of line ${line.id}: only ${remaining} remaining`,
        );
      }
      validated.push({ line, qty: r.quantity! });
    }

    for (const v of validated) {
      // Ledger entry at the destination.
      await this.db.insert(schema.inventoryMovements).values({
        businessId: tenant.businessId!,
        variantId: v.line.variantId,
        locationId: transfer.toLocationId,
        delta: v.qty,
        reason: 'transfer_in',
        referenceType: 'stock_transfer',
        referenceId: transfer.id,
        actorUserId: actor.id,
        notes: body.notes ?? null,
      });
      // Increment the destination level.
      await this.db
        .insert(schema.inventoryLevels)
        .values({
          businessId: tenant.businessId!,
          variantId: v.line.variantId,
          locationId: transfer.toLocationId,
          onHand: v.qty,
        })
        .onConflictDoUpdate({
          target: [schema.inventoryLevels.variantId, schema.inventoryLevels.locationId],
          set: {
            onHand: sql`${schema.inventoryLevels.onHand} + ${v.qty}`,
            updatedAt: new Date(),
          },
        });
      // Bump the line counter.
      await this.db
        .update(schema.stockTransferLines)
        .set({ quantityReceived: v.line.quantityReceived + v.qty })
        .where(eq(schema.stockTransferLines.id, v.line.id));
    }

    const refreshed = await this.db
      .select({
        shipped: schema.stockTransferLines.quantityShipped,
        received: schema.stockTransferLines.quantityReceived,
      })
      .from(schema.stockTransferLines)
      .where(eq(schema.stockTransferLines.transferId, id));
    const fullyReceived = refreshed.every((l) => l.received >= l.shipped);
    if (fullyReceived) {
      await this.db
        .update(schema.stockTransfers)
        .set({ status: 'received', receivedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.stockTransfers.id, id));
    } else {
      await this.db
        .update(schema.stockTransfers)
        .set({ updatedAt: new Date() })
        .where(eq(schema.stockTransfers.id, id));
    }

    await this.audit.log({
      action: 'stock_transfer.receive',
      targetType: 'stock_transfer',
      targetId: id,
      after: {
        lineCount: validated.length,
        unitsReceived: validated.reduce((s, v) => s + v.qty, 0),
        fullyReceived,
      },
    });

    if (fullyReceived) {
      void this.webhooks.fire({
        businessId: tenant.businessId!,
        eventType: 'stock_transfer.received',
        payload: {
          transferId: id,
          number: transfer.number,
          fromLocationId: transfer.fromLocationId,
          toLocationId: transfer.toLocationId,
        },
      });
    }
    return this.hydrate(id);
  }

  /**
   * G8 variance close-out: sent 4, received 3 — the shortfall cannot be
   * dismissed, only resolved. Requires `inventory.write_off` (or a
   * manager override), a coded reason (class `transfer_variance`), and
   * the short units land on the write-off register at cost + in the
   * exception register. Transfer shrink is the most common internal
   * theft channel in multi-store retail; this is the document that
   * forces resolution.
   */
  @Post(':id/close-short')
  @RequirePermission('inventory.transfer')
  async closeShort(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body()
    body: { reasonCodeId?: string; reason?: string; override?: OverrideCredentials },
  ): Promise<Detail> {
    const [transfer] = await this.db
      .select()
      .from(schema.stockTransfers)
      .where(eq(schema.stockTransfers.id, id))
      .limit(1);
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'in_transit') {
      throw new ForbiddenException(`Cannot close a ${transfer.status} transfer short`);
    }
    const lines = await this.db
      .select()
      .from(schema.stockTransferLines)
      .where(eq(schema.stockTransferLines.transferId, id));
    const short = lines
      .map((l) => ({ line: l, missing: l.quantityShipped - l.quantityReceived }))
      .filter((x) => x.missing > 0);
    const totalShort = short.reduce((s, x) => s + x.missing, 0);
    if (totalShort === 0) {
      throw new BadRequestException('Nothing is short — receive the transfer instead');
    }

    await this.overrides.require({
      permission: 'inventory.write_off',
      action: `Close transfer ${transfer.number} short by ${totalShort} unit(s)`,
      entityType: 'stock_transfer',
      entityId: id,
      override: body.override,
    });
    const reason = await this.overrides.resolveReason('transfer_variance', {
      reasonCodeId: body.reasonCodeId ?? body.override?.reasonCodeId,
      reason: body.reason ?? body.override?.reason,
    });

    // The missing units are shrink: valued at cost on the write-off
    // register, attributed to the origin (they left there and never
    // arrived anywhere).
    let totalCostCents = 0;
    for (const x of short) {
      const [variant] = await this.db
        .select({ costCents: schema.productVariants.costCents })
        .from(schema.productVariants)
        .where(eq(schema.productVariants.id, x.line.variantId))
        .limit(1);
      const unitCost = variant?.costCents ?? 0;
      totalCostCents += unitCost * x.missing;
      await this.db.insert(schema.writeOffs).values({
        businessId: tenant.businessId!,
        variantId: x.line.variantId,
        locationId: transfer.fromLocationId,
        quantity: x.missing,
        unitCostCents: unitCost,
        totalCostCents: unitCost * x.missing,
        reasonCodeId: reason.reasonCodeId,
        reason: `Transfer ${transfer.number} short: ${reason.reasonText ?? reason.reasonCode ?? ''}`,
        actorUserId: actor.id,
      });
    }

    await this.db
      .update(schema.stockTransfers)
      .set({
        status: 'closed_short',
        varianceReasonCodeId: reason.reasonCodeId,
        receivedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.stockTransfers.id, id));

    await this.audit.log({
      action: 'stock_transfer.close_short',
      targetType: 'stock_transfer',
      targetId: id,
      after: {
        unitsShort: totalShort,
        totalCostCents,
        reason: reason.reasonText,
        reasonCode: reason.reasonCode,
      },
    });
    await this.exceptions.record({
      type: 'transfer_variance',
      severity: 'warning',
      entityType: 'stock_transfer',
      entityId: id,
      summary: `Transfer ${transfer.number} closed ${totalShort} unit(s) short — $${(totalCostCents / 100).toFixed(2)} at cost`,
      metadata: {
        unitsShort: totalShort,
        totalCostCents,
        reasonCode: reason.reasonCode,
        reason: reason.reasonText,
      },
    });
    return this.hydrate(id);
  }

  @Post(':id/cancel')
  @RequirePermission('inventory.transfer')
  async cancel(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<Detail> {
    const [transfer] = await this.db
      .select()
      .from(schema.stockTransfers)
      .where(eq(schema.stockTransfers.id, id))
      .limit(1);
    if (!transfer) throw new NotFoundException('Transfer not found');
    if (transfer.status !== 'draft') {
      throw new ForbiddenException(
        `Only draft transfers can be canceled. In-transit transfers must be received at the destination — reverse the move with a new transfer if needed.`,
      );
    }
    await this.db
      .update(schema.stockTransfers)
      .set({ status: 'canceled', canceledAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.stockTransfers.id, id));

    await this.audit.log({
      action: 'stock_transfer.cancel',
      targetType: 'stock_transfer',
      targetId: id,
      before: { status: transfer.status },
      after: { status: 'canceled' },
    });
    return this.hydrate(id);
  }

  private async deductOrigin(
    businessId: string,
    actorId: string,
    transferId: string,
    fromLocationId: string,
    lines: { variantId: string; quantity: number }[],
    notes: string | null,
  ): Promise<void> {
    for (const l of lines) {
      await this.db.insert(schema.inventoryMovements).values({
        businessId,
        variantId: l.variantId,
        locationId: fromLocationId,
        delta: -l.quantity,
        reason: 'transfer_out',
        referenceType: 'stock_transfer',
        referenceId: transferId,
        actorUserId: actorId,
        notes,
      });
      await this.db
        .insert(schema.inventoryLevels)
        .values({
          businessId,
          variantId: l.variantId,
          locationId: fromLocationId,
          onHand: 0,
        })
        .onConflictDoUpdate({
          target: [schema.inventoryLevels.variantId, schema.inventoryLevels.locationId],
          set: {
            onHand: sql`GREATEST(0, ${schema.inventoryLevels.onHand} - ${l.quantity})`,
            updatedAt: new Date(),
          },
        });
    }
  }

  private async hydrate(id: string): Promise<Detail> {
    const [row] = await this.db
      .select({
        id: schema.stockTransfers.id,
        number: schema.stockTransfers.number,
        status: schema.stockTransfers.status,
        transferType: schema.stockTransfers.transferType,
        scheduledFor: schema.stockTransfers.scheduledFor,
        orderId: schema.stockTransfers.orderId,
        fromLocationId: schema.stockTransfers.fromLocationId,
        fromLocationName: fromLoc.name,
        fromLocationAddressJson: fromLoc.addressJson,
        toLocationId: schema.stockTransfers.toLocationId,
        toLocationName: toLoc.name,
        toLocationAddressJson: toLoc.addressJson,
        businessName: schema.businesses.name,
        shippedAt: schema.stockTransfers.shippedAt,
        receivedAt: schema.stockTransfers.receivedAt,
        canceledAt: schema.stockTransfers.canceledAt,
        notes: schema.stockTransfers.notes,
        createdByUserId: schema.stockTransfers.createdByUserId,
        createdAt: schema.stockTransfers.createdAt,
      })
      .from(schema.stockTransfers)
      .leftJoin(fromLoc, eq(fromLoc.id, schema.stockTransfers.fromLocationId))
      .leftJoin(toLoc, eq(toLoc.id, schema.stockTransfers.toLocationId))
      .leftJoin(schema.businesses, eq(schema.businesses.id, schema.stockTransfers.businessId))
      .where(eq(schema.stockTransfers.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Transfer not found');

    const lines = await this.db
      .select({
        id: schema.stockTransferLines.id,
        variantId: schema.stockTransferLines.variantId,
        productName: schema.products.name,
        variantName: schema.productVariants.name,
        sku: schema.productVariants.sku,
        quantityShipped: schema.stockTransferLines.quantityShipped,
        quantityReceived: schema.stockTransferLines.quantityReceived,
      })
      .from(schema.stockTransferLines)
      .innerJoin(
        schema.productVariants,
        eq(schema.productVariants.id, schema.stockTransferLines.variantId),
      )
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(eq(schema.stockTransferLines.transferId, id));

    return {
      ...row,
      lines: lines.map((l) => ({ ...l, productName: l.productName ?? '(deleted)' })),
    };
  }

  private async generateNumber(businessId: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    for (let attempt = 0; attempt < 5; attempt++) {
      const rows = await this.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(schema.stockTransfers)
        .where(
          and(
            eq(schema.stockTransfers.businessId, businessId),
            sql`${schema.stockTransfers.number} LIKE ${`ST-${year}-%`}`,
          ),
        );
      const count = rows[0]?.count ?? 0;
      const seq = count + 1 + attempt;
      const candidate = `ST-${year}-${String(seq).padStart(6, '0')}`;
      const [existing] = await this.db
        .select({ id: schema.stockTransfers.id })
        .from(schema.stockTransfers)
        .where(
          and(
            eq(schema.stockTransfers.businessId, businessId),
            eq(schema.stockTransfers.number, candidate),
          ),
        )
        .limit(1);
      if (!existing) return candidate;
    }
    return `ST-${year}-${Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0')}`;
  }
}

function clampLimit(raw: string | undefined, def: number): number {
  const n = Number(raw ?? String(def));
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(Math.max(Math.floor(n), 1), 200);
}
