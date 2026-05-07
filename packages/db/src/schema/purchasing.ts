import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';
import { locations } from './tenancy';
import { productVariants } from './catalog';

/**
 * Suppliers / vendors that the business buys from. Kept lightweight —
 * just enough contact info to write a PO and reorder. Full vendor
 * portals (statements, payment terms, PO emailing) are explicit
 * future work.
 */
export const vendors = pgTable(
  'vendors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    contactName: text('contact_name'),
    email: text('email'),
    phone: text('phone'),
    addressJson: jsonb('address_json'),
    notes: text('notes'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessNameUnique: uniqueIndex('vendors_business_name_uniq').on(t.businessId, t.name),
    businessIdx: index('vendors_business_id_idx').on(t.businessId),
  }),
);

/**
 * Purchase orders. Status lifecycle:
 *   draft → ordered → partially_received → received → closed
 *                  └──────── canceled ───────────┘
 * Receipts against the PO go through inventory_movements with
 * reason='receive_po' and reference_type='purchase_order'.
 */
export const purchaseOrders = pgTable(
  'purchase_orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    vendorId: uuid('vendor_id')
      .notNull()
      .references(() => vendors.id, { onDelete: 'restrict' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'restrict' }),
    number: text('number').notNull(),
    /** 'draft' | 'ordered' | 'partially_received' | 'received' | 'canceled' */
    status: text('status').notNull(),
    expectedAt: timestamp('expected_at', { withTimezone: true }),
    placedAt: timestamp('placed_at', { withTimezone: true }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    subtotalCents: integer('subtotal_cents').notNull().default(0),
    notes: text('notes'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessNumberUnique: uniqueIndex('purchase_orders_business_number_uniq').on(
      t.businessId,
      t.number,
    ),
    vendorIdx: index('purchase_orders_vendor_id_idx').on(t.vendorId),
    locationIdx: index('purchase_orders_location_id_idx').on(t.locationId),
    statusIdx: index('purchase_orders_status_idx').on(t.businessId, t.status),
  }),
);

export const purchaseOrderLines = pgTable(
  'purchase_order_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    purchaseOrderId: uuid('purchase_order_id')
      .notNull()
      .references(() => purchaseOrders.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    quantityOrdered: integer('quantity_ordered').notNull(),
    quantityReceived: integer('quantity_received').notNull().default(0),
    unitCostCents: integer('unit_cost_cents').notNull(),
    lineTotalCents: integer('line_total_cents').notNull(),
  },
  (t) => ({
    poIdx: index('purchase_order_lines_po_id_idx').on(t.purchaseOrderId),
    businessIdx: index('purchase_order_lines_business_id_idx').on(t.businessId),
    variantIdx: index('purchase_order_lines_variant_id_idx').on(t.variantId),
  }),
);
