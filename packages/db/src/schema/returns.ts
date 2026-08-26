import { check, index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { businesses, users } from './platform';
import { locations } from './tenancy';
import { customers } from './customers';
import { productVariants } from './catalog';
import { orders, orderLines } from './orders';
import { reasonCodes } from './controls';

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

/**
 * Return document (PLAN-STORIS-GAP §8, amendment A7): the financial
 * event is gated on the physical event. A return is *authorized* at
 * entry (lines, method, reasons — no money, no inventory), and the
 * refund fires only when the goods are physically received back
 * (status → completed, goods to As-Is, tenders reversed). Counter
 * drop-offs — goods in hand — authorize and receive in one step,
 * flagged by fulfillment='drop_off'.
 */
export const orderReturns = pgTable(
  'order_returns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    /** Customer-facing RMA: "RMA-{order number}-{n}". */
    rmaNumber: text('rma_number').notNull(),
    /** 'authorized' | 'completed' | 'cancelled' */
    status: text('status').notNull().default('authorized'),
    /** 'drop_off' (goods in hand — refund immediately) | 'pickup' */
    fulfillment: text('fulfillment').notNull().default('drop_off'),
    /** 'original' | 'store_credit' — captured at authorization. */
    refundMethod: text('refund_method').notNull().default('original'),
    /** Total to refund, computed from the lines at authorization. */
    amountCents: integer('amount_cents').notNull(),
    reason: text('reason'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    authorizedAt: timestamp('authorized_at', { withTimezone: true }).notNull().defaultNow(),
    goodsReceivedAt: timestamp('goods_received_at', { withTimezone: true }),
    receivedByUserId: uuid('received_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledByUserId: uuid('cancelled_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    cancelReason: text('cancel_reason'),
  },
  (t) => ({
    businessIdx: index('order_returns_business_id_idx').on(t.businessId),
    statusIdx: index('order_returns_status_idx').on(t.businessId, t.status),
    orderIdx: index('order_returns_order_id_idx').on(t.orderId),
  }),
);

export const orderReturnLines = pgTable(
  'order_return_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    returnId: uuid('return_id')
      .notNull()
      .references(() => orderReturns.id, { onDelete: 'cascade' }),
    orderLineId: uuid('order_line_id')
      .notNull()
      .references(() => orderLines.id, { onDelete: 'restrict' }),
    quantity: integer('quantity').notNull(),
    /** What the customer paid per unit (line total + tax share). */
    perUnitCents: integer('per_unit_cents').notNull(),
    /** Coded return reason (class `return`); text is the A9 fallback. */
    reasonCodeId: uuid('reason_code_id').references(() => reasonCodes.id, {
      onDelete: 'set null',
    }),
    reason: text('reason'),
  },
  (t) => ({
    businessIdx: index('order_return_lines_business_id_idx').on(t.businessId),
    returnIdx: index('order_return_lines_return_id_idx').on(t.returnId),
    orderLineIdx: index('order_return_lines_order_line_id_idx').on(t.orderLineId),
    quantityPositive: check('order_return_lines_quantity_positive', sql`${t.quantity} > 0`),
  }),
);
