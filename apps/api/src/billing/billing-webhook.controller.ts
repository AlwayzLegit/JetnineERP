import {
  BadRequestException,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Logger,
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import type { Request } from 'express';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';
import { Public } from '../tenancy/decorators';
import { PlatformBillingService, type BillingWebhookEvent } from './platform-billing.service';
import type { PlanId } from './pricing';
import type { SubscriptionStatus } from './subscription-state';

/**
 * PLAN §15.5 — Stripe Billing webhook. Stripe is the source of truth for
 * a SaaS account's subscription once it has checked out: every event here
 * is projected onto `subscriptions` (status, ids, period, quantity) and
 * `businesses` (status/plan mirror), and every invoice becomes a
 * `subscription_payments` row with `method = 'stripe'`.
 *
 * Same contract as the Connect webhook: signature-verified, idempotent via
 * `stripe_webhook_events.event_id`, Public, and always 200 once the event
 * is durably recorded (handler errors are stored on the event row).
 */
const STRIPE_TO_SUBSCRIPTION: Record<string, SubscriptionStatus> = {
  active: 'active',
  trialing: 'active',
  past_due: 'past_due',
  unpaid: 'past_due',
  incomplete: 'past_due',
  paused: 'past_due',
  canceled: 'canceled',
  incomplete_expired: 'canceled',
};

const BUSINESS_STATUS_FOR: Record<SubscriptionStatus, string> = {
  active: 'active',
  trial: 'trial',
  past_due: 'suspended',
  canceled: 'cancelled',
};

type Obj = Record<string, unknown>;

function str(o: Obj | undefined, key: string): string | null {
  const v = o?.[key];
  if (typeof v === 'string') return v;
  // Expanded objects carry their id.
  if (v && typeof v === 'object' && typeof (v as Obj).id === 'string')
    return (v as Obj).id as string;
  return null;
}
function num(o: Obj | undefined, key: string): number | null {
  const v = o?.[key];
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}
function unix(o: Obj | undefined, key: string): Date | null {
  const n = num(o, key);
  return n == null ? null : new Date(n * 1000);
}
function obj(o: Obj | undefined, key: string): Obj | undefined {
  const v = o?.[key];
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Obj) : undefined;
}
function firstItem(o: Obj | undefined, key: string): Obj | undefined {
  const container = obj(o, key);
  const data = container?.data;
  return Array.isArray(data) && data[0] && typeof data[0] === 'object'
    ? (data[0] as Obj)
    : undefined;
}

@Controller('v1/billing/stripe')
export class BillingWebhookController {
  private readonly logger = new Logger(BillingWebhookController.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(PlatformBillingService) private readonly billing: PlatformBillingService,
  ) {}

