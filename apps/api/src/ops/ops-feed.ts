/**
 * Operations feed — the pure half (owner 2026-08-31).
 *
 * The controller does the SQL; everything that decides *whether a row
 * deserves a human's attention*, how loudly, and in what order lives
 * here so it can be tested without a database. Thresholds come from
 * `businesses.ops_settings_json` and every one of them is tri-state:
 * an absent field means the documented default, never "off".
 */

/** Feed sources. The subject key is `${subjectType}:${subjectId}`. */
export type OpsSubjectType =
  | 'negative_stock'
  | 'take_with_open'
  | 'drawer_variance'
  | 'refund'
  | 'return'
  | 'exchange'
  | 'write_off'
  | 'inventory_movement'
  | 'gift_card_adjustment'
  | 'security_override'
  | 'exception';

export type OpsSeverity = 'critical' | 'warning' | 'info';

export interface OpsFeedRow {
  subjectType: OpsSubjectType;
  subjectId: string;
  severity: OpsSeverity;
  /** Short display label for the row's kind ("Refund", "Stock adjustment"). */
  kind: string;
  summary: string;
  /** Money at stake, when the row has any. Negative = money out. */
  amountCents: number | null;
  actorUserId: string | null;
  actorName: string | null;
  locationId: string | null;
  locationName: string | null;
  /** Where "Open" goes. Null when the subject has no page of its own. */
  href: string | null;
  occurredAt: Date;
  /**
   * How this row gets signed off. Exception-register rows already have
   * `exception_events.acknowledged_at`; everything else is stamped in
   * `ops_reviews`. Keeping the distinction here means a subject is
   * never recorded as reviewed in two places.
   */
  clearVia: 'exception' | 'review';
}

/**
 * Thresholds that decide what reaches the feed. Every default below is
 * the owner's stated starting point, not a hard rule — all six are
 * editable under Settings → Operations.
 */
export interface OpsThresholds {
  /** Refunds and returns at or above this land on the feed. */
  refundCents: number;
  /** Order/line discount at or above this share of subtotal (percent). */
  discountPct: number;
  /** Price overrides and write-offs at or above this. */
  overrideCents: number;
  /** |drawer variance| at or above this. */
  drawerVarianceCents: number;
  /** |manual stock adjustment| in units at or above this. */
  inventoryAdjustUnits: number;
  /** Hours a take-with may sit on an open split ticket before flagging. */
  takeWithOpenHours: number;
  /** How far back the feed looks, in days. */
  lookbackDays: number;
}

export const OPS_THRESHOLD_DEFAULTS: OpsThresholds = {
  refundCents: 20_000,
  discountPct: 20,
  overrideCents: 10_000,
  drawerVarianceCents: 500,
  inventoryAdjustUnits: 5,
  takeWithOpenHours: 24,
  lookbackDays: 7,
};

/** The shape `ops_settings_json.opsReview` may carry. All optional. */
export interface OpsReviewSettings {
  refundCents?: number | null;
  discountPct?: number | null;
  overrideCents?: number | null;
  drawerVarianceCents?: number | null;
  inventoryAdjustUnits?: number | null;
  takeWithOpenHours?: number | null;
  lookbackDays?: number | null;
}

/**
 * Merge stored settings over the defaults. A null or absent field means
 * "use the default" (SET-002: blank is never implicit "off"); zero is a
 * real value and is kept, so a business can set a $0 refund threshold
 * and see every refund. Negatives and non-finite numbers are ignored —
 * they can only be corruption, and silently widening a threshold is
 * worse than falling back.
 */
