import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { businesses } from './platform';

/**
 * Nightly batch run log (EOD-001 → sysadmin pack JOB-002).
 *
 * STORIS's Generate Daily Reports is 48 undeclared steps where reporting
 * and destructive updates are fused, catch-up runs collapse missed days
 * onto one date, and the operator cannot see the list. Ours is the
 * opposite: every step is a registered job with a declared order and a
 * destructive flag, every (business, job, business date) runs at most
 * once, a catch-up runs one pass per missed date, and this table is the
 * morning run report — status, duration, records affected, error.
 */
export const jobRuns = pgTable(
  'job_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    /** Registered job id, e.g. 'auto_replenishment'. */
    jobId: text('job_id').notNull(),
    /** The business date this pass processed — never wall-clock. */
    businessDate: date('business_date').notNull(),
    /** 'succeeded' | 'failed' | 'skipped' */
    status: text('status').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
    finishedAt: timestamp('finished_at', { withTimezone: true }),
    durationMs: integer('duration_ms'),
    recordsAffected: integer('records_affected').notNull().default(0),
    detailJson: text('detail_json'),
    error: text('error'),
  },
  (t) => ({
    onePerDay: uniqueIndex('job_runs_business_job_date_uniq').on(
      t.businessId,
      t.jobId,
      t.businessDate,
    ),
    businessIdx: index('job_runs_business_id_idx').on(t.businessId),
    dateIdx: index('job_runs_date_idx').on(t.businessId, t.businessDate),
  }),
);
