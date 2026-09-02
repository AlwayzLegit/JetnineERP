import { sql, type SQL } from 'drizzle-orm';

/**
 * Date-range query params (owner 2026-09-02, Shopify-style picker): every
 * list or dashboard that scopes by date accepts `start` / `end` as
 * `YYYY-MM-DD`, inclusive on both ends. A malformed or reversed pair is
 * ignored (the endpoint keeps its default window) rather than rejected,
 * so a stale bookmark still renders.
 */
export interface DayRange {
  start: string;
  end: string;
}

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDay(s: unknown): s is string {
  return typeof s === 'string' && DAY_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`));
}

export function parseDayRange(start?: string, end?: string): DayRange | null {
  if (!isDay(start) || !isDay(end) || start > end) return null;
  return { start, end };
}

/** UTC instants: `[from, toExclusive)` covering every day in the range. */
export function utcBounds(range: DayRange): { from: Date; toExclusive: Date } {
  const from = new Date(`${range.start}T00:00:00.000Z`);
  const toExclusive = new Date(`${range.end}T00:00:00.000Z`);
  toExclusive.setUTCDate(toExclusive.getUTCDate() + 1);
  return { from, toExclusive };
}

/** Store-local midnight at the start of `day` in `tz`, as SQL. */
export function tzDayStart(day: string, tz: string): SQL {
  return sql`(${day}::date::timestamp AT TIME ZONE ${tz})`;
}

/** Store-local midnight after `day` in `tz` (exclusive end), as SQL. */
export function tzDayEndExclusive(day: string, tz: string): SQL {
  return sql`((${day}::date + 1)::timestamp AT TIME ZONE ${tz})`;
}
