/**
 * Shopify-style date ranges (owner 2026-09-02): one vocabulary of presets
 * shared by every page that scopes data by date, resolved in the browser's
 * local calendar and carried in the URL as `?range=<preset>&start&end` so
 * a view can be bookmarked, shared and reloaded to the same window.
 *
 * All dates are `YYYY-MM-DD` strings; ranges are inclusive on both ends.
 */

export type LastUnit = 'days' | 'weeks' | 'months';

/**
 * Presets: the fixed vocabulary, plus Shopify's rolling "Last N units"
 * (`last_7_days`, `last_3_weeks_excl` — `_excl` leaves today out) and
 * calendar quarters (`q3_2026`).
 */
export type RangePreset =
  | 'today'
  | 'yesterday'
  | 'last7'
  | 'last30'
  | 'last90'
  | 'last12m'
  | 'wtd'
  | 'mtd'
  | 'qtd'
  | 'ytd'
  | 'last_week'
  | 'last_month'
  | 'last_quarter'
  | 'last_year'
  | `last_${number}_${LastUnit}`
  | `last_${number}_${LastUnit}_excl`
  | `q${1 | 2 | 3 | 4}_${number}`
  | 'all'
  | 'custom';

export type FixedPreset = Exclude<RangePreset, 'custom'>;

export interface DateRange {
  preset: RangePreset;
  start: string;
  end: string;
}

export const PRESETS: {
  key: FixedPreset;
  label: string;
  group: 'quick' | 'last' | 'to_date' | 'previous';
}[] = [
  { key: 'today', label: 'Today', group: 'quick' },
  { key: 'yesterday', label: 'Yesterday', group: 'quick' },
  { key: 'last7', label: 'Last 7 days', group: 'last' },
  { key: 'last30', label: 'Last 30 days', group: 'last' },
  { key: 'last90', label: 'Last 90 days', group: 'last' },
  { key: 'last12m', label: 'Last 12 months', group: 'last' },
  { key: 'wtd', label: 'Week to date', group: 'to_date' },
  { key: 'mtd', label: 'Month to date', group: 'to_date' },
  { key: 'qtd', label: 'Quarter to date', group: 'to_date' },
  { key: 'ytd', label: 'Year to date', group: 'to_date' },
  { key: 'last_week', label: 'Last week', group: 'previous' },
  { key: 'last_month', label: 'Last month', group: 'previous' },
  { key: 'last_quarter', label: 'Last quarter', group: 'previous' },
  { key: 'last_year', label: 'Last year', group: 'previous' },
];

const LAST_RE = /^last_(\d{1,3})_(days|weeks|months)(_excl)?$/;
const QUARTER_RE = /^q([1-4])_(\d{4})$/;

export function parseLastPreset(
  preset: string,
): { n: number; unit: LastUnit; includeToday: boolean } | null {
  const m = LAST_RE.exec(preset);
  if (!m) return null;
  const n = Number(m[1]);
  if (!Number.isInteger(n) || n < 1) return null;
  return { n, unit: m[2] as LastUnit, includeToday: !m[3] };
}

export function lastPreset(n: number, unit: LastUnit, includeToday: boolean): FixedPreset {
  return `last_${n}_${unit}${includeToday ? '' : '_excl'}` as FixedPreset;
}

export function parseQuarterPreset(preset: string): { q: 1 | 2 | 3 | 4; year: number } | null {
  const m = QUARTER_RE.exec(preset);
  if (!m) return null;
  return { q: Number(m[1]) as 1 | 2 | 3 | 4, year: Number(m[2]) };
}

export function quarterPreset(q: 1 | 2 | 3 | 4, year: number): FixedPreset {
  return `q${q}_${year}` as FixedPreset;
}

export function isFixedPreset(s: unknown): s is FixedPreset {
  if (typeof s !== 'string' || s === 'custom') return false;
  return (
    s === 'all' ||
    PRESETS.some((p) => p.key === s) ||
    !!parseLastPreset(s) ||
    !!parseQuarterPreset(s)
  );
}

