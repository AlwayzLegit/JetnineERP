// Auth tables managed by better-auth. Field names are camelCase (Drizzle JS
// keys) and resolve to snake_case columns; the better-auth Drizzle adapter
// looks up fields by JS key.
import { boolean, index, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { users } from './platform';

// Credentials per (provider, user). For email/password sign-in this row
// stores the password hash; for OAuth providers it stores tokens.
export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    userIdx: index('accounts_user_id_idx').on(t.userId),
    providerAccountUnique: uniqueIndex('accounts_provider_account_uniq').on(
      t.providerId,
      t.accountId,
    ),
  }),
);

// Short-lived tokens for email verification and password reset. better-auth
// inserts a row keyed by `identifier` (email) and `value` (token), checks
// `expiresAt`, then deletes on consumption.
export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    identifierIdx: index('verifications_identifier_idx').on(t.identifier),
    expiresIdx: index('verifications_expires_at_idx').on(t.expiresAt),
  }),
);

// TOTP enrolment per user (singular row at a time today; better-auth's
// model name is `twoFactor`, plural here matches the rest of our schema).
export const twoFactors = pgTable(
  'two_factors',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    secret: text('secret').notNull(),
    backupCodes: text('backup_codes').notNull(),
    verified: boolean('verified').notNull().default(true),
  },
  (t) => ({
    userIdx: index('two_factors_user_id_idx').on(t.userId),
  }),
);
