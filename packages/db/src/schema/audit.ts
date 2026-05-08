import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';
import { businesses, users } from './platform';
import { inet } from '../types';

// Audit log. business_id is nullable for platform-level events
// (super-admin actions before any business exists, login failures, etc).
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id').references(() => businesses.id, { onDelete: 'cascade' }),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    // 'user' | 'super_admin' | 'system'
    actorType: text('actor_type').notNull(),
    impersonatorUserId: uuid('impersonator_user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    action: text('action').notNull(),
    targetType: text('target_type'),
    targetId: text('target_id'),
    changesJson: jsonb('changes_json'),
    ip: inet('ip'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('audit_logs_business_id_idx').on(t.businessId),
    actorIdx: index('audit_logs_actor_user_id_idx').on(t.actorUserId),
    actionIdx: index('audit_logs_action_idx').on(t.action),
    createdIdx: index('audit_logs_created_at_idx').on(t.createdAt),
  }),
);
