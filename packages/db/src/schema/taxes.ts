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

/**
 * Tax classes let merchants override the location/business default
 * tax rate at the product level — common cases are groceries
 * (exempt), prepared food (higher rate), and clothing (state-
 * specific). At sale time, a line uses its product's tax class
 * `rate_bps` if set; otherwise it falls back to the location/
 * business default that's already in place.
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
    /** Rate in basis points. 0 = exempt, 875 = 8.75%. */
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
