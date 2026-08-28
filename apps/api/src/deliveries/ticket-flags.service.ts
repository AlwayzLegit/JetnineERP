import { Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { DRIZZLE } from '../database/database.module';
import {
  applyTicketEdit,
  canPrintSecondDate,
  recordTicketPrint,
  type FlagTransition,
  type TicketEdit,
  type TicketSnapshot,
} from './ticket-flags';

const LIVE_DELIVERY = ['scheduled', 'loaded', 'out_for_delivery'];

/**
 * Persistence wrapper around the pure ticket-flag state machine
 * (ticket-flags.ts). Header date slots are the order's live deliveries
 * ordered by scheduled date; a line's slots are its delivery_lines
 * memberships. Every transition is written to the audit trail with the
 * rule that fired (pack open question 8: "why did this reprint?" must
 * be answerable).
 *
 * Quantity approximation, recorded deliberately: Jetnine tracks reserve
 * and assignment per ORDER LINE, not per (line, date). A slot's
 * reserved/assigned quantities are the slot's scheduled quantity when
 * the parent line has at least that much reserved/fulfilled. Good
 * enough for R10's gate; revisit if per-date piece assignment lands.
 */
@Injectable()
export class TicketFlagsService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  async loadSnapshot(orderId: string): Promise<TicketSnapshot | null> {
    const deliveries = await this.db
      .select({
        id: schema.deliveries.id,
        scheduledDate: schema.deliveries.scheduledDate,
        ticketFlag: schema.deliveries.ticketFlag,
        pickListFlag: schema.deliveries.pickListFlag,
      })
      .from(schema.deliveries)
      .where(
        and(
          eq(schema.deliveries.orderId, orderId),
          inArray(schema.deliveries.status, LIVE_DELIVERY),
        ),
      )
      .orderBy(asc(schema.deliveries.scheduledDate));
    if (deliveries.length === 0) return null;

    const [order] = await this.db
      .select({ status: schema.orders.status, deliveryStatus: schema.orders.deliveryStatus })
      .from(schema.orders)
      .where(eq(schema.orders.id, orderId))
      .limit(1);

    const dLines = await this.db
      .select({
        deliveryId: schema.deliveryLines.deliveryId,
        orderLineId: schema.deliveryLines.orderLineId,
        quantity: schema.deliveryLines.quantity,
        ticketFlag: schema.deliveryLines.ticketFlag,
        pickListFlag: schema.deliveryLines.pickListFlag,
      })
      .from(schema.deliveryLines)
      .where(
        inArray(
          schema.deliveryLines.deliveryId,
          deliveries.map((d) => d.id),
        ),
      );
    const lineIds = [...new Set(dLines.map((l) => l.orderLineId))];
    const orderLines = lineIds.length
      ? await this.db
          .select({
            id: schema.orderLines.id,
            qtyReserved: schema.orderLines.qtyReserved,
            qtyFulfilled: schema.orderLines.qtyFulfilled,
          })
          .from(schema.orderLines)
          .where(inArray(schema.orderLines.id, lineIds))
      : [];
    const lineBy = new Map(orderLines.map((l) => [l.id, l]));
    const dateByDelivery = new Map(deliveries.map((d) => [d.id, d.scheduledDate]));

    const lines = lineIds.map((lineId) => {
      const slots = dLines
        .filter((dl) => dl.orderLineId === lineId)
        .map((dl) => {
          const parent = lineBy.get(lineId);
          const reserved = Math.min(dl.quantity, parent?.qtyReserved ?? 0);
          const assigned = Math.min(dl.quantity, parent?.qtyFulfilled ?? 0);
          return {
            date: dateByDelivery.get(dl.deliveryId)!,
            quantityScheduled: dl.quantity,
            quantityReserved: reserved,
            quantityAssigned: assigned,
            ticketFlag: (dl.ticketFlag as 'P' | 'R' | null) ?? null,
            pickListFlag: (dl.pickListFlag as 'P' | null) ?? null,
          };
        })
        .sort((a, b) => a.date.localeCompare(b.date));
      return { id: lineId, slots };
    });

    return {
      fulfillmentStatus: order?.deliveryStatus === 'estimated' ? 'estimated' : 'scheduled',
      headerSlots: deliveries.map((d) => ({
        date: d.scheduledDate,
        ticketFlag: (d.ticketFlag as 'P' | 'R' | null) ?? null,
        pickListFlag: (d.pickListFlag as 'P' | null) ?? null,
      })),
      lines,
    };
  }

  private async persist(
    orderId: string,
    snapshot: TicketSnapshot,
    transitions: FlagTransition[],
    reason: string,
  ): Promise<void> {
    const deliveries = await this.db
      .select({ id: schema.deliveries.id, scheduledDate: schema.deliveries.scheduledDate })
      .from(schema.deliveries)
      .where(
        and(
          eq(schema.deliveries.orderId, orderId),
          inArray(schema.deliveries.status, LIVE_DELIVERY),
        ),
      );
    const deliveryByDate = new Map(deliveries.map((d) => [d.scheduledDate, d.id]));

    for (const slot of snapshot.headerSlots) {
      const deliveryId = deliveryByDate.get(slot.date);
      if (!deliveryId) continue;
      await this.db
        .update(schema.deliveries)
        .set({ ticketFlag: slot.ticketFlag, pickListFlag: slot.pickListFlag })
        .where(eq(schema.deliveries.id, deliveryId));
    }
    for (const line of snapshot.lines) {
      for (const slot of line.slots) {
        const deliveryId = deliveryByDate.get(slot.date);
        if (!deliveryId) continue;
        await this.db
          .update(schema.deliveryLines)
          .set({ ticketFlag: slot.ticketFlag, pickListFlag: slot.pickListFlag })
          .where(
            and(
              eq(schema.deliveryLines.deliveryId, deliveryId),
              eq(schema.deliveryLines.orderLineId, line.id),
            ),
          );
      }
    }
    if (transitions.length > 0) {
      await this.audit.log({
        action: 'delivery.ticket_flags',
        targetType: 'order',
        targetId: orderId,
        metadata: { reason, transitions } as unknown as Record<string, unknown>,
      });
    }
  }

  /** Run one enumerated edit through the machine and persist the result. */
  async applyEdit(orderId: string, edit: TicketEdit, reason: string): Promise<FlagTransition[]> {
    const snap = await this.loadSnapshot(orderId);
    if (!snap) return [];
    const { snapshot, transitions } = applyTicketEdit(snap, edit);
    await this.persist(orderId, snapshot, transitions, reason);
    return transitions;
  }

  /**
   * Record a successful ticket print for one delivery. Returns false when
   * R10 refuses a second-date print (first ticket missing / no line
   * qualifies) — callers surface that as a 409.
   */
  async recordPrint(orderId: string, deliveryId?: string): Promise<{ ok: boolean; date?: string }> {
    const snap = await this.loadSnapshot(orderId);
    if (!snap || snap.headerSlots.length === 0) return { ok: true }; // nothing to flag
    let date = snap.headerSlots[0]!.date;
    if (deliveryId) {
      const [d] = await this.db
        .select({ scheduledDate: schema.deliveries.scheduledDate })
        .from(schema.deliveries)
        .where(eq(schema.deliveries.id, deliveryId))
        .limit(1);
      if (d) date = d.scheduledDate;
    }
    const slotIndex = snap.headerSlots.findIndex((s) => s.date === date);
    if (slotIndex === 1 && !canPrintSecondDate(snap)) return { ok: false, date };
    if (slotIndex > 1) return { ok: false, date }; // only two ticketable slots (Q3)
    const { snapshot, transitions } = recordTicketPrint(snap, date);
    await this.persist(orderId, snapshot, transitions, 'print');
    return { ok: true, date };
  }
}
