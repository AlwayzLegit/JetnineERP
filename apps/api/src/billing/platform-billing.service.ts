import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import StripeSdk from 'stripe';
import type { PlanId } from './pricing';

type StripeClient = InstanceType<typeof StripeSdk>;

/**
 * PLAN §15.5 — Stripe Billing for SaaS accounts, on the *platform's* Stripe
 * account (the same `STRIPE_SECRET_KEY` the Connect integration uses, but
 * without the `Stripe-Account` header: these charges are ours, not a
 * merchant's).
 *
 * One product, two monthly per-location Prices:
 *   STRIPE_PRICE_STARTER_PER_LOCATION, STRIPE_PRICE_PRO_PER_LOCATION
 * and a dedicated endpoint secret for the billing webhook:
 *   STRIPE_BILLING_WEBHOOK_SECRET
 *
 * Stub mode (no secret key): checkout / portal return same-origin URLs
 * back to the Billing page, and the webhook accepts unsigned JSON so
 * the whole lifecycle can be driven in dev and tests. `configured` is
 * true in stub mode on purpose — the UI must be exercisable locally —
 * and false in a real deployment that has the key but not the prices.
 */
export interface BillingWebhookEvent {
  id: string;
  type: string;
  livemode: boolean;
  data: { object: Record<string, unknown> };
}

export interface CheckoutSessionResult {
  sessionId: string;
  url: string;
  /** Stub mode mints a deterministic customer so the portal path works too. */
  customerId: string | null;
}

@Injectable()
export class PlatformBillingService {
  private readonly logger = new Logger(PlatformBillingService.name);
  readonly stub: boolean;
  readonly configured: boolean;
  private readonly client: StripeClient | null;
  private readonly prices: Record<PlanId, string | null>;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY') ?? null;
    this.stub = !secret;
    this.client = secret ? new StripeSdk(secret) : null;
    this.prices = {
      starter: this.config.get<string>('STRIPE_PRICE_STARTER_PER_LOCATION') ?? null,
      pro: this.config.get<string>('STRIPE_PRICE_PRO_PER_LOCATION') ?? null,
    };
    this.configured = this.stub || Boolean(this.prices.starter && this.prices.pro);
    if (this.stub) {
      this.logger.warn(
        'PlatformBillingService running in STUB mode (no STRIPE_SECRET_KEY): checkout/portal return local URLs and the billing webhook accepts unsigned JSON.',
      );
    } else if (!this.configured) {
      this.logger.warn(
        'Stripe Billing has a secret key but no STRIPE_PRICE_STARTER_PER_LOCATION / STRIPE_PRICE_PRO_PER_LOCATION; checkout is disabled until both are set.',
      );
    }
  }

  /** Reverse lookup for webhook payloads: which plan does a Stripe Price belong to? */
  planForPrice(priceId: string | null | undefined): PlanId | null {
    if (!priceId) return null;
    if (priceId === this.prices.starter) return 'starter';
    if (priceId === this.prices.pro) return 'pro';
    if (this.stub) {
      if (priceId.includes('starter')) return 'starter';
      if (priceId.includes('pro')) return 'pro';
    }
    return null;
  }

  async createCheckoutSession(args: {
    businessId: string;
    businessName: string;
    plan: PlanId;
    quantity: number;
    customerId: string | null;
    customerEmail: string | null;
    successUrl: string;
    cancelUrl: string;
  }): Promise<CheckoutSessionResult> {
    if (this.stub || !this.client) {
      const sep = args.successUrl.includes('?') ? '&' : '?';
      return {
        sessionId: `cs_stub_${args.businessId.slice(0, 8)}_${Date.now()}`,
        url: `${args.successUrl}${sep}stub=1&plan=${args.plan}`,
        customerId: args.customerId ?? `cus_stub_${args.businessId.slice(0, 8)}`,
      };
    }
    const price = this.prices[args.plan];
    if (!price) throw new Error(`No Stripe price configured for plan ${args.plan}`);
    const session = await this.client.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: args.quantity }],
      ...(args.customerId
        ? { customer: args.customerId }
        : args.customerEmail
          ? { customer_email: args.customerEmail }
          : {}),
      client_reference_id: args.businessId,
      metadata: { businessId: args.businessId, plan: args.plan },
      subscription_data: {
        metadata: { businessId: args.businessId, plan: args.plan, businessName: args.businessName },
      },
      allow_promotion_codes: true,
      success_url: args.successUrl,
      cancel_url: args.cancelUrl,
    });
    if (!session.url) throw new Error('Stripe returned a Checkout Session without a URL');
    return {
      sessionId: session.id,
      url: session.url,
      customerId: typeof session.customer === 'string' ? session.customer : null,
    };
  }

  async createPortalSession(args: { customerId: string; returnUrl: string }): Promise<string> {
    if (this.stub || !this.client) {
      const sep = args.returnUrl.includes('?') ? '&' : '?';
      return `${args.returnUrl}${sep}portal=stub`;
    }
    const session = await this.client.billingPortal.sessions.create({
      customer: args.customerId,
      return_url: args.returnUrl,
    });
    return session.url;
  }

  /**
   * Verify a billing webhook against `STRIPE_BILLING_WEBHOOK_SECRET`. In
   * stub mode (or without the secret) the raw JSON is trusted so tests and
   * local dev can post events by hand — never run production that way.
   */
  verifyWebhook(
    rawBody: string | Buffer,
    signatureHeader: string | undefined,
  ): BillingWebhookEvent {
    const secret = this.config.get<string>('STRIPE_BILLING_WEBHOOK_SECRET');
    if (this.stub || !this.client || !secret) {
      const text = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
      const parsed = JSON.parse(text) as Partial<BillingWebhookEvent>;
      if (!parsed.id || !parsed.type) {
        throw new Error('Stub webhook payload requires id + type');
      }
      return {
        id: parsed.id,
        type: parsed.type,
        livemode: parsed.livemode ?? false,
        data: { object: parsed.data?.object ?? {} },
      };
    }
    if (!signatureHeader) throw new Error('Missing Stripe-Signature header');
    const event = this.client.webhooks.constructEvent(rawBody, signatureHeader, secret);
    return {
      id: event.id,
      type: event.type,
      livemode: event.livemode,
      data: { object: event.data.object as unknown as Record<string, unknown> },
    };
  }
}
