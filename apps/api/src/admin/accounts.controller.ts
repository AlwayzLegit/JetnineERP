import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { and, count, desc, eq, gte, max, sum } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { monthlyPriceCents, PLANS, type PlanId } from '../billing/pricing';
import { isReadOnly, type SubscriptionStatus } from '../billing/subscription-state';
import { SuperAdminOnly, TenantScoped } from '../tenancy/decorators';

/**
 * PLAN §15 — the platform owner's console over every sub-account.
 *
 * An account is a business seen from the platform side: its kind
 * ('agency' = the owner's own operation, never billed; 'saas' = a paying
 * tenant), its subscription, the payments it has made toward it, the
 * resources it consumes, and the people who can sign in to it.
 *
 * `/v1/admin/businesses` stays as the provisioning surface (create,
 * status, activate plan); this controller is the read/manage surface.
 */

export type AccountKind = 'agency' | 'saas';
const ACCOUNT_KINDS = new Set<string>(['agency', 'saas']);
const PAYMENT_METHODS = new Set<string>(['manual', 'stripe', 'comp']);
const PAYMENT_STATUSES = new Set<string>(['paid', 'failed', 'refunded']);

const SUBSCRIPTION_STATUS_FOR_BUSINESS_STATUS: Record<string, SubscriptionStatus> = {
  active: 'active',
  trial: 'trial',
  suspended: 'past_due',
  cancelled: 'canceled',
};

export interface AccountSummary {
  id: string;
  slug: string;
  name: string;
  accountKind: AccountKind;
  status: string;
  plan: string | null;
  subscriptionStatus: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  readOnly: boolean;
  /** What this account bills per month at its current plan + locations. 0 for agency. */
  mrrCents: number;
  userCount: number;
  locationCount: number;
  lastActivityAt: Date | null;
  lastPaidAt: Date | null;
  createdAt: Date;
}

export interface AccountUsage {
  locations: number;
  members: number;
  products: number;
  customers: number;
  ordersLast30d: number;
  salesLast30d: { count: number; grossCents: number };
  lastActivityAt: Date | null;
}

export interface AccountDetail extends AccountSummary {
  subscription: {
    plan: string;
    status: SubscriptionStatus;
    trialEndsAt: Date | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
    cancelAtPeriodEnd: Date | null;
    paidLocationCount: number;
    perLocationCents: number | null;
  };
  usage: AccountUsage;
  payments: { count: number; totalPaidCents: number; lastPaidAt: Date | null };
}

export interface AccountMember {
  membershipId: string;
  userId: string;
  email: string;
  name: string | null;
  roleName: string;
  status: string;
  isSuperAdmin: boolean;
  joinedAt: Date;
}

export interface SubscriptionPaymentRow {
  id: string;
  businessId: string;
  amountCents: number;
  currencyCode: string;
  status: string;
  method: string;
  periodStart: Date | null;
  periodEnd: Date | null;
  reference: string | null;
  note: string | null;
  recordedByUserId: string | null;
  paidAt: Date;
  createdAt: Date;
}

interface RecordPaymentBody {
  amountCents?: number;
  method?: string;
  status?: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  reference?: string | null;
  note?: string | null;
  paidAt?: string | null;
}

function parseDate(value: string | null | undefined, field: string): Date | null {
  if (value == null || value === '') return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw new BadRequestException(`${field} must be a valid date`);
  return d;
}

