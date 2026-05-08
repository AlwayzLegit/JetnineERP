import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { businesses } from './platform';

/**
 * Idempotency keys for safe retry of mutating requests.
 *
 * Stripe-style: a client supplies an `Idempotency-Key` header on a
 * POST/PATCH/DELETE; the server records the key + a SHA-256 fingerprint
 * of the canonical request (method + path + body) and the eventual
 * response. A second request with the same key and matching fingerprint
 * returns the cached response without re-running the handler. A second
 * request with the same key but a *different* fingerprint is rejected
 * 409 Conflict — keys are not reusable across distinct operations.
 *
 * Scope is per-business: two businesses can independently use the same
 * key string with no collision. The (`business_id`, `key`) pair is the
 * uniqueness invariant.
 *
 * Rows are kept for 24h (swept by an offline job) which matches Stripe's
 * window — long enough for client retries and proxy replays, short
 * enough that the table doesn't grow unboundedly.
 */
export const idempotencyKeys = pgTable(
  'idempotency_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    /** The client-supplied key (1-255 chars). */
    key: text('key').notNull(),
    /** SHA-256 hex of `${method} ${path}\n${canonicalBody}`. */
    requestFingerprint: text('request_fingerprint').notNull(),
    /** 'pending' while the original request is in flight; terminal once cached. */
    status: text('status').notNull(),
    responseStatus: integer('response_status'),
    responseBody: jsonb('response_body'),
    /** When the lock was acquired; lets a stuck request be reaped. */
    lockedAt: timestamp('locked_at', { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessKeyUnique: uniqueIndex('idempotency_keys_business_key_uniq').on(t.businessId, t.key),
    createdIdx: index('idempotency_keys_created_at_idx').on(t.createdAt),
  }),
);
