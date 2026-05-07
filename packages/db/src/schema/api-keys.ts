import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';

/**
 * Per-business API keys for programmatic access. The full key is shown
 * exactly once at create time and never persisted; the row stores a
 * SHA-256 hash for verification and a short, opaque prefix for display.
 *
 * Keys carry a `scopes` array of permission strings; on each request,
 * the tenant guard loads those scopes (instead of the user's role
 * permissions) so a key issued for "sales.view" can read but never
 * write — even if the user who created it would otherwise be allowed.
 *
 * Revocation is soft (`revoked_at`) so historical audit rows pointing
 * at the key continue to resolve.
 */
export const apiKeys = pgTable(
  'api_keys',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    keyPrefix: text('key_prefix').notNull(),
    keyHash: text('key_hash').notNull(),
    scopes: jsonb('scopes').$type<string[]>().notNull(),
    livemode: text('livemode').notNull(), // 'live' | 'test'
    notes: text('notes'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    keyHashUnique: uniqueIndex('api_keys_key_hash_uniq').on(t.keyHash),
    businessIdx: index('api_keys_business_id_idx').on(t.businessId),
    prefixIdx: index('api_keys_key_prefix_idx').on(t.keyPrefix),
  }),
);