@SuperAdminOnly()
@TenantScoped()
@Controller('v1/admin/accounts')
export class AdminAccountsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  async list(@Query('kind') kind?: string): Promise<AccountSummary[]> {
    if (kind !== undefined && kind !== '' && !ACCOUNT_KINDS.has(kind)) {
      throw new BadRequestException(`kind must be one of: ${[...ACCOUNT_KINDS].join(', ')}`);
    }
    const rows = await this.summaries(
      kind && ACCOUNT_KINDS.has(kind) ? (kind as AccountKind) : null,
    );
    return rows;
  }

  @Get(':id')
  async detail(@Param('id') id: string): Promise<AccountDetail> {
    return this.detailFor(id);
  }

  /**
   * Flip a business between the owner's own (agency) operation and a
   * paying SaaS tenant. Marking as agency also clears any trial or lapse
   * so the guard never blocks it; converting back to SaaS leaves the
   * subscription row as-is (activate a plan from the Subscription card).
   */
  @Patch(':id/kind')
  async setKind(
    @Param('id') id: string,
    @Body() body: { accountKind?: string } | undefined,
  ): Promise<AccountDetail> {
    const accountKind = body?.accountKind;
    if (!accountKind || !ACCOUNT_KINDS.has(accountKind)) {
      throw new BadRequestException(`accountKind must be one of: ${[...ACCOUNT_KINDS].join(', ')}`);
    }
    const [existing] = await this.db
      .select({ accountKind: schema.businesses.accountKind, status: schema.businesses.status })
      .from(schema.businesses)
      .where(eq(schema.businesses.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Business not found');

    const now = new Date();
    if (accountKind === 'agency') {
      await this.db
        .update(schema.businesses)
        .set({ accountKind, status: 'active', trialEndsAt: null, updatedAt: now })
        .where(eq(schema.businesses.id, id));
      await this.db
        .update(schema.subscriptions)
        .set({ status: 'active', trialEndsAt: null, cancelAtPeriodEnd: null, updatedAt: now })
        .where(eq(schema.subscriptions.businessId, id));
    } else {
      await this.db
        .update(schema.businesses)
        .set({ accountKind, updatedAt: now })
        .where(eq(schema.businesses.id, id));
    }

    await this.audit.log({
      action: 'business.account_kind.update',
      targetType: 'business',
      targetId: id,
      before: { accountKind: existing.accountKind, status: existing.status },
      after: { accountKind, status: accountKind === 'agency' ? 'active' : existing.status },
    });

    return this.detailFor(id);
  }

  @Get(':id/members')
  async members(@Param('id') id: string): Promise<AccountMember[]> {
    await this.mustExist(id);
    const rows = await this.db
      .select({
        membershipId: schema.memberships.id,
        userId: schema.users.id,
        email: schema.users.email,
        name: schema.users.name,
        roleName: schema.roles.name,
        status: schema.memberships.status,
        isSuperAdmin: schema.users.isSuperAdmin,
        joinedAt: schema.memberships.createdAt,
      })
      .from(schema.memberships)
      .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
      .innerJoin(schema.roles, eq(schema.roles.id, schema.memberships.roleId))
      .where(eq(schema.memberships.businessId, id))
      .orderBy(schema.users.email);
    return rows.map((r) => ({ ...r, status: r.status }));
  }

  @Get(':id/payments')
  async payments(@Param('id') id: string): Promise<SubscriptionPaymentRow[]> {
    await this.mustExist(id);
    return this.db
      .select()
      .from(schema.subscriptionPayments)
      .where(eq(schema.subscriptionPayments.businessId, id))
      .orderBy(desc(schema.subscriptionPayments.paidAt))
      .limit(200);
  }

  /**
   * Record a payment against a SaaS account's subscription. A `paid`
   * row also marks the subscription active (clearing any trial or lapse)
   * and, when a period is given, stamps it on the subscription so the
   * console shows what the payment covered.
   */
  @Post(':id/payments')
  async recordPayment(
    @Param('id') id: string,
    @Body() body: RecordPaymentBody | undefined,
    @CurrentUser() actor: CurrentUserPayload,
  ): Promise<SubscriptionPaymentRow> {
    const biz = await this.mustExist(id);
    if (biz.accountKind === 'agency') {
      throw new ConflictException('Agency (house) accounts are not billed');
    }
    const amountCents = body?.amountCents;
    if (typeof amountCents !== 'number' || !Number.isInteger(amountCents) || amountCents < 0) {
      throw new BadRequestException('amountCents must be a non-negative integer');
    }
    const method = body?.method ?? 'manual';
    if (!PAYMENT_METHODS.has(method)) {
      throw new BadRequestException(`method must be one of: ${[...PAYMENT_METHODS].join(', ')}`);
    }
    const status = body?.status ?? 'paid';
    if (!PAYMENT_STATUSES.has(status)) {
      throw new BadRequestException(`status must be one of: ${[...PAYMENT_STATUSES].join(', ')}`);
    }
    const periodStart = parseDate(body?.periodStart, 'periodStart');
    const periodEnd = parseDate(body?.periodEnd, 'periodEnd');
    if (periodStart && periodEnd && periodEnd.getTime() < periodStart.getTime()) {
      throw new BadRequestException('periodEnd must not be before periodStart');
    }
    const paidAt = parseDate(body?.paidAt, 'paidAt') ?? new Date();

    const [row] = await this.db
      .insert(schema.subscriptionPayments)
      .values({
        businessId: id,
        amountCents,
        currencyCode: biz.currencyCode,
        status,
        method,
        periodStart,
        periodEnd,
        reference: body?.reference?.trim() || null,
        note: body?.note?.trim() || null,
        recordedByUserId: actor.id,
        paidAt,
      })
      .returning();
    if (!row) throw new BadRequestException('failed to record payment');

    if (status === 'paid') {
      const now = new Date();
      const [sub] = await this.db
        .select({ id: schema.subscriptions.id, plan: schema.subscriptions.plan })
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.businessId, id))
        .limit(1);
      const plan = sub?.plan ?? biz.plan ?? 'starter';
      const periodPatch = {
        ...(periodStart ? { currentPeriodStart: periodStart } : {}),
        ...(periodEnd ? { currentPeriodEnd: periodEnd } : {}),
      };
      await this.db
        .insert(schema.subscriptions)
        .values({
          businessId: id,
          plan,
          status: 'active',
          trialEndsAt: null,
          currentPeriodStart: periodStart ?? now,
          currentPeriodEnd: periodEnd,
        })
        .onConflictDoUpdate({
          target: schema.subscriptions.businessId,
          set: {
            status: 'active',
            trialEndsAt: null,
            cancelAtPeriodEnd: null,
            ...periodPatch,
            updatedAt: now,
          },
        });
      await this.db
        .update(schema.businesses)
        .set({ status: 'active', plan, trialEndsAt: null, updatedAt: now })
        .where(eq(schema.businesses.id, id));
    }

    await this.audit.log({
      action: 'billing.payment.recorded',
      targetType: 'business',
      targetId: id,
      after: {
        paymentId: row.id,
        amountCents,
        method,
        status,
        periodStart: periodStart?.toISOString() ?? null,
        periodEnd: periodEnd?.toISOString() ?? null,
      },
    });

    return row;
  }

  // ---- internals --------------------------------------------------

  private async mustExist(id: string) {
    const [biz] = await this.db
      .select({
        id: schema.businesses.id,
        accountKind: schema.businesses.accountKind,
        plan: schema.businesses.plan,
        currencyCode: schema.businesses.currencyCode,
      })
      .from(schema.businesses)
      .where(eq(schema.businesses.id, id))
      .limit(1);
    if (!biz) throw new NotFoundException('Business not found');
    return biz;
  }

  private async summaries(kind: AccountKind | null, onlyId?: string): Promise<AccountSummary[]> {
    const memberSubq = this.db
      .select({
        businessId: schema.memberships.businessId,
        userCount: count().as('member_count'),
      })
      .from(schema.memberships)
      .groupBy(schema.memberships.businessId)
      .as('m');
    const locationSubq = this.db
      .select({
        businessId: schema.locations.businessId,
        locationCount: count().as('location_count'),
      })
      .from(schema.locations)
      .groupBy(schema.locations.businessId)
      .as('l');
    const auditSubq = this.db
      .select({
        businessId: schema.auditLogs.businessId,
        lastActivityAt: max(schema.auditLogs.createdAt).as('last_activity_at'),
      })
      .from(schema.auditLogs)
      .groupBy(schema.auditLogs.businessId)
      .as('a');
    const paidSubq = this.db
      .select({
        businessId: schema.subscriptionPayments.businessId,
        lastPaidAt: max(schema.subscriptionPayments.paidAt).as('last_paid_at'),
      })
      .from(schema.subscriptionPayments)
      .where(eq(schema.subscriptionPayments.status, 'paid'))
      .groupBy(schema.subscriptionPayments.businessId)
      .as('p');

    const conditions = [];
    if (kind) conditions.push(eq(schema.businesses.accountKind, kind));
    if (onlyId) conditions.push(eq(schema.businesses.id, onlyId));

    const rows = await this.db
      .select({
        id: schema.businesses.id,
        slug: schema.businesses.slug,
        name: schema.businesses.name,
        accountKind: schema.businesses.accountKind,
        status: schema.businesses.status,
        plan: schema.businesses.plan,
        bizTrialEndsAt: schema.businesses.trialEndsAt,
        createdAt: schema.businesses.createdAt,
        subPlan: schema.subscriptions.plan,
        subStatus: schema.subscriptions.status,
        subTrialEndsAt: schema.subscriptions.trialEndsAt,
        currentPeriodEnd: schema.subscriptions.currentPeriodEnd,
        userCount: memberSubq.userCount,
        locationCount: locationSubq.locationCount,
        lastActivityAt: auditSubq.lastActivityAt,
        lastPaidAt: paidSubq.lastPaidAt,
      })
      .from(schema.businesses)
      .leftJoin(schema.subscriptions, eq(schema.subscriptions.businessId, schema.businesses.id))
      .leftJoin(memberSubq, eq(memberSubq.businessId, schema.businesses.id))
      .leftJoin(locationSubq, eq(locationSubq.businessId, schema.businesses.id))
      .leftJoin(auditSubq, eq(auditSubq.businessId, schema.businesses.id))
      .leftJoin(paidSubq, eq(paidSubq.businessId, schema.businesses.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.businesses.createdAt));

    return rows.map((r) => {
      const accountKind: AccountKind = r.accountKind === 'agency' ? 'agency' : 'saas';
      const subscriptionStatus: SubscriptionStatus =
        (r.subStatus as SubscriptionStatus | null) ??
        SUBSCRIPTION_STATUS_FOR_BUSINESS_STATUS[r.status] ??
        'trial';
      const trialEndsAt = r.subStatus ? r.subTrialEndsAt : r.bizTrialEndsAt;
      const locationCount = Number(r.locationCount ?? 0);
      const plan = r.subPlan ?? r.plan ?? null;
      const readOnly =
        accountKind === 'agency' ? false : isReadOnly(subscriptionStatus, trialEndsAt);
      const mrrCents =
        accountKind === 'saas' && subscriptionStatus === 'active' && plan && plan in PLANS
          ? monthlyPriceCents(plan as PlanId, locationCount)
          : 0;
      return {
        id: r.id,
        slug: r.slug,
        name: r.name,
        accountKind,
        status: r.status,
        plan,
        subscriptionStatus,
        trialEndsAt: trialEndsAt ?? null,
        currentPeriodEnd: r.currentPeriodEnd ?? null,
        readOnly,
        mrrCents,
        userCount: Number(r.userCount ?? 0),
        locationCount,
        lastActivityAt: r.lastActivityAt ?? null,
        lastPaidAt: r.lastPaidAt ?? null,
        createdAt: r.createdAt,
      };
    });
  }

  private async detailFor(id: string): Promise<AccountDetail> {
    const [summary] = await this.summaries(null, id);
    if (!summary) throw new NotFoundException('Business not found');

    const [sub] = await this.db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, id))
      .limit(1);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const one = async (q: Promise<{ value: number }[]>) => Number((await q)[0]?.value ?? 0);
    const [products, customers, ordersLast30d, salesRows, payRows] = await Promise.all([
      one(
        this.db
          .select({ value: count() })
          .from(schema.products)
          .where(eq(schema.products.businessId, id)),
      ),
      one(
        this.db
          .select({ value: count() })
          .from(schema.customers)
          .where(eq(schema.customers.businessId, id)),
      ),
      one(
        this.db
          .select({ value: count() })
          .from(schema.orders)
          .where(and(eq(schema.orders.businessId, id), gte(schema.orders.createdAt, since))),
      ),
      this.db
        .select({ count: count(), gross: sum(schema.sales.totalCents) })
        .from(schema.sales)
        .where(and(eq(schema.sales.businessId, id), gte(schema.sales.createdAt, since))),
      this.db
        .select({
          count: count(),
          total: sum(schema.subscriptionPayments.amountCents),
          lastPaidAt: max(schema.subscriptionPayments.paidAt),
        })
        .from(schema.subscriptionPayments)
        .where(
          and(
            eq(schema.subscriptionPayments.businessId, id),
            eq(schema.subscriptionPayments.status, 'paid'),
          ),
        ),
    ]);

    const plan = summary.plan ?? 'starter';
    return {
      ...summary,
      subscription: {
        plan,
        status: summary.subscriptionStatus,
        trialEndsAt: summary.trialEndsAt,
        currentPeriodStart: sub?.currentPeriodStart ?? null,
        currentPeriodEnd: sub?.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? null,
        paidLocationCount: sub?.paidLocationCount ?? 0,
        perLocationCents: plan in PLANS ? PLANS[plan as PlanId].perLocationCents : null,
      },
      usage: {
        locations: summary.locationCount,
        members: summary.userCount,
        products,
        customers,
        ordersLast30d,
        salesLast30d: {
          count: Number(salesRows[0]?.count ?? 0),
          grossCents: Number(salesRows[0]?.gross ?? 0),
        },
        lastActivityAt: summary.lastActivityAt,
      },
      payments: {
        count: Number(payRows[0]?.count ?? 0),
        totalPaidCents: Number(payRows[0]?.total ?? 0),
        lastPaidAt: payRows[0]?.lastPaidAt ?? null,
      },
    };
  }
}
