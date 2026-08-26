import { check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { businesses, users } from './platform';
import { locations } from './tenancy';
import { customers } from './customers';
import { productVariants } from './catalog';

/**
 * As-Is intake queue (PLAN-POS-OPERATIONS §10): every returned item —
 * and warranty/defect intakes — lands here instead of sellable stock,
 * and waits for a manager/warehouse review. The review decides its
 * disposition: restock (into the same variant or the matching `-AS`
 * as-is variant), return to vendor, or scrap. Only a restock touches
 * inventory.
 */
export const asIsItems = pgTable(
  'as_is_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    /** 'return' | 'warranty' | 'defect' | 'exchange_pickup' */
    source: text('source').notNull().default('return'),
    /** 'pending_review' | 'restocked' | 'vendor_return' | 'scrapped' */
    status: text('status').notNull().default('pending_review'),
    /** What produced it: 'refund' | 'order' | 'manual' + the row's id. */
    referenceType: text('reference_type'),
    referenceId: uuid('reference_id'),
    /** Where the units went on restock (may be the `-AS` variant). */
    restockedVariantId: uuid('restocked_variant_id').references(() => productVariants.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    reviewedByUserId: uuid('reviewed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('as_is_items_business_id_idx').on(t.businessId),
    statusIdx: index('as_is_items_status_idx').on(t.businessId, t.status),
    variantIdx: index('as_is_items_variant_id_idx').on(t.variantId),
    locationIdx: index('as_is_items_location_id_idx').on(t.locationId),
    quantityPositive: check('as_is_items_quantity_positive', sql`${t.quantity} > 0`),
  }),
);

/**
 * Store-credit ledger (§10): credit lives on the customer record,
 * never expires, and auto-surfaces at checkout. Issued by returns and
 * refunds (positive delta), redeemed by store_credit tenders (negative
 * delta). The balance is always the SUM — never stored.
 */
export const storeCreditEntries = pgTable(
  'store_credit_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    /** Positive = issued, negative = redeemed. */
    deltaCents: integer('delta_cents').notNull(),
    reason: text('reason'),
    /** 'refund' | 'order_return' | 'payment' | 'manual' + the row's id. */
    referenceType: text('reference_type'),
    referenceId: uuid('reference_id'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('store_credit_entries_business_id_idx').on(t.businessId),
    customerIdx: index('store_credit_entries_customer_id_idx').on(t.businessId, t.customerId),
  }),
);