/** Open-ended window: the API treats a missing start as "since the beginning". */
export const ALL_TIME_START = '2000-01-01';

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isDay(s: unknown): s is string {
  return typeof s === 'string' && DAY_RE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00`));
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Local calendar date of a Date as YYYY-MM-DD. */
export function toDay(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Today's local calendar date. */
export function localToday(): string {
  return toDay(new Date());
}

function fromDay(day: string): Date {
  const [y, m, d] = day.split('-').map(Number) as [number, number, number];
  return new Date(y, m - 1, d);
}

export function addDays(day: string, n: number): string {
  const d = fromDay(day);
  d.setDate(d.getDate() + n);
  return toDay(d);
}

function startOfWeek(day: string): string {
  // Weeks start on Monday, like Shopify's default.
  const d = fromDay(day);
  const dow = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dow);
  return toDay(d);
}

function startOfMonth(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

function startOfQuarter(day: string): string {
  const d = fromDay(day);
  const q = Math.floor(d.getMonth() / 3) * 3;
  return toDay(new Date(d.getFullYear(), q, 1));
}

function startOfYear(day: string): string {
  return `${day.slice(0, 4)}-01-01`;
}

function addMonths(day: string, n: number): string {
  const d = fromDay(day);
  const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(d.getDate(), last));
  return toDay(target);
}

/** Resolve a preset to concrete inclusive bounds as of `today`. */
export function resolvePreset(
  preset: FixedPreset,
  today: string = localToday(),
): { start: string; end: string } {
  if (preset === 'all') return { start: ALL_TIME_START, end: today };
  const last = parseLastPreset(preset);
  if (last) {
    const end = last.includeToday ? today : addDays(today, -1);
    if (last.unit === 'days') return { start: addDays(end, -(last.n - 1)), end };
    if (last.unit === 'weeks') return { start: addDays(end, -(last.n * 7 - 1)), end };
    return { start: addDays(addMonths(end, -last.n), 1), end };
  }
  const quarter = parseQuarterPreset(preset);
  if (quarter) {
    const first = new Date(quarter.year, (quarter.q - 1) * 3, 1);
    const lastDay = new Date(quarter.year, quarter.q * 3, 0);
    return { start: toDay(first), end: toDay(lastDay) };
  }
  switch (preset) {
    case 'today':
      return { start: today, end: today };
    case 'yesterday': {
      const y = addDays(today, -1);
      return { start: y, end: y };
    }
    case 'last7':
      return { start: addDays(today, -6), end: today };
    case 'last30':
      return { start: addDays(today, -29), end: today };
    case 'last90':
      return { start: addDays(today, -89), end: today };
    case 'last12m':
      return { start: addDays(addMonths(today, -12), 1), end: today };
    case 'wtd':
      return { start: startOfWeek(today), end: today };
    case 'mtd':
      return { start: startOfMonth(today), end: today };
    case 'qtd':
      return { start: startOfQuarter(today), end: today };
    case 'ytd':
      return { start: startOfYear(today), end: today };
    case 'last_week': {
      const thisMonday = startOfWeek(today);
      return { start: addDays(thisMonday, -7), end: addDays(thisMonday, -1) };
    }
    case 'last_month': {
      const first = startOfMonth(today);
      const prevEnd = addDays(first, -1);
      return { start: startOfMonth(prevEnd), end: prevEnd };
    }
    case 'last_quarter': {
      const first = startOfQuarter(today);
      const prevEnd = addDays(first, -1);
      return { start: startOfQuarter(prevEnd), end: prevEnd };
    }
    case 'last_year': {
      const y = Number(today.slice(0, 4)) - 1;
      return { start: `${y}-01-01`, end: `${y}-12-31` };
    }
    default:
      return { start: today, end: today };
  }
}

export function rangeFor(preset: FixedPreset, today?: string): DateRange {
  return { preset, ...resolvePreset(preset, today) };
}

/** Calendar quarter containing `day`: { q, year }. */
export function quarterOf(day: string): { q: 1 | 2 | 3 | 4; year: number } {
  const d = fromDay(day);
  return { q: (Math.floor(d.getMonth() / 3) + 1) as 1 | 2 | 3 | 4, year: d.getFullYear() };
}

/**
 * Read a range from URL search params: `range` names a preset (resolved
 * against today), else `start`/`end` make a custom range; anything
 * missing or malformed falls back to `fallback`.
 */
/**
 * Several pickers can share one page (owner 2026-09-02: "multiple
 * instances where I want to apply individual time filters on certain
 * data"). Each instance owns a `key`; the page-level picker uses the bare
 * `range` / `start` / `end` params, a section picker keyed `deliveries`
 * uses `deliveries.range` / `deliveries.start` / `deliveries.end`.
 */
export function rangeParamNames(key?: string): { range: string; start: string; end: string } {
  const p = key ? `${key}.` : '';
  return { range: `${p}range`, start: `${p}start`, end: `${p}end` };
}

export function rangeFromSearch(
  params: URLSearchParams,
  fallback: FixedPreset,
  today: string = localToday(),
  key?: string,
): DateRange {
  const names = rangeParamNames(key);
  const preset = params.get(names.range);
  if (isFixedPreset(preset)) {
    return rangeFor(preset, today);
  }
  const start = params.get(names.start);
  const end = params.get(names.end);
  if (isDay(start) && isDay(end) && start <= end) {
    return { preset: 'custom', start, end };
  }
  return rangeFor(fallback, today);
}

/** Write a range into search params (mutates and returns them). */
export function rangeToSearch(
  range: DateRange,
  params: URLSearchParams,
  key?: string,
): URLSearchParams {
  const names = rangeParamNames(key);
  if (range.preset === 'custom') {
    params.delete(names.range);
    params.set(names.start, range.start);
    params.set(names.end, range.end);
  } else {
    params.set(names.range, range.preset);
    params.delete(names.start);
    params.delete(names.end);
  }
  return params;
}

/** The same-length window immediately before `range` (for "compare to previous period"). */
export function previousPeriod(range: DateRange): { start: string; end: string } {
  const days = daysBetween(range.start, range.end) + 1;
  const end = addDays(range.start, -1);
  return { start: addDays(end, -(days - 1)), end };
}

export function daysBetween(start: string, end: string): number {
  const ms = fromDay(end).getTime() - fromDay(start).getTime();
  return Math.round(ms / 86_400_000);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "Sep 2, 2026" */
export function formatDay(day: string): string {
  if (!isDay(day)) return day;
  const d = fromDay(day);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

/** "Aug 4 – Sep 2, 2026" / "Sep 2, 2026" / "Dec 4, 2025 – Jan 2, 2026" */
export function formatRange(range: { start: string; end: string }): string {
  if (range.start === range.end) return formatDay(range.start);
  const s = fromDay(range.start);
  const e = fromDay(range.end);
  if (s.getFullYear() === e.getFullYear()) {
    return `${MONTHS[s.getMonth()]} ${s.getDate()} – ${MONTHS[e.getMonth()]} ${e.getDate()}, ${e.getFullYear()}`;
  }
  return `${formatDay(range.start)} – ${formatDay(range.end)}`;
}

export function presetLabel(preset: RangePreset): string {
  if (preset === 'all') return 'All time';
  const fixed = PRESETS.find((p) => p.key === preset);
  if (fixed) return fixed.label;
  const last = parseLastPreset(preset);
  if (last) {
    const unit = last.n === 1 ? last.unit.slice(0, -1) : last.unit;
    return `Last ${last.n} ${unit}${last.includeToday ? '' : ' (before today)'}`;
  }
  const quarter = parseQuarterPreset(preset);
  if (quarter) return `Q${quarter.q} ${quarter.year}`;
  return 'Custom';
}
