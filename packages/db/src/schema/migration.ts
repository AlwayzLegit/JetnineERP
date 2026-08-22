import {
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
 * The STORIS migration's identity map (sprint decision D7). Every record
 * we import records the legacy system's key alongside the Jetnine id it
 * became, so the whole pipeline is an idempotent upsert: re-running an
 * import (two rehearsals + the final delta) updates the same rows instead
 * of duplicating them.
 *
 * `entity` is the logical target ('customer', 'product', 'order', …) and
 * `legacy_id` is whatever STORIS called it — an account number, a SKU, an
 * order number. Uniqueness is per business so the throwaway rehearsal
 * tenant and the production tenant can hold the same legacy ids.
 */
export const legacyRefs = pgTable(
  'legacy_refs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    entity: text('entity').notNull(),
    legacyId: text('legacy_id').notNull(),
    jetnineId: uuid('jetnine_id').notNull(),
    // Where this mapping came from: the source system name and, once the
    // importer runs in batches, the batch that wrote it.
    source: text('source').notNull().default('storis'),
    importBatchId: uuid('import_batch_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    entityLegacyUnique: uniqueIndex('legacy_refs_business_entity_legacy_uniq').on(
      t.businessId,
      t.entity,
      t.legacyId,
    ),
    // Reverse lookup: "what legacy record did this order come from?"
    jetnineIdx: index('legacy_refs_business_entity_jetnine_idx').on(
      t.businessId,
      t.entity,
      t.jetnineId,
    ),
    businessIdx: index('legacy_refs_business_id_idx').on(t.businessId),
  }),
);

/**
 * Staging for the import pipeline (§7): one batch per uploaded CSV.
 *
 * The pipeline is upload → stage → map → validate → commit → reconcile,
 * and a batch carries its state through all of it. Raw rows are kept
 * after commit so a reconciliation mismatch can be traced back to the
 * exact source line.
 *
 * Deviation from the plan's `staging.*` sketch: these live in the public
 * schema as ordinary tenant tables so they inherit the same RLS policy,
 * `business_id` indexing, and migration tooling as everything else. A
 * separate Postgres schema would need its own grants and policy wiring
 * for no gain.
 */
export const importBatches = pgTable(
  'import_batches',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    // Logical target entity — matches `legacy_refs.entity`.
    entity: text('entity').notNull(),
    source: text('source').notNull().default('storis'),
    filename: text('filename'),
    /** 'uploaded' | 'mapped' | 'validated' | 'committed' | 'failed' */
    status: text('status').notNull().default('uploaded'),
    // Column → field mapping plus per-field value transforms, authored in
    // the import wizard and replayed verbatim on the delta run.
    mappingJson: jsonb('mapping_json'),
    // Human-readable validation output: missing FKs, bad money, duplicate
    // legacy ids, unknown SKUs.
    validationJson: jsonb('validation_json'),
    rowCount: integer('row_count').notNull().default(0),
    validRowCount: integer('valid_row_count').notNull().default(0),
    invalidRowCount: integer('invalid_row_count').notNull().default(0),
    committedRowCount: integer('committed_row_count').notNull().default(0),
    uploadedByUserId: uuid('uploaded_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    validatedAt: timestamp('validated_at', { withTimezone: true }),
    committedAt: timestamp('committed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('import_batches_business_id_idx').on(t.businessId),
    entityIdx: index('import_batches_business_entity_idx').on(t.businessId, t.entity),
    statusIdx: index('import_batches_status_idx').on(t.businessId, t.status),
  }),
);

/**
 * One staged source row. `raw_json` is the CSV line as parsed (strings,
 * original headers); `normalized_json` is what the mapping produced and
 * what commit actually writes. Keeping both is what makes a validation
 * failure fixable without re-uploading.
 */
export const importRows = pgTable(
  'import_rows',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    batchId: uuid('batch_id')
      .notNull()
      .references(() => importBatches.id, { onDelete: 'cascade' }),
    // 1-based line number in the source file, for error messages.
    rowNumber: integer('row_number').notNull(),
    legacyId: text('legacy_id'),
    rawJson: jsonb('raw_json').notNull(),
    normalizedJson: jsonb('normalized_json'),
    /** 'pending' | 'valid' | 'invalid' | 'committed' | 'skipped' */
    status: text('status').notNull().default('pending'),
    errorsJson: jsonb('errors_json'),
    // Set on commit — the row this became.
    jetnineId: uuid('jetnine_id'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    batchRowUnique: uniqueIndex('import_rows_batch_row_number_uniq').on(t.batchId, t.rowNumber),
    businessIdx: index('import_rows_business_id_idx').on(t.businessId),
    batchStatusIdx: index('import_rows_batch_status_idx').on(t.batchId, t.status),
    legacyIdx: index('import_rows_batch_legacy_id_idx').on(t.batchId, t.legacyId),
  }),
);
