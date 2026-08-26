import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { DRIZZLE } from '../database/database.module';
import { CommissionsService } from '../money/commissions.service';
import { paidCents } from '../orders/order-math';
import { StoreCreditService } from './store-credit.service';

/**
 * The physical half of the A7 return lifecycle: goods arrive back →
 * qtyReturned bumps, units land in As-Is, and only now the refund
 * fires (original tenders newest-first, or the store-credit ledger).
 * Shared by the counter drop-off path (authorize + receive in one
 * request) and the warehouse receive endpoint for truck pickups.
 */
@Injectable()
export class OrderReturnsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(StoreCreditService) private readonly storeCredit: StoreCreditService,
    @Inject(CommissionsService) private readonly commissions: CommissionsService,
  ) {}

  async receiveGoods(returnId: string, actorUserId: string | null): Promise<void> {
    const [ret] = await this.db
      .select()
      .from(schema.orderReturns)
      .where(eq(schema.orderReturns.id, returnId))
      .limit(1);
    if (!ret) throw new NotFoundException('Return not found');
    if (ret.status !== 'authorized') {
      throw new ConflictException(`Return ${ret.rmaNumber} is already ${ret.status}`);
    }
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, ret.orderId))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');

    const returnLines = await this.db
      .select()
      .from(schema.orderReturnLines)
      .where(eq(schema.orderReturnLines.returnId, returnId));

    // Money first — validate before any goods movement so a blocked
    // refund leaves the return untouched (still authorized).
    const toStoreCredit = ret.refundMethod === 'store_credit';
    const payments = await this.db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.orderId, ret.orderId))
      .orderBy(desc(schema.payments.createdAt));
    if (!toStoreCredit && ret.amountCents > paidCents(payments)) {
      throw new BadRequestException(
        `Refund (${ret.amountCents}) exceeds the money now collected on ${order.number} — cancel and re-authorize as store credit`,
      );
    }

    // Goods: bump returned counters and stage everything in As-Is.
    for (const rl of returnLines) {
      const [line] = await this.db
        .select()
        .from(schema.orderLines)
        .where(eq(schema.orderLines.id, rl.orderLineId))
        .limit(1);
      if (!line) throw new NotFoundException(`Order line not found: ${rl.orderLineId}`);
      if (line.qtyFulfilled - line.qtyReturned < rl.quantity) {
        throw new ConflictException(
          `Line "${line.description}" no longer has ${rl.quantity} returnable unit(s)`,
        );
      }
      await this.db
        .update(schema.orderLines)
        .set({ qtyReturned: line.qtyReturned + rl.quantity })
        .where(eq(schema.orderLines.id, line.id));
      if (line.variantId) {
        // G10 piece identity: one As-Is row per returned unit, each
        // with its own reference number.
        const inserted = await this.db
          .insert(schema.asIsItems)
          .values(
            Array.from({ length: rl.quantity }, () => ({
              businessId: ret.businessId,
              variantId: line.variantId!,
              locationId: order.locationId,
              quantity: 1,
              source: 'return',
              // Reference the order (matching the P8 contract the As-Is
              // UI links from); the return doc itself is on order_returns.
              referenceType: 'order',
              referenceId: ret.orderId,
              reasonCodeId: rl.reasonCodeId,
              notes: rl.reason ?? ret.reason ?? null,
            })),
          )
          .returning({ id: schema.asIsItems.id });
        for (const piece of inserted) {
          await this.db
            .update(schema.asIsItems)
            .set({ pieceNumber: `AS-${piece.id.slice(0, 8).toUpperCase()}` })
            .where(eq(schema.asIsItems.id, piece.id));
        }
      }
    }

    // Money: reverse the original tenders newest-first, or credit the
    // ledger — the same allocation the sales refund uses.
    if (toStoreCredit) {
      await this.storeCredit.issue(this.db, {
        businessId: ret.businessId,
        customerId: order.customerId,
        amountCents: ret.amountCents,
        reason: ret.reason ?? `Return ${ret.rmaNumber} on ${order.number}`,
        referenceType: 'order_return',
        referenceId: ret.id,
        actorUserId,
      });
    } else {
      let remaining = ret.amountCents;
      for (const p of payments) {
        if (remaining <= 0) break;
        if (p.status !== 'succeeded' || p.amountCents <= 0) continue;
        const slice = Math.min(remaining, p.amountCents);
        await this.db.insert(schema.payments).values({
          businessId: ret.businessId,
          saleId: null,
          orderId: ret.orderId,
          kind: 'refund',
          method: p.method,
          amountCents: -slice,
          status: 'succeeded',
        });
        remaining -= slice;
      }
    }

    // §9 exchange/return clawback: the salespeople give back the
    // commission on the returned fraction (no-op until the order has
    // completed and accrued).
    await this.commissions.reverseForOrderReturn(this.db, {
      businessId: ret.businessId,
      orderId: ret.orderId,
      refundedCents: ret.amountCents,
      orderTotalCents: order.totalCents,
      rmaNumber: ret.rmaNumber,
    });

    const now = new Date();
    await this.db
      .update(schema.orderReturns)
      .set({
        status: 'completed',
        goodsReceivedAt: now,
        receivedByUserId: actorUserId,
        completedAt: now,
      })
      .where(eq(schema.orderReturns.id, returnId));

    await this.audit.log({
      action: 'order.return',
      targetType: 'order',
      targetId: ret.orderId,
      after: {
        rmaNumber: ret.rmaNumber,
        amountCents: ret.amountCents,
        refundMethod: ret.refundMethod,
        fulfillment: ret.fulfillment,
        unitCount: returnLines.reduce((s, l) => s + l.quantity, 0),
        reason: ret.reason ?? null,
      },
    });
  }
}
