import { describe, expect, it } from 'vitest';
import { computeAutoTransferDate } from './auto-schedule';

describe('XFR-053 — auto transfer schedule date', () => {
  it('worked example verbatim: created Mon 4/6, days=2 → Thu 4/9; Tuesdays-only → Tue 4/14', () => {
    // 2026-04-06 is a Monday.
    const created = new Date(2026, 3, 6, 10, 30);
    const unrestricted = computeAutoTransferDate(created, 2, null);
    expect(unrestricted?.getFullYear()).toBe(2026);
    expect(unrestricted?.getMonth()).toBe(3);
    expect(unrestricted?.getDate()).toBe(9); // Thursday 4/9

    const tuesdaysOnly = computeAutoTransferDate(created, 2, [2]);
    expect(tuesdaysOnly?.getDate()).toBe(14); // following Tuesday 4/14
    expect(tuesdaysOnly?.getDay()).toBe(2);
  });

  it('zero days means same-day + 1 (distinct from blank = feature off)', () => {
    const created = new Date(2026, 3, 6);
    const d = computeAutoTransferDate(created, 0, null);
    expect(d?.getDate()).toBe(7);
  });

  it('a candidate already on an allowed day stays put', () => {
    // 4/6 + 2 + 1 = Thursday 4/9; Thursdays (4) allowed.
    const d = computeAutoTransferDate(new Date(2026, 3, 6), 2, [4]);
    expect(d?.getDate()).toBe(9);
  });

  it('an explicitly empty day set returns null instead of looping', () => {
    expect(computeAutoTransferDate(new Date(2026, 3, 6), 2, [])).toBeNull();
  });
});
