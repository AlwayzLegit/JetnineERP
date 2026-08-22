/**
 * Pure order math, shared by the orders controller and (from Day 3) the
 * delivery/fulfillment flow. Nothing here touches the database, so every
 * rule below is unit-testable without a Postgres round-trip.
 *
 * Cart totals themselves are NOT re-implemented — orders reuse
 * `sales/totals.ts` verbatim (sprint decision D1 keeps the two aggregates
 * separate, but the arithmetic behind a line is the same arithmetic).
 * What lives here is what an order has and a cash-and-carry sale does
 * not: money already collected, a balance still owed, a deposit policy,
 * and stock committed rather than sold.
 *
 * All money is integer cents; all rates are basis points (10000 = 100%).
 */

/** Payment statuses that count as money actually collected. */
const COLLECTED_STATUSES = new Set(['succeeded']);

export interface OrderPaymentLike {
  amountCents: number;
  status: string;
}

/**
 * Money actually collected on an order. Pending and failed tenders are
 * not money — only `succeeded` counts, matching how the cash drawer and
 * every revenue report read the payments table.
 */
export function paidCents(payments: readonly OrderPaymentLike[]): number {
  let sum = 0;
  for (const p of payments) {
    if (!COLLECTED_STATUSES.has(p.status)) continue;
    sum += p.amountCents;
  }
  return sum;
}

/**
 * What the customer still owes. Never negative: an overpayment is a
 * refund/credit problem, not a negative balance, and reporting it as a
 * negative number would silently offset other orders in an AR total.
 */
export function balanceDueCents(totalCents: number, payments: readonly OrderPaymentLike[]): number {
  return Math.max(0, totalCents - paidCents(payments));
}

/**
 * The policy deposit for an order total, rounded up to the cent. Rounding
 * up rather than down means a 25% policy on a $999.99 order asks for
 * $250.00, not $249.99 — the store never under-collects because of
 * rounding.
 */
export function defaultDepositCents(totalCents: number, depositRateBps: number): number {
  if (!Number.isInteger(totalCents) || totalCents < 0) {
    throw new Error('totalCents must be a non-negative integer');
  }
  if (!Number.isInteger(depositRateBps) || depositRateBps < 0 || depositRateBps > 10000) {
    throw new Error('depositRateBps must be an integer between 0 and 10000');
  }
  return Math.min(totalCents, Math.ceil((totalCents * depositRateBps) / 10000));
}

export interface ReservableLine {
  id: string;
  variantId: string | null;
  quantity: number;
  qtyReserved: number;
  /** 'stock' | 'special_order' */
  lineType: string;
}

/** On-hand and already-committed units for one (variant, location). */
export interface StockLevel {
  onHand: number;
  reserved: number;
}

export interface Reservation {
  orderLineId: string;
  variantId: string;
  /** Additional units to commit. Always > 0. */
  quantity: number;
}

export interface Shortfall {
  orderLineId: string;
  variantId: string;
  /** Units the line wanted that stock could not cover. Always > 0. */
  quantity: number;
}

export interface ReservationPlan {
  reservations: Reservation[];
  shortfalls: Shortfall[];
}

/**
 * Work out how much of each line can be committed against current stock.
 *
 * Available stock for a variant is `on_hand - reserved` — units that are
 * physically here and not already promised to another order. A line
 * reserves at most what it still needs (`quantity - qtyReserved`), and at
 * most what is available; the remainder is reported as a shortfall rather
 * than being silently dropped, because Day 4 turns shortfalls into
 * special orders and POs.
 *
 * Lines already marked `special_order` are skipped entirely: we don't own
 * those units, so there is nothing to commit and nothing short.
 *
 * Availability is consumed as the plan is built, so two lines on the same
 * order competing for the same variant can't both reserve the last unit.
 */
export function planReservations(
  lines: readonly ReservableLine[],
  levels: ReadonlyMap<string, StockLevel>,
): ReservationPlan {
  const reservations: Reservation[] = [];
  const shortfalls: Shortfall[] = [];
  // Local copy so multiple lines hitting one variant draw down the same
  // pool instead of each seeing the full quantity.
  const remaining = new Map<string, number>();

  for (const line of lines) {
    if (line.lineType === 'special_order') continue;
    if (!line.variantId) continue;

    const needed = line.quantity - line.qtyReserved;
    if (needed <= 0) continue;

    if (!remaining.has(line.variantId)) {
      const level = levels.get(line.variantId);
      const available = level ? level.onHand - level.reserved : 0;
      remaining.set(line.variantId, Math.max(0, available));
    }
    const pool = remaining.get(line.variantId)!;
    const take = Math.min(needed, pool);

    if (take > 0) {
      reservations.push({ orderLineId: line.id, variantId: line.variantId, quantity: take });
      remaining.set(line.variantId, pool - take);
    }
    if (needed - take > 0) {
      shortfalls.push({
        orderLineId: line.id,
        variantId: line.variantId,
        quantity: needed - take,
      });
    }
  }

  return { reservations, shortfalls };
}

export interface Release {
  orderLineId: string;
  variantId: string;
  /** Units to hand back to available stock. Always > 0. */
  quantity: number;
}

/**
 * Everything currently committed by these lines, so cancelling an order
 * (or deleting a line) hands the units back. Fulfilled units are NOT
 * released — they have already left the building; the fulfillment flow
 * converts them from reserved to gone.
 */
export function planReleases(lines: readonly ReservableLine[]): Release[] {
  const releases: Release[] = [];
  for (const line of lines) {
    if (!line.variantId) continue;
    if (line.qtyReserved <= 0) continue;
    releases.push({
      orderLineId: line.id,
      variantId: line.variantId,
      quantity: line.qtyReserved,
    });
  }
  return releases;
}

export interface FulfillableLine {
  quantity: number;
  qtyFulfilled: number;
}

/**
 * Where an open order sits on the fulfillment axis, derived from its
 * lines rather than stored — the same reason balance due is derived.
 * Returns the status the order should carry; `completed` and `cancelled`
 * are lifecycle decisions the caller owns, not functions of line
 * quantities.
 */
export function deriveFulfillmentStatus(
  lines: readonly FulfillableLine[],
): 'open' | 'partially_fulfilled' | 'fulfilled' {
  if (lines.length === 0) return 'open';
  let anyFulfilled = false;
  let allFulfilled = true;
  for (const l of lines) {
    if (l.qtyFulfilled > 0) anyFulfilled = true;
    if (l.qtyFulfilled < l.quantity) allFulfilled = false;
  }
  if (allFulfilled) return 'fulfilled';
  return anyFulfilled ? 'partially_fulfilled' : 'open';
}

/**
 * Order statuses from which stock is still committed and money can still
 * move. Used to gate deposits, line edits, and reservation.
 */
export const LIVE_ORDER_STATUSES = ['quote', 'open', 'partially_fulfilled', 'fulfilled'] as const;

export type OrderStatus =
  | 'quote'
  | 'open'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'completed'
  | 'cancelled';

export function isLiveOrderStatus(status: string): boolean {
  return (LIVE_ORDER_STATUSES as readonly string[]).includes(status);
}
