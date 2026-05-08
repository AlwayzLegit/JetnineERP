import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';
import { locations } from './tenancy';
import { customers } from './customers';
import { productVariants } from './catalog';

export const sales = pgTable(
  'sales',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'restrict' }),
    // Human-friendly: "INV-2026-000123"
    number: text('number').notNull(),
    // 'draft' | 'completed' | 'voided' | 'refunded' | 'partially_refunded'
    status: text('status').notNull(),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    associateUserId: uuid('associate_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    subtotalCents: integer('subtotal_cents').notNull(),
    discountCents: integer('discount_cents').notNull().default(0),
    taxCents: integer('tax_cents').notNull().default(0),
    totalCents: integer('total_cents').notNull(),
    notes: text('notes'),
    completedAt: timestamp('completed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessNumberUnique: uniqueIndex('sales_business_number_uniq').on(t.businessId, t.number),
    businessIdx: index('sales_business_id_idx').on(t.businessId),
    locationIdx: index('sales_location_id_idx').on(t.locationId),
    customerIdx: index('sales_customer_id_idx').on(t.customerId),
    associateIdx: index('sales_associate_user_id_idx').on(t.associateUserId),
    statusIdx: index('sales_status_idx').on(t.businessId, t.status),
  }),
);

export const saleLines = pgTable(
  'sale_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    description: text('description').notNull(),
    quantity: integer('quantity').notNull(),
    unitPriceCents: integer('unit_price_cents').notNull(),
    discountCents: integer('discount_cents').notNull().default(0),
    taxCents: integer('tax_cents').notNull().default(0),
    totalCents: integer('total_cents').notNull(),
  },
  (t) => ({
    saleIdx: index('sale_lines_sale_id_idx').on(t.saleId),
    businessIdx: index('sale_lines_business_id_idx').on(t.businessId),
    variantIdx: index('sale_lines_variant_id_idx').on(t.variantId),
  }),
);

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id, { onDelete: 'cascade' }),
    // 'cash' | 'card' | 'store_credit' | 'gift_card'
    method: text('method').notNull(),
    amountCents: integer('amount_cents').notNull(),
    processor: text('processor'),
    processorRef: text('processor_ref'),
    // 'pending' | 'succeeded' | 'failed' | 'refunded'
    status: text('status').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    saleIdx: index('payments_sale_id_idx').on(t.saleId),
    businessIdx: index('payments_business_id_idx').on(t.businessId),
    processorRefIdx: index('payments_processor_ref_idx').on(t.processor, t.processorRef),
  }),
);

export const refunds = pgTable(
  'refunds',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    saleId: uuid('sale_id')
      .notNull()
      .references(() => sales.id, { onDelete: 'cascade' }),
    reason: text('reason'),
    amountCents: integer('amount_cents').notNull(),
    approvedByUserId: uuid('approved_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    saleIdx: index('refunds_sale_id_idx').on(t.saleId),
    businessIdx: index('refunds_business_id_idx').on(t.businessId),
    approvedIdx: index('refunds_approved_by_user_id_idx').on(t.approvedByUserId),
  }),
);

export const refundLines = pgTable(
  'refund_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    refundId: uuid('refund_id')
      .notNull()
      .references(() => refunds.id, { onDelete: 'cascade' }),
    saleLineId: uuid('sale_line_id')
      .notNull()
      .references(() => saleLines.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'set null' }),
    quantity: integer('quantity').notNull(),
    amountCents: integer('amount_cents').notNull(),
  },
  (t) => ({
    refundIdx: index('refund_lines_refund_id_idx').on(t.refundId),
    businessIdx: index('refund_lines_business_id_idx').on(t.businessId),
    saleLineIdx: index('refund_lines_sale_line_id_idx').on(t.saleLineId),
  }),
);
