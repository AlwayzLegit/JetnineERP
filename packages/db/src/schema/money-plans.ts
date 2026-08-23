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
import { memberships } from './tenancy';
import { orders } from './orders';
import { payments } from './sales';

/**
 * Layaway / in-house installment plans (STORIS cutover G4). A plan
 * belongs to an order; installments are generated up front from the
 * schedule and each one is settled by exactly one order payment. Money
 * always flows through `payments` — the plan is bookkeeping over it,
 * never a second ledger.
 */
export const paymentPlans = pgTable(
  'payment_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    orderId: uuid('order_id')
      .notNull()
      .references(() => orders.id, { onDelete: 'cascade' }),
    /** 'layaway' | 'in_house' */
    type: text('type').notNull(),
    /** 'active' | 'completed' | 'defaulted' | 'cancelled' */
    status: text('status').notNull().default('active'),
    installmentAmountCents: integer('installment_amount_cents').notNull(),
    /** 'weekly' | 'biweekly' | 'monthly' */
    frequency: text('frequency').notNull(),
    startDate: date('start_date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('payment_plans_business_id_idx').on(t.businessId),
    orderIdx: uniqueIndex('payment_plans_order_id_uniq').on(t.orderId),
    statusIdx: index('payment_plans_status_idx').on(t.businessId, t.status),
  }),
);

export const paymentPlanInstallments = pgTable(
  'payment_plan_installments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    planId: uuid('plan_id')
      .notNull()
      .references(() => paymentPlans.id, { onDelete: 'cascade' }),
    seq: integer('seq').notNull(),
    dueDate: date('due_date').notNull(),
    amountCents: integer('amount_cents').notNull(),
    paidPaymentId: uuid('paid_payment_id').references(() => payments.id, {
      onDelete: 'set null',
    }),
    /** 'due' | 'paid' | 'overdue' | 'waived' */
    status: text('status').notNull().default('due'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    planSeqUnique: uniqueIndex('payment_plan_installments_plan_seq_uniq').on(t.planId, t.seq),
    businessIdx: index('payment_plan_installments_business_id_idx').on(t.businessId),
    dueIdx: index('payment_plan_installments_due_idx').on(t.businessId, t.status, t.dueDate),
  }),
);

/**
 * Commission plans (G5): how a salesperson gets paid. Assigned per
 * membership; accrual happens at sale/order completion into
 * commission_entries, never recomputed retroactively — a rate change
 * affects future accruals only.
 */
export const commissionPlans = pgTable(
  'commission_plans',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** 'percent_of_sale' | 'percent_of_margin' */
    basis: text('basis').notNull(),
    rateBps: integer('rate_bps').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessNameUnique: uniqueIndex('commission_plans_business_name_uniq').on(t.businessId, t.name),
    businessIdx: index('commission_plans_business_id_idx').on(t.businessId),
  }),
);

export const commissionEntries = pgTable(
  'commission_entries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    businessId: uuid('business_id')
      .notNull()
      .references(() => businesses.id, { onDelete: 'cascade' }),
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => memberships.id, { onDelete: 'cascade' }),
    /** Exactly one of these names the source document. */
    orderId: uuid('order_id'),
    saleId: uuid('sale_id'),
    basisCents: integer('basis_cents').notNull(),
    /** Negative for refund reversals. */
    amountCents: integer('amount_cents').notNull(),
    rateBps: integer('rate_bps').notNull(),
    /** 'pending' | 'approved' | 'paid' */
    status: text('status').notNull().default('pending'),
    accruedAt: timestamp('accrued_at', { withTimezone: true }).notNull().defaultNow(),
    /** 'YYYY-MM' — the payroll period the accrual lands in. */
    period: text('period').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    businessIdx: index('commission_entries_business_id_idx').on(t.businessId),
    membershipPeriodIdx: index('commission_entries_membership_period_idx').on(
      t.membershipId,
      t.period,
    ),
    statusIdx: index('commission_entries_status_idx').on(t.businessId, t.status),
    orderIdx: index('commission_entries_order_id_idx').on(t.orderId),
    saleIdx: index('commission_entries_sale_id_idx').on(t.saleId),
  }),
);
