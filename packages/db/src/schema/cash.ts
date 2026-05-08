import { index, integer, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';
import { locations } from './tenancy';

/**
 * A cash drawer shift — a cashier opens with an opening float, runs sales,
 * then closes with a counted-cash amount. Expected cash at close is
 * computed as opening_float + sum(cash payments during the shift) and
 * stored at close time so the variance is auditable forever even if the
 * payments table is later reorganized.
 */
export const cashShifts = pgTable(
  'cash_shifts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'restrict' }),
    openedByUserId: uuid('opened_by_user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'set null' }),
    openedAt: timestamp('opened_at', { withTimezone: true }).notNull().defaultNow(),
    openingFloatCents: integer('opening_float_cents').notNull(),
    closedByUserId: uuid('closed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    expectedCashCents: integer('expected_cash_cents'),
    countedCashCents: integer('counted_cash_cents'),
    varianceCents: integer('variance_cents'),
    notes: text('notes'),
  },
  (t) => ({
    businessIdx: index('cash_shifts_business_id_idx').on(t.businessId),
    locationIdx: index('cash_shifts_location_id_idx').on(t.locationId),
    openedIdx: index('cash_shifts_opened_at_idx').on(t.businessId, t.openedAt),
  }),
);
