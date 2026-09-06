import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Patch,
  Post,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { PlatformBillingService } from './platform-billing.service';
import { monthlyPriceCents, PLANS, type PlanId } from './pricing';
import { isReadOnly } from './subscription-state';

interface SubscriptionView {
  id: string;
  /** PLAN §15: 'agency' house accounts are never billed or read-only. */
  accountKind: 'agency' | 'saas';
  plan: PlanId;
  status: 'trial' | 'active' | 'past_due' | 'canceled';
  trialEndsAt: Date | null;
  trialExpired: boolean;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  paidLocationCount: number;
  locationCount: number;
  monthlyPriceCents: number;
  cancelAtPeriodEnd: Date | null;
  readOnly: boolean;
  /** PLAN §15.5 — Stripe Billing state for the tenant Billing page. */
  stripeBilling: {
    configured: boolean;
    stubMode: boolean;
    customerId: string | null;
    subscriptionId: string | null;
  };
}

const VALID_PLANS = new Set<PlanId>(['starter', 'pro']);

@TenantScoped()
@Controller('v1/billing')
export class BillingController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(PlatformBillingService) private readonly stripeBilling: PlatformBillingService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  /**
   * Catalog of plans + their per-location prices. Static, so it doesn't
   * need a permission gate beyond `pos.access`-equivalent baseline; we
   * use `business.billing.view` to keep the surface predictable.
   */
  @Get('plans')
  @RequirePermission('business.billing.view')
  plans(): {
    id: PlanId;
    name: string;
    description: string;
    perLocationCents: number;
  }[] {
    return (Object.keys(PLANS) as PlanId[]).map((id) => ({
      id,
      name: PLANS[id].name,
      description: PLANS[id].description,
      perLocationCents: PLANS[id].perLocationCents,
    }));
  }

  @Get('subscription')
  @RequirePermission('business.billing.view')
  async get(@CurrentTenant() tenant: RequestTenantContext): Promise<SubscriptionView> {
    return this.hydrate(tenant.businessId!);
  }

  /**
   * Start (or restart) a paid subscription on the chosen plan. In a
   * real Stripe-wired environment this is where we'd create the
   * checkout session, redirect, and rely on the webhook to flip
   * `status='active'`. For MVP we do the transition inline so the rest
   * of the system can exercise the post-payment state.
   */
  @Post('subscribe')
  @RequirePermission('business.billing.update')
  async subscribe(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: { plan?: PlanId },
  ): Promise<SubscriptionView> {
    const plan = body.plan;
    if (!plan || !VALID_PLANS.has(plan)) {
      throw new BadRequestException(`plan must be one of: ${[...VALID_PLANS].join(', ')}`);
    }
    if (this.stripeBilling.configured && !this.stripeBilling.stub) {
      // PLAN §15.5: with real Stripe Billing live, activation only happens
      // through Checkout + webhook — never by an unpaid API call.
      throw new ConflictException('Use Stripe checkout to start a subscription');
    }
    const businessId = tenant.businessId!;
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setUTCMonth(periodEnd.getUTCMonth() + 1);
    const locationCount = await this.locationCount(businessId);

    await this.db
      .insert(schema.subscriptions)
      .values({
        businessId,
        plan,
        status: 'active',
        trialEndsAt: null,
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        paidLocationCount: locationCount,
      })
      .onConflictDoUpdate({
        target: schema.subscriptions.businessId,
        set: {
          plan,
          status: 'active',
          trialEndsAt: null,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          paidLocationCount: locationCount,
          cancelAtPeriodEnd: null,
          updatedAt: now,
        },
      });
    await this.db
      .update(schema.businesses)
      .set({ status: 'active', plan, updatedAt: now })
      .where(eq(schema.businesses.id, businessId));

    await this.audit.log({
      action: 'billing.subscribe',
      targetType: 'business',
      targetId: businessId,
      after: { plan, monthlyPriceCents: monthlyPriceCents(plan, locationCount) },
    });
    void actor;
    return this.hydrate(businessId);
  }

  /**
   * Switch plans without changing payment state. In Stripe this would
   * proration through `subscriptions.update`; here it just swaps `plan`.
   */
  @Patch('subscription')
  @RequirePermission('business.billing.update')
  async update(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: { plan?: PlanId },
  ): Promise<SubscriptionView> {
    const plan = body.plan;
    if (!plan || !VALID_PLANS.has(plan)) {
      throw new BadRequestException(`plan must be one of: ${[...VALID_PLANS].join(', ')}`);
    }
    const businessId = tenant.businessId!;
    const [sub] = await this.db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, businessId))
      .limit(1);
    if (!sub) throw new NotFoundException('No subscription on file');
    if (sub.status === 'canceled') {
      throw new ForbiddenException(
        'Cancelled subscriptions cannot change plan; resubscribe instead',
      );
    }
    const now = new Date();
    await this.db
      .update(schema.subscriptions)
      .set({ plan, updatedAt: now })
      .where(eq(schema.subscriptions.businessId, businessId));
    await this.db
      .update(schema.businesses)
      .set({ plan, updatedAt: now })
      .where(eq(schema.businesses.id, businessId));
    await this.audit.log({
      action: 'billing.plan_change',
      targetType: 'business',
      targetId: businessId,
      before: { plan: sub.plan },
      after: { plan },
    });
    return this.hydrate(businessId);
  }

  /**
   * PLAN §15.5 — start a Stripe Checkout Session for the chosen plan,
   * quantity = locations (min 1). Activation happens when the
   * `checkout.session.completed` webhook lands, not here.
   */
  @Post('checkout')
  @RequirePermission('business.billing.update')
  async checkout(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: { plan?: PlanId },
  ): Promise<{ url: string; stub: boolean }> {
    const plan = body.plan;
    if (!plan || !VALID_PLANS.has(plan)) {
      throw new BadRequestException(`plan must be one of: ${[...VALID_PLANS].join(', ')}`);
    }
    if (!this.stripeBilling.configured) {
      throw new ServiceUnavailableException(
        'Stripe Billing is not configured on this platform yet; ask your super admin to set the plan.',
      );
    }
    const businessId = tenant.businessId!;
    const [biz] = await this.db
      .select({
        name: schema.businesses.name,
        accountKind: schema.businesses.accountKind,
        customerId: schema.subscriptions.stripeCustomerId,
      })
      .from(schema.businesses)
      .leftJoin(schema.subscriptions, eq(schema.subscriptions.businessId, schema.businesses.id))
      .where(eq(schema.businesses.id, businessId))
      .limit(1);
    if (!biz) throw new NotFoundException('Business not found');
    if (biz.accountKind === 'agency') {
      throw new ConflictException('Agency (house) accounts are not billed');
    }
    const [user] = await this.db
      .select({ email: schema.users.email })
      .from(schema.users)
      .where(eq(schema.users.id, actor.id))
      .limit(1);

    const base = `${this.webBase()}/settings/billing`;
    const quantity = Math.max(1, await this.locationCount(businessId));
    const session = await this.stripeBilling.createCheckoutSession({
      businessId,
      businessName: biz.name,
      plan,
      quantity,
      customerId: biz.customerId ?? null,
      customerEmail: user?.email ?? null,
      successUrl: `${base}?checkout=success`,
      cancelUrl: `${base}?checkout=cancelled`,
    });
    if (session.customerId && !biz.customerId) {
      // Remember the customer so the portal works before the first
      // webhook arrives (and so stub mode has one at all).
      await this.db
        .insert(schema.subscriptions)
        .values({ businessId, plan, status: 'trial', stripeCustomerId: session.customerId })
        .onConflictDoUpdate({
          target: schema.subscriptions.businessId,
          set: { stripeCustomerId: session.customerId, updatedAt: new Date() },
        });
    }
    await this.audit.log({
      action: 'billing.checkout.started',
      targetType: 'business',
      targetId: businessId,
      after: { plan, quantity, sessionId: session.sessionId, stub: this.stripeBilling.stub },
    });
    return { url: session.url, stub: this.stripeBilling.stub };
  }

  /** PLAN §15.5 — Stripe Customer Portal: card, invoices, cancel, plan quantity. */
  @Post('portal')
  @RequirePermission('business.billing.update')
  async portal(@CurrentTenant() tenant: RequestTenantContext): Promise<{ url: string }> {
    if (!this.stripeBilling.configured) {
      throw new ServiceUnavailableException(
        'Stripe Billing is not configured on this platform yet.',
      );
    }
    const businessId = tenant.businessId!;
    const [sub] = await this.db
      .select({ customerId: schema.subscriptions.stripeCustomerId })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, businessId))
      .limit(1);
    if (!sub?.customerId) {
      throw new ConflictException('No Stripe customer on file yet — start a subscription first.');
    }
    const url = await this.stripeBilling.createPortalSession({
      customerId: sub.customerId,
      returnUrl: `${this.webBase()}/settings/billing?portal=return`,
    });
    return { url };
  }

  @Post('cancel')
  @RequirePermission('business.billing.update')
  async cancel(@CurrentTenant() tenant: RequestTenantContext): Promise<SubscriptionView> {
    const businessId = tenant.businessId!;
    const [sub] = await this.db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, businessId))
      .limit(1);
    if (!sub) throw new NotFoundException('No subscription on file');

    const now = new Date();
    await this.db
      .update(schema.subscriptions)
      .set({ status: 'canceled', cancelAtPeriodEnd: sub.currentPeriodEnd ?? now, updatedAt: now })
      .where(eq(schema.subscriptions.businessId, businessId));
    await this.db
      .update(schema.businesses)
      .set({ status: 'cancelled', updatedAt: now })
      .where(eq(schema.businesses.id, businessId));
    await this.audit.log({
      action: 'billing.cancel',
      targetType: 'business',
      targetId: businessId,
      before: { status: sub.status },
    });
    return this.hydrate(businessId);
  }

  /**
   * Test-only helper that fast-forwards a subscription past the trial
   * end without payment, transitioning it to `past_due` so the
   * read-only mode kicks in. Gated by NODE_ENV so it never fires in
   * production. The Stripe webhook handler is the production
   * equivalent.
   */
  @Post('dev/expire-trial')
  @RequirePermission('business.billing.update')
  async expireTrial(@CurrentTenant() tenant: RequestTenantContext): Promise<SubscriptionView> {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('expire-trial is disabled in production');
    }
    const businessId = tenant.businessId!;
    const now = new Date();
    const past = new Date(now.getTime() - 60_000);
    await this.db
      .insert(schema.subscriptions)
      .values({
        businessId,
        plan: 'starter',
        status: 'past_due',
        trialEndsAt: past,
      })
      .onConflictDoUpdate({
        target: schema.subscriptions.businessId,
        set: { status: 'past_due', trialEndsAt: past, updatedAt: now },
      });
    await this.db
      .update(schema.businesses)
      .set({ status: 'suspended', trialEndsAt: past, updatedAt: now })
      .where(eq(schema.businesses.id, businessId));
    return this.hydrate(businessId);
  }

  private async hydrate(businessId: string): Promise<SubscriptionView> {
    const [sub] = await this.db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, businessId))
      .limit(1);
    const [biz] = await this.db
      .select({
        status: schema.businesses.status,
        plan: schema.businesses.plan,
        trialEndsAt: schema.businesses.trialEndsAt,
        accountKind: schema.businesses.accountKind,
      })
      .from(schema.businesses)
      .where(eq(schema.businesses.id, businessId))
      .limit(1);
    if (!biz) throw new NotFoundException('Business not found');
    const accountKind = biz.accountKind === 'agency' ? 'agency' : 'saas';

    const locationCount = await this.locationCount(businessId);
    const trialEndsAt = sub?.trialEndsAt ?? biz.trialEndsAt;
    const trialExpired = trialEndsAt != null && trialEndsAt.getTime() < Date.now();
    const status = (sub?.status ?? (biz.status === 'active' ? 'active' : 'trial')) as
      | 'trial'
      | 'active'
      | 'past_due'
      | 'canceled';
    const plan = (sub?.plan ?? biz.plan ?? 'starter') as PlanId;

    return {
      id: sub?.id ?? '',
      accountKind,
      plan,
      status,
      trialEndsAt: trialEndsAt ?? null,
      trialExpired,
      currentPeriodStart: sub?.currentPeriodStart ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
      paidLocationCount: sub?.paidLocationCount ?? 0,
      locationCount,
      monthlyPriceCents: monthlyPriceCents(plan, locationCount),
      cancelAtPeriodEnd: sub?.cancelAtPeriodEnd ?? null,
      readOnly: accountKind === 'agency' ? false : isReadOnly(status, trialEndsAt),
      stripeBilling: {
        configured: this.stripeBilling.configured,
        stubMode: this.stripeBilling.stub,
        customerId: sub?.stripeCustomerId ?? null,
        subscriptionId: sub?.stripeSubscriptionId ?? null,
      },
    };
  }

  private webBase(): string {
    return (this.config.get<string>('WEB_BASE_URL') ?? 'http://localhost:3000').replace(/\/$/, '');
  }

  private async locationCount(businessId: string): Promise<number> {
    const rows = await this.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.locations)
      .where(eq(schema.locations.businessId, businessId));
    return rows[0]?.count ?? 0;
  }
}
