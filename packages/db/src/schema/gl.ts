import {
  boolean,
  check,
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { businesses, users } from './platform';

/**
 * In-house general ledger (owner decision 2026-08-28, run-01 GAP §6:
 * option (b) full GL). Slice 1: chart of accounts, fiscal periods with
 * STORIS-style cascade close/reopen and the period-13 year latch, and
 * balanced journal batches.
 *
 * Two STORIS flaws are deliberately NOT copied (run-01 batch 1):
 * - F1's silent default account: Jetnine has no fall-through — a
 *   posting that cannot name its account is refused, never defaulted.
 * - F17's conventional references: `source_type`/`source_id` are typed
 *   columns, mandatory on every derived batch, so the trail from a
 *   posting back to its operational document is structural.
 */

export const glAccounts = pgTable(
  'gl_accounts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    /** Numeric-ish code, e.g. "1200". Unique per business, immutable. */
    code: text('code').notNull(),
    name: text('name').notNull(),
    /** 'asset' | 'liability' | 'equity' | 'revenue' | 'expense' */
    accountType: text('account_type').notNull(),
    /**
     * Non-null marks a system account the journal-event derivation
     * posts to (e.g. 'sales_revenue', 'inventory', 'cogs',
     * 'deposit_liability'). One account per key per business; the
     * derivation REFUSES to post when a key it needs is unmapped.
     */
    systemKey: text('system_key'),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessCodeUnique: uniqueIndex('gl_accounts_business_code_uniq').on(t.businessId, t.code),
    businessSystemKeyUnique: uniqueIndex('gl_accounts_business_system_key_uniq').on(
      t.businessId,
      t.systemKey,
    ),
    businessIdx: index('gl_accounts_business_id_idx').on(t.businessId),
  }),
);

/**
 * Fiscal periods: calendar months (presumed pending the owner's fiscal
 * calendar answer — GAP Q4) numbered 1-12, plus period 13 for year-end
 * adjustments. Closing period N closes all prior open periods;
 * reopening N reopens all subsequent closed ones (batch-1 F4/F5, both
 * warned client-side). The year is closed only when period 13 closes
 * (F6). Rows are created lazily the first time a year is touched.
 */
export const glPeriods = pgTable(
  'gl_periods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    fiscalYear: integer('fiscal_year').notNull(),
    /** 1-12 calendar months; 13 = year-end adjustment period. */
    period: integer('period').notNull(),
    /** 'open' | 'closed' */
    status: text('status').notNull().default('open'),
    closedAt: timestamp('closed_at', { withTimezone: true }),
    closedByUserId: uuid('closed_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
  },
  (t) => ({
    businessYearPeriodUnique: uniqueIndex('gl_periods_business_year_period_uniq').on(
      t.businessId,
      t.fiscalYear,
      t.period,
    ),
    businessIdx: index('gl_periods_business_id_idx').on(t.businessId),
    periodRange: check('gl_periods_period_range', sql`${t.period} BETWEEN 1 AND 13`),
  }),
);

/**
 * A journal batch: draft until posted; posting requires balanced lines
 * and an open period. Derived batches (batch_type 'derived') carry a
 * mandatory typed source reference and are append-only — corrections
 * are new batches, never edits to posted ones.
 */
export const glJournalBatches = pgTable(
  'gl_journal_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    number: text('number').notNull(),
    /** 'draft' | 'posted' */
    status: text('status').notNull().default('draft'),
    /** 'manual' | 'derived' | 'year_end' */
    batchType: text('batch_type').notNull().default('manual'),
    /** Typed source pointer — mandatory when batch_type = 'derived'. */
    sourceType: text('source_type'),
    sourceId: uuid('source_id'),
    /** The accounting date; decides fiscal year + period. */
    businessDate: date('business_date').notNull(),
    fiscalYear: integer('fiscal_year').notNull(),
    period: integer('period').notNull(),
    memo: text('memo'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    postedAt: timestamp('posted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessNumberUnique: uniqueIndex('gl_journal_batches_business_number_uniq').on(
      t.businessId,
      t.number,
    ),
    businessIdx: index('gl_journal_batches_business_id_idx').on(t.businessId),
    statusIdx: index('gl_journal_batches_status_idx').on(t.businessId, t.status),
    periodIdx: index('gl_journal_batches_period_idx').on(t.businessId, t.fiscalYear, t.period),
    sourceIdx: index('gl_journal_batches_source_idx').on(t.sourceType, t.sourceId),
    derivedHasSource: check(
      'gl_journal_batches_derived_source_chk',
      sql`batch_type <> 'derived' OR (source_type IS NOT NULL AND source_id IS NOT NULL)`,
    ),
  }),
);

export const glJournalLines = pgTable(
  'gl_journal_lines',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => glJournalBatches.id, { onDelete: 'cascade' }),
    accountId: uuid('account_id')
      .notNull()
      .references(() => glAccounts.id, { onDelete: 'restrict' }),
    memo: text('memo'),
    debitCents: integer('debit_cents').notNull().default(0),
    creditCents: integer('credit_cents').notNull().default(0),
  },
  (t) => ({
    batchIdx: index('gl_journal_lines_batch_id_idx').on(t.batchId),
    accountIdx: index('gl_journal_lines_account_id_idx').on(t.accountId),
    businessIdx: index('gl_journal_lines_business_id_idx').on(t.businessId),
    // Exactly one side, strictly positive — a line is a debit XOR a credit.
    oneSided: check(
      'gl_journal_lines_one_sided_chk',
      sql`(debit_cents > 0 AND credit_cents = 0) OR (credit_cents > 0 AND debit_cents = 0)`,
    ),
  }),
);
