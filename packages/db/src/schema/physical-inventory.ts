import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';
import { locations } from './tenancy';
import { productVariants } from './catalog';
import { storageBins } from './inventory';
import { reasonCodes } from './controls';

/**
 * Physical inventory (FAQ pack C1/B16, PHYS-001…PHYS-080, lean).
 *
 * One count covers one location. The freeze snapshots every stock level
 * at that location into count lines; counting fills `counted_qty`;
 * posting writes `physical_count` movements for the accepted variances
 * and flips the levels. **Soft freeze**: the store keeps selling during
 * the count — post-freeze activity is measured from the movements ledger
 * between `frozen_at` and posting, and the variance math nets it out, so
 * a sale made mid-count is not double-deducted.
 *
 *   open (frozen) → counting → posted
 *                       ↘ cancelled
 */
export const physicalCounts = pgTable(
  'physical_counts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    // 'open' | 'counting' | 'posted' | 'cancelled'
    status: text('status').notNull().default('open'),
    countDate: date('count_date').notNull(),
    frozenAt: timestamp('frozen_at', { withTimezone: true }).notNull().defaultNow(),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    postedByUserId: uuid('posted_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('physical_counts_business_id_idx').on(t.businessId),
    locationIdx: index('physical_counts_location_id_idx').on(t.locationId),
  }),
);

export const physicalCountLines = pgTable(
  'physical_count_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    countId: uuid('count_id')
      .notNull()
      .references(() => physicalCounts.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id')
      .notNull()
      .references(() => productVariants.id, { onDelete: 'cascade' }),
    /** Bin the stock sat in at freeze time — the count-sheet walking order. */
    storageBinId: uuid('storage_bin_id').references(() => storageBins.id, {
      onDelete: 'set null',
    }),
    /** Immutable snapshot at freeze. */
    frozenQty: integer('frozen_qty').notNull(),
    frozenReserved: integer('frozen_reserved').notNull().default(0),
    /** Null until someone counts the line. */
    countedQty: integer('counted_qty'),
    countedByUserId: uuid('counted_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    countedAt: timestamp('counted_at', { withTimezone: true }),
    /** Coded reason required to post a non-zero variance (class physical_variance). */
    reasonCodeId: uuid('reason_code_id').references(() => reasonCodes.id, {
      onDelete: 'set null',
    }),
    /** The variance actually posted (counted − frozen − post-freeze delta). */
    postedVariance: integer('posted_variance'),
  },
  (t) => ({
    countVariantUnique: uniqueIndex('physical_count_lines_count_variant_uniq').on(
      t.countId,
      t.variantId,
    ),
    businessIdx: index('physical_count_lines_business_id_idx').on(t.businessId),
    countIdx: index('physical_count_lines_count_id_idx').on(t.countId),
  }),
);
