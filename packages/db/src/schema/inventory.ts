import { index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';
import { locations } from './tenancy';
import { productVariants } from './catalog';

// Snapshot of stock per (variant, location). Updated transactionally alongside
// movements; movements are the source of truth.
export const inventoryLevels = pgTable(
  'inventory_levels',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    onHand: integer('on_hand').notNull().default(0),
    reserved: integer('reserved').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    variantLocationUnique: uniqueIndex('inventory_levels_variant_location_uniq').on(
      t.variantId,
      t.locationId,
    ),
    businessIdx: index('inventory_levels_business_id_idx').on(t.businessId),
  }),
);

// Append-only ledger. on_hand on inventory_levels is derived from these.
export const inventoryMovements = pgTable(
  'inventory_movements',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    delta: integer('delta').notNull(),
    // 'sale' | 'return' | 'adjustment' | 'receive' | 'transfer'
    reason: text('reason').notNull(),
    referenceType: text('reference_type'),
    referenceId: uuid('reference_id'),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('inventory_movements_business_id_idx').on(t.businessId),
    variantIdx: index('inventory_movements_variant_id_idx').on(t.variantId),
    locationIdx: index('inventory_movements_location_id_idx').on(t.locationId),
    referenceIdx: index('inventory_movements_reference_idx').on(t.referenceType, t.referenceId),
  }),
);

/**
 * Individually-tracked units (STORIS cutover G7, lean). A serial exists
 * once per physical unit; its status walks in_stock → committed (picked
 * for an order line) → sold (fulfilled), with in_service/returned for
 * the service loop. Only variants of serial-tracked products get rows.
 */
export const serialUnits = pgTable(
  'serial_units',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'restrict' }),
    serial: text('serial').notNull(),
    /** 'in_stock' | 'committed' | 'sold' | 'in_service' | 'returned' */
    status: text('status').notNull().default('in_stock'),
    orderLineId: uuid('order_line_id'),
    customerId: uuid('customer_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessSerialUnique: uniqueIndex('serial_units_business_variant_serial_uniq').on(
      t.businessId,
      t.variantId,
      t.serial,
    ),
    businessIdx: index('serial_units_business_id_idx').on(t.businessId),
    variantIdx: index('serial_units_variant_id_idx').on(t.variantId, t.locationId, t.status),
    orderLineIdx: index('serial_units_order_line_id_idx').on(t.orderLineId),
  }),
);
