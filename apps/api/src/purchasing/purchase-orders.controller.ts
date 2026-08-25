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
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { SpecialOrdersService } from '../special-orders/special-orders.service';
import { WebhookDispatcher } from '../webhooks/webhook-dispatcher.service';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface PoLineInput {
  variantId?: string;
  quantity?: number;
  unitCostCents?: number;
}

interface CreatePoBody {
  vendorId?: string;
  locationId?: string;
  expectedAt?: string;
  notes?: string | null;
  lines?: PoLineInput[];
  /**
   * Whether to mark the PO as `ordered` immediately (instead of leaving
   * it as a `draft` for later edits). Defaults to true — most users
   * create + place in one step.
   */
  place?: boolean;
}

interface ReceivePoBody {
  notes?: string | null;
  lines?: { lineId?: string; quantity?: number }[];
}

interface PoListRow {
  id: string;
  number: string;
  status: string;
  vendorId: string;
  vendorName: string | null;
  locationId: string;
  expectedAt: Date | null;
  placedAt: Date | null;
  closedAt: Date | null;
  subtotalCents: number;
  createdAt: Date;
}

interface PoLineRow {
  id: string;
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  /** Vendor's part number when it differs from our sku (null = same). */
  vendorSku: string | null;
  quantityOrdered: number;
  quantityReceived: number;
  unitCostCents: number;
  lineTotalCents: number;
}

interface PoDetail extends PoListRow {
  notes: string | null;
  createdByUserId: string | null;
  lines: PoLineRow[];
}

