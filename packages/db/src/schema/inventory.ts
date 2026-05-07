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
