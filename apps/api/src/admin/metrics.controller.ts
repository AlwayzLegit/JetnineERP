import { Controller, Get, Inject } from '@nestjs/common';
import { count, eq, gte, sum } from 'drizzle-orm';
import { monthlyPriceCents, PLANS, type PlanId } from '../billing/pricing';
import { isReadOnly, type SubscriptionStatus } from '../billing/subscription-state';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';
import { SuperAdminOnly, TenantScoped } from '../tenancy/decorators';

interface PlatformMetrics {
  totalBusinesses: number;
  activeBusinesses: number;
  totalUsers: number;
  salesLast30Days: {
    count: number;
    grossCents: number;
  };
  /** PLAN §15 account model. */
  accounts: { agency: number; saas: number };
  subscriptions: {
    active: number;
    trial: number;
    pastDue: number;
    canceled: number;
    /** SaaS accounts the guard is currently blocking writes for. */
    readOnly: number;
    trialsEndingWithin7d: number;
  };
  /** Sum of what active SaaS accounts bill per month at their current plan + locations. */
  mrrCents: number;
}

const SUBSCRIPTION_STATUS_FOR_BUSINESS_STATUS: Record<string, SubscriptionStatus> = {
  active: 'active',
  trial: 'trial',
  suspended: 'past_due',
  cancelled: 'canceled',
};

@SuperAdminOnly()
@TenantScoped()
@Controller('v1/admin/metrics')
export class AdminMetricsController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  @Get()
  async metrics(): Promise<PlatformMetrics> {
    const [totalBiz] = await this.db.select({ value: count() }).from(schema.businesses);
    const [activeBiz] = await this.db
      .select({ value: count() })
      .from(schema.businesses)
      .where(eq(schema.businesses.status, 'active'));
    const [totalUsers] = await this.db.select({ value: count() }).from(schema.users);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [recent] = await this.db
      .select({ count: count(), gross: sum(schema.sales.totalCents) })
      .from(schema.sales)
      .where(gte(schema.sales.createdAt, since));

    const locationSubq = this.db
      .select({
        businessId: schema.locations.businessId,
        locationCount: count().as('location_count'),
      })
      .from(schema.locations)
      .groupBy(schema.locations.businessId)
      .as('l');
    const accountRows = await this.db
      .select({
        accountKind: schema.businesses.accountKind,
        status: schema.businesses.status,
        plan: schema.businesses.plan,
        bizTrialEndsAt: schema.businesses.trialEndsAt,
        subPlan: schema.subscriptions.plan,
        subStatus: schema.subscriptions.status,
        subTrialEndsAt: schema.subscriptions.trialEndsAt,
        locationCount: locationSubq.locationCount,
      })
      .from(schema.businesses)
      .leftJoin(schema.subscriptions, eq(schema.subscriptions.businessId, schema.businesses.id))
      .leftJoin(locationSubq, eq(locationSubq.businessId, schema.businesses.id));

    const accounts = { agency: 0, saas: 0 };
    const subscriptions = {
      active: 0,
      trial: 0,
      pastDue: 0,
      canceled: 0,
      readOnly: 0,
      trialsEndingWithin7d: 0,
    };
    let mrrCents = 0;
    const now = Date.now();
    const in7d = now + 7 * 24 * 60 * 60 * 1000;
    for (const r of accountRows) {
      if (r.accountKind === 'agency') {
        accounts.agency += 1;
        continue;
      }
      accounts.saas += 1;
      const status: SubscriptionStatus =
        (r.subStatus as SubscriptionStatus | null) ??
        SUBSCRIPTION_STATUS_FOR_BUSINESS_STATUS[r.status] ??
        'trial';
      const trialEndsAt = r.subStatus ? r.subTrialEndsAt : r.bizTrialEndsAt;
      if (status === 'active') subscriptions.active += 1;
      else if (status === 'trial') subscriptions.trial += 1;
      else if (status === 'past_due') subscriptions.pastDue += 1;
      else subscriptions.canceled += 1;
      if (isReadOnly(status, trialEndsAt)) subscriptions.readOnly += 1;
      if (
        status === 'trial' &&
        trialEndsAt &&
        trialEndsAt.getTime() >= now &&
        trialEndsAt.getTime() <= in7d
      ) {
        subscriptions.trialsEndingWithin7d += 1;
      }
      const plan = r.subPlan ?? r.plan;
      if (status === 'active' && plan && plan in PLANS) {
        mrrCents += monthlyPriceCents(plan as PlanId, Number(r.locationCount ?? 0));
      }
    }

    return {
      totalBusinesses: Number(totalBiz?.value ?? 0),
      activeBusinesses: Number(activeBiz?.value ?? 0),
      totalUsers: Number(totalUsers?.value ?? 0),
      salesLast30Days: {
        count: Number(recent?.count ?? 0),
        grossCents: Number(recent?.gross ?? 0),
      },
      accounts,
      subscriptions,
      mrrCents,
    };
  }
}
