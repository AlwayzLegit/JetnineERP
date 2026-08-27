import {
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { businesses, users } from './platform';
import { locations } from './tenancy';
import { productVariants } from './catalog';
import { reasonCodes } from './controls';
import { orders } from './orders';

/**
 * Stock transfers move inventory between two of the business's own
 * locations. Lifecycle:
 *   draft → in_transit → received
 *                    ├── closed_short (G8: variance write-off)
 *                    └── canceled
 *
 * Shipping deducts inventory at the origin (`reason='transfer_out'`,
 * `reference_type='stock_transfer'`); receiving credits the destination
 * (`reason='transfer_in'`). Partial receipts are supported — the
 * transfer auto-flips to `received` once every line's
 * `quantity_received` matches the shipped quantity.
 */
export const stockTransfers = pgTable(
  'stock_transfers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    fromLocationId: uuid('from_location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'restrict' }),
    toLocationId: uuid('to_location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'restrict' }),
    number: text('number').notNull(),
    /** 'draft' | 'in_transit' | 'received' | 'closed_short' | 'canceled' */
    status: text('status').notNull(),
    /**
     * G8 (STORIS transfer types): 'replenishment' | 'floor_sample' |
     * 'customer' | 'as_is' | 'auto' — a floor model moved to a store is
     * not silently sellable as new. 'auto' (XFR-051) is generated from a
     * sales-order shortfall and released manually.
     */
    transferType: text('transfer_type').notNull().default('replenishment'),
    /** XFR-053: the calculated auto-transfer date (auto transfers only). */
    scheduledFor: date('scheduled_for'),
    /** The sales order whose shortfall generated this auto transfer. */
    orderId: uuid('order_id').references(() => orders.id, { onDelete: 'set null' }),
    /** G8: coded reason (class `transfer_variance`) on a short close. */
    varianceReasonCodeId: uuid('variance_reason_code_id').references(() => reasonCodes.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    shippedAt: timestamp('shipped_at', { withTimezone: true }),
    receivedAt: timestamp('received_at', { withTimezone: true }),
    canceledAt: timestamp('canceled_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessNumberUnique: uniqueIndex('stock_transfers_business_number_uniq').on(
      t.businessId,
      t.number,
    ),
    statusIdx: index('stock_transfers_status_idx').on(t.businessId, t.status),
    fromIdx: index('stock_transfers_from_location_id_idx').on(t.fromLocationId),
    toIdx: index('stock_transfers_to_location_id_idx').on(t.toLocationId),
    distinctLocations: check(
      'stock_transfers_distinct_locations_chk',
      sql`from_location_id <> to_location_id`,
    ),
  }),
);

export const stockTransferLines = pgTable(
  'stock_transfer_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    transferId: uuid('transfer_id')
      .notNull()
      .references(() => stockTransfers.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'restrict' }),
    quantityShipped: integer('quantity_shipped').notNull(),
    quantityReceived: integer('quantity_received').notNull().default(0),
    /**
     * FIFO cost carried across the transfer: the weighted unit cost of
     * the origin layers consumed at ship time. Receiving creates the
     * destination layer at this cost. Null on transfers shipped before
     * costing existed — receive falls back to the variant catalog cost.
     */
    unitCostCents: integer('unit_cost_cents'),
    /**
     * J3 (XFR-040): the specific serial pieces riding this line (array
     * of serial_units ids, ≤ quantity_shipped). Ship flags them
     * in_transit; receive re-homes them at the destination.
     */
    serialIdsJson: jsonb('serial_ids_json'),
  },
  (t) => ({
    transferIdx: index('stock_transfer_lines_transfer_id_idx').on(t.transferId),
    businessIdx: index('stock_transfer_lines_business_id_idx').on(t.businessId),
    variantIdx: index('stock_transfer_lines_variant_id_idx').on(t.variantId),
  }),
);
