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
import { businesses } from './platform';

/**
 * Outbound webhook endpoints. Merchants configure URLs that receive
 * signed POSTs whenever their business produces an event they've
 * subscribed to. The `secret` is shown to the merchant exactly once
 * at create time; we store it server-side to sign the body.
 *
 * `events` is an array of event-type strings (e.g. 'sale.created');
 * the literal '*' matches every event type. Subscriptions outside
 * the documented set are silently ignored.
 */
export const webhookEndpoints = pgTable(
  'webhook_endpoints',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    secret: text('secret').notNull(),
    description: text('description'),
    events: jsonb('events').$type<string[]>().notNull(),
    isActive: boolean('is_active').notNull().default(true),
    /** Cached counters to surface health on the UI without a join. */
    consecutiveFailures: integer('consecutive_failures').notNull().default(0),
    totalDeliveries: integer('total_deliveries').notNull().default(0),
    lastSuccessAt: timestamp('last_success_at', { withTimezone: true }),
    lastFailureAt: timestamp('last_failure_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessUrlUnique: uniqueIndex('webhook_endpoints_business_url_uniq').on(t.businessId, t.url),
    businessIdx: index('webhook_endpoints_business_id_idx').on(t.businessId),
  }),
);

/**
 * One row per attempted delivery. Persisted forever so merchants can
 * inspect history; older rows can be aged out by an offline sweep
 * (Phase 3). Each emitted event has a single `event_id` UUID that's
 * shared across all endpoints subscribed to it, so consumers can
 * dedupe across multiple webhook configurations or replays.
 */
export const webhookDeliveries = pgTable(
  'webhook_deliveries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    endpointId: uuid('endpoint_id')
      .notNull()
      .references(() => webhookEndpoints.id, { onDelete: 'cascade' }),
    eventId: uuid('event_id').notNull(),
    eventType: text('event_type').notNull(),
    payloadJson: jsonb('payload_json').notNull(),
    /** 'pending' | 'succeeded' | 'failed' */
    status: text('status').notNull(),
    attempts: integer('attempts').notNull().default(0),
    responseStatus: integer('response_status'),
    /** Truncated to 8KB for storage sanity. */
    responseBody: text('response_body'),
    errorMessage: text('error_message'),
    lastAttemptAt: timestamp('last_attempt_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    endpointIdx: index('webhook_deliveries_endpoint_id_idx').on(t.endpointId),
    businessIdx: index('webhook_deliveries_business_id_idx').on(t.businessId),
    eventIdx: index('webhook_deliveries_event_id_idx').on(t.eventId),
    createdIdx: index('webhook_deliveries_created_at_idx').on(t.createdAt),
  }),
);