@TenantScoped()
@Controller('v1/purchase-orders')
export class PurchaseOrdersController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(WebhookDispatcher) private readonly webhooks: WebhookDispatcher,
    @Inject(SpecialOrdersService) private readonly specialOrders: SpecialOrdersService,
  ) {}

  @Get()
  @RequirePermission('purchase_orders.view')
  async list(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('status') status?: string,
    @Query('limit') limitStr?: string,
  ): Promise<PoListRow[]> {
    const limit = clampLimit(limitStr, 50);
    const where = status ? eq(schema.purchaseOrders.status, status) : undefined;
    const rows = await this.db
      .select({
        id: schema.purchaseOrders.id,
        number: schema.purchaseOrders.number,
        status: schema.purchaseOrders.status,
        vendorId: schema.purchaseOrders.vendorId,
        vendorName: schema.vendors.name,
        locationId: schema.purchaseOrders.locationId,
        expectedAt: schema.purchaseOrders.expectedAt,
        placedAt: schema.purchaseOrders.placedAt,
        closedAt: schema.purchaseOrders.closedAt,
        subtotalCents: schema.purchaseOrders.subtotalCents,
        createdAt: schema.purchaseOrders.createdAt,
      })
      .from(schema.purchaseOrders)
      .leftJoin(schema.vendors, eq(schema.vendors.id, schema.purchaseOrders.vendorId))
      .where(where)
      .orderBy(desc(schema.purchaseOrders.createdAt))
      .limit(limit);
    return rows;
  }

  /**
   * Reorder suggestions: every managed variant (non-null reorder_point)
   * whose available stock — on-hand minus reserved, summed across all
   * locations — is at or below its point, grouped by preferred vendor
   * so each group can become one PO. Suggested quantity is the variant's
   * reorder_qty when set, else a top-up to 2× the point (min/max).
   * Declared before the ':id' route so the static path wins.
   */
  @Get('reorder-suggestions')
  @RequirePermission('purchase_orders.view')
  async reorderSuggestions(@CurrentTenant() _tenant: RequestTenantContext): Promise<{
    vendors: {
      vendorId: string | null;
      vendorName: string | null;
      lines: {
        variantId: string;
        productName: string;
        variantName: string | null;
        sku: string | null;
        vendorSku: string | null;
        available: number;
        reorderPoint: number;
        suggestedQty: number;
        unitCostCents: number | null;
      }[];
    }[];
  }> {
    const rows = await this.db
      .select({
        variantId: schema.productVariants.id,
        productName: schema.products.name,
        variantName: schema.productVariants.name,
        sku: schema.productVariants.sku,
        vendorSku: schema.productVariants.vendorSku,
        reorderPoint: schema.productVariants.reorderPoint,
        reorderQty: schema.productVariants.reorderQty,
        costCents: schema.productVariants.costCents,
        vendorId: schema.productVariants.preferredVendorId,
        vendorName: schema.vendors.name,
        available: sql<number>`COALESCE(SUM(${schema.inventoryLevels.onHand} - ${schema.inventoryLevels.reserved}), 0)::int`,
      })
      .from(schema.productVariants)
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .leftJoin(
        schema.inventoryLevels,
        eq(schema.inventoryLevels.variantId, schema.productVariants.id),
      )
      .leftJoin(schema.vendors, eq(schema.vendors.id, schema.productVariants.preferredVendorId))
      .where(
        and(
          sql`${schema.productVariants.reorderPoint} IS NOT NULL`,
          eq(schema.productVariants.isActive, true),
          eq(schema.products.isActive, true),
        ),
      )
      .groupBy(
        schema.productVariants.id,
        schema.products.name,
        schema.productVariants.name,
        schema.productVariants.sku,
        schema.productVariants.vendorSku,
        schema.productVariants.reorderPoint,
        schema.productVariants.reorderQty,
        schema.productVariants.costCents,
        schema.productVariants.preferredVendorId,
        schema.vendors.name,
      )
      .having(
        sql`COALESCE(SUM(${schema.inventoryLevels.onHand} - ${schema.inventoryLevels.reserved}), 0) <= ${schema.productVariants.reorderPoint}`,
      );

    const byVendor = new Map<
      string,
      { vendorId: string | null; vendorName: string | null; lines: unknown[] }
    >();
    for (const r of rows) {
      const point = r.reorderPoint!;
      const suggestedQty = r.reorderQty ?? Math.max(1, point * 2 - r.available);
      const key = r.vendorId ?? 'unassigned';
      const group = byVendor.get(key) ?? {
        vendorId: r.vendorId ?? null,
        vendorName: r.vendorName ?? null,
        lines: [],
      };
      group.lines.push({
        variantId: r.variantId,
        productName: r.productName,
        variantName: r.variantName,
        sku: r.sku,
        vendorSku: r.vendorSku,
        available: r.available,
        reorderPoint: point,
        suggestedQty,
        unitCostCents: r.costCents ?? null,
      });
      byVendor.set(key, group);
    }
    const vendors = [...byVendor.values()].sort((a, b) =>
      (a.vendorName ?? 'zzz').localeCompare(b.vendorName ?? 'zzz'),
    ) as Awaited<ReturnType<PurchaseOrdersController['reorderSuggestions']>>['vendors'];
    return { vendors };
  }

  @Get(':id')
  @RequirePermission('purchase_orders.view')
  async get(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<PoDetail> {
    return this.hydrate(id);
  }

  @Post()
  @RequirePermission('purchase_orders.create')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: CreatePoBody,
  ): Promise<PoDetail> {
    if (!body.vendorId) throw new BadRequestException('vendorId is required');
    if (!body.locationId) throw new BadRequestException('locationId is required');
    if (!body.lines || body.lines.length === 0) {
      throw new BadRequestException('lines must contain at least one entry');
    }

    // Validate vendor + location belong to this business (RLS would
    // also catch it; explicit lookups give a friendly 404).
    const [vendor] = await this.db
      .select({ id: schema.vendors.id })
      .from(schema.vendors)
      .where(eq(schema.vendors.id, body.vendorId))
      .limit(1);
    if (!vendor) throw new NotFoundException('Vendor not found');
    const [location] = await this.db
      .select({ id: schema.locations.id })
      .from(schema.locations)
      .where(eq(schema.locations.id, body.locationId))
      .limit(1);
    if (!location) throw new NotFoundException('Location not found');

    // Validate every variant + collect descriptions for audit / response.
    const variantIds: string[] = [];
    for (const l of body.lines) {
      if (!l.variantId) throw new BadRequestException('lines[].variantId is required');
      if (!Number.isInteger(l.quantity) || (l.quantity ?? 0) <= 0) {
        throw new BadRequestException('lines[].quantity must be a positive integer');
      }
      if (!Number.isInteger(l.unitCostCents) || (l.unitCostCents ?? -1) < 0) {
        throw new BadRequestException('lines[].unitCostCents must be a non-negative integer');
      }
      variantIds.push(l.variantId);
    }
    const variants = await this.db
      .select({
        id: schema.productVariants.id,
      })
      .from(schema.productVariants)
      .where(inArray(schema.productVariants.id, variantIds));
    if (variants.length !== new Set(variantIds).size) {
      throw new NotFoundException('One or more variants not found');
    }

    const subtotalCents = body.lines.reduce((s, l) => s + l.quantity! * l.unitCostCents!, 0);
    const number = await this.generatePoNumber(tenant.businessId!);
    const place = body.place !== false;
    const expectedAt = parseDate(body.expectedAt);

    const [po] = await this.db
      .insert(schema.purchaseOrders)
      .values({
        businessId: tenant.businessId!,
        vendorId: body.vendorId,
        locationId: body.locationId,
        number,
        status: place ? 'ordered' : 'draft',
        expectedAt,
        placedAt: place ? new Date() : null,
        subtotalCents,
        notes: body.notes ?? null,
        createdByUserId: actor.id,
      })
      .returning();
    if (!po) throw new BadRequestException('failed to create purchase order');

    await this.db.insert(schema.purchaseOrderLines).values(
      body.lines.map((l) => ({
        businessId: tenant.businessId!,
        purchaseOrderId: po.id,
        variantId: l.variantId!,
        quantityOrdered: l.quantity!,
        unitCostCents: l.unitCostCents!,
        lineTotalCents: l.quantity! * l.unitCostCents!,
      })),
    );

    await this.audit.log({
      action: 'purchase_order.create',
      targetType: 'purchase_order',
      targetId: po.id,
      after: {
        number: po.number,
        vendorId: body.vendorId,
        status: po.status,
        subtotalCents,
        lineCount: body.lines.length,
      },
    });
    return this.hydrate(po.id);
  }

  /**
   * Receive a batch of units against an open PO. Multiple receipts
   * across the lifetime of the PO are supported — the status
   * transitions automatically from `ordered` → `partially_received` →
   * `received` once every line's `quantity_received` catches up to
   * `quantity_ordered`.
   *
   * Each line in the body specifies how many units arrived; we
   * append `inventory_movements` rows + upsert `inventory_levels`
   * exactly the way the manual Receive flow does, then bump the PO
   * line counters.
   */
  @Post(':id/receive')
  @RequirePermission('purchase_orders.receive')
  async receive(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: ReceivePoBody,
  ): Promise<PoDetail> {
    if (!body.lines || body.lines.length === 0) {
      throw new BadRequestException('lines must contain at least one entry');
    }
    const [po] = await this.db
      .select()
      .from(schema.purchaseOrders)
      .where(eq(schema.purchaseOrders.id, id))
      .limit(1);
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status !== 'ordered' && po.status !== 'partially_received') {
      throw new ForbiddenException(`Cannot receive against a ${po.status} purchase order`);
    }

    const lines = await this.db
      .select()
      .from(schema.purchaseOrderLines)
      .where(eq(schema.purchaseOrderLines.purchaseOrderId, id));
    const byId = new Map(lines.map((l) => [l.id, l]));

    // Validate every requested receipt up-front before mutating
    // anything; we want partial-success semantics.
    const validated: { line: (typeof lines)[number]; qty: number }[] = [];
    for (const r of body.lines) {
      if (!r.lineId) throw new BadRequestException('lines[].lineId is required');
      const line = byId.get(r.lineId);
      if (!line) throw new NotFoundException(`PO line not found: ${r.lineId}`);
      if (!Number.isInteger(r.quantity) || (r.quantity ?? 0) <= 0) {
        throw new BadRequestException('lines[].quantity must be a positive integer');
      }
      const remaining = line.quantityOrdered - line.quantityReceived;
      if (r.quantity! > remaining) {
        throw new BadRequestException(
          `Cannot receive ${r.quantity} of line ${line.id}: only ${remaining} remaining`,
        );
      }
      validated.push({ line, qty: r.quantity! });
    }

    let totalReceivedThisTx = 0;
    for (const v of validated) {
      // Inventory ledger row.
      await this.db.insert(schema.inventoryMovements).values({
        businessId: tenant.businessId!,
        variantId: v.line.variantId,
        locationId: po.locationId,
        delta: v.qty,
        reason: 'receive_po',
        referenceType: 'purchase_order',
        referenceId: po.id,
        actorUserId: actor.id,
        notes: body.notes ?? null,
      });
      // Inventory level upsert (mirrors the manual /v1/inventory/receive).
      await this.db
        .insert(schema.inventoryLevels)
        .values({
          businessId: tenant.businessId!,
          variantId: v.line.variantId,
          locationId: po.locationId,
          onHand: v.qty,
        })
        .onConflictDoUpdate({
          target: [schema.inventoryLevels.variantId, schema.inventoryLevels.locationId],
          set: {
            onHand: sql`${schema.inventoryLevels.onHand} + ${v.qty}`,
            updatedAt: new Date(),
          },
        });
      // Bump the PO line counter.
      await this.db
        .update(schema.purchaseOrderLines)
        .set({
          quantityReceived: v.line.quantityReceived + v.qty,
        })
        .where(eq(schema.purchaseOrderLines.id, v.line.id));

      // Special-order loop (G3): units bought FOR a customer commit to
      // that customer the moment they hit the dock, and they get the
      // "your item is in" email.
      await this.specialOrders.handleReceipt(this.db, {
        businessId: tenant.businessId!,
        poLineId: v.line.id,
        locationId: po.locationId,
        quantity: v.qty,
        actorUserId: actor.id ?? null,
      });
      totalReceivedThisTx += v.qty;
    }

    // Recompute status: all lines fully received → 'received'; else
    // 'partially_received'. We re-read the lines because we just
    // mutated them.
    const refreshed = await this.db
      .select({
        ordered: schema.purchaseOrderLines.quantityOrdered,
        received: schema.purchaseOrderLines.quantityReceived,
      })
      .from(schema.purchaseOrderLines)
      .where(eq(schema.purchaseOrderLines.purchaseOrderId, id));
    const fullyReceived = refreshed.every((l) => l.received >= l.ordered);
    const nextStatus = fullyReceived ? 'received' : 'partially_received';
    const closedAt = fullyReceived ? new Date() : null;
    await this.db
      .update(schema.purchaseOrders)
      .set({ status: nextStatus, closedAt, updatedAt: new Date() })
      .where(eq(schema.purchaseOrders.id, id));

    await this.audit.log({
      action: 'purchase_order.receive',
      targetType: 'purchase_order',
      targetId: id,
      after: {
        status: nextStatus,
        unitsReceived: totalReceivedThisTx,
        lineCount: validated.length,
      },
    });

    if (fullyReceived) {
      void this.webhooks.fire({
        businessId: tenant.businessId!,
        eventType: 'purchase_order.received',
        payload: {
          purchaseOrderId: id,
          number: po.number,
          vendorId: po.vendorId,
          locationId: po.locationId,
          subtotalCents: po.subtotalCents,
        },
      });
    }
    return this.hydrate(id);
  }

  @Post(':id/cancel')
  @RequirePermission('purchase_orders.cancel')
  async cancel(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<PoDetail> {
    const [po] = await this.db
      .select()
      .from(schema.purchaseOrders)
      .where(eq(schema.purchaseOrders.id, id))
      .limit(1);
    if (!po) throw new NotFoundException('Purchase order not found');
    if (po.status === 'received' || po.status === 'canceled') {
      throw new ForbiddenException(`Cannot cancel a ${po.status} purchase order`);
    }
    await this.db
      .update(schema.purchaseOrders)
      .set({ status: 'canceled', closedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.purchaseOrders.id, id));

    await this.audit.log({
      action: 'purchase_order.cancel',
      targetType: 'purchase_order',
      targetId: id,
      before: { status: po.status },
      after: { status: 'canceled' },
    });
    return this.hydrate(id);
  }

  private async hydrate(id: string): Promise<PoDetail> {
    const [po] = await this.db
      .select({
        id: schema.purchaseOrders.id,
        number: schema.purchaseOrders.number,
        status: schema.purchaseOrders.status,
        vendorId: schema.purchaseOrders.vendorId,
        vendorName: schema.vendors.name,
        locationId: schema.purchaseOrders.locationId,
        expectedAt: schema.purchaseOrders.expectedAt,
        placedAt: schema.purchaseOrders.placedAt,
        closedAt: schema.purchaseOrders.closedAt,
        subtotalCents: schema.purchaseOrders.subtotalCents,
        notes: schema.purchaseOrders.notes,
        createdByUserId: schema.purchaseOrders.createdByUserId,
        createdAt: schema.purchaseOrders.createdAt,
      })
      .from(schema.purchaseOrders)
      .leftJoin(schema.vendors, eq(schema.vendors.id, schema.purchaseOrders.vendorId))
      .where(eq(schema.purchaseOrders.id, id))
      .limit(1);
    if (!po) throw new NotFoundException('Purchase order not found');

    const lines = await this.db
      .select({
        id: schema.purchaseOrderLines.id,
        variantId: schema.purchaseOrderLines.variantId,
        productName: schema.products.name,
        variantName: schema.productVariants.name,
        sku: schema.productVariants.sku,
        vendorSku: schema.productVariants.vendorSku,
        quantityOrdered: schema.purchaseOrderLines.quantityOrdered,
        quantityReceived: schema.purchaseOrderLines.quantityReceived,
        unitCostCents: schema.purchaseOrderLines.unitCostCents,
        lineTotalCents: schema.purchaseOrderLines.lineTotalCents,
      })
      .from(schema.purchaseOrderLines)
      .innerJoin(
        schema.productVariants,
        eq(schema.productVariants.id, schema.purchaseOrderLines.variantId),
      )
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(eq(schema.purchaseOrderLines.purchaseOrderId, id));

    return {
      ...po,
      lines: lines.map((l) => ({
        ...l,
        productName: l.productName ?? '(deleted)',
      })),
    };
  }

  /**
   * Per-business, per-year PO number. Mirrors the sale-numbering
   * approach: count + retry-on-conflict, with a randomized fallback
   * if 5 sequential candidates collide.
   */
  private async generatePoNumber(businessId: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    for (let attempt = 0; attempt < 5; attempt++) {
      const rows = await this.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(schema.purchaseOrders)
        .where(
          and(
            eq(schema.purchaseOrders.businessId, businessId),
            sql`${schema.purchaseOrders.number} LIKE ${`PO-${year}-%`}`,
          ),
        );
      const count = rows[0]?.count ?? 0;
      const seq = count + 1 + attempt;
      const candidate = `PO-${year}-${String(seq).padStart(6, '0')}`;
      const [existing] = await this.db
        .select({ id: schema.purchaseOrders.id })
        .from(schema.purchaseOrders)
        .where(
          and(
            eq(schema.purchaseOrders.businessId, businessId),
            eq(schema.purchaseOrders.number, candidate),
          ),
        )
        .limit(1);
      if (!existing) return candidate;
    }
    return `PO-${year}-${Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0')}`;
  }
}

function clampLimit(raw: string | undefined, def: number): number {
  const n = Number(raw ?? String(def));
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(Math.max(Math.floor(n), 1), 200);
}

function parseDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}
