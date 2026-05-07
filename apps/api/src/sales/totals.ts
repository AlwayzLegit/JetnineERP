/**
 * Pure cart-totals math, shared by the POS create-sale endpoint and any
 * future preview surfaces. All money is cents, all rates are basis points
 * (10000 bps = 100%). Tax is applied to the post-discount subtotal at the
 * sale level; per-line tax allocation is left for Phase 2 (tax-by-class).
 */

export interface CartLineInput {
  variantId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  /** Absolute line discount in cents. Clamped to [0, qty*unit]. */
  lineDiscountCents?: number;
}

export interface CartTotalsInput {
  lines: CartLineInput[];
  /** Absolute order-level discount in cents. Clamped to [0, post-line subtotal]. */
  orderDiscountCents?: number;
  /** Sale tax rate in basis points (e.g. 875 = 8.75%). */
  taxRateBps: number;
}

export interface CartLineTotals {
  variantId: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  discountCents: number;
  /** quantity * unitPrice - lineDiscount. */
  totalCents: number;
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
  const lines: CartLineTotals[] = [];
  let gross = 0;
  let totalLineDiscount = 0;
  for (const l of input.lines) {
    if (!Number.isInteger(l.quantity) || l.quantity <= 0) {
      throw new Error('quantity must be a positive integer');
    }
    if (!Number.isInteger(l.unitPriceCents) || l.unitPriceCents < 0) {
      throw new Error('unitPriceCents must be a non-negative integer');
    }
    const lineGross = l.quantity * l.unitPriceCents;
    const requested = l.lineDiscountCents ?? 0;
    if (!Number.isInteger(requested) || requested < 0) {
      throw new Error('lineDiscountCents must be a non-negative integer');
    }
    const lineDiscount = Math.min(requested, lineGross);
    gross += lineGross;
    totalLineDiscount += lineDiscount;
    lines.push({
      variantId: l.variantId,
      description: l.description,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
      discountCents: lineDiscount,
      totalCents: lineGross - lineDiscount,
    });
  }

  const subtotalAfterLineDiscount = gross - totalLineDiscount;
  const orderRequested = input.orderDiscountCents ?? 0;
  if (!Number.isInteger(orderRequested) || orderRequested < 0) {
    throw new Error('orderDiscountCents must be a non-negative integer');
  }
  const orderDiscount = Math.min(orderRequested, subtotalAfterLineDiscount);
  const taxableBase = subtotalAfterLineDiscount - orderDiscount;

  if (!Number.isInteger(input.taxRateBps) || input.taxRateBps < 0) {
    throw new Error('taxRateBps must be a non-negative integer');
  }
  // Banker's-style rounding isn't worth the complexity here; standard
  // half-up is what every receipt program does.
  const taxCents = Math.round((taxableBase * input.taxRateBps) / 10000);

  return {
    lines,
    subtotalCents: gross,
    discountCents: totalLineDiscount + orderDiscount,
    taxCents,
    totalCents: taxableBase + taxCents,
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
