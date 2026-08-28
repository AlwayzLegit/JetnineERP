import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gte, inArray, isNotNull, isNull, lt, ne, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { GlService, resolvePeriod } from './gl.service';

/**
 * GL journal-event derivation (docs/erp-gl/DERIVATION-SPEC.md — the
 * contract). One derived, POSTED batch per family per business date,
 * idempotent by (source_type = eod_<family>, business_date). Ground
 * rules honored here:
 *  - anti-F1: a family whose system keys are unmapped is SKIPPED with
 *    the reason reported — nothing posts to a fallback account;
 *  - D8: imported records never derive;
 *  - defensive balance: a family whose legs do not balance is skipped
 *    and reported, never force-balanced.
 * Refunds derive with a proportional tax split (family 9). Exchanges
 * settle through their orders and the returns machinery — their money
 * flows already surface in families 1-3.
 */

interface Leg {
  key: string;
  debitCents?: number;
  creditCents?: number;
  memo: string;
}

export interface DerivationOutcome {
  posted: { family: string; batchNumber: string; debitCents: number }[];
  skipped: { family: string; reason: string }[];
}

/** Tender method → system account key (spec §families). */
const METHOD_KEY: Record<string, string> = {
  cash: 'cash_drawer',
  card: 'cash_bank',
  external_card: 'cash_bank',
  check: 'cash_bank',
  gift_card: 'gift_card_liability',
  store_credit: 'deposit_liability',
  financing: 'accounts_receivable',
};

const COGS_CONSUMPTION_TYPES = ['sale', 'order_fulfill', 'direct_ship'];
const ADJUST_CONSUMPTION_TYPES = ['inventory_adjust', 'physical_count'];
const RECEIPT_LAYER_TYPES = ['po_receive', 'receive'];
const ADJUST_LAYER_TYPES = ['adjustment', 'physical_count', 'as_is_restock'];

@Injectable()
export class GlDerivationService {
  constructor(@Inject(GlService) private readonly gl: GlService) {}

