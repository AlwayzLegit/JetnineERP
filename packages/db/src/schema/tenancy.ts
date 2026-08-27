import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';

export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    timezone: text('timezone').notNull(),
    addressJson: jsonb('address_json'),
    // Optional override of businesses.default_tax_rate_bps. Null inherits.
    taxRateBps: integer('tax_rate_bps'),
    /**
     * Store code for order numbering (PLAN-POS-OPERATIONS §1): orders at
     * this location number as `{PREFIX}-{sequence}` from the location's own
     * counter in `order_sequences`. NULL = location still numbers from the
     * legacy per-business SO-YYYY sequence.
     */
    orderPrefix: text('order_prefix'),
    /**
     * J5 (CFG-LOC-REPLDAYS): weekdays (0=Sun … 6=Sat) on which this
     * location accepts auto replenishment transfers. Null = every day;
     * an explicit empty array disables auto transfers INTO this location.
     */
    replenishmentDaysJson: jsonb('replenishment_days_json'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('locations_business_id_idx').on(t.businessId),
    orderPrefixUnique: uniqueIndex('locations_business_order_prefix_uniq').on(
      t.businessId,
      t.orderPrefix,
    ),
  }),
);

/**
 * Per-store order-number counters (PLAN-POS-OPERATIONS §1). One row per
 * location, `next_value` is claimed with an atomic UPDATE ... RETURNING so
 * concurrent sales at the same store never collide.
 */
export const orderSequences = pgTable(
  'order_sequences',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    nextValue: integer('next_value').notNull().default(10001),
  },
  (t) => ({
    locationUnique: uniqueIndex('order_sequences_location_uniq').on(t.locationId),
    businessIdx: index('order_sequences_business_id_idx').on(t.businessId),
  }),
);

export const roles = pgTable(
  'roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    isSystem: boolean('is_system').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessNameUnique: uniqueIndex('roles_business_name_uniq').on(t.businessId, t.name),
    businessIdx: index('roles_business_id_idx').on(t.businessId),
  }),
);

export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    permission: text('permission').notNull(),
    constraintsJson: jsonb('constraints_json'),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.roleId, t.permission] }),
    roleIdx: index('role_permissions_role_id_idx').on(t.roleId),
  }),
);

export const memberships = pgTable(
  'memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),
    /** G5: which commission plan pays this member; null = no commission. */
    commissionPlanId: uuid('commission_plan_id'),
    // 'active' | 'invited' | 'disabled'
    status: text('status').notNull(),
    invitedByUserId: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
    invitedAt: timestamp('invited_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessUserUnique: uniqueIndex('memberships_business_user_uniq').on(t.businessId, t.userId),
    businessIdx: index('memberships_business_id_idx').on(t.businessId),
    userIdx: index('memberships_user_id_idx').on(t.userId),
    roleIdx: index('memberships_role_id_idx').on(t.roleId),
  }),
);

export const membershipLocationScopes = pgTable(
  'membership_location_scopes',
  {
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => memberships.id, { onDelete: 'cascade' }),
    locationId: uuid('location_id')
      .notNull()
      .references(() => locations.id, { onDelete: 'cascade' }),
    // Denormalized so RLS policies can match without an extra join.
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.membershipId, t.locationId] }),
    locationIdx: index('membership_location_scopes_location_idx').on(t.locationId),
    businessIdx: index('membership_location_scopes_business_idx').on(t.businessId),
  }),
);

/**
 * Per-user permission adjustments on top of role defaults
 * (PLAN-POS-OPERATIONS §2): creating a user copies nothing — the guard
 * reads role permissions, then applies these rows (allowed=true grants a
 * permission the role lacks, allowed=false revokes one it has).
 */
export const membershipPermissionOverrides = pgTable(
  'membership_permission_overrides',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => memberships.id, { onDelete: 'cascade' }),
    permission: text('permission').notNull(),
    allowed: boolean('allowed').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    memberPermUnique: uniqueIndex('membership_permission_overrides_uniq').on(
      t.membershipId,
      t.permission,
    ),
    businessIdx: index('membership_permission_overrides_business_idx').on(t.businessId),
  }),
);
