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
import { citext, inet } from '../types';

// Platform user — a single account spans multiple businesses via `memberships`.
//
// Authentication concerns (password, OAuth credentials, 2FA secret + backup
// codes, email-verification + reset tokens, session tokens) live in dedicated
// tables (`accounts`, `verifications`, `two_factors`, extended `sessions`)
// owned by better-auth. This table holds identity + platform flags only.
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: citext('email').notNull(),
    emailVerified: boolean('email_verified').notNull().default(false),
    name: text('name'),
    image: text('image'),
    isSuperAdmin: boolean('is_super_admin').notNull().default(false),
    twoFactorEnabled: boolean('two_factor_enabled').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    emailUnique: uniqueIndex('users_email_uniq').on(t.email),
  }),
);

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // The opaque token sent in the session cookie. better-auth treats this as
    // the session lookup key, separate from `id`.
    token: text('token').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    ipAddress: inet('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('sessions_user_id_idx').on(t.userId),
    expiresIdx: index('sessions_expires_at_idx').on(t.expiresAt),
    tokenUnique: uniqueIndex('sessions_token_uniq').on(t.token),
  }),
);

export const businesses = pgTable(
  'businesses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    // 'active' | 'suspended' | 'trial' | 'cancelled'
    status: text('status').notNull(),
    plan: text('plan'),
    trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
    /**
     * PLAN §15 account model. 'agency' = a business the platform owner
     * operates directly (LA Mattress): never billed, never read-only,
     * SubscriptionGuard passes it through. 'saas' = a paying tenant on
     * the trial → plan lifecycle.
     */
    accountKind: text('account_kind').notNull().default('saas'),
    // Settings (Epic 1.6). Tax rate is stored in basis points so 250 = 2.5%
    // — keeps math integer and avoids float drift. Locations may override
    // via locations.tax_rate_bps.
    currencyCode: text('currency_code').notNull().default('USD'),
    defaultTaxRateBps: integer('default_tax_rate_bps').notNull().default(0),
    receiptHeader: text('receipt_header'),
    receiptFooter: text('receipt_footer'),
    /**
     * White-label branding: `{ accentColor?, logoUrl?, publicName? }`.
     * accentColor is a #rrggbb hex applied as the app's brand color for
     * this tenant; logoUrl renders in the sidebar; publicName overrides
     * the display name on the shell and printed receipts (the legal
     * `name` stays what invoices and the platform know the business as).
     */
    brandingJson: jsonb('branding_json'),
    /**
     * Operational knobs from PLAN-POS-OPERATIONS: `{ recyclingFeeCents?,
     * invoiceHeaderNote?, invoiceFooterNote?, unlockRoleIds?: string[],
     * deliveryDailyCap?, poReplyTo? }`. One jsonb blob rather than a column
     * per knob — these are admin-edited settings, never queried by value.
     */
    opsSettingsJson: jsonb('ops_settings_json'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    slugUnique: uniqueIndex('businesses_slug_uniq').on(t.slug),
    statusIdx: index('businesses_status_idx').on(t.status),
  }),
);
