'use client';

import { type DBSchema, type IDBPDatabase, openDB } from 'idb';
import { apiUrl } from './api';

/**
 * Offline POS queue + lazy catalog cache.
 *
 * - `pendingSales` is the outbound queue. When the network is up, the
 *   POS page sends sales straight through. When it's down, we stash
 *   the body + a deterministic Idempotency-Key into IDB and return a
 *   placeholder receipt. On reconnect, `syncAll()` drains the queue,
 *   replaying each request — Phase 2.9's idempotency layer dedupes if
 *   the sale was already accepted but the response was lost mid-flight.
 *
 * - `variants` is a read-through cache populated on every successful
 *   `/v1/pos/lookup` while online. When the cashier types a query
 *   while offline, we fall back to a local search across this cache.
 *   It's intentionally lazy — no big up-front sync — so a brand-new
 *   register has an empty cache, but a few minutes of online use is
 *   enough to cover the common items.
 */

export interface QueuedSale {
  id: string;
  /** Per-business so a multi-tenant browser session can't cross-contaminate. */
  businessId: string;
  /** Body to POST to /v1/sales. */
  body: unknown;
  /** Sent as `Idempotency-Key` so a replay is safe (Phase 2.9). */
  idempotencyKey: string;
  /** ISO when first enqueued. */
  enqueuedAt: string;
  /** ISO of the most recent attempt (if any). */
  lastAttemptAt: string | null;
  /** Last error message — surfaced in the UI for stuck rows. */
  lastError: string | null;
  /** Bumped on each failed attempt. The UI escalates the badge color. */
  attempts: number;
}

export interface CachedVariant {
  variantId: string;
  productId: string;
  productName: string;
  sku: string | null;
  barcode: string | null;
  variantName: string | null;
  priceCents: number;
  cachedAt: string;
}

interface JetnineDb extends DBSchema {
  pendingSales: {
    key: string;
    value: QueuedSale;
    indexes: { 'by-business': string };
  };
  variants: {
    key: string;
    value: CachedVariant & { businessId: string };
    indexes: { 'by-business': string; 'by-barcode': [string, string] };
  };
}

const DB_NAME = 'jetnine-offline';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<JetnineDb>> | null = null;

function getDb(): Promise<IDBPDatabase<JetnineDb>> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB is not available in this environment'));
  }
  if (!dbPromise) {
    dbPromise = openDB<JetnineDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const sales = db.createObjectStore('pendingSales', { keyPath: 'id' });
        sales.createIndex('by-business', 'businessId');
        const variants = db.createObjectStore('variants', { keyPath: 'variantId' });
        variants.createIndex('by-business', 'businessId');
        variants.createIndex('by-barcode', ['businessId', 'barcode']);
      },
    });
  }
  return dbPromise;
}

// ──────────────────────────────────────────────────────────────────────
// Queue
// ──────────────────────────────────────────────────────────────────────

export async function enqueueSale(args: {
  businessId: string;
  body: unknown;
  idempotencyKey: string;
}): Promise<QueuedSale> {
  const db = await getDb();
  const row: QueuedSale = {
    id: args.idempotencyKey,
    businessId: args.businessId,
    body: args.body,
    idempotencyKey: args.idempotencyKey,
    enqueuedAt: new Date().toISOString(),
    lastAttemptAt: null,
    lastError: null,
    attempts: 0,
  };
  await db.put('pendingSales', row);
  return row;
}

export async function listPending(businessId: string): Promise<QueuedSale[]> {
  const db = await getDb();
  return db.getAllFromIndex('pendingSales', 'by-business', businessId);
}

export async function removePending(id: string): Promise<void> {
  const db = await getDb();
  await db.delete('pendingSales', id);
}

export async function pendingCount(businessId: string): Promise<number> {
  const rows = await listPending(businessId);
  return rows.length;
}

/**
 * Read the active-business cookie (set by POST /v1/auth/active-business).
 * Returns null on the server or when no business is selected. Used to
 * partition the offline queue + variant cache by tenant.
 */
export function readActiveBusinessId(): string | null {
  if (typeof document === 'undefined') return null;
  const raw = document.cookie;
  if (!raw) return null;
  for (const part of raw.split(/;\s*/)) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq) === 'jetnine.active_business_id') {
      return decodeURIComponent(part.slice(eq + 1)) || null;
    }
  }
  return null;
}