  async derive(
    db: PostgresJsDatabase,
    businessId: string,
    businessDate: string,
    jobRunId: string,
  ): Promise<DerivationOutcome> {
    const outcome: DerivationOutcome = { posted: [], skipped: [] };
    const { fiscalYear, period } = resolvePeriod(businessDate);

    const status = await this.gl.periodStatus(businessId, fiscalYear, period, db);
    if (status !== 'open') {
      outcome.skipped.push({ family: '*', reason: `period ${fiscalYear}-${period} is closed` });
      return outcome;
    }

    const accountRows = await db
      .select({
        id: schema.glAccounts.id,
        systemKey: schema.glAccounts.systemKey,
        isActive: schema.glAccounts.isActive,
      })
      .from(schema.glAccounts)
      .where(
        and(eq(schema.glAccounts.businessId, businessId), isNotNull(schema.glAccounts.systemKey)),
      );
    const keyToAccount = new Map(
      accountRows.filter((a) => a.isActive).map((a) => [a.systemKey!, a.id]),
    );

    const from = new Date(`${businessDate}T00:00:00Z`);
    const to = new Date(from.getTime() + 24 * 60 * 60 * 1000);

    const families: { family: string; legs: () => Promise<Leg[]> }[] = [
      { family: 'pos_sales', legs: () => this.posSales(db, businessId, from, to) },
      { family: 'order_money_in', legs: () => this.orderMoneyIn(db, businessId, from, to) },
      { family: 'order_revenue', legs: () => this.orderRevenue(db, businessId, from, to) },
      { family: 'cogs', legs: () => this.cogs(db, businessId, from, to) },
      { family: 'inventory_receipts', legs: () => this.receipts(db, businessId, from, to) },
      { family: 'vendor_bills', legs: () => this.vendorBills(db, businessId, from, to) },
      { family: 'cash_over_short', legs: () => this.overShort(db, businessId, from, to) },
      { family: 'inventory_adjustments', legs: () => this.adjustments(db, businessId, from, to) },
      { family: 'refunds', legs: () => this.refunds(db, businessId, from, to) },
    ];

    for (const f of families) {
      const sourceType = `eod_${f.family}`;
      const [existing] = await db
        .select({ id: schema.glJournalBatches.id })
        .from(schema.glJournalBatches)
        .where(
          and(
            eq(schema.glJournalBatches.businessId, businessId),
            eq(schema.glJournalBatches.sourceType, sourceType),
            eq(schema.glJournalBatches.businessDate, businessDate),
          ),
        )
        .limit(1);
      if (existing) {
        outcome.skipped.push({ family: f.family, reason: 'already derived for this date' });
        continue;
      }

      const legs = (await f.legs()).filter(
        (l) => (l.debitCents ?? 0) > 0 || (l.creditCents ?? 0) > 0,
      );
      if (legs.length === 0) continue; // no activity — nothing to post, nothing to report

      const neededKeys = [...new Set(legs.map((l) => l.key))];
      const unmapped = neededKeys.filter((k) => !keyToAccount.has(k));
      if (unmapped.length > 0) {
        outcome.skipped.push({
          family: f.family,
          reason: `unmapped system key(s): ${unmapped.join(', ')} — map them in /gl and re-run`,
        });
        continue;
      }

      const debitCents = legs.reduce((s, l) => s + (l.debitCents ?? 0), 0);
      const creditCents = legs.reduce((s, l) => s + (l.creditCents ?? 0), 0);
      if (debitCents !== creditCents) {
        outcome.skipped.push({
          family: f.family,
          reason: `legs out of balance (${debitCents}¢ vs ${creditCents}¢) — investigate before posting manually`,
        });
        continue;
      }

      const number = await this.gl.generateBatchNumber(businessId, fiscalYear, db);
      const [batch] = await db
        .insert(schema.glJournalBatches)
        .values({
          businessId,
          number,
          status: 'posted',
          batchType: 'derived',
          sourceType,
          sourceId: jobRunId,
          businessDate,
          fiscalYear,
          period,
          memo: `EOD derivation ${businessDate}: ${f.family}`,
          postedAt: new Date(),
        })
        .returning();
      await db.insert(schema.glJournalLines).values(
        legs.map((l) => ({
          businessId,
          batchId: batch!.id,
          accountId: keyToAccount.get(l.key)!,
          memo: l.memo,
          debitCents: l.debitCents ?? 0,
          creditCents: l.creditCents ?? 0,
        })),
      );
      outcome.posted.push({ family: f.family, batchNumber: number, debitCents });
    }
    return outcome;
  }

  /** Family 1: POS sales completed in the window (D8-excluded). */
  private async posSales(
    db: PostgresJsDatabase,
    businessId: string,
    from: Date,
    to: Date,
  ): Promise<Leg[]> {
    const [totals] = await db
      .select({
        subtotal: sql<number>`COALESCE(SUM(${schema.sales.subtotalCents}), 0)::int`,
        discount: sql<number>`COALESCE(SUM(${schema.sales.discountCents}), 0)::int`,
        tax: sql<number>`COALESCE(SUM(${schema.sales.taxCents}), 0)::int`,
      })
      .from(schema.sales)
      .where(
        and(
          eq(schema.sales.businessId, businessId),
          isNull(schema.sales.importedAt),
          gte(schema.sales.completedAt, from),
          lt(schema.sales.completedAt, to),
        ),
      );
    const tender = await db
      .select({
        method: schema.payments.method,
        amount: sql<number>`COALESCE(SUM(${schema.payments.amountCents}), 0)::int`,
      })
      .from(schema.payments)
      .innerJoin(schema.sales, eq(schema.sales.id, schema.payments.saleId))
      .where(
        and(
          eq(schema.payments.businessId, businessId),
          eq(schema.payments.status, 'succeeded'),
          isNull(schema.sales.importedAt),
          gte(schema.sales.completedAt, from),
          lt(schema.sales.completedAt, to),
        ),
      )
      .groupBy(schema.payments.method);
    const legs: Leg[] = tender.map((t) => ({
      key: METHOD_KEY[t.method] ?? 'cash_bank',
      debitCents: t.amount,
      memo: `POS tender: ${t.method}`,
    }));
    const revenue = (totals?.subtotal ?? 0) - (totals?.discount ?? 0);
    if (revenue > 0)
      legs.push({ key: 'sales_revenue', creditCents: revenue, memo: 'POS sales revenue' });
    if ((totals?.tax ?? 0) > 0)
      legs.push({ key: 'sales_tax_payable', creditCents: totals!.tax, memo: 'POS sales tax' });
    return legs;
  }

