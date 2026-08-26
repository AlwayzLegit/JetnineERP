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
import { businesses, users } from './platform';

/**
 * Reason Code registry (PLAN-STORIS-GAP §0.2, STORIS "Reason Code
 * Settings"). Every reason prompt in the system draws from this table,
 * filtered by usage class — free text is only a transitional fallback
 * while a business has no active codes for a class. `isRestricted`
 * mirrors STORIS "As-Is Restricted": assigning or clearing a restricted
 * code needs the gating permission or a security override.
 */
export const reasonCodes = pgTable(
  'reason_codes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    description: text('description').notNull(),
    /**
     * Where the code is legal: 'exception' | 'as_is' | 'return' |
     * 'adjustment' | 'delivery_failure' | 'manifest_removal' |
     * 'inventory_adjustment' | 'transfer_variance' | 'write_off'.
     * (Catalog lives in @jetnine/shared REASON_USAGE_CLASSES.)
     */
    usageClass: text('usage_class').notNull(),
    isRestricted: boolean('is_restricted').notNull().default(false),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('reason_codes_business_id_idx').on(t.businessId),
    classIdx: index('reason_codes_class_idx').on(t.businessId, t.usageClass, t.active),
    codeUnique: uniqueIndex('reason_codes_business_class_code_uniq').on(
      t.businessId,
      t.usageClass,
      t.code,
    ),
  }),
);

/**
 * Security override register (PLAN-STORIS-GAP §0.1, STORIS "Security
 * Override Screen"): when a user without a permission performs a gated
 * action under a second, authorized user's credentials, the override is
 * stamped here with both identities, the reason code, and the before/
 * after of what changed. Reportable — this is the POS exception file,
 * not a log line.
 */
export const securityOverrides = pgTable(
  'security_overrides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    authorizingUserId: uuid('authorizing_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    /** The permission the actor lacked (from the shared catalog). */
    permission: text('permission').notNull(),
    /** Human description of the gated action, shown on the override screen. */
    action: text('action').notNull(),
    entityType: text('entity_type'),
    entityId: uuid('entity_id'),
    reasonCodeId: uuid('reason_code_id').references(() => reasonCodes.id, {
      onDelete: 'set null',
    }),
    /** Free-text fallback while the business has no exception codes. */
    reason: text('reason'),
    beforeJson: jsonb('before_json'),
    afterJson: jsonb('after_json'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('security_overrides_business_id_idx').on(t.businessId),
    createdIdx: index('security_overrides_created_idx').on(t.businessId, t.createdAt),
    actorIdx: index('security_overrides_actor_idx').on(t.businessId, t.actorUserId),
  }),
);

/**
 * Exception register (PLAN-STORIS-GAP §0.3): the reportable file the
 * owner actually works — severity, type, actor, acknowledged state —
 * not a scrolling feed. Overrides, unlocks, cap overrides, write-offs
 * and (with G6) threshold breaches all land here; the per-associate
 * ranked digest reads from it.
 */
export const exceptionEvents = pgTable(
  'exception_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    /** 'security_override' | 'order_unlock' | 'delivery_cap_override' | 'write_off' | 'return_cancel' | … */
    type: text('type').notNull(),
    /** 'info' | 'warning' | 'critical' */
    severity: text('severity').notNull().default('warning'),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    entityType: text('entity_type'),
    entityId: uuid('entity_id'),
    summary: text('summary').notNull(),
    metadataJson: jsonb('metadata_json'),
    acknowledgedAt: timestamp('acknowledged_at', { withTimezone: true }),
    acknowledgedByUserId: uuid('acknowledged_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('exception_events_business_id_idx').on(t.businessId),
    openIdx: index('exception_events_open_idx').on(t.businessId, t.acknowledgedAt, t.createdAt),
    actorIdx: index('exception_events_actor_idx').on(t.businessId, t.actorUserId, t.createdAt),
    typeIdx: index('exception_events_type_idx').on(t.businessId, t.type),
  }),
);

/**
 * Daily close-out runs (PLAN-POS-OPERATIONS §12 / P9): the 22:00 job
 * per store. Never blocks — it flags. One row per location per local
 * date is the idempotency key; the summary keeps what was flagged.
 */
export const dailyCloseouts = pgTable(
  'daily_closeouts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id').notNull(),
    /** The store-local calendar date the close covers (YYYY-MM-DD). */
    closeDate: text('close_date').notNull(),
    ranAt: timestamp('ran_at', { withTimezone: true }).notNull().defaultNow(),
    /** 'scheduler' | 'manual' */
    trigger: text('trigger').notNull().default('scheduler'),
    exceptionCount: integer('exception_count').notNull().default(0),
    stockReleasedCount: integer('stock_released_count').notNull().default(0),
    summaryJson: jsonb('summary_json'),
  },
  (t) => ({
    businessIdx: index('daily_closeouts_business_id_idx').on(t.businessId),
    dateIdx: index('daily_closeouts_date_idx').on(t.businessId, t.closeDate),
    locationDateUnique: uniqueIndex('daily_closeouts_location_date_uniq').on(
      t.locationId,
      t.closeDate,
    ),
  }),
);
