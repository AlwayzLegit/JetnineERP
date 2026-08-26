import { describe, expect, it } from 'vitest';
import { computeTotals, reconstructOrderDiscountShares, refundUnitCents } from './totals';

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

describe('computeTotals — per-line tax classes', () => {
  it('uses the per-line rate when provided, falling back to sale-level for others', () => {
    // Coffee 10% (taxable), milk 0% (exempt). Order tax rate 1000 just
    // serves as the fallback — coffee uses its own.
    const t = computeTotals({
      lines: [
        {
          variantId: 'coffee',
          description: 'Coffee',
          quantity: 1,
          unitPriceCents: 500,
          taxRateBps: 1000,
        },
        {
          variantId: 'milk',
          description: 'Milk',
          quantity: 1,
          unitPriceCents: 300,
          taxRateBps: 0,
        },
      ],
      taxRateBps: 1000,
    });
    expect(t.subtotalCents).toBe(800);
    // Tax: coffee = 50, milk = 0 → total 50
    expect(t.taxCents).toBe(50);
    expect(t.totalCents).toBe(850);
    expect(t.lines[0]!.taxCents).toBe(50);
    expect(t.lines[1]!.taxCents).toBe(0);
    expect(t.lines[0]!.taxRateBps).toBe(1000);
    expect(t.lines[1]!.taxRateBps).toBe(0);
  });

  it('order discount is allocated pro-rata, residue lands on the last line', () => {
    // Three lines, $10 each, $1 order discount, no per-line tax variation.
    // Each line should receive ⅓ of $1 = 33.33¢ → 33, 33, 34 (last absorbs).
    const t = computeTotals({
      lines: [
        { variantId: 'a', description: 'A', quantity: 1, unitPriceCents: 1000 },
        { variantId: 'b', description: 'B', quantity: 1, unitPriceCents: 1000 },
        { variantId: 'c', description: 'C', quantity: 1, unitPriceCents: 1000 },
      ],
      orderDiscountCents: 100,
      taxRateBps: 0,
    });
    expect(t.subtotalCents).toBe(3000);
    expect(t.discountCents).toBe(100);
    expect(t.totalCents).toBe(2900);
  });

  it('mixed-rate sale charges per-line tax against discounted base', () => {
    // 2× $10 coffee at 10% + 1× $5 milk at 0%, with $5 order discount.
    // Net by line: coffee 2000, milk 500. Total net 2500. Order discount
    // allocation: coffee floor(500*2000/2500)=400; milk gets 100 (residue).
    // Coffee taxable=2000-400=1600 → tax 160; milk taxable=500-100=400 → 0.
    // Total tax 160; total = 2500 - 500 + 160 = 2160.
    const t = computeTotals({
      lines: [
        {
          variantId: 'coffee',
          description: 'Coffee',
          quantity: 2,
          unitPriceCents: 1000,
          taxRateBps: 1000,
        },
        {
          variantId: 'milk',
          description: 'Milk',
          quantity: 1,
          unitPriceCents: 500,
          taxRateBps: 0,
        },
      ],
      orderDiscountCents: 500,
      taxRateBps: 0,
    });
    expect(t.taxCents).toBe(160);
    expect(t.totalCents).toBe(2160);
  });

  it('rejects negative taxRateBps on a line', () => {
    expect(() =>
      computeTotals({
        lines: [
          {
            variantId: 'x',
            description: 'X',
            quantity: 1,
            unitPriceCents: 100,
            taxRateBps: -50,
          },
        ],
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

  // QA 2026-08-26 (D1): INV-2026-000005 sold a $1,000 line under a 30%
  // cart discount — $700 collected — and refunded $1,000. The line's own
  // discount_cents is 0; the discount lived at the sale level.
  it('subtracts the line share of a SALE-level discount', () => {
    expect(
      refundUnitCents({
        quantity: 1,
        unitPriceCents: 100_000,
        discountCents: 0,
        orderDiscountShareCents: 30_000,
      }),
    ).toBe(70_000);
  });

  it('adds back the tax the customer actually paid', () => {
    // 2 @ $10, 10% tax on the $20 base = $2 → $11 per unit returned.
    expect(
      refundUnitCents({ quantity: 2, unitPriceCents: 1000, discountCents: 0, taxCents: 200 }),
    ).toBe(1100);
  });

  it('never returns a negative per-unit amount', () => {
    expect(
      refundUnitCents({
        quantity: 1,
        unitPriceCents: 100,
        discountCents: 0,
        orderDiscountShareCents: 500,
      }),
    ).toBe(0);
  });
});

describe('reconstructOrderDiscountShares (legacy sale_lines)', () => {
  it('splits pro-rata by net and sums to the whole discount', () => {
    const lines = [
      { quantity: 1, unitPriceCents: 100_000, discountCents: 0 },
      { quantity: 1, unitPriceCents: 300_000, discountCents: 0 },
    ];
    const shares = reconstructOrderDiscountShares(lines, 40_000);
    expect(shares.reduce((s, n) => s + n, 0)).toBe(40_000);
    expect(shares[0]).toBe(10_000); // 25% of net
    expect(shares[1]).toBe(30_000);
  });

  it('matches what computeTotals allocated, for the same cart', () => {
    const totals = computeTotals({
      taxRateBps: 0,
      orderDiscountCents: 777,
      lines: [
        { variantId: 'a', description: 'A', quantity: 3, unitPriceCents: 333 },
        { variantId: 'b', description: 'B', quantity: 1, unitPriceCents: 1000 },
      ],
    });
    const reconstructed = reconstructOrderDiscountShares(totals.lines, 777);
    expect(reconstructed).toEqual(totals.lines.map((l) => l.orderDiscountShareCents));
  });

  it('is a no-op without a sale-level discount', () => {
    expect(
      reconstructOrderDiscountShares([{ quantity: 1, unitPriceCents: 500, discountCents: 0 }], 0),
    ).toEqual([0]);
  });
});
