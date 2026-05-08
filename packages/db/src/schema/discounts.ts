import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { businesses } from './platform';
import { customers } from './customers';
import { sales } from './sales';
import { citext } from '../types';

/**
 * Discount codes. Two kinds:
 *   - 'percent': `value` is in basis points (1500 = 15% off the
 *     post-line-discount subtotal).
 *   - 'fixed':   `value` is in cents (500 = $5 off).
 * The applied amount is always clamped to the post-line-discount
 * subtotal so the order total never goes negative.
 *
 * Codes are case-insensitive (citext) so "SAVE10" and "save10" match.
 * `usage_count` is denormalized for the hot path (sale validation);
 * `discount_redemptions` is the source of truth for historical audits
 * and per-customer limit checks.
 */
export const discountCodes = pgTable(
  'discount_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    code: citext('code').notNull(),
    /** 'percent' | 'fixed' */
    kind: text('kind').notNull(),
    /** Basis points for 'percent', cents for 'fixed'. */
    value: integer('value').notNull(),
    description: text('description'),
    isActive: boolean('is_active').notNull().default(true),
    startsAt: timestamp('starts_at', { withTimezone: true }),
    endsAt: timestamp('ends_at', { withTimezone: true }),
    usageLimit: integer('usage_limit'),
    usageCount: integer('usage_count').notNull().default(0),
    perCustomerLimit: integer('per_customer_limit'),
    minSubtotalCents: integer('min_subtotal_cents'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessCodeUnique: uniqueIndex('discount_codes_business_code_uniq').on(t.businessId, t.code),
    businessIdx: index('discount_codes_business_id_idx').on(t.businessId),
  }),
);

export const discountRedemptions = pgTable(
  'discount_redemptions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    discountCodeId: uuid('discount_code_id')
      .notNull()
      .references(() => discountCodes.id, { onDelete: 'cascade' }),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    amountCents: integer('amount_cents').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    discountIdx: index('discount_redemptions_discount_code_id_idx').on(t.discountCodeId),
    businessIdx: index('discount_redemptions_business_id_idx').on(t.businessId),
    saleIdx: index('discount_redemptions_sale_id_idx').on(t.saleId),
    customerIdx: index('discount_redemptions_customer_id_idx').on(t.customerId),
  }),
);
