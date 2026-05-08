import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';
import { customers } from './customers';
import { sales, refunds } from './sales';
import { citext } from '../types';

/**
 * Gift cards / store credit.
 *
 * A gift card carries an integer cents balance and a human-typeable
 * code that's case-insensitive (citext). The code itself IS the
 * secret in this MVP — anyone holding it can spend the balance — so
 * codes are generated server-side as 16 unambiguous chars (no
 * lowercase, no 0/O/1/I) and never displayed in the list view in
 * full. A future pass can add a PIN second factor.
 *
 * `current_balance_cents` is denormalized off `gift_card_transactions`
 * for the hot path (POS lookup must be fast). The transactions table
 * is the audit ground truth — replaying it must produce the cached
 * balance, and an integration test asserts that invariant.
 *
 * Status:
 *   - 'active'     spendable until expires_at
 *   - 'redeemed'   balance hit zero (kept for history)
 *   - 'cancelled'  manually voided; locks the card
 *   - 'expired'    soft-flag (an offline cron updates these)
 */
export const giftCards = pgTable(
  'gift_cards',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    /** Case-insensitive 16-char display code, unique per business. */
    code: citext('code').notNull(),
    initialBalanceCents: integer('initial_balance_cents').notNull(),
    currentBalanceCents: integer('current_balance_cents').notNull(),
    /** 'active' | 'redeemed' | 'cancelled' | 'expired' */
    status: text('status').notNull().default('active'),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    /** Optional recipient — informational only, doesn't gate redemption. */
    issuedForCustomerId: uuid('issued_for_customer_id').references(() => customers.id, {
      onDelete: 'set null',
    }),
    issuedByUserId: uuid('issued_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessCodeUnique: uniqueIndex('gift_cards_business_code_uniq').on(t.businessId, t.code),
    businessIdx: index('gift_cards_business_id_idx').on(t.businessId),
    statusIdx: index('gift_cards_status_idx').on(t.businessId, t.status),
  }),
);

/**
 * Append-only ledger of every balance change. `kind` distinguishes:
 *   - 'issue'    initial load at creation (positive)
 *   - 'redeem'   spent at POS (negative; sale_id set)
 *   - 'refund'   credited back from a refund (positive; refund_id set)
 *   - 'adjust'   manual correction by an authorized user (signed)
 *   - 'cancel'   zeroes the remaining balance (negative)
 *
 * `balance_after_cents` is captured at write time so we never have
 * to replay history to display a transaction's running balance.
 */
export const giftCardTransactions = pgTable(
  'gift_card_transactions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    giftCardId: uuid('gift_card_id')
      .notNull()
      .references(() => giftCards.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    amountCents: integer('amount_cents').notNull(),
    balanceAfterCents: integer('balance_after_cents').notNull(),
    saleId: uuid('sale_id').references(() => sales.id, { onDelete: 'set null' }),
    refundId: uuid('refund_id').references(() => refunds.id, { onDelete: 'set null' }),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    cardIdx: index('gift_card_transactions_card_id_idx').on(t.giftCardId),
    businessIdx: index('gift_card_transactions_business_id_idx').on(t.businessId),
    createdIdx: index('gift_card_transactions_created_at_idx').on(t.createdAt),
  }),
);
