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
import { locations } from './tenancy';

/**
 * Tax classes let merchants override the location/business default
 * tax rate at the product level — common cases are groceries
 * (exempt), prepared food (higher rate), and clothing (state-
 * specific). At sale time, a line uses its product's tax class
 * `rate_bps` if set; otherwise it falls back to the location/
 * business default that's already in place.
 *
 * `rate_bps` here is the *fallback* rate when a per-location
 * override hasn't been configured. For multi-location merchants
 * that need different rates by jurisdiction (e.g. Apparel: 0% in
 * NJ, 8% in NY), `tax_class_rates` carries the per-location rate
 * and shadows this default.
 */
export const taxClasses = pgTable(
  'tax_classes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    /** Fallback rate in basis points. 0 = exempt, 875 = 8.75%. */
    rateBps: integer('rate_bps').notNull(),
    /**
     * One class per business may be flagged as the default. We don't
     * enforce uniqueness in the DB (multiple defaults aren't a data
     * corruption hazard, and merchants sometimes want to "promote" a
     * second one before retiring the first); the controller picks
     * the most recently updated default if there's ever a tie.
     */
    isDefault: boolean('is_default').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessNameUnique: uniqueIndex('tax_classes_business_name_uniq').on(t.businessId, t.name),
    businessIdx: index('tax_classes_business_id_idx').on(t.businessId),
  }),
);

/**
 * Per-location override for a tax class. When a sale line resolves
 * its tax rate, the lookup order is:
 *
 *   1. tax_class_rates row matching (line's tax_class, sale's location)
 *   2. tax_classes.rate_bps (the class's fallback)
 *   3. locations.tax_rate_bps
 *   4. businesses.default_tax_rate_bps
 *
 * The unique constraint on `(tax_class_id, location_id)` keeps the
 * lookup deterministic. Both columns cascade on parent delete so a
 * retired location or class can't leave orphan overrides.
 */
export const taxClassRates = pgTable(
  'tax_class_rates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    taxClassId: uuid('tax_class_id')
      .notNull()
      .references(() => taxClasses.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    rateBps: integer('rate_bps').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    classLocationUnique: uniqueIndex('tax_class_rates_class_location_uniq').on(
      t.taxClassId,
      t.locationId,
    ),
    businessIdx: index('tax_class_rates_business_id_idx').on(t.businessId),
    classIdx: index('tax_class_rates_class_id_idx').on(t.taxClassId),
    locationIdx: index('tax_class_rates_location_id_idx').on(t.locationId),
  }),
);
