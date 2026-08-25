import { index, integer, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';

/**
 * Marketing: saved audience segments + one-shot email campaigns.
 *
 * A segment is a stored filter, not a stored member list — membership
 * is resolved at preview/send time so it always reflects the current
 * customer base. `filter_json`: `{ tagIds?: string[], sinceDays?: n }`
 * — customers carrying ANY of the tags (or all customers when no tags),
 * optionally restricted to those created in the last `sinceDays` days.
 * Only customers with an email address ever receive anything.
 */
export const customerSegments = pgTable(
  'customer_segments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    filterJson: jsonb('filter_json').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('customer_segments_business_id_idx').on(t.businessId),
  }),
);

export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    segmentId: uuid('segment_id')
      .notNull()
      .references(() => customerSegments.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    subject: text('subject').notNull(),
    /** Plain-text body; rendered into a minimal HTML wrapper at send. */
    bodyText: text('body_text').notNull(),
    /** 'draft' | 'sent' */
    status: text('status').notNull().default('draft'),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    sentByUserId: uuid('sent_by_user_id').references(() => users.id, { onDelete: 'set null' }),
    recipientCount: integer('recipient_count'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('campaigns_business_id_idx').on(t.businessId),
    segmentIdx: index('campaigns_segment_id_idx').on(t.segmentId),
  }),
);