/**
 * Generate a UUID for the Idempotency-Key. Uses crypto.randomUUID
 * when available (everywhere in modern browsers); falls back to a
 * timestamp-based id only in the most ancient environments where
 * collisions still don't matter because each tab uses its own DB.
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `pos_${crypto.randomUUID()}`;
  }
  return `pos_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

// ──────────────────────────────────────────────────────────────────────
// Sync
// ──────────────────────────────────────────────────────────────────────

export interface SyncResult {
  attempted: number;
  succeeded: number;
  failed: number;
  errors: { id: string; message: string }[];
}

/**
 * Drain the queue for a business. Each row is POSTed to /v1/sales with
 * its stored Idempotency-Key; success removes the row, failure bumps
 * `attempts` and stamps the error so the UI can show a stuck-sale
 * indicator. Returns a summary so the caller can flash a toast.
 *
 * Concurrent calls are serialized via the `inFlight` lock — two
 * triggers (online event + manual button + visibility change) won't
 * step on each other.
 */
let inFlight: Promise<SyncResult> | null = null;
export async function syncAll(businessId: string): Promise<SyncResult> {
  if (inFlight) return inFlight;
  inFlight = (async () => {
    const result: SyncResult = { attempted: 0, succeeded: 0, failed: 0, errors: [] };
    const db = await getDb();
    const rows = await db.getAllFromIndex('pendingSales', 'by-business', businessId);
    for (const row of rows) {
      result.attempted += 1;
      try {
        // Use fetch directly so we can attach Idempotency-Key + the
        // explicit X-Business-Id (the cookie may have rolled over to a
        // different business in another tab).
        const res = await fetch(`${apiUrl}/v1/sales`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': row.idempotencyKey,
            'X-Business-Id': businessId,
          },
          body: JSON.stringify(row.body),
        });
        if (!res.ok) {
          const text = await res.text();
          let message = `${res.status} ${res.statusText}`;
          try {
            const parsed = JSON.parse(text) as { message?: string };
            if (parsed.message) message = parsed.message;
          } catch {
            if (text) message = text;
          }
          throw new Error(message);
        }
        await db.delete('pendingSales', row.id);
        result.succeeded += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const updated: QueuedSale = {
          ...row,
          lastAttemptAt: new Date().toISOString(),
          lastError: message,
          attempts: row.attempts + 1,
        };
        await db.put('pendingSales', updated);
        result.failed += 1;
        result.errors.push({ id: row.id, message });
      }
    }
    return result;
  })();
  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
}

// ──────────────────────────────────────────────────────────────────────
// Catalog cache
// ──────────────────────────────────────────────────────────────────────

export async function cacheVariants(
  businessId: string,
  variants: Omit<CachedVariant, 'cachedAt'>[],
): Promise<void> {
  if (variants.length === 0) return;
  const db = await getDb();
  const tx = db.transaction('variants', 'readwrite');
  const now = new Date().toISOString();
  await Promise.all(
    variants.map((v) =>
      tx.store.put({
        ...v,
        businessId,
        cachedAt: now,
      }),
    ),
  );
  await tx.done;
}

/**
 * Local search over the variant cache. Mirrors the server's
 * `/v1/pos/lookup`: exact barcode hit first, then case-insensitive
 * substring on name + SKU.
 */
export async function lookupVariantsLocally(
  businessId: string,
  query: string,
  limit = 25,
): Promise<CachedVariant[]> {
  const db = await getDb();
  const trimmed = query.trim();
  if (trimmed.length === 0) return [];

  // Exact barcode first.
  const byBarcode = await db.getAllFromIndex('variants', 'by-barcode', [businessId, trimmed]);
  if (byBarcode.length > 0) return byBarcode.slice(0, limit);

  // Otherwise scan all variants for this business and filter.
  const all = await db.getAllFromIndex('variants', 'by-business', businessId);
  const needle = trimmed.toLowerCase();
  return all
    .filter(
      (v) =>
        v.productName.toLowerCase().includes(needle) ||
        (v.sku?.toLowerCase().includes(needle) ?? false),
    )
    .slice(0, limit);
}

export async function clearAll(): Promise<void> {
  const db = await getDb();
  await db.clear('pendingSales');
  await db.clear('variants');
}
