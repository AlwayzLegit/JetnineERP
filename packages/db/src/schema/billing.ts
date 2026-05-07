import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './platform';

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
