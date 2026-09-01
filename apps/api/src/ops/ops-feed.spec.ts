import { describe, expect, it } from 'vitest';
import {
  OPS_THRESHOLD_DEFAULTS,
  digestByActor,
  discountPercent,
  resolveOpsThresholds,
  sortFeed,
  splitFamilyBase,
  subjectKey,
  withoutCleared,
  type OpsFeedRow,
  type OpsSeverity,
} from './ops-feed';

function row(over: Partial<OpsFeedRow> = {}): OpsFeedRow {
  return {
    subjectType: 'refund',
    subjectId: 'r1',
    severity: 'warning',
    kind: 'Refund',
    summary: 'Refund $200',
    amountCents: -20_000,
    actorUserId: 'u1',
    actorName: 'Maria',
    locationId: 'l1',
    locationName: 'Torrance',
    href: '/sales/s1',
    occurredAt: new Date('2026-08-31T18:00:00Z'),
    clearVia: 'review',
    ...over,
  };
}

describe('resolveOpsThresholds', () => {
  it('falls back to the documented default for absent and null fields', () => {
    expect(resolveOpsThresholds(null)).toEqual(OPS_THRESHOLD_DEFAULTS);
    expect(resolveOpsThresholds({ refundCents: null })).toEqual(OPS_THRESHOLD_DEFAULTS);
    expect(resolveOpsThresholds({})).toEqual(OPS_THRESHOLD_DEFAULTS);
  });

  it('keeps zero — a $0 refund threshold means "show me every refund"', () => {
    expect(resolveOpsThresholds({ refundCents: 0 }).refundCents).toBe(0);
    expect(resolveOpsThresholds({ drawerVarianceCents: 0 }).drawerVarianceCents).toBe(0);
  });

  it('ignores negative and non-finite values rather than widening a threshold', () => {
    expect(resolveOpsThresholds({ refundCents: -1 }).refundCents).toBe(
      OPS_THRESHOLD_DEFAULTS.refundCents,
    );
    expect(resolveOpsThresholds({ overrideCents: Number.NaN }).overrideCents).toBe(
      OPS_THRESHOLD_DEFAULTS.overrideCents,
    );
    expect(resolveOpsThresholds({ discountPct: Number.POSITIVE_INFINITY }).discountPct).toBe(
      OPS_THRESHOLD_DEFAULTS.discountPct,
    );
  });

  it('clamps the lookback to at least one day so the feed is never permanently empty', () => {
    expect(resolveOpsThresholds({ lookbackDays: 0 }).lookbackDays).toBe(1);
    expect(resolveOpsThresholds({ lookbackDays: 30 }).lookbackDays).toBe(30);
  });

  it('overrides only the fields that are set', () => {
    const t = resolveOpsThresholds({ refundCents: 500, takeWithOpenHours: 4 });
    expect(t.refundCents).toBe(500);
    expect(t.takeWithOpenHours).toBe(4);
    expect(t.discountPct).toBe(OPS_THRESHOLD_DEFAULTS.discountPct);
  });
});

describe('sortFeed', () => {
  it('ranks critical over warning over info regardless of age', () => {
    const sorted = sortFeed([
      row({ subjectId: 'a', severity: 'info', occurredAt: new Date('2026-08-31T23:00:00Z') }),
      row({ subjectId: 'b', severity: 'critical', occurredAt: new Date('2026-08-01T00:00:00Z') }),
      row({ subjectId: 'c', severity: 'warning', occurredAt: new Date('2026-08-31T22:00:00Z') }),
    ]);
    expect(sorted.map((r) => r.severity)).toEqual(['critical', 'warning', 'info']);
  });

  it('puts the newest first inside a severity band', () => {
    const sorted = sortFeed([
      row({ subjectId: 'old', occurredAt: new Date('2026-08-30T10:00:00Z') }),
      row({ subjectId: 'new', occurredAt: new Date('2026-08-31T10:00:00Z') }),
    ]);
    expect(sorted.map((r) => r.subjectId)).toEqual(['new', 'old']);
  });

  it('is stable on ties so the list does not reshuffle between requests', () => {
    const at = new Date('2026-08-31T10:00:00Z');
    const input = [
      row({ subjectId: 'z', occurredAt: at }),
      row({ subjectId: 'a', occurredAt: at }),
      row({ subjectId: 'm', occurredAt: at }),
    ];
    expect(sortFeed(input).map((r) => r.subjectId)).toEqual(['a', 'm', 'z']);
    expect(sortFeed([...input].reverse()).map((r) => r.subjectId)).toEqual(['a', 'm', 'z']);
  });

  it('does not mutate its input', () => {
    const input = [
      row({ subjectId: 'a', severity: 'info' }),
      row({ subjectId: 'b', severity: 'critical' }),
    ];
    sortFeed(input);
    expect(input.map((r) => r.subjectId)).toEqual(['a', 'b']);
  });
});

