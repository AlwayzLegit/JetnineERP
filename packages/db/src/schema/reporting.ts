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
 * Self-service report builder (docs/handoffs/storis-report-builder —
 * owner chose option (b), 2026-08-28).
 *
 * Source files and their SYSTEM dictionaries are code, not rows: the
 * catalog in apps/api knows the physical schema and how to query it.
 * These tables hold what USERS author on top: extra dictionaries
 * (formulas and joins) and report definitions.
 */

/**
 * User-authored dictionaries. `kind='formula'` evaluates a closed-set
 * expression over the row's system dictionaries; `kind='joined'` grafts
 * a field from a related source per the catalog's relation graph
 * (pack 03: the copy is permanent and behaves like a native
 * dictionary). System dictionaries never appear here.
 */
export const reportDictionaries = pgTable(
  'report_dictionaries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    /** Source-file id from the code catalog (e.g. 'orders'). */
    sourceId: text('source_id').notNull(),
    /** Unique within (business, source); ≤15 chars (pack 03 clone cap). */
    name: text('name').notNull(),
    description: text('description'),
    columnHeading: text('column_heading').notNull(),
    width: integer('width').notNull().default(12),
    /** 'left' | 'right' | 'centered' */
    justification: text('justification').notNull().default('left'),
    /** 'formula' | 'joined' — discriminated union (pack 03). */
    kind: text('kind').notNull(),
    /** kind='formula' only. Closed function set; validated on save. */
    formula: text('formula'),
    /** kind='joined' only: the related source and its dictionary. */
    joinSourceId: text('join_source_id'),
    joinFieldName: text('join_field_name'),
    /**
     * Field security (pack 07 layer 3): permission required to SEE the
     * data. Masked users get the column header with empty cells —
     * never a missing column, never a WHERE clause.
     */
    maskPermission: text('mask_permission'),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nameUnique: uniqueIndex('report_dictionaries_source_name_uniq').on(
      t.businessId,
      t.sourceId,
      t.name,
    ),
    businessIdx: index('report_dictionaries_business_id_idx').on(t.businessId),
  }),
);

/**
 * A saved report definition. Columns/prompts/filters/sorts live in one
 * jsonb document — the definition is authored and validated as a unit
 * (pack 02's five tabs), and its parts are meaningless separately.
 */
export const reportDefinitions = pgTable(
  'report_definitions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    /** Unique per business. Reserved 'S$' prefix = systemOwned only. */
    name: text('name').notNull(),
    description: text('description'),
    sourceId: text('source_id').notNull(),
    title: text('title'),
    subTitle: text('sub_title'),
    footer: text('footer'),
    /** Author's instructions, shown verbatim on the run screen (T-23). */
    runTimeInformation: text('run_time_information'),
    addToSchedule: boolean('add_to_schedule').notNull().default(false),
    /** 'anyone' | 'same_role' | 'owner_only' (pack 07 layer 1). */
    access: text('access').notNull().default('anyone'),
    /** Vendor-standard: runnable and cloneable, never editable (T-31). */
    systemOwned: boolean('system_owned').notNull().default(false),
    /** {columns:[], prompts:[], filters:[], sorts:[]} per pack 01. */
    definitionJson: jsonb('definition_json').notNull(),
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nameUnique: uniqueIndex('report_definitions_business_name_uniq').on(t.businessId, t.name),
    businessIdx: index('report_definitions_business_id_idx').on(t.businessId),
    sourceIdx: index('report_definitions_source_idx').on(t.businessId, t.sourceId),
  }),
);
