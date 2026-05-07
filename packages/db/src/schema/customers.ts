import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses } from './platform';
import { citext } from '../types';

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    email: citext('email'),
    phone: text('phone'),
    firstName: text('first_name'),
    lastName: text('last_name'),
    addressesJson: jsonb('addresses_json'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('customers_business_id_idx').on(t.businessId),
    emailIdx: index('customers_business_email_idx').on(t.businessId, t.email),
    phoneIdx: index('customers_business_phone_idx').on(t.businessId, t.phone),
  }),
);
