import { Controller, ForbiddenException, Get, Inject, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { and, desc, eq, gte, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentTenant } from '../auth/current-user.decorator';
import { CostingService } from '../costing/costing.service';
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

interface ZReportTenderRow {
  method: string;
  amountCents: number;
  count: number;
}
interface ZReportShiftRow {
  id: string;
  locationId: string;
  openedAt: string;
  closedAt: string | null;
  openingFloatCents: number;
  expectedCashCents: number | null;
  countedCashCents: number | null;
  varianceCents: number | null;
}
interface ZReport {
  date: string;
  locationId: string | null;
  saleCount: number;
  grossCents: number;
  subtotalCents: number;
  discountCents: number;
  taxCents: number;
  refundCount: number;
  refundsCents: number;
  netCents: number;
  tenders: ZReportTenderRow[];
  orderPaymentsCents: number;
  shifts: ZReportShiftRow[];
}

interface CategoryRow {
  categoryId: string | null;
  categoryName: string;
  quantity: number;
  revenueCents: number;
}

interface ValuationRow {
  variantId: string;
  locationId: string;
  locationName: string | null;
  productName: string;
  variantName: string | null;
  sku: string | null;
  onHand: number;
  costCents: number | null;
  priceCents: number;
  costValueCents: number | null;
  retailValueCents: number;
}

interface TaxSummaryRow {
  taxClassId: string | null;
  taxClassName: string;
  lineCount: number;
  /**
   * Net line revenue (after line discounts, before order-level discount
   * allocation). The exact taxed base differs by the pro-rata order
   * discount, so this is context, not a filing figure — `taxCents` is
   * the exact number.
   */
  netSalesCents: number;
  taxCents: number;
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
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(CostingService) private readonly costing: CostingService,
  ) {}

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
   * Z-report — the daily close-out sheet, built to sit next to the STORIS
   * Z-report on parallel-run day. One UTC day (default: today), optional
   * location filter. Imported legacy documents are excluded (D8): this is
   * a drawer-day view, not a history view.
   */
  @Get('z')
  @RequirePermission('reports.sales.view')
  async zReport(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('date') dateStr?: string,
    @Query('locationId') locationId?: string,
  ): Promise<ZReport> {
    const date = matchesDate(dateStr) ? dateStr! : new Date().toISOString().slice(0, 10);
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const saleDay = and(
      gte(schema.sales.completedAt, dayStart),
      lt(schema.sales.completedAt, dayEnd),
      sql`${schema.sales.status} IN ('completed', 'partially_refunded', 'refunded')`,
      isNull(schema.sales.importedAt),
      locationId ? eq(schema.sales.locationId, locationId) : undefined,
    );

    const [salesTotals] = await this.db
      .select({
        saleCount: sql<number>`COUNT(*)::int`,
        subtotalCents: sql<number>`COALESCE(SUM(${schema.sales.subtotalCents}), 0)::int`,
        discountCents: sql<number>`COALESCE(SUM(${schema.sales.discountCents}), 0)::int`,
        taxCents: sql<number>`COALESCE(SUM(${schema.sales.taxCents}), 0)::int`,
        grossCents: sql<number>`COALESCE(SUM(${schema.sales.totalCents}), 0)::int`,
      })
      .from(schema.sales)
      .where(saleDay);

    const [refundTotals] = await this.db
      .select({
        refundCount: sql<number>`COUNT(*)::int`,
        refundsCents: sql<number>`COALESCE(SUM(${schema.refunds.amountCents}), 0)::int`,
      })
      .from(schema.refunds)
      .innerJoin(schema.sales, eq(schema.sales.id, schema.refunds.saleId))
      .where(
        and(
          gte(schema.refunds.createdAt, dayStart),
          lt(schema.refunds.createdAt, dayEnd),
          isNull(schema.sales.importedAt),
          locationId ? eq(schema.sales.locationId, locationId) : undefined,
        ),
      );

    // Tender mix: every succeeded payment taken today, whatever document
    // it landed on (POS sale, order deposit/balance, service charge) —
    // matching what the drawer actually saw. Payments against imported
    // documents are excluded via the left joins.
    const tenders = await this.db
      .select({
        method: schema.payments.method,
        amountCents: sql<number>`COALESCE(SUM(${schema.payments.amountCents}), 0)::int`,
        count: sql<number>`COUNT(*)::int`,
      })
      .from(schema.payments)
      .leftJoin(schema.sales, eq(schema.sales.id, schema.payments.saleId))
      .leftJoin(schema.orders, eq(schema.orders.id, schema.payments.orderId))
      // Service charges are the third payment parent (exactly one of
      // sale/order/service per row). Without this join a location
      // filter's COALESCE was NULL for them — every service payment
      // silently vanished from the filtered Z — and D8's imported
      // exclusion could never apply to service documents.
      .leftJoin(schema.serviceOrders, eq(schema.serviceOrders.id, schema.payments.serviceOrderId))
      .where(
        and(
          gte(schema.payments.createdAt, dayStart),
          lt(schema.payments.createdAt, dayEnd),
          eq(schema.payments.status, 'succeeded'),
          isNull(schema.sales.importedAt),
          isNull(schema.orders.importedAt),
          isNull(schema.serviceOrders.importedAt),
          locationId
            ? sql`COALESCE(${schema.sales.locationId}, ${schema.orders.locationId}, ${schema.serviceOrders.locationId}) = ${locationId}`
            : undefined,
        ),
      )
      .groupBy(schema.payments.method)
      .orderBy(desc(sql`COALESCE(SUM(${schema.payments.amountCents}), 0)`));

    const [orderMoney] = await this.db
      .select({
        amountCents: sql<number>`COALESCE(SUM(${schema.payments.amountCents}), 0)::int`,
      })
      .from(schema.payments)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.payments.orderId))
      .where(
        and(
          gte(schema.payments.createdAt, dayStart),
          lt(schema.payments.createdAt, dayEnd),
          eq(schema.payments.status, 'succeeded'),
          isNull(schema.orders.importedAt),
          locationId ? eq(schema.orders.locationId, locationId) : undefined,
        ),
      );

    const shifts = await this.db
      .select({
        id: schema.cashShifts.id,
        locationId: schema.cashShifts.locationId,
        openedAt: schema.cashShifts.openedAt,
        closedAt: schema.cashShifts.closedAt,
        openingFloatCents: schema.cashShifts.openingFloatCents,
        expectedCashCents: schema.cashShifts.expectedCashCents,
        countedCashCents: schema.cashShifts.countedCashCents,
        varianceCents: schema.cashShifts.varianceCents,
      })
      .from(schema.cashShifts)
      .where(
        and(
          // A shift belongs to today's Z if it was open at any point today:
          // opened before end-of-day and not closed before start-of-day.
          lt(schema.cashShifts.openedAt, dayEnd),
          or(isNull(schema.cashShifts.closedAt), gte(schema.cashShifts.closedAt, dayStart)),
          locationId ? eq(schema.cashShifts.locationId, locationId) : undefined,
        ),
      )
      .orderBy(schema.cashShifts.openedAt);

    const grossCents = salesTotals?.grossCents ?? 0;
    const refundsCents = refundTotals?.refundsCents ?? 0;
    return {
      date,
      locationId: locationId ?? null,
      saleCount: salesTotals?.saleCount ?? 0,
      grossCents,
      subtotalCents: salesTotals?.subtotalCents ?? 0,
      discountCents: salesTotals?.discountCents ?? 0,
      taxCents: salesTotals?.taxCents ?? 0,
      refundCount: refundTotals?.refundCount ?? 0,
      refundsCents,
      netCents: grossCents - refundsCents,
      tenders,
      orderPaymentsCents: orderMoney?.amountCents ?? 0,
      shifts: shifts.map((s) => ({
        ...s,
        openedAt: s.openedAt.toISOString(),
        closedAt: s.closedAt ? s.closedAt.toISOString() : null,
      })),
    };
  }

  /** Sales aggregated per product category across a date window. */
  @Get('sales/by-category')
  @RequirePermission('reports.sales.view')
  async byCategory(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('start') startStr?: string,
    @Query('end') endStr?: string,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<CategoryRow[] | void> {
    const { startDate, endDate } = parseRange(startStr, endStr);
    const startTs = new Date(`${startDate}T00:00:00.000Z`);
    const endTsExclusive = new Date(`${endDate}T00:00:00.000Z`);
    endTsExclusive.setUTCDate(endTsExclusive.getUTCDate() + 1);

    const rows = await this.db
      .select({
        categoryId: schema.products.categoryId,
        categoryName: sql<string>`COALESCE(${schema.categories.name}, 'Uncategorized')`,
        quantity: sql<number>`COALESCE(SUM(${schema.saleLines.quantity}), 0)::int`,
        revenueCents: sql<number>`COALESCE(SUM(${schema.saleLines.totalCents}), 0)::int`,
      })
      .from(schema.saleLines)
      .innerJoin(schema.sales, eq(schema.sales.id, schema.saleLines.saleId))
      .leftJoin(schema.productVariants, eq(schema.productVariants.id, schema.saleLines.variantId))
      .leftJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .leftJoin(schema.categories, eq(schema.categories.id, schema.products.categoryId))
      .where(
        and(
          gte(schema.sales.completedAt, startTs),
          lt(schema.sales.completedAt, endTsExclusive),
          sql`${schema.sales.status} IN ('completed', 'partially_refunded', 'refunded')`,
        ),
      )
      .groupBy(schema.products.categoryId, schema.categories.name)
      .orderBy(desc(sql`COALESCE(SUM(${schema.saleLines.totalCents}), 0)`));

    if (format === 'csv') {
      requireExport(tenant);
      sendCsv(
        res!,
        `sales-by-category-${startDate}-to-${endDate}.csv`,
        toCsv(
          ['category', 'quantity', 'revenue_cents'],
          rows.map((r) => [r.categoryName, r.quantity, r.revenueCents]),
        ),
      );
      return;
    }
    return rows;
  }

  /**
   * Inventory valuation: on-hand × cost (and × retail) per variant.
   * Cost-derived, so it sits behind `reports.financial.view`.
   */
  @Get('inventory/valuation')
  @RequirePermission('reports.financial.view')
  async valuation(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('locationId') locationId?: string,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<{
    rows: ValuationRow[];
    totalCostValueCents: number;
    totalRetailValueCents: number;
  } | void> {
    const rows = await this.db
      .select({
        variantId: schema.inventoryLevels.variantId,
        locationId: schema.inventoryLevels.locationId,
        locationName: schema.locations.name,
        productName: schema.products.name,
        variantName: schema.productVariants.name,
        sku: schema.productVariants.sku,
        onHand: schema.inventoryLevels.onHand,
        costCents: schema.productVariants.costCents,
        priceCents: schema.productVariants.priceCents,
      })
      .from(schema.inventoryLevels)
      .innerJoin(
        schema.productVariants,
        eq(schema.productVariants.id, schema.inventoryLevels.variantId),
      )
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .leftJoin(schema.locations, eq(schema.locations.id, schema.inventoryLevels.locationId))
      .where(locationId ? eq(schema.inventoryLevels.locationId, locationId) : undefined)
      .orderBy(schema.products.name, schema.productVariants.sku);

    // FIFO valuation (owner decision 2026-08-27): layered stock is valued
    // at its actual layer costs; any remainder that predates costing
    // falls back to the catalog cost.
    const fifo = await this.costing.valuation(this.db, {
      businessId: tenant.businessId!,
      locationId,
    });
    const out: ValuationRow[] = rows.map((r) => {
      const layered = fifo.get(`${r.variantId}:${r.locationId}`);
      const layeredQty = Math.min(layered?.quantity ?? 0, r.onHand);
      const remainder = r.onHand - layeredQty;
      const costValueCents = layered
        ? layered.costCents + remainder * (r.costCents ?? 0)
        : r.costCents != null
          ? r.costCents * r.onHand
          : null;
      return {
        ...r,
        costValueCents,
        retailValueCents: r.priceCents * r.onHand,
      };
    });
    const totalCostValueCents = out.reduce((s, r) => s + (r.costValueCents ?? 0), 0);
    const totalRetailValueCents = out.reduce((s, r) => s + r.retailValueCents, 0);

    if (format === 'csv') {
      requireExport(tenant);
      sendCsv(
        res!,
        `inventory-valuation-${new Date().toISOString().slice(0, 10)}.csv`,
        toCsv(
          [
            'product',
            'variant',
            'sku',
            'location',
            'on_hand',
            'cost_cents',
            'cost_value_cents',
            'retail_value_cents',
          ],
          out.map((r) => [
            r.productName,
            r.variantName,
            r.sku,
            r.locationName ?? r.locationId,
            r.onHand,
            r.costCents,
            r.costValueCents,
            r.retailValueCents,
          ]),
        ),
      );
      return;
    }
    return { rows: out, totalCostValueCents, totalRetailValueCents };
  }

  /**
   * Tax collected across a window, grouped by the product's tax class.
   * Lines whose product has no class fall under the business/location
   * default rate. Reconciles to the cent with SUM(sales.tax_cents).
   */
  @Get('tax/summary')
  @RequirePermission('reports.financial.view')
  async taxSummary(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('start') startStr?: string,
    @Query('end') endStr?: string,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<{ rows: TaxSummaryRow[]; totalTaxCents: number; start: string; end: string } | void> {
    const { startDate, endDate } = parseRange(startStr, endStr);
    const startTs = new Date(`${startDate}T00:00:00.000Z`);
    const endTsExclusive = new Date(`${endDate}T00:00:00.000Z`);
    endTsExclusive.setUTCDate(endTsExclusive.getUTCDate() + 1);

    const rows = await this.db
      .select({
        taxClassId: schema.products.taxClassId,
        taxClassName: sql<string>`COALESCE(${schema.taxClasses.name}, 'Default rate')`,
        lineCount: sql<number>`COUNT(*)::int`,
        // Line totalCents is net of line discounts and pre-tax (totals.ts).
        netSalesCents: sql<number>`COALESCE(SUM(${schema.saleLines.totalCents}), 0)::int`,
        taxCents: sql<number>`COALESCE(SUM(${schema.saleLines.taxCents}), 0)::int`,
      })
      .from(schema.saleLines)
      .innerJoin(schema.sales, eq(schema.sales.id, schema.saleLines.saleId))
      .leftJoin(schema.productVariants, eq(schema.productVariants.id, schema.saleLines.variantId))
      .leftJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .leftJoin(schema.taxClasses, eq(schema.taxClasses.id, schema.products.taxClassId))
      .where(
        and(
          gte(schema.sales.completedAt, startTs),
          lt(schema.sales.completedAt, endTsExclusive),
          sql`${schema.sales.status} IN ('completed', 'partially_refunded', 'refunded')`,
        ),
      )
      .groupBy(schema.products.taxClassId, schema.taxClasses.name)
      .orderBy(desc(sql`COALESCE(SUM(${schema.saleLines.taxCents}), 0)`));

    const totalTaxCents = rows.reduce((s, r) => s + r.taxCents, 0);

    if (format === 'csv') {
      requireExport(tenant);
      sendCsv(
        res!,
        `tax-summary-${startDate}-to-${endDate}.csv`,
        toCsv(
          ['tax_class', 'line_count', 'net_sales_cents', 'tax_cents'],
          rows.map((r) => [r.taxClassName, r.lineCount, r.netSalesCents, r.taxCents]),
        ),
      );
      return;
    }
    return { rows, totalTaxCents, start: startDate, end: endDate };
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
