import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';

/**
 * Commission accrual (STORIS cutover G5). Entries are written at the
 * moment a document completes — a sale at the register, an order at
 * completion — and never recomputed retroactively: a plan change
 * affects future accruals only. Refunds write negative entries against
 * the same membership so the period nets out.
 */
@Injectable()
export class CommissionsService {
  constructor(@Inject(DRIZZLE) private readonly rootDb: PostgresJsDatabase) {}

  private period(d = new Date()): string {
    return d.toISOString().slice(0, 7); // YYYY-MM
  }

  private async planFor(
    db: PostgresJsDatabase,
    membershipId: string,
  ): Promise<{ rateBps: number; basis: string } | null> {
    const [m] = await db
      .select({ commissionPlanId: schema.memberships.commissionPlanId })
      .from(schema.memberships)
      .where(eq(schema.memberships.id, membershipId))
      .limit(1);
    if (!m?.commissionPlanId) return null;
    const [plan] = await db
      .select({ rateBps: schema.commissionPlans.rateBps, basis: schema.commissionPlans.basis })
      .from(schema.commissionPlans)
      .where(eq(schema.commissionPlans.id, m.commissionPlanId))
      .limit(1);
    return plan ?? null;
  }

  /** Margin basis: total minus recorded cost of the units sold. */
  private marginCents(
    totalCents: number,
    lines: readonly { quantity: number; costCents: number | null }[],
  ): number {
    const cost = lines.reduce((s, l) => s + l.quantity * (l.costCents ?? 0), 0);
    return Math.max(0, totalCents - cost);
  }

  private async write(
    db: PostgresJsDatabase,
    args: {
      businessId: string;
      membershipId: string;
      orderId?: string;
      saleId?: string;
      basisCents: number;
      rateBps: number;
      notes?: string;
    },
  ): Promise<void> {
    const amount = Math.round((args.basisCents * args.rateBps) / 10000);
    if (amount === 0) return;
    await db.insert(schema.commissionEntries).values({
      businessId: args.businessId,
      membershipId: args.membershipId,
      orderId: args.orderId ?? null,
      saleId: args.saleId ?? null,
      basisCents: args.basisCents,
      amountCents: amount,
      rateBps: args.rateBps,
      period: this.period(),
      notes: args.notes ?? null,
    });
  }

  /**
   * POS sale accrual. The register's associate is a user id; commission
   * needs their membership in this business.
   */
  async accrueForSale(
    db: PostgresJsDatabase,
    args: { businessId: string; saleId: string },
  ): Promise<void> {
    const [sale] = await db
      .select({
        totalCents: schema.sales.totalCents,
        associateUserId: schema.sales.associateUserId,
        importedAt: schema.sales.importedAt,
      })
      .from(schema.sales)
      .where(eq(schema.sales.id, args.saleId))
      .limit(1);
    if (!sale || sale.importedAt || !sale.associateUserId) return; // D8: no accrual on imports
    const [membership] = await db
      .select({ id: schema.memberships.id })
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.userId, sale.associateUserId),
          eq(schema.memberships.businessId, args.businessId),
        ),
      )
      .limit(1);
    if (!membership) return;
    const plan = await this.planFor(db, membership.id);
    if (!plan) return;

    let basis = sale.totalCents;
    if (plan.basis === 'percent_of_margin') {
      const lines = await db
        .select({
          quantity: schema.saleLines.quantity,
          costCents: schema.productVariants.costCents,
        })
        .from(schema.saleLines)
        .leftJoin(schema.productVariants, eq(schema.productVariants.id, schema.saleLines.variantId))
        .where(eq(schema.saleLines.saleId, args.saleId));
      basis = this.marginCents(sale.totalCents, lines);
    }
    await this.write(db, {
      businessId: args.businessId,
      membershipId: membership.id,
      saleId: args.saleId,
      basisCents: basis,
      rateBps: plan.rateBps,
    });
  }

  /**
   * Order accrual at completion. Split commission: the primary
   * salesperson takes split_bps of the basis, the second takes the
   * rest; no split → primary takes it all.
   */
  async accrueForOrder(
    db: PostgresJsDatabase,
    args: { businessId: string; orderId: string },
  ): Promise<void> {
    const [order] = await db
      .select({
        totalCents: schema.orders.totalCents,
        salespersonMembershipId: schema.orders.salespersonMembershipId,
        secondSalespersonMembershipId: schema.orders.secondSalespersonMembershipId,
        splitBps: schema.orders.splitBps,
        importedAt: schema.orders.importedAt,
      })
      .from(schema.orders)
      .where(eq(schema.orders.id, args.orderId))
      .limit(1);
    if (!order || order.importedAt || !order.salespersonMembershipId) return; // D8

    const lines = await db
      .select({
        quantity: schema.orderLines.quantity,
        costCents: schema.productVariants.costCents,
      })
      .from(schema.orderLines)
      .leftJoin(schema.productVariants, eq(schema.productVariants.id, schema.orderLines.variantId))
      .where(eq(schema.orderLines.orderId, args.orderId));

    const shares: { membershipId: string; share: number }[] = [];
    if (order.secondSalespersonMembershipId && order.splitBps != null) {
      shares.push(
        { membershipId: order.salespersonMembershipId, share: order.splitBps },
        { membershipId: order.secondSalespersonMembershipId, share: 10000 - order.splitBps },
      );
    } else {
      shares.push({ membershipId: order.salespersonMembershipId, share: 10000 });
    }

    for (const { membershipId, share } of shares) {
      const plan = await this.planFor(db, membershipId);
      if (!plan) continue;
      const fullBasis =
        plan.basis === 'percent_of_margin'
          ? this.marginCents(order.totalCents, lines)
          : order.totalCents;
      const basis = Math.round((fullBasis * share) / 10000);
      await this.write(db, {
        businessId: args.businessId,
        membershipId,
        orderId: args.orderId,
        basisCents: basis,
        rateBps: plan.rateBps,
      });
    }
  }

  /**
   * Refund reversal: negative entries proportional to the refunded
   * fraction of each original entry for the sale.
   */
  async reverseForRefund(
    db: PostgresJsDatabase,
    args: { businessId: string; saleId: string; refundedCents: number; saleTotalCents: number },
  ): Promise<void> {
    if (args.saleTotalCents <= 0 || args.refundedCents <= 0) return;
    const entries = await db
      .select()
      .from(schema.commissionEntries)
      .where(
        and(
          eq(schema.commissionEntries.saleId, args.saleId),
          inArray(schema.commissionEntries.status, ['pending', 'approved', 'paid']),
        ),
      );
    const fraction = Math.min(1, args.refundedCents / args.saleTotalCents);
    for (const e of entries) {
      if (e.amountCents <= 0) continue; // don't reverse reversals
      const basis = -Math.round(e.basisCents * fraction);
      const amount = Math.round((basis * e.rateBps) / 10000);
      if (amount === 0) continue;
      await db.insert(schema.commissionEntries).values({
        businessId: args.businessId,
        membershipId: e.membershipId,
        saleId: args.saleId,
        basisCents: basis,
        amountCents: amount,
        rateBps: e.rateBps,
        period: this.period(),
        notes: 'refund reversal',
      });
    }
  }
}
