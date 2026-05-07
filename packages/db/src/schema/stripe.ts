import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';

/**
 * Per-business Stripe Connect (Standard) account record. Merchants
 * authenticate via Stripe's OAuth flow; we store the resulting
 * `stripe_user_id` so subsequent API calls can be made on behalf of
 * the merchant via the `Stripe-Account` header. No access tokens are
 * stored — Standard Connect only requires the platform secret key
 * plus the connected account id.
 */
export const merchantStripeAccounts = pgTable(
  'merchant_stripe_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    stripeAccountId: text('stripe_account_id').notNull(),
    /** 'read_write' | 'read_only' */
    scope: text('scope').notNull(),
    livemode: boolean('livemode').notNull(),
    /** Cached from Stripe at connect time; refreshed on the account.updated webhook. */
    accountEmail: text('account_email'),
    defaultCurrency: text('default_currency'),
    chargesEnabled: boolean('charges_enabled').notNull().default(false),
    payoutsEnabled: boolean('payouts_enabled').notNull().default(false),
    connectedByUserId: uuid('connected_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    connectedAt: timestamp('connected_at', { withTimezone: true }).notNull().defaultNow(),
    disconnectedAt: timestamp('disconnected_at', { withTimezone: true }),
  },
  (t) => ({
    businessUnique: uniqueIndex('merchant_stripe_accounts_business_id_uniq').on(t.businessId),
    stripeIdIdx: index('merchant_stripe_accounts_stripe_id_idx').on(t.stripeAccountId),
  }),
);

/**
 * Short-lived state tokens for Stripe Connect's CSRF defense. Created
 * when a merchant clicks "Connect Stripe", consumed (and deleted) when
 * they return from Stripe's OAuth.
 */
export const stripeOauthStates = pgTable(
  'stripe_oauth_states',
  {
    state: text('state').primaryKey(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  },
  (t) => ({
    businessIdx: index('stripe_oauth_states_business_id_idx').on(t.businessId),
  }),
);

/**
 * Stripe webhook event log. Used for idempotency — Stripe retries
 * delivery, and the webhook handler must accept the same event id
 * exactly once. Persisted across restarts so we don't double-handle
 * after a deploy. No `business_id` column: webhooks may target the
 * platform itself (account.application.deauthorized) before we know
 * which tenant they relate to. RLS isn't applied to this table; only
 * the platform writes/reads it.
 */
export const stripeWebhookEvents = pgTable(
  'stripe_webhook_events',
  {
    eventId: text('event_id').primaryKey(),
    type: text('type').notNull(),
    livemode: boolean('livemode').notNull().default(false),
    receivedAt: timestamp('received_at', { withTimezone: true }).notNull().defaultNow(),
    payload: text('payload'),
    error: text('error'),
  },
  (t) => ({
    typeIdx: index('stripe_webhook_events_type_idx').on(t.type),
    receivedIdx: index('stripe_webhook_events_received_at_idx').on(t.receivedAt),
  }),
);
