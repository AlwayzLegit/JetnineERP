import { describe, expect, it } from 'vitest';
import { computeTotals, refundUnitCents } from './totals';

describe('computeTotals', () => {
  it('sums line gross and applies tax', () => {
    const t = computeTotals({
      lines: [
        { variantId: 'v1', description: 'A', quantity: 2, unitPriceCents: 500 },
        { variantId: 'v2', description: 'B', quantity: 1, unitPriceCents: 1234 },
      ],
      taxRateBps: 1000, // 10%
    });
    expect(t.subtotalCents).toBe(2234);
    expect(t.discountCents).toBe(0);
    expect(t.taxCents).toBe(223); // round(2234 * 0.10)
    expect(t.totalCents).toBe(2457);
  });

  it('applies a line discount before tax', () => {
    const t = computeTotals({
      lines: [
        {
          variantId: 'v1',
          description: 'A',
          quantity: 2,
          unitPriceCents: 500,
          lineDiscountCents: 200,
        },
      ],
      taxRateBps: 1000,
    });
    expect(t.subtotalCents).toBe(1000);
    expect(t.discountCents).toBe(200);
    expect(t.taxCents).toBe(80); // 800 * 10%
    expect(t.totalCents).toBe(880);
    expect(t.lines[0]!.totalCents).toBe(800);
  });

  it('clamps an oversized line discount to the line gross', () => {
    const t = computeTotals({
      lines: [
        {
          variantId: 'v1',
          description: 'A',
          quantity: 1,
          unitPriceCents: 500,
          lineDiscountCents: 999_999,
        },
      ],
      taxRateBps: 0,
    });
    expect(t.discountCents).toBe(500);
    expect(t.totalCents).toBe(0);
  });

  it('combines line and order discounts', () => {
    const t = computeTotals({
      lines: [
        {
          variantId: 'v1',
          description: 'A',
          quantity: 2,
          unitPriceCents: 1000,
          lineDiscountCents: 500,
        },
      ],
      orderDiscountCents: 100,
      taxRateBps: 0,
    });
    // gross 2000, line discount 500, order discount 100, taxable 1400
    expect(t.subtotalCents).toBe(2000);
    expect(t.discountCents).toBe(600);
    expect(t.totalCents).toBe(1400);
  });

  it('clamps order discount to post-line subtotal', () => {
    const t = computeTotals({
      lines: [{ variantId: 'v1', description: 'A', quantity: 1, unitPriceCents: 100 }],
      orderDiscountCents: 9999,
      taxRateBps: 1000,
    });
    expect(t.discountCents).toBe(100);
    expect(t.taxCents).toBe(0);
    expect(t.totalCents).toBe(0);
  });

  it('rejects empty cart', () => {
    expect(() => computeTotals({ lines: [], taxRateBps: 0 })).toThrow();
  });

  it('rejects non-positive quantity', () => {
    expect(() =>
      computeTotals({
        lines: [{ variantId: 'v1', description: 'A', quantity: 0, unitPriceCents: 100 }],
        taxRateBps: 0,
      }),
    ).toThrow();
  });
});

describe('refundUnitCents', () => {
  it('returns unit price when no discount', () => {
    expect(refundUnitCents({ quantity: 2, unitPriceCents: 500, discountCents: 0 })).toBe(500);
  });
  it('subtracts the per-unit discount', () => {
    // 3 @ $5 with $3 line discount → net $12 / 3 = $4 per unit
    expect(refundUnitCents({ quantity: 3, unitPriceCents: 500, discountCents: 300 })).toBe(400);
  });
});
