import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';

/**
 * Per-business subscription record. One row per business. Stripe is the
 * source of truth for billing cycle data when wired in production
 * (`STRIPE_SECRET_KEY` set); in dev / test we drive transitions through
 * the subscription endpoints directly so the rest of the system can
 * exercise trial → active → past_due → canceled flows without real
 * payments.
 *
 * The denormalized status mirrors `businesses.status` so the
 * SubscriptionGuard can read either column on the hot path; we keep
 * both columns in sync inside the controller.
 */
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    // 'starter' | 'pro'
    plan: text('plan').notNull(),
    // 'trial' | 'active' | 'past_due' | 'canceled'
    status: text('status').notNull(),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    currentPeriodStart: timestamp('current_period_start', { withTimezone: true }),
    currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }),
    // The number of locations on the most recent successful renewal —
    // pricing is per-location, so swings during the period are billed at
    // the next cycle.
    paidLocationCount: integer('paid_location_count').notNull().default(0),
    stripeCustomerId: text('stripe_customer_id'),
    stripeSubscriptionId: text('stripe_subscription_id'),
    cancelAtPeriodEnd: timestamp('cancel_at_period_end', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessUnique: uniqueIndex('subscriptions_business_id_uniq').on(t.businessId),
    statusIdx: index('subscriptions_status_idx').on(t.status),
  }),
);

/**
 * Platform-billing ledger: one row per payment (or attempted payment)
 * a SaaS account made toward its subscription. Recorded by a super admin
 * from the accounts console today (manual / comped); the Stripe Billing
 * webhook writes `method = 'stripe'` rows once wired. Agency accounts
 * (PLAN §15) never get rows here.
 */
export const subscriptionPayments = pgTable(
  'subscription_payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    amountCents: integer('amount_cents').notNull(),
    currencyCode: text('currency_code').notNull().default('USD'),
    // 'paid' | 'failed' | 'refunded'
    status: text('status').notNull(),
    // 'manual' | 'stripe' | 'comp'
    method: text('method').notNull(),
    periodStart: timestamp('period_start', { withTimezone: true }),
    periodEnd: timestamp('period_end', { withTimezone: true }),
    /** Check number, Stripe invoice id, bank reference. */
    reference: text('reference'),
    note: text('note'),
    recordedByUserId: uuid('recorded_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('subscription_payments_business_id_idx').on(t.businessId),
    businessPaidIdx: index('subscription_payments_business_paid_at_idx').on(t.businessId, t.paidAt),
  }),
);
