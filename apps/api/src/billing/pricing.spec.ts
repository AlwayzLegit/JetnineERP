import { describe, expect, it } from 'vitest';
import { monthlyPriceCents, PLANS } from './pricing';

describe('monthlyPriceCents', () => {
  it('multiplies the per-location price by the location count', () => {
    expect(monthlyPriceCents('starter', 1)).toBe(5000);
    expect(monthlyPriceCents('starter', 3)).toBe(15000);
    expect(monthlyPriceCents('pro', 2)).toBe(20000);
  });
  it('returns 0 for zero locations', () => {
    expect(monthlyPriceCents('starter', 0)).toBe(0);
  });
  it('rejects non-integer or negative counts', () => {
    expect(() => monthlyPriceCents('starter', -1)).toThrow();
    expect(() => monthlyPriceCents('starter', 1.5)).toThrow();
  });
});

describe('PLANS', () => {
  it('lists both plans with positive prices and a description', () => {
    expect(PLANS.starter.perLocationCents).toBeGreaterThan(0);
    expect(PLANS.pro.perLocationCents).toBeGreaterThan(PLANS.starter.perLocationCents);
    expect(PLANS.starter.description).toBeTruthy();
  });
});
