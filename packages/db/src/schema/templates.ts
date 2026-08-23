import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';

/**
 * Business templates (platform layer, P1): a snapshot of one business's
 * configuration — roles, categories, tax classes, settings, optionally
 * the product catalog — that super-admins can stamp onto a new or
 * existing business. Platform-level table: no `business_id`, super-admin
 * surface only, so it stays outside tenant RLS like `businesses` itself.
 *
 * `snapshot_json` shape:
 *   { settings: {...}, roles: [...], categories: [...],
 *     taxClasses: [...], products: [{..., variants: [...]}] }
 * `scope_json` records which sections were captured so apply() knows
 * what the author intended, even as sections evolve.
 */
export const businessTemplates = pgTable(
  'business_templates',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    description: text('description'),
    sourceBusinessId: uuid('source_business_id').references(() => businesses.id, {
      onDelete: 'set null',
    }),
    snapshotJson: jsonb('snapshot_json').notNull(),
    scopeJson: jsonb('scope_json').notNull(),
    createdByUserId: uuid('created_by_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    nameIdx: index('business_templates_name_idx').on(t.name),
  }),
);