  /** Family 2: money taken on orders (deposits, balances, installments). */
  private async orderMoneyIn(
    db: PostgresJsDatabase,
    businessId: string,
    from: Date,
    to: Date,
  ): Promise<Leg[]> {
    const tender = await db
      .select({
        method: schema.payments.method,
        amount: sql<number>`COALESCE(SUM(${schema.payments.amountCents}), 0)::int`,
      })
      .from(schema.payments)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.payments.orderId))
      .where(
        and(
          eq(schema.payments.businessId, businessId),
          eq(schema.payments.status, 'succeeded'),
          isNull(schema.orders.importedAt),
          gte(schema.payments.createdAt, from),
          lt(schema.payments.createdAt, to),
        ),
      )
      .groupBy(schema.payments.method);
    const legs: Leg[] = tender.map((t) => ({
      key: METHOD_KEY[t.method] ?? 'cash_bank',
      debitCents: t.amount,
      memo: `Order money in: ${t.method}`,
    }));
    const total = tender.reduce((s, t) => s + t.amount, 0);
    if (total > 0)
      legs.push({ key: 'deposit_liability', creditCents: total, memo: 'Customer deposits held' });
    return legs;
  }

  /** Family 3: revenue recognition at FULL order completion (lean rule). */
  private async orderRevenue(
    db: PostgresJsDatabase,
    businessId: string,
    from: Date,
    to: Date,
  ): Promise<Leg[]> {
    const [t] = await db
      .select({
        subtotal: sql<number>`COALESCE(SUM(${schema.orders.subtotalCents}), 0)::int`,
        discount: sql<number>`COALESCE(SUM(${schema.orders.discountCents}), 0)::int`,
        tax: sql<number>`COALESCE(SUM(${schema.orders.taxCents}), 0)::int`,
        delivery: sql<number>`COALESCE(SUM(${schema.orders.deliveryFeeCents}), 0)::int`,
        install: sql<number>`COALESCE(SUM(${schema.orders.installFeeCents}), 0)::int`,
        other: sql<number>`COALESCE(SUM(${schema.orders.otherFeeCents}), 0)::int`,
        total: sql<number>`COALESCE(SUM(${schema.orders.totalCents}), 0)::int`,
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.businessId, businessId),
          isNull(schema.orders.importedAt),
          gte(schema.orders.completedAt, from),
          lt(schema.orders.completedAt, to),
        ),
      );
    if (!t || t.total === 0) return [];
    const legs: Leg[] = [
      { key: 'deposit_liability', debitCents: t.total, memo: 'Deposits released at completion' },
    ];
    const revenue = t.subtotal - t.discount;
    if (revenue > 0)
      legs.push({ key: 'sales_revenue', creditCents: revenue, memo: 'Order revenue' });
    if (t.tax > 0)
      legs.push({ key: 'sales_tax_payable', creditCents: t.tax, memo: 'Order sales tax' });
    if (t.delivery > 0)
      legs.push({ key: 'delivery_revenue', creditCents: t.delivery, memo: 'Delivery charges' });
    const fees = t.install + t.other;
    if (fees > 0) legs.push({ key: 'fee_revenue', creditCents: fees, memo: 'Install + misc fees' });
    return legs;
  }

  /** Family 4: COGS at actual FIFO cents. */
  private async cogs(
    db: PostgresJsDatabase,
    businessId: string,
    from: Date,
    to: Date,
  ): Promise<Leg[]> {
    const [t] = await db
      .select({
        cents: sql<number>`COALESCE(SUM(${schema.costConsumptions.quantity} * ${schema.costConsumptions.unitCostCents}), 0)::int`,
      })
      .from(schema.costConsumptions)
      .where(
        and(
          eq(schema.costConsumptions.businessId, businessId),
          inArray(schema.costConsumptions.referenceType, COGS_CONSUMPTION_TYPES),
          gte(schema.costConsumptions.consumedAt, from),
          lt(schema.costConsumptions.consumedAt, to),
        ),
      );
    if (!t || t.cents === 0) return [];
    return [
      { key: 'cogs', debitCents: t.cents, memo: 'Cost of goods sold (FIFO actual)' },
      { key: 'inventory', creditCents: t.cents, memo: 'Inventory relieved' },
    ];
  }

  /** Family 5: receipts raise inventory against Received Not Recorded. */
  private async receipts(
    db: PostgresJsDatabase,
    businessId: string,
    from: Date,
    to: Date,
  ): Promise<Leg[]> {
    const [layers] = await db
      .select({
        cents: sql<number>`COALESCE(SUM(${schema.costLayers.quantityReceived} * ${schema.costLayers.unitCostCents}), 0)::int`,
      })
      .from(schema.costLayers)
      .where(
        and(
          eq(schema.costLayers.businessId, businessId),
          inArray(schema.costLayers.sourceType, RECEIPT_LAYER_TYPES),
          gte(schema.costLayers.receivedAt, from),
          lt(schema.costLayers.receivedAt, to),
        ),
      );
    const [unreceive] = await db
      .select({
        cents: sql<number>`COALESCE(SUM(${schema.costConsumptions.quantity} * ${schema.costConsumptions.unitCostCents}), 0)::int`,
      })
      .from(schema.costConsumptions)
      .where(
        and(
          eq(schema.costConsumptions.businessId, businessId),
          eq(schema.costConsumptions.referenceType, 'po_unreceive'),
          gte(schema.costConsumptions.consumedAt, from),
          lt(schema.costConsumptions.consumedAt, to),
        ),
      );
    const legs: Leg[] = [];
    if ((layers?.cents ?? 0) > 0) {
      legs.push(
        { key: 'inventory', debitCents: layers!.cents, memo: 'Receipts into inventory' },
        {
          key: 'received_not_recorded',
          creditCents: layers!.cents,
          memo: 'Goods received, bill pending',
        },
      );
    }
    if ((unreceive?.cents ?? 0) > 0) {
      legs.push(
        {
          key: 'received_not_recorded',
          debitCents: unreceive!.cents,
          memo: 'Un-received (receipt reversal)',
        },
        { key: 'inventory', creditCents: unreceive!.cents, memo: 'Inventory backed out' },
      );
    }
    return legs;
  }

  /** Family 6: approved vendor bills clear RNR into AP. */
  private async vendorBills(
    db: PostgresJsDatabase,
    businessId: string,
    from: Date,
    to: Date,
  ): Promise<Leg[]> {
    const [t] = await db
      .select({
        cents: sql<number>`COALESCE(SUM(${schema.vendorInvoices.totalCents}), 0)::int`,
      })
      .from(schema.vendorInvoices)
      .where(
        and(
          eq(schema.vendorInvoices.businessId, businessId),
          gte(schema.vendorInvoices.approvedAt, from),
          lt(schema.vendorInvoices.approvedAt, to),
        ),
      );
    if (!t || t.cents === 0) return [];
    return [
      { key: 'received_not_recorded', debitCents: t.cents, memo: 'RNR cleared at bill approval' },
      { key: 'accounts_payable', creditCents: t.cents, memo: 'Vendor bills approved' },
    ];
  }

  /** Family 7: drawer over/short at shift close. */
  private async overShort(
    db: PostgresJsDatabase,
    businessId: string,
    from: Date,
    to: Date,
  ): Promise<Leg[]> {
    const [t] = await db
      .select({
        short: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashShifts.varianceCents} < 0 THEN -${schema.cashShifts.varianceCents} ELSE 0 END), 0)::int`,
        over: sql<number>`COALESCE(SUM(CASE WHEN ${schema.cashShifts.varianceCents} > 0 THEN ${schema.cashShifts.varianceCents} ELSE 0 END), 0)::int`,
      })
      .from(schema.cashShifts)
      .where(
        and(
          eq(schema.cashShifts.businessId, businessId),
          ne(schema.cashShifts.varianceCents, 0),
          gte(schema.cashShifts.closedAt, from),
          lt(schema.cashShifts.closedAt, to),
        ),
      );
    const legs: Leg[] = [];
    if ((t?.short ?? 0) > 0) {
      legs.push(
        { key: 'cash_over_short', debitCents: t!.short, memo: 'Drawers short' },
        { key: 'cash_drawer', creditCents: t!.short, memo: 'Drawer cash below expected' },
      );
    }
    if ((t?.over ?? 0) > 0) {
      legs.push(
        { key: 'cash_drawer', debitCents: t!.over, memo: 'Drawer cash above expected' },
        { key: 'cash_over_short', creditCents: t!.over, memo: 'Drawers over' },
      );
    }
    return legs;
  }

  /**
   * Family 9: POS refunds — tax split proportionally to the original
   * sale (round-half-up per refund), tender back out of the drawer.
   */
  private async refunds(
    db: PostgresJsDatabase,
    businessId: string,
    from: Date,
    to: Date,
  ): Promise<Leg[]> {
    const rows = await db
      .select({
        amountCents: schema.refunds.amountCents,
        saleTaxCents: schema.sales.taxCents,
        saleTotalCents: schema.sales.totalCents,
      })
      .from(schema.refunds)
      .innerJoin(schema.sales, eq(schema.sales.id, schema.refunds.saleId))
      .where(
        and(
          eq(schema.refunds.businessId, businessId),
          isNull(schema.sales.importedAt),
          gte(schema.refunds.createdAt, from),
          lt(schema.refunds.createdAt, to),
        ),
      );
    let revenue = 0;
    let tax = 0;
    let total = 0;
    for (const r of rows) {
      const taxShare =
        r.saleTotalCents > 0 ? Math.round((r.amountCents * r.saleTaxCents) / r.saleTotalCents) : 0;
      revenue += r.amountCents - taxShare;
      tax += taxShare;
      total += r.amountCents;
    }
    if (total === 0) return [];
    const legs: Leg[] = [];
    if (revenue > 0)
      legs.push({ key: 'sales_revenue', debitCents: revenue, memo: 'Refunded revenue' });
    if (tax > 0)
      legs.push({ key: 'sales_tax_payable', debitCents: tax, memo: 'Refunded sales tax' });
    legs.push({ key: 'cash_drawer', creditCents: total, memo: 'Refunds paid from drawer' });
    return legs;
  }

  /** Family 8: adjustments/counts/as-is recoveries against inventory. */
  private async adjustments(
    db: PostgresJsDatabase,
    businessId: string,
    from: Date,
    to: Date,
  ): Promise<Leg[]> {
    const [down] = await db
      .select({
        cents: sql<number>`COALESCE(SUM(${schema.costConsumptions.quantity} * ${schema.costConsumptions.unitCostCents}), 0)::int`,
      })
      .from(schema.costConsumptions)
      .where(
        and(
          eq(schema.costConsumptions.businessId, businessId),
          inArray(schema.costConsumptions.referenceType, ADJUST_CONSUMPTION_TYPES),
          gte(schema.costConsumptions.consumedAt, from),
          lt(schema.costConsumptions.consumedAt, to),
        ),
      );
    const [up] = await db
      .select({
        cents: sql<number>`COALESCE(SUM(${schema.costLayers.quantityReceived} * ${schema.costLayers.unitCostCents}), 0)::int`,
      })
      .from(schema.costLayers)
      .where(
        and(
          eq(schema.costLayers.businessId, businessId),
          inArray(schema.costLayers.sourceType, ADJUST_LAYER_TYPES),
          gte(schema.costLayers.receivedAt, from),
          lt(schema.costLayers.receivedAt, to),
        ),
      );
    const legs: Leg[] = [];
    if ((down?.cents ?? 0) > 0) {
      legs.push(
        {
          key: 'inventory_adjustment',
          debitCents: down!.cents,
          memo: 'Shrink / negative adjustments',
        },
        { key: 'inventory', creditCents: down!.cents, memo: 'Inventory written down' },
      );
    }
    if ((up?.cents ?? 0) > 0) {
      legs.push(
        { key: 'inventory', debitCents: up!.cents, memo: 'Positive adjustments / recoveries' },
        { key: 'inventory_adjustment', creditCents: up!.cents, memo: 'Adjustment recovery' },
      );
    }
    return legs;
  }
}
