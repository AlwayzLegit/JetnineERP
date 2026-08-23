import { Controller, ForbiddenException, Get, Inject, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { and, desc, eq, gte, inArray, isNull, lt, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { toCsv } from './csv';

interface DailyTotalRow {
  day: string; // ISO YYYY-MM-DD
  saleCount: number;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
}
interface AssociateTotalRow {
  associateUserId: string | null;
  associateEmail: string | null;
  saleCount: number;
  totalCents: number;
}
interface PaymentMethodRow {
  method: string;
  amountCents: number;
  count: number;
}
interface OrderPaymentsDayRow {
  day: string;
  amountCents: number;
  count: number;
}
interface DailyReport {
  start: string;
  end: string;
  byDay: DailyTotalRow[];
  byAssociate: AssociateTotalRow[];
  /** Tender mix across POS sales AND order deposits/balances (D2). */
  byPaymentMethod: PaymentMethodRow[];
  /** Money taken against sales orders per day — deposits and balances. */
  orderPaymentsByDay: OrderPaymentsDayRow[];
}

interface ProductRow {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  quantity: number;
  revenueCents: number;
  costCents: number | null;
  marginCents: number | null;
}
interface InventoryRow {
  variantId: string;
  locationId: string;
  productName: string;
  sku: string | null;
  variantName: string | null;
  onHand: number;
  reserved: number;
  available: number;
}

@TenantScoped()
@Controller('v1/reports')
export class ReportsController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  /**
   * Daily sales totals across the requested window. Returns three slices
   * of the same data: per-day, per-associate, and per-payment-method.
   * The window defaults to the last 7 days inclusive of today (UTC).
   */
  @Get('sales/daily')
  @RequirePermission('reports.sales.view')
  async daily(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('start') startStr?: string,
    @Query('end') endStr?: string,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<DailyReport | void> {
    const { startDate, endDate } = parseRange(startStr, endStr);
    const startTs = new Date(`${startDate}T00:00:00.000Z`);
    const endTsExclusive = new Date(`${endDate}T00:00:00.000Z`);
    endTsExclusive.setUTCDate(endTsExclusive.getUTCDate() + 1);

    // We only count completed sales (and partial refunds keep their sale
    // row in 'partially_refunded' but the originating revenue still
    // counts). Voided sales are excluded.
    const includedStatuses = sql`${schema.sales.status} IN ('completed', 'partially_refunded', 'refunded')`;
    const dateRange = and(
      gte(schema.sales.completedAt, startTs),
      lt(schema.sales.completedAt, endTsExclusive),
    );

    const dayExpr = sql<string>`to_char(${schema.sales.completedAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
    const byDay = await this.db
      .select({
        day: dayExpr,
        saleCount: sql<number>`COUNT(*)::int`,
        subtotalCents: sql<number>`COALESCE(SUM(${schema.sales.subtotalCents}), 0)::int`,
        discountCents: sql<number>`COALESCE(SUM(${schema.sales.discountCents}), 0)::int`,
        taxCents: sql<number>`COALESCE(SUM(${schema.sales.taxCents}), 0)::int`,
        totalCents: sql<number>`COALESCE(SUM(${schema.sales.totalCents}), 0)::int`,
      })
      .from(schema.sales)
      .where(and(dateRange, includedStatuses))
      .groupBy(dayExpr)
      .orderBy(dayExpr);

    const byAssociate = await this.db
      .select({
        associateUserId: schema.sales.associateUserId,
        associateEmail: schema.users.email,
        saleCount: sql<number>`COUNT(*)::int`,
        totalCents: sql<number>`COALESCE(SUM(${schema.sales.totalCents}), 0)::int`,
      })
      .from(schema.sales)
      .leftJoin(schema.users, eq(schema.users.id, schema.sales.associateUserId))
      .where(and(dateRange, includedStatuses))
      .groupBy(schema.sales.associateUserId, schema.users.email)
      .orderBy(desc(sql`COALESCE(SUM(${schema.sales.totalCents}), 0)`));

    const salePayments = await this.db
      .select({
        method: schema.payments.method,
        amountCents: sql<number>`COALESCE(SUM(${schema.payments.amountCents}), 0)::int`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(schema.payments)
      .innerJoin(schema.sales, eq(schema.sales.id, schema.payments.saleId))
      .where(and(dateRange, includedStatuses, eq(schema.payments.status, 'succeeded')))
      .groupBy(schema.payments.method);

    // Order deposits/balances join the tender mix (D2). Received-at is the
    // payment's own timestamp — an order can live for weeks, its money
    // lands the day it is taken. Imported legacy orders excluded per D8.
    const orderPaymentWindow = and(
      gte(schema.payments.createdAt, startTs),
      lt(schema.payments.createdAt, endTsExclusive),
      eq(schema.payments.status, 'succeeded'),
      isNull(schema.orders.importedAt),
    );
    const orderPayments = await this.db
      .select({
        method: schema.payments.method,
        amountCents: sql<number>`COALESCE(SUM(${schema.payments.amountCents}), 0)::int`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(schema.payments)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.payments.orderId))
      .where(orderPaymentWindow)
      .groupBy(schema.payments.method);

    const methodTotals = new Map<string, { amountCents: number; count: number }>();
    for (const row of [...salePayments, ...orderPayments]) {
      const cur = methodTotals.get(row.method) ?? { amountCents: 0, count: 0 };
      cur.amountCents += row.amountCents;
      cur.count += row.count;
      methodTotals.set(row.method, cur);
    }
    const byPaymentMethod = [...methodTotals.entries()]
      .map(([method, v]) => ({ method, ...v }))
      .sort((a, b) => b.amountCents - a.amountCents);

    const orderPayDayExpr = sql<string>`to_char(${schema.payments.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD')`;
    const orderPaymentsByDay = await this.db
      .select({
        day: orderPayDayExpr,
        amountCents: sql<number>`COALESCE(SUM(${schema.payments.amountCents}), 0)::int`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(schema.payments)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.payments.orderId))
      .where(orderPaymentWindow)
      .groupBy(orderPayDayExpr)
      .orderBy(orderPayDayExpr);

    const report: DailyReport = {
      start: startDate,
      end: endDate,
      byDay,
      byAssociate,
      byPaymentMethod,
      orderPaymentsByDay,
    };
    if (format === 'csv') {
      requireExport(tenant);
      const csv = toCsv(
        ['day', 'sale_count', 'subtotal_cents', 'discount_cents', 'tax_cents', 'total_cents'],
        report.byDay.map((r) => [
          r.day,
          r.saleCount,
          r.subtotalCents,
          r.discountCents,
          r.taxCents,
          r.totalCents,
        ]),
      );
      sendCsv(res!, `sales-daily-${startDate}-to-${endDate}.csv`, csv);
      return;
    }
    return report;
  }

  /**
   * Sales aggregated per variant across a date window. Margin (and any
   * cost-derived field) is omitted unless the caller has
   * `reports.financial.view`.
   */
  @Get('sales/by-product')
  @RequirePermission('reports.sales.view')
  async byProduct(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('start') startStr?: string,
    @Query('end') endStr?: string,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<ProductRow[] | void> {
    const { startDate, endDate } = parseRange(startStr, endStr);
    const startTs = new Date(`${startDate}T00:00:00.000Z`);
    const endTsExclusive = new Date(`${endDate}T00:00:00.000Z`);
    endTsExclusive.setUTCDate(endTsExclusive.getUTCDate() + 1);

    const canSeeFinancial = hasPermission(tenant, 'reports.financial.view');

    const rows = await this.db
      .select({
        variantId: schema.saleLines.variantId,
        productName: schema.products.name,
        variantName: schema.productVariants.name,
        sku: schema.productVariants.sku,
        costCents: schema.productVariants.costCents,
        quantity: sql<number>`COALESCE(SUM(${schema.saleLines.quantity}), 0)::int`,
        revenueCents: sql<number>`COALESCE(SUM(${schema.saleLines.totalCents}), 0)::int`,
      })
      .from(schema.saleLines)
      .innerJoin(schema.sales, eq(schema.sales.id, schema.saleLines.saleId))
      .leftJoin(schema.productVariants, eq(schema.productVariants.id, schema.saleLines.variantId))
      .leftJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(
        and(
          gte(schema.sales.completedAt, startTs),
          lt(schema.sales.completedAt, endTsExclusive),
          sql`${schema.sales.status} IN ('completed', 'partially_refunded', 'refunded')`,
        ),
      )
      .groupBy(
        schema.saleLines.variantId,
        schema.products.name,
        schema.productVariants.name,
        schema.productVariants.sku,
        schema.productVariants.costCents,
      )
      .orderBy(desc(sql`COALESCE(SUM(${schema.saleLines.totalCents}), 0)`));

    const out: ProductRow[] = rows.map((r) => {
      const cost = canSeeFinancial ? r.costCents : null;
      const margin =
        canSeeFinancial && r.costCents != null ? r.revenueCents - r.costCents * r.quantity : null;
      return {
        variantId: r.variantId ?? '',
        productName: r.productName ?? '(deleted product)',
        variantName: r.variantName ?? null,
        sku: r.sku ?? null,
        quantity: r.quantity,
        revenueCents: r.revenueCents,
        costCents: cost,
        marginCents: margin,
      };
    });

    if (format === 'csv') {
      requireExport(tenant);
      const headers = ['product', 'variant', 'sku', 'quantity', 'revenue_cents'];
      if (canSeeFinancial) headers.push('cost_cents', 'margin_cents');
      const data = out.map((r) => {
        const row: (string | number | null)[] = [
          r.productName,
          r.variantName,
          r.sku,
          r.quantity,
          r.revenueCents,
        ];
        if (canSeeFinancial) row.push(r.costCents, r.marginCents);
        return row;
      });
      sendCsv(res!, `sales-by-product-${startDate}-to-${endDate}.csv`, toCsv(headers, data));
      return;
    }
    return out;
  }

  /**
   * Inventory on-hand snapshot. Optional `locationId` filter and
   * `lowStock` numeric threshold (returns rows where available <= N).
   */
  @Get('inventory/on-hand')
  @RequirePermission('reports.inventory.view')
  async inventory(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('locationId') locationId?: string,
    @Query('lowStock') lowStockStr?: string,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<InventoryRow[] | void> {
    const where = locationId ? eq(schema.inventoryLevels.locationId, locationId) : undefined;
    const rows = await this.db
      .select({
        variantId: schema.inventoryLevels.variantId,
        locationId: schema.inventoryLevels.locationId,
        productName: schema.products.name,
        sku: schema.productVariants.sku,
        variantName: schema.productVariants.name,
        onHand: schema.inventoryLevels.onHand,
        reserved: schema.inventoryLevels.reserved,
      })
      .from(schema.inventoryLevels)
      .innerJoin(
        schema.productVariants,
        eq(schema.productVariants.id, schema.inventoryLevels.variantId),
      )
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(where)
      .orderBy(schema.products.name, schema.productVariants.sku);

    const all = rows.map((r) => ({
      ...r,
      available: Math.max(0, r.onHand - r.reserved),
    }));
    const lowStock = lowStockStr != null ? Number(lowStockStr) : NaN;
    const filtered = Number.isFinite(lowStock) ? all.filter((r) => r.available <= lowStock) : all;

    if (format === 'csv') {
      requireExport(tenant);
      sendCsv(
        res!,
        `inventory-on-hand-${new Date().toISOString().slice(0, 10)}.csv`,
        toCsv(
          ['product', 'variant', 'sku', 'on_hand', 'reserved', 'available'],
          filtered.map((r) => [
            r.productName,
            r.variantName,
            r.sku,
            r.onHand,
            r.reserved,
            r.available,
          ]),
        ),
      );
      return;
    }
    return filtered;
  }

  /**
   * Accounts receivable (G8-lite): every live or completed document that
   * still has money owing, bucketed by age. Quotes owe nothing; imported
   * docs are included — their balances are real even if their history
   * came from STORIS.
   */
  @Get('ar')
  @RequirePermission('reports.financial.view')
  async ar(@CurrentTenant() _tenant: RequestTenantContext): Promise<{
    rows: {
      customerId: string;
      customerName: string | null;
      documents: number;
      balanceCents: number;
      bucket0_30: number;
      bucket31_60: number;
      bucket61_90: number;
      bucket90plus: number;
    }[];
    totalCents: number;
  }> {
    const orders = await this.db
      .select({
        id: schema.orders.id,
        customerId: schema.orders.customerId,
        totalCents: schema.orders.totalCents,
        createdAt: schema.orders.createdAt,
        status: schema.orders.status,
      })
      .from(schema.orders)
      .where(sql`${schema.orders.status} NOT IN ('quote', 'cancelled')`);
    const orderIds = orders.map((o) => o.id);
    const paid = new Map<string, number>();
    if (orderIds.length > 0) {
      const pays = await this.db
        .select({
          orderId: schema.payments.orderId,
          amount: sql<number>`COALESCE(SUM(${schema.payments.amountCents}), 0)::int`,
        })
        .from(schema.payments)
        .where(
          and(sql`${schema.payments.orderId} IS NOT NULL`, eq(schema.payments.status, 'succeeded')),
        )
        .groupBy(schema.payments.orderId);
      for (const p of pays) if (p.orderId) paid.set(p.orderId, p.amount);
    }

    const byCustomer = new Map<
      string,
      {
        documents: number;
        balanceCents: number;
        bucket0_30: number;
        bucket31_60: number;
        bucket61_90: number;
        bucket90plus: number;
      }
    >();
    const now = Date.now();
    for (const o of orders) {
      const balance = o.totalCents - (paid.get(o.id) ?? 0);
      if (balance <= 0) continue;
      const days = Math.floor((now - new Date(o.createdAt).getTime()) / 86_400_000);
      const cur = byCustomer.get(o.customerId) ?? {
        documents: 0,
        balanceCents: 0,
        bucket0_30: 0,
        bucket31_60: 0,
        bucket61_90: 0,
        bucket90plus: 0,
      };
      cur.documents += 1;
      cur.balanceCents += balance;
      if (days <= 30) cur.bucket0_30 += balance;
      else if (days <= 60) cur.bucket31_60 += balance;
      else if (days <= 90) cur.bucket61_90 += balance;
      else cur.bucket90plus += balance;
      byCustomer.set(o.customerId, cur);
    }

    const customerIds = [...byCustomer.keys()];
    const names = customerIds.length
      ? await this.db
          .select({
            id: schema.customers.id,
            firstName: schema.customers.firstName,
            lastName: schema.customers.lastName,
          })
          .from(schema.customers)
          .where(inArray(schema.customers.id, customerIds))
      : [];
    const nameBy = new Map(
      names.map((c) => [c.id, [c.firstName, c.lastName].filter(Boolean).join(' ') || null]),
    );
    const rows = customerIds
      .map((customerId) => ({
        customerId,
        customerName: nameBy.get(customerId) ?? null,
        ...byCustomer.get(customerId)!,
      }))
      .sort((a, b) => b.balanceCents - a.balanceCents);
    return { rows, totalCents: rows.reduce((s, r) => s + r.balanceCents, 0) };
  }
}

function hasPermission(tenant: RequestTenantContext, permission: string): boolean {
  if (tenant.isSuperAdmin) return true;
  return tenant.permissions.has(permission as never);
}

function requireExport(tenant: RequestTenantContext): void {
  if (!hasPermission(tenant, 'reports.export')) {
    throw new ForbiddenException('reports.export permission required for CSV download');
  }
}

function parseRange(start?: string, end?: string): { startDate: string; endDate: string } {
  const today = new Date();
  const isoToday = today.toISOString().slice(0, 10);
  const defaultStart = new Date(today);
  defaultStart.setUTCDate(defaultStart.getUTCDate() - 6);
  const isoStart = defaultStart.toISOString().slice(0, 10);
  return {
    startDate: matchesDate(start) ? start! : isoStart,
    endDate: matchesDate(end) ? end! : isoToday,
  };
}

function matchesDate(s: string | undefined): boolean {
  return Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s));
}

function sendCsv(res: Response, filename: string, body: string): void {
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(body);
}