  @Public()
  @Post('webhook')
  @HttpCode(200)
  async handle(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<{ received: true; deduped?: true }> {
    const raw = req.rawBody;
    if (!raw) {
      throw new BadRequestException(
        'Webhook requires raw body — set rawBody:true in NestFactory.create',
      );
    }
    let event: BillingWebhookEvent;
    try {
      event = this.billing.verifyWebhook(raw, signature);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Billing webhook signature verification failed: ${message}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    const inserted = await this.db
      .insert(schema.stripeWebhookEvents)
      .values({
        eventId: event.id,
        type: event.type,
        livemode: event.livemode,
        payload: JSON.stringify(event.data.object).slice(0, 16000),
      })
      .onConflictDoNothing({ target: schema.stripeWebhookEvents.eventId })
      .returning({ eventId: schema.stripeWebhookEvents.eventId });
    if (inserted.length === 0) {
      this.logger.log(`Billing webhook ${event.id} already processed; skipping.`);
      return { received: true, deduped: true };
    }

    try {
      await this.dispatch(event);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Billing webhook ${event.type}/${event.id} failed: ${message}`);
      await this.db
        .update(schema.stripeWebhookEvents)
        .set({ error: message.slice(0, 2000) })
        .where(eq(schema.stripeWebhookEvents.eventId, event.id));
    }
    return { received: true };
  }

  private async dispatch(event: BillingWebhookEvent): Promise<void> {
    const o = event.data.object;
    switch (event.type) {
      case 'checkout.session.completed':
        return this.onCheckoutCompleted(o);
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        return this.onSubscriptionChanged(o, false);
      case 'customer.subscription.deleted':
        return this.onSubscriptionChanged(o, true);
      case 'invoice.paid':
      case 'invoice.payment_succeeded':
        return this.onInvoice(o, 'paid', event.id);
      case 'invoice.payment_failed':
        return this.onInvoice(o, 'failed', event.id);
      default:
        this.logger.log(`Billing webhook ${event.type} received; no handler wired (no-op).`);
    }
  }

  // ---- handlers ---------------------------------------------------

  private async onCheckoutCompleted(session: Obj): Promise<void> {
    if (str(session, 'mode') !== 'subscription') return;
    const metadata = obj(session, 'metadata');
    const businessId =
      (await this.resolveBusiness({
        metadataBusinessId: str(metadata, 'businessId') ?? str(session, 'client_reference_id'),
        customerId: str(session, 'customer'),
        subscriptionId: str(session, 'subscription'),
      })) ?? null;
    if (!businessId) {
      throw new Error('checkout.session.completed: could not resolve business');
    }
    const plan = this.validPlan(str(metadata, 'plan'));
    await this.applyState(businessId, {
      stripeCustomerId: str(session, 'customer'),
      stripeSubscriptionId: str(session, 'subscription'),
      status: 'active',
      plan,
      trialEndsAt: null,
      source: 'checkout.session.completed',
    });
  }

  private async onSubscriptionChanged(sub: Obj, deleted: boolean): Promise<void> {
    const metadata = obj(sub, 'metadata');
    const businessId = await this.resolveBusiness({
      subscriptionId: str(sub, 'id'),
      customerId: str(sub, 'customer'),
      metadataBusinessId: str(metadata, 'businessId'),
    });
    if (!businessId) throw new Error('customer.subscription.*: could not resolve business');

    const item = firstItem(sub, 'items');
    const price = obj(item, 'price');
    const plan =
      this.billing.planForPrice(str(price, 'id')) ?? this.validPlan(str(metadata, 'plan'));
    const status: SubscriptionStatus = deleted
      ? 'canceled'
      : (STRIPE_TO_SUBSCRIPTION[str(sub, 'status') ?? ''] ?? 'active');
    // API versions from 2025 moved the period onto the subscription item.
    const periodStart = unix(sub, 'current_period_start') ?? unix(item, 'current_period_start');
    const periodEnd = unix(sub, 'current_period_end') ?? unix(item, 'current_period_end');
    const cancelAtPeriodEnd = deleted
      ? (unix(sub, 'canceled_at') ?? new Date())
      : sub.cancel_at_period_end === true
        ? (unix(sub, 'cancel_at') ?? periodEnd)
        : null;

    await this.applyState(businessId, {
      stripeCustomerId: str(sub, 'customer'),
      stripeSubscriptionId: str(sub, 'id'),
      status,
      plan,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd,
      paidLocationCount: num(item, 'quantity'),
      trialEndsAt: null,
      source: deleted ? 'customer.subscription.deleted' : 'customer.subscription.updated',
    });
  }

  private async onInvoice(
    invoice: Obj,
    outcome: 'paid' | 'failed',
    eventId: string,
  ): Promise<void> {
    const parent = obj(invoice, 'parent');
    const subscriptionId =
      str(invoice, 'subscription') ??
      str(obj(parent, 'subscription_details'), 'subscription') ??
      null;
    const customerId = str(invoice, 'customer');
    const businessId = await this.resolveBusiness({
      subscriptionId,
      customerId,
      metadataBusinessId: str(obj(invoice, 'metadata'), 'businessId'),
    });
    if (!businessId) throw new Error(`invoice.${outcome}: could not resolve business`);

    const invoiceId = str(invoice, 'id') ?? `evt:${eventId}`;
    const amountCents =
      outcome === 'paid' ? (num(invoice, 'amount_paid') ?? 0) : (num(invoice, 'amount_due') ?? 0);
    const line = firstItem(invoice, 'lines');
    const linePeriod = obj(line, 'period');
    const periodStart = unix(linePeriod, 'start') ?? unix(invoice, 'period_start');
    const periodEnd = unix(linePeriod, 'end') ?? unix(invoice, 'period_end');
    const transitions = obj(invoice, 'status_transitions');
    const paidAt = unix(transitions, 'paid_at') ?? unix(invoice, 'created') ?? new Date();
    const number = str(invoice, 'number');
    const hosted = str(invoice, 'hosted_invoice_url');

    // One ledger row per invoice outcome; Stripe retries and re-sends
    // freely, and the event-level dedupe does not cover distinct events
    // about the same invoice (invoice.paid + invoice.payment_succeeded).
    const reference = outcome === 'paid' ? invoiceId : `${invoiceId}:failed`;
    const [existing] = await this.db
      .select({ id: schema.subscriptionPayments.id })
      .from(schema.subscriptionPayments)
      .where(
        and(
          eq(schema.subscriptionPayments.businessId, businessId),
          eq(schema.subscriptionPayments.reference, reference),
        ),
      )
      .limit(1);
    if (!existing && (outcome === 'failed' || amountCents > 0)) {
      await this.db.insert(schema.subscriptionPayments).values({
        businessId,
        amountCents,
        currencyCode: (str(invoice, 'currency') ?? 'usd').toUpperCase(),
        status: outcome,
        method: 'stripe',
        periodStart,
        periodEnd,
        reference,
        note: [number ? `Stripe invoice ${number}` : 'Stripe invoice', hosted]
          .filter(Boolean)
          .join(' — '),
        paidAt,
      });
    }

    await this.applyState(businessId, {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      status: outcome === 'paid' ? 'active' : 'past_due',
      currentPeriodStart: outcome === 'paid' ? periodStart : undefined,
      currentPeriodEnd: outcome === 'paid' ? periodEnd : undefined,
      trialEndsAt: null,
      source: outcome === 'paid' ? 'invoice.paid' : 'invoice.payment_failed',
    });
  }

  // ---- projection -------------------------------------------------

  private validPlan(plan: string | null): PlanId | undefined {
    return plan === 'starter' || plan === 'pro' ? plan : undefined;
  }

  private async resolveBusiness(args: {
    subscriptionId?: string | null;
    customerId?: string | null;
    metadataBusinessId?: string | null;
  }): Promise<string | null> {
    if (args.subscriptionId) {
      const [row] = await this.db
        .select({ businessId: schema.subscriptions.businessId })
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.stripeSubscriptionId, args.subscriptionId))
        .limit(1);
      if (row) return row.businessId;
    }
    if (args.customerId) {
      const [row] = await this.db
        .select({ businessId: schema.subscriptions.businessId })
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.stripeCustomerId, args.customerId))
        .limit(1);
      if (row) return row.businessId;
    }
    if (args.metadataBusinessId) {
      const [row] = await this.db
        .select({ id: schema.businesses.id })
        .from(schema.businesses)
        .where(eq(schema.businesses.id, args.metadataBusinessId))
        .limit(1);
      if (row) return row.id;
    }
    return null;
  }

  private async applyState(
    businessId: string,
    patch: {
      stripeCustomerId?: string | null;
      stripeSubscriptionId?: string | null;
      status: SubscriptionStatus;
      plan?: PlanId;
      currentPeriodStart?: Date | null;
      currentPeriodEnd?: Date | null;
      cancelAtPeriodEnd?: Date | null;
      paidLocationCount?: number | null;
      trialEndsAt?: null;
      source: string;
    },
  ): Promise<void> {
    const now = new Date();
    const [before] = await this.db
      .select({
        status: schema.subscriptions.status,
        plan: schema.subscriptions.plan,
        accountKind: schema.businesses.accountKind,
        bizPlan: schema.businesses.plan,
      })
      .from(schema.businesses)
      .leftJoin(schema.subscriptions, eq(schema.subscriptions.businessId, schema.businesses.id))
      .where(eq(schema.businesses.id, businessId))
      .limit(1);
    if (before?.accountKind === 'agency') {
      // PLAN §15: house accounts are never billed. Record the ledger row
      // (done by the caller) but never let Stripe drive their status.
      this.logger.warn(`Ignoring Stripe state for agency account ${businessId} (${patch.source})`);
      return;
    }
    const plan =
      patch.plan ??
      (before?.plan as PlanId | null) ??
      (before?.bizPlan as PlanId | null) ??
      'starter';

    const set: Record<string, unknown> = {
      status: patch.status,
      plan,
      updatedAt: now,
    };
    if (patch.stripeCustomerId) set.stripeCustomerId = patch.stripeCustomerId;
    if (patch.stripeSubscriptionId) set.stripeSubscriptionId = patch.stripeSubscriptionId;
    if (patch.currentPeriodStart !== undefined) set.currentPeriodStart = patch.currentPeriodStart;
    if (patch.currentPeriodEnd !== undefined) set.currentPeriodEnd = patch.currentPeriodEnd;
    if (patch.cancelAtPeriodEnd !== undefined) set.cancelAtPeriodEnd = patch.cancelAtPeriodEnd;
    if (patch.paidLocationCount != null) set.paidLocationCount = patch.paidLocationCount;
    if (patch.trialEndsAt === null) set.trialEndsAt = null;

    await this.db
      .insert(schema.subscriptions)
      .values({
        businessId,
        plan,
        status: patch.status,
        stripeCustomerId: patch.stripeCustomerId ?? null,
        stripeSubscriptionId: patch.stripeSubscriptionId ?? null,
        currentPeriodStart: patch.currentPeriodStart ?? null,
        currentPeriodEnd: patch.currentPeriodEnd ?? null,
        cancelAtPeriodEnd: patch.cancelAtPeriodEnd ?? null,
        paidLocationCount: patch.paidLocationCount ?? 0,
        trialEndsAt: null,
      })
      .onConflictDoUpdate({ target: schema.subscriptions.businessId, set });

    await this.db
      .update(schema.businesses)
      .set({
        status: BUSINESS_STATUS_FOR[patch.status],
        plan,
        ...(patch.trialEndsAt === null ? { trialEndsAt: null } : {}),
        updatedAt: now,
      })
      .where(eq(schema.businesses.id, businessId));

    await this.db.insert(schema.auditLogs).values({
      businessId,
      actorType: 'system',
      action: 'billing.stripe.sync',
      targetType: 'business',
      targetId: businessId,
      changesJson: {
        before: { status: before?.status ?? null, plan: before?.plan ?? null },
        after: { status: patch.status, plan },
        source: patch.source,
        stripeSubscriptionId: patch.stripeSubscriptionId ?? null,
      },
    });
  }
}