describe('withoutCleared', () => {
  const reviewed = new Date('2026-08-31T19:00:00Z');

  it('drops only the exact subject that was signed off', () => {
    const rows = [
      row({ subjectType: 'refund', subjectId: 'x' }),
      row({ subjectType: 'return', subjectId: 'x' }),
      row({ subjectType: 'refund', subjectId: 'y' }),
    ];
    const left = withoutCleared(rows, new Map([['refund:x', reviewed]]));
    expect(left.map(subjectKey)).toEqual(['return:x', 'refund:y']);
  });

  it('is a no-op when nothing has been cleared', () => {
    const rows = [row()];
    expect(withoutCleared(rows, new Map())).toHaveLength(1);
  });

  it('resurfaces a subject that recurred after its sign-off', () => {
    // Stock went negative, was reviewed, was fixed — and went negative
    // again a month later: same inventory_levels id, newer occurredAt.
    const recurrence = row({
      subjectType: 'negative_stock',
      subjectId: 'level-1',
      occurredAt: new Date('2026-09-30T12:00:00Z'),
    });
    const left = withoutCleared([recurrence], new Map([['negative_stock:level-1', reviewed]]));
    expect(left).toHaveLength(1);
  });

  it('keeps hiding a one-shot event reviewed after it happened', () => {
    const event = row({ occurredAt: new Date('2026-08-31T18:00:00Z') });
    expect(withoutCleared([event], new Map([[subjectKey(event), reviewed]]))).toHaveLength(0);
  });
});

describe('digestByActor', () => {
  it('groups by person, counts kinds, and sums money in absolute cents', () => {
    const digest = digestByActor([
      row({
        subjectId: '1',
        actorUserId: 'u1',
        actorName: 'Maria',
        kind: 'Refund',
        amountCents: -20_000,
      }),
      row({
        subjectId: '2',
        actorUserId: 'u1',
        actorName: 'Maria',
        kind: 'Refund',
        amountCents: -1_200,
      }),
      row({
        subjectId: '3',
        actorUserId: 'u1',
        actorName: 'Maria',
        kind: 'Price override',
        amountCents: 5_000,
      }),
      row({
        subjectId: '4',
        actorUserId: 'u2',
        actorName: 'Dev',
        kind: 'Refund',
        amountCents: -100,
      }),
    ]);
    expect(digest).toHaveLength(2);
    expect(digest[0]).toMatchObject({
      actorUserId: 'u1',
      actorName: 'Maria',
      total: 3,
      amountCents: 26_200,
      byKind: { Refund: 2, 'Price override': 1 },
    });
    expect(digest[1]).toMatchObject({ actorUserId: 'u2', total: 1, amountCents: 100 });
  });

  it('carries the worst severity the person is responsible for', () => {
    const [entry] = digestByActor([
      row({ subjectId: '1', severity: 'info' }),
      row({ subjectId: '2', severity: 'critical' }),
      row({ subjectId: '3', severity: 'warning' }),
    ]);
    expect(entry!.worstSeverity).toBe('critical' satisfies OpsSeverity);
  });

  it('buckets actor-less rows under system rather than dropping them', () => {
    const digest = digestByActor([row({ actorUserId: null, actorName: null, amountCents: null })]);
    expect(digest).toHaveLength(1);
    expect(digest[0]!.actorUserId).toBeNull();
    expect(digest[0]!.amountCents).toBe(0);
  });

  it('recovers a name from a later row when the first one lacks it', () => {
    const digest = digestByActor([
      row({ subjectId: '1', actorUserId: 'u1', actorName: null }),
      row({ subjectId: '2', actorUserId: 'u1', actorName: 'Maria' }),
    ]);
    expect(digest[0]!.actorName).toBe('Maria');
  });

  it('ranks by count, breaking ties on money', () => {
    const digest = digestByActor([
      row({ subjectId: '1', actorUserId: 'a', amountCents: -100 }),
      row({ subjectId: '2', actorUserId: 'b', amountCents: -90_000 }),
    ]);
    expect(digest[0]!.actorUserId).toBe('b');
  });
});

describe('discountPercent', () => {
  it('computes the share of subtotal', () => {
    expect(discountPercent(2_500, 10_000)).toBe(25);
  });

  it('returns zero rather than dividing by a zero or negative subtotal', () => {
    expect(discountPercent(500, 0)).toBe(0);
    expect(discountPercent(500, -100)).toBe(0);
  });
});

describe('splitFamilyBase', () => {
  it('strips a single letter suffix', () => {
    expect(splitFamilyBase('SO-2026-000016-B')).toBe('SO-2026-000016');
  });

  it('leaves a base number alone', () => {
    expect(splitFamilyBase('SO-2026-000016')).toBe('SO-2026-000016');
  });

  it('does not eat a numeric suffix', () => {
    expect(splitFamilyBase('SO-2026-000016-2')).toBe('SO-2026-000016-2');
  });
});
