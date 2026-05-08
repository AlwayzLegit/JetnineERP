import { BadRequestException } from '@nestjs/common';

/**
 * Standard list-endpoint response envelope.
 *
 *   { data: T[], nextCursor: string | null }
 *
 * `nextCursor` is opaque to clients — they round-trip it as `?cursor=`
 * to fetch the next page. When null, the page is the last one.
 */
export interface PageResponse<T> {
  data: T[];
  nextCursor: string | null;
}

/**
 * Decoded cursor. Always carries a tiebreaker `id` so a second page
 * never duplicates or skips a row when the sort column has duplicates
 * (two rows with the same `created_at`, two products with the same
 * `name`, etc.).
 */
export interface CursorValue {
  /**
   * Opaque value of the primary sort column. Stored as ISO-8601 for
   * timestamps, raw string for text, raw number for integers. The
   * caller decides how to compare it; we just round-trip it.
   */
  v: string | number;
  /** Tiebreaker — the row's id. */
  id: string;
}

const MAX_LIMIT = 200;
const DEFAULT_LIMIT = 50;

/** Clamp `?limit=` to [1, 200], default 50. */
export function clampLimit(raw: string | undefined, def = DEFAULT_LIMIT): number {
  const n = Number(raw ?? String(def));
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(Math.max(Math.floor(n), 1), MAX_LIMIT);
}

/**
 * Decode a base64url cursor string. Throws 400 if malformed — clients
 * shouldn't be hand-crafting cursors, so a bad cursor is an error
 * rather than a silent skip-to-page-1.
 */
export function decodeCursor(raw: string | undefined): CursorValue | null {
  if (!raw || raw.length === 0) return null;
  try {
    const json = Buffer.from(raw, 'base64url').toString('utf8');
    const parsed = JSON.parse(json) as { v?: unknown; id?: unknown };
    if (
      (typeof parsed.v !== 'string' && typeof parsed.v !== 'number') ||
      typeof parsed.id !== 'string' ||
      parsed.id.length === 0
    ) {
      throw new Error('shape');
    }
    return { v: parsed.v, id: parsed.id };
  } catch {
    throw new BadRequestException('Invalid cursor');
  }
}

/**
 * Encode the last row of a page into a cursor for the *next* page.
 * Pass the value of the primary sort column and the row's id.
 */
export function encodeCursor(value: string | number | Date, id: string): string {
  const v = value instanceof Date ? value.toISOString() : value;
  return Buffer.from(JSON.stringify({ v, id })).toString('base64url');
}

/**
 * Given an over-fetched array (limit + 1), build the page response:
 * trim to `limit`, set `nextCursor` if there's a next page, derive
 * the cursor from the last visible row.
 */
export function buildPage<T extends { id: string }>(
  rows: T[],
  limit: number,
  cursorValue: (row: T) => string | number | Date,
): PageResponse<T> {
  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const last = data[data.length - 1];
  const nextCursor = hasMore && last ? encodeCursor(cursorValue(last), last.id) : null;
  return { data, nextCursor };
}
