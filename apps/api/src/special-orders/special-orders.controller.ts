import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface QueueRow {
  orderLineId: string;
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  variantId: string | null;
  sku: string | null;
  preferredVendorId: string | null;
  unitCostCents: number | null;
  description: string;
  quantity: number;
  allocated: number;
  toOrder: number;
}

interface GeneratePoBody {
  vendorId?: string;
  locationId?: string;
  /** Place immediately (default) or leave as draft. */
  place?: boolean;
  lines?: { orderLineId?: string; quantity?: number; unitCostCents?: number }[];
}

/**
 * The to-order queue (STORIS cutover G3): what customers have bought
 * that the store still has to buy. Rows are special-order lines on live
 * orders that aren't fully covered by PO allocations; generate-PO turns
 * a selection into a purchase order and links every unit back to the
 * customer who's waiting for it.
 */
@TenantScoped()
@Controller('v1/special-orders')
export class SpecialOrdersController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get('queue')
  @RequirePermission('orders.view')
  async queue(@CurrentTenant() _tenant: RequestTenantContext): Promise<QueueRow[]> {
    const lines = await this.db
      .select({
        orderLineId: schema.orderLines.id,
        orderId: schema.orderLines.orderId,
        variantId: schema.orderLines.variantId,
        description: schema.orderLines.description,
        quantity: schema.orderLines.quantity,
        orderNumber: schema.orders.number,
        customerId: schema.orders.customerId,
      })
      .from(schema.orderLines)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.orderLines.orderId))
      .where(
        and(
          eq(schema.orderLines.lineType, 'special_order'),
          inArray(schema.orders.status, ['open', 'partially_fulfilled']),
        ),
      );
    if (lines.length === 0) return [];

    const allocations = await this.db
      .select({
        orderLineId: schema.poLineAllocations.orderLineId,
        allocated: sql<number>`COALESCE(SUM(${schema.poLineAllocations.quantity}), 0)::int`,
      })
      .from(schema.poLineAllocations)
      .where(
        and(
          inArray(
            schema.poLineAllocations.orderLineId,
            lines.map((l) => l.orderLineId),
          ),
          sql`${schema.poLineAllocations.status} != 'cancelled'`,
        ),
      )
      .groupBy(schema.poLineAllocations.orderLineId);
    const allocatedBy = new Map(allocations.map((a) => [a.orderLineId, a.allocated]));

    const customerIds = [...new Set(lines.map((l) => l.customerId))];
    const customers = await this.db
      .select({
        id: schema.customers.id,
        firstName: schema.customers.firstName,
        lastName: schema.customers.lastName,
      })
      .from(schema.customers)
      .where(inArray(schema.customers.id, customerIds));
    const nameBy = new Map(
      customers.map((c) => [c.id, [c.firstName, c.lastName].filter(Boolean).join(' ') || null]),
    );

    const variantIds = lines.map((l) => l.variantId).filter((v): v is string => Boolean(v));
    const variants = variantIds.length
      ? await this.db
          .select({
            id: schema.productVariants.id,
            sku: schema.productVariants.sku,
            costCents: schema.productVariants.costCents,
            preferredVendorId: schema.productVariants.preferredVendorId,
          })
          .from(schema.productVariants)
          .where(inArray(schema.productVariants.id, variantIds))
      : [];
    const variantBy = new Map(variants.map((v) => [v.id, v]));

    return lines
      .map((l) => {
        const allocated = allocatedBy.get(l.orderLineId) ?? 0;
        const variant = l.variantId ? variantBy.get(l.variantId) : undefined;
        return {
          orderLineId: l.orderLineId,
          orderId: l.orderId,
          orderNumber: l.orderNumber,
          customerName: nameBy.get(l.customerId) ?? null,
          variantId: l.variantId,
          sku: variant?.sku ?? null,
          // §6: lets the PO builder pre-load "sold-not-in-stock for
          // that vendor" and pre-fill the cost.
          preferredVendorId: variant?.preferredVendorId ?? null,
          unitCostCents: variant?.costCents ?? null,
          description: l.description,
          quantity: l.quantity,
          allocated,
          toOrder: Math.max(0, l.quantity - allocated),
        };
      })
      .filter((r) => r.toOrder > 0);
  }

  /**
   * Turn queue lines into one purchase order for one vendor. Every unit
   * ordered is allocated back to the customer line that needs it, so the
   * receiving dock knows exactly whose goods just arrived.
   */
  @Post('generate-po')
  @RequirePermission('purchase_orders.create')
  async generatePo(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: GeneratePoBody,
  ): Promise<{ purchaseOrderId: string; number: string; lineCount: number }> {
    if (!body.vendorId) throw new BadRequestException('vendorId is required');
    if (!body.lines || body.lines.length === 0) {
      throw new BadRequestException('lines must contain at least one entry');
    }
    const [vendor] = await this.db
      .select({ id: schema.vendors.id })
      .from(schema.vendors)
      .where(eq(schema.vendors.id, body.vendorId))
      .limit(1);
    if (!vendor) throw new NotFoundException('Vendor not found');

    const lineIds = body.lines.map((l) => String(l.orderLineId ?? ''));
    const orderLines = await this.db
      .select({
        id: schema.orderLines.id,
        orderId: schema.orderLines.orderId,
        variantId: schema.orderLines.variantId,
        quantity: schema.orderLines.quantity,
      })
      .from(schema.orderLines)
      .where(inArray(schema.orderLines.id, lineIds));
    const byId = new Map(orderLines.map((l) => [l.id, l]));

    // Location: explicit, or the first order's location.
    let locationId = body.locationId ?? null;
    if (!locationId) {
      const [ord] = await this.db
        .select({ locationId: schema.orders.locationId })
        .from(schema.orders)
        .where(eq(schema.orders.id, orderLines[0]?.orderId ?? ''))
        .limit(1);
      locationId = ord?.locationId ?? null;
    }
    if (!locationId) throw new BadRequestException('locationId is required');

    // Validate + shape: per-variant aggregation for the PO lines, exact
    // per-order-line quantities for the allocations.
    const perVariant = new Map<string, { quantity: number; unitCostCents: number }>();
    const allocInputs: { orderLineId: string; variantId: string; quantity: number }[] = [];
    for (const input of body.lines) {
      const line = byId.get(String(input.orderLineId ?? ''));
      if (!line) throw new NotFoundException(`Order line not found: ${input.orderLineId}`);
      if (!line.variantId) {
        throw new BadRequestException(`Line ${line.id} is free-text — order it manually`);
      }
      const qty = Number(input.quantity ?? 0);
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new BadRequestException('lines[].quantity must be a positive integer');
      }
      const cur = perVariant.get(line.variantId) ?? { quantity: 0, unitCostCents: 0 };
      cur.quantity += qty;
      if (input.unitCostCents != null) cur.unitCostCents = input.unitCostCents;
      perVariant.set(line.variantId, cur);
      allocInputs.push({ orderLineId: line.id, variantId: line.variantId, quantity: qty });
    }

    // Cost fallback: the variant's recorded cost.
    const variantRows = await this.db
      .select({ id: schema.productVariants.id, costCents: schema.productVariants.costCents })
      .from(schema.productVariants)
      .where(inArray(schema.productVariants.id, [...perVariant.keys()]));
    for (const v of variantRows) {
      const entry = perVariant.get(v.id)!;
      if (!entry.unitCostCents) entry.unitCostCents = v.costCents ?? 0;
    }

    const number = await this.generatePoNumber(tenant.businessId!);
    const place = body.place !== false;
    const subtotal = [...perVariant.values()].reduce((s, v) => s + v.quantity * v.unitCostCents, 0);
    const [po] = await this.db
      .insert(schema.purchaseOrders)
      .values({
        businessId: tenant.businessId!,
        vendorId: body.vendorId,
        locationId,
        number,
        status: place ? 'ordered' : 'draft',
        placedAt: place ? new Date() : null,
        subtotalCents: subtotal,
        notes: 'Generated from the special-orders queue',
        createdByUserId: actor?.id ?? null,
      })
      .returning();
    if (!po) throw new BadRequestException('failed to create purchase order');

    const poLineIdByVariant = new Map<string, string>();
    for (const [variantId, v] of perVariant) {
      const [poLine] = await this.db
        .insert(schema.purchaseOrderLines)
        .values({
          businessId: tenant.businessId!,
          purchaseOrderId: po.id,
          variantId,
          quantityOrdered: v.quantity,
          unitCostCents: v.unitCostCents,
          lineTotalCents: v.quantity * v.unitCostCents,
        })
        .returning();
      poLineIdByVariant.set(variantId, poLine!.id);
    }
    await this.db.insert(schema.poLineAllocations).values(
      allocInputs.map((a) => ({
        businessId: tenant.businessId!,
        poLineId: poLineIdByVariant.get(a.variantId)!,
        orderLineId: a.orderLineId,
        quantity: a.quantity,
      })),
    );

    await this.audit.log({
      action: 'special_orders.generate_po',
      targetType: 'purchase_order',
      targetId: po.id,
      after: { number, vendorId: body.vendorId, lineCount: allocInputs.length },
    });
    return { purchaseOrderId: po.id, number, lineCount: allocInputs.length };
  }

  /** Same count-and-retry scheme the purchasing module uses. */
  private async generatePoNumber(businessId: string): Promise<string> {
    const year = new Date().getUTCFullYear();
    for (let attempt = 0; attempt < 8; attempt++) {
      const rows = await this.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(schema.purchaseOrders)
        .where(
          and(
            eq(schema.purchaseOrders.businessId, businessId),
            sql`${schema.purchaseOrders.number} LIKE ${`PO-${year}-%`}`,
          ),
        );
      const seq = (rows[0]?.count ?? 0) + 1 + attempt;
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
    return `PO-${year}-${Math.random().toString().slice(2, 8)}`;
  }
}
