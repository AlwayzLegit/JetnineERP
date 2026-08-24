import { index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './platform';

/**
 * External platform connections (Shopify, WooCommerce, Wix, …): the
 * "bring your data with you" layer. A connection stores the merchant's
 * credentials for one provider; syncs pull customers/products/orders
 * from the provider and feed them through the SAME import pipeline as
 * the STORIS CSVs (import_batches → legacy_refs upserts, D7), so
 * re-syncing updates records in place and the recon gates apply.
 *
 * `credentials_json` holds provider secrets (API tokens, key/secret
 * pairs). They are tenant-scoped under RLS like everything else and
 * never returned by the API after connect.
 */
export const integrations = pgTable(
  'integrations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    /** 'shopify' | 'woocommerce' | 'wix' — the connector registry key. */
    provider: text('provider').notNull(),
    /** 'connected' | 'error' | 'disconnected' */
    status: text('status').notNull().default('connected'),
    /** Provider-specific secrets. Never serialized back to clients. */
    credentialsJson: jsonb('credentials_json').notNull(),
    /** Non-secret settings (shop domain, site URL, sync toggles). */
    configJson: jsonb('config_json'),
    /** Human-readable outcome of the last sync or connection test. */
    lastResultJson: jsonb('last_result_json'),
    lastSyncAt: timestamp('last_sync_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessProviderUnique: uniqueIndex('integrations_business_provider_uniq').on(
      t.businessId,
      t.provider,
    ),
    businessIdx: index('integrations_business_id_idx').on(t.businessId),
  }),
);
