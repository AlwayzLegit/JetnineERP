/**
 * Pure cart-totals math, shared by the POS create-sale endpoint and any
 * future preview surfaces. All money is cents, all rates are basis points
 * (10000 bps = 100%).
 *
 * Each line carries an optional `taxRateBps` so per-product tax classes
 * (Phase 2.5) can override the sale-level default. Order-level discount
 * is allocated to lines pro-rata by post-line-discount net so the
 * taxable base of each line shrinks proportionally; the last line
 * absorbs any rounding residue so the allocated amounts sum exactly.
 */

export interface CartLineInput {
  variantId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  /** Absolute line discount in cents. Clamped to [0, qty*unit]. */
  lineDiscountCents?: number;
  /** Per-line tax rate. Defaults to the input's sale-level taxRateBps. */
  taxRateBps?: number;
}

export interface CartTotalsInput {
  lines: CartLineInput[];
  /** Absolute order-level discount in cents. Clamped to [0, post-line subtotal]. */
  orderDiscountCents?: number;
  /** Default tax rate for any line that doesn't specify its own. */
  taxRateBps: number;
}

export interface CartLineTotals {
  variantId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  /** Per-line discount. Does not include the line's share of an order discount. */
  discountCents: number;
  /** quantity*unit - lineDiscount. (Pre-order-discount-share, pre-tax.) */
  totalCents: number;
  /** The effective tax rate this line was charged at, in basis points. */
  taxRateBps: number;
  /** Tax dollars assessed on this line, after its order-discount share. */
  taxCents: number;
}

export interface CartTotals {
  lines: CartLineTotals[];
  /** Sum of (qty * unit) before any discount. */
  subtotalCents: number;
  /** Sum of all line discounts plus the order-level discount. */
  discountCents: number;
  taxCents: number;
  totalCents: number;
}

export function computeTotals(input: CartTotalsInput): CartTotals {
  if (input.lines.length === 0) {
    throw new Error('cart must contain at least one line');
  }
  if (!Number.isInteger(input.taxRateBps) || input.taxRateBps < 0) {
    throw new Error('taxRateBps must be a non-negative integer');
  }

  // First pass: validate, compute per-line gross + discount, accumulate
  // the post-line-discount net we'll use for order-discount allocation.
  const interim: { line: CartLineInput; gross: number; lineDiscount: number; net: number }[] = [];
  let totalLineDiscount = 0;
  let totalNet = 0;
  let gross = 0;
  for (const l of input.lines) {
    if (!Number.isInteger(l.quantity) || l.quantity <= 0) {
      throw new Error('quantity must be a positive integer');
    }
    if (!Number.isInteger(l.unitPriceCents) || l.unitPriceCents < 0) {
      throw new Error('unitPriceCents must be a non-negative integer');
    }
    if (l.taxRateBps !== undefined) {
      if (!Number.isInteger(l.taxRateBps) || l.taxRateBps < 0) {
        throw new Error('lines[].taxRateBps must be a non-negative integer');
      }
    }
    const lineGross = l.quantity * l.unitPriceCents;
    const requested = l.lineDiscountCents ?? 0;
    if (!Number.isInteger(requested) || requested < 0) {
      throw new Error('lineDiscountCents must be a non-negative integer');
    }
    const lineDiscount = Math.min(requested, lineGross);
    const net = lineGross - lineDiscount;
    gross += lineGross;
    totalLineDiscount += lineDiscount;
    totalNet += net;
    interim.push({ line: l, gross: lineGross, lineDiscount, net });
  }

  const orderRequested = input.orderDiscountCents ?? 0;
  if (!Number.isInteger(orderRequested) || orderRequested < 0) {
    throw new Error('orderDiscountCents must be a non-negative integer');
  }
  const orderDiscount = Math.min(orderRequested, totalNet);

  // Allocate the order discount across lines pro-rata by net. Use
  // floor-then-residue so the allocated cents sum exactly to
  // orderDiscount even when proportional shares would round.
  const allocations: number[] = new Array(interim.length).fill(0);
  if (orderDiscount > 0 && totalNet > 0) {
    let allocated = 0;
    for (let i = 0; i < interim.length; i++) {
      const share =
        i === interim.length - 1
          ? orderDiscount - allocated
          : Math.floor((orderDiscount * interim[i]!.net) / totalNet);
      allocations[i] = share;
      allocated += share;
    }
  }

  // Second pass: per-line tax on (net - allocated_order_discount).
  let totalTax = 0;
  const lines: CartLineTotals[] = interim.map((row, i) => {
    const taxableBase = row.net - allocations[i]!;
    const rate = row.line.taxRateBps ?? input.taxRateBps;
    const taxCents = Math.round((taxableBase * rate) / 10000);
    totalTax += taxCents;
    return {
      variantId: row.line.variantId,
      description: row.line.description,
      quantity: row.line.quantity,
      unitPriceCents: row.line.unitPriceCents,
      discountCents: row.lineDiscount,
      totalCents: row.net,
      taxRateBps: rate,
      taxCents,
    };
  });

  const taxableTotal = totalNet - orderDiscount;
  return {
    lines,
    subtotalCents: gross,
    discountCents: totalLineDiscount + orderDiscount,
    taxCents: totalTax,
    totalCents: taxableTotal + totalTax,
  };
}

/**
 * Compute the per-unit refund amount for a sale line, accounting for any
 * line-level discount that was applied at sale time. Returns cents per unit.
 */
export function refundUnitCents(line: {
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
}): number {
  if (line.quantity <= 0) return 0;
  const lineNet = line.quantity * line.unitPriceCents - line.discountCents;
  return Math.round(lineNet / line.quantity);
}
