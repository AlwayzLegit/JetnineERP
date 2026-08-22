import { BadRequestException } from '@nestjs/common';
import { type SQL, and, desc, eq, lt, or, sql } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';

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

/**
 * Postgres `timestamptz` keeps **microseconds**; a JavaScript `Date` — and
 * therefore `toISOString()`, and therefore the cursor — keeps only
 * milliseconds. Comparing a cursor against the raw column means the boundary
 * row can never match: a row stored as `…19.699720+00` is neither `<` nor `=`
 * the cursor's `…19.699Z`, so the page after it comes back empty and the walk
 * stops early. Rows inserted in one statement all share a timestamp, so this
 * silently truncated every list endpoint to a single page.
 *
 * Both sides are therefore compared at millisecond resolution, which is
 * exactly the resolution the cursor can carry. The `ORDER BY` has to use the
 * same expression as the predicate or the two disagree for rows sharing a
 * millisecond but differing in microseconds — which would skip rows instead
 * of stopping early, a worse failure. There is no index on
 * `(created_at, id)` on any of these tables, so the planner was already
 * sorting; truncating the sort key costs nothing.
 */
function msTruncated(column: PgColumn): SQL {
  return sql`date_trunc('milliseconds', ${column})`;
}

/**
 * Keyset predicate for "rows strictly after the cursor" under
 * `timestampCursorOrder`. Returns undefined when there is no cursor, so it
 * drops cleanly into an `and(...)` list.
 */
export function timestampCursorWhere(
  column: PgColumn,
  idColumn: PgColumn,
  cursor: CursorValue | null,
): SQL | undefined {
  if (!cursor) return undefined;
  const parsed = new Date(cursor.v as string);
  if (Number.isNaN(parsed.getTime())) throw new BadRequestException('Invalid cursor');
  // Bound as an ISO string, not a Date: the left-hand side is a raw SQL
  // expression rather than a column, so the driver has no column type to
  // serialize a Date against and throws. Postgres infers timestamptz for the
  // parameter from the comparison instead.
  const v = parsed.toISOString();
  const t = msTruncated(column);
  // Built with drizzle's operators rather than a raw template so the id
  // comparison carries the column's type — bound as plain text, Postgres
  // rejects `uuid < text` for want of an operator.
  return or(lt(t, v), and(eq(t, v), lt(idColumn, cursor.id)));
}

/** The matching ORDER BY. Must be used with `timestampCursorWhere`. */
export function timestampCursorOrder(column: PgColumn, idColumn: PgColumn): [SQL, SQL] {
  return [desc(msTruncated(column)), desc(idColumn)];
}
