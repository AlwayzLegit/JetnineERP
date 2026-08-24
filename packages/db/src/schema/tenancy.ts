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
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('locations_business_id_idx').on(t.businessId),
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