export function resolveOpsThresholds(
  settings: OpsReviewSettings | null | undefined,
): OpsThresholds {
  const pick = (value: number | null | undefined, fallback: number): number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : fallback;
  const s = settings ?? {};
  return {
    refundCents: pick(s.refundCents, OPS_THRESHOLD_DEFAULTS.refundCents),
    discountPct: pick(s.discountPct, OPS_THRESHOLD_DEFAULTS.discountPct),
    overrideCents: pick(s.overrideCents, OPS_THRESHOLD_DEFAULTS.overrideCents),
    drawerVarianceCents: pick(s.drawerVarianceCents, OPS_THRESHOLD_DEFAULTS.drawerVarianceCents),
    inventoryAdjustUnits: pick(s.inventoryAdjustUnits, OPS_THRESHOLD_DEFAULTS.inventoryAdjustUnits),
    takeWithOpenHours: pick(s.takeWithOpenHours, OPS_THRESHOLD_DEFAULTS.takeWithOpenHours),
    // A zero-day lookback would render the feed permanently empty, so
    // this one clamps to at least a day.
    lookbackDays: Math.max(1, pick(s.lookbackDays, OPS_THRESHOLD_DEFAULTS.lookbackDays)),
  };
}

const SEVERITY_RANK: Record<OpsSeverity, number> = { critical: 0, warning: 1, info: 2 };

export function subjectKey(row: Pick<OpsFeedRow, 'subjectType' | 'subjectId'>): string {
  return `${row.subjectType}:${row.subjectId}`;
}

/**
 * Loudest first, then newest. Ties break on subject key so the order is
 * stable between requests — a feed that reshuffles under the cursor is
 * a feed people stop trusting.
 */
export function sortFeed(rows: OpsFeedRow[]): OpsFeedRow[] {
  return [...rows].sort((a, b) => {
    const bySeverity = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
    if (bySeverity !== 0) return bySeverity;
    const byTime = b.occurredAt.getTime() - a.occurredAt.getTime();
    if (byTime !== 0) return byTime;
    return subjectKey(a).localeCompare(subjectKey(b));
  });
}

/** Drop rows already signed off. `cleared` holds `subjectKey` values. */
export function withoutCleared(rows: OpsFeedRow[], cleared: ReadonlySet<string>): OpsFeedRow[] {
  return rows.filter((r) => !cleared.has(subjectKey(r)));
}

export interface ActorDigestRow {
  actorUserId: string | null;
  actorName: string | null;
  total: number;
  /** Money implicated by this actor's rows, absolute cents. */
  amountCents: number;
  byKind: Record<string, number>;
  worstSeverity: OpsSeverity;
}

/**
 * The per-person roll-up: "Maria — 3 overrides, 1 void, $412". A flat
 * chronological stream hides a pattern; grouping by who did it is what
 * makes an outlier show itself.
 */
export function digestByActor(rows: OpsFeedRow[]): ActorDigestRow[] {
  const byActor = new Map<string, ActorDigestRow>();
  for (const row of rows) {
    const key = row.actorUserId ?? 'system';
    const entry = byActor.get(key) ?? {
      actorUserId: row.actorUserId,
      actorName: row.actorName,
      total: 0,
      amountCents: 0,
      byKind: {},
      worstSeverity: 'info' as OpsSeverity,
    };
    entry.total += 1;
    entry.amountCents += Math.abs(row.amountCents ?? 0);
    entry.byKind[row.kind] = (entry.byKind[row.kind] ?? 0) + 1;
    if (SEVERITY_RANK[row.severity] < SEVERITY_RANK[entry.worstSeverity]) {
      entry.worstSeverity = row.severity;
    }
    // A later row may name the actor the first one left null.
    entry.actorName ??= row.actorName;
    byActor.set(key, entry);
  }
  return [...byActor.values()].sort((a, b) => b.total - a.total || b.amountCents - a.amountCents);
}

/** Percent of `subtotalCents` that `discountCents` represents. */
export function discountPercent(discountCents: number, subtotalCents: number): number {
  if (subtotalCents <= 0) return 0;
  return (discountCents / subtotalCents) * 100;
}

/**
 * The base document number of a split family: `SO-2026-000016-B` →
 * `SO-2026-000016`. Mirrors OrdersController.splitFamily so both agree
 * on what "same ticket" means.
 */
export function splitFamilyBase(number: string): string {
  return number.replace(/-[A-Z]$/, '');
}
