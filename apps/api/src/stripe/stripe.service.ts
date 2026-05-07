import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import StripeSdk from 'stripe';

type StripeClient = InstanceType<typeof StripeSdk>;

/**
 * Thin wrapper around the Stripe SDK + a stub fallback for dev / test
 * runs without `STRIPE_SECRET_KEY`. The stub returns deterministic fake
 * IDs and always-succeed responses so the rest of the app can be
 * exercised end-to-end without hitting Stripe. Production deployments
 * MUST set the env vars; the controller surfaces a clear error if they
 * try to use Stripe-backed paths in stub mode and the env is set to
 * `production`.
 */
export interface ConnectOauthResult {
  stripeAccountId: string;
  scope: string;
  livemode: boolean;
}

export interface StripeAccount {
  id: string;
  email: string | null;
  defaultCurrency: string | null;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}

export interface ChargeResult {
  paymentIntentId: string;
  status: 'succeeded' | 'requires_action' | 'requires_payment_method' | 'processing' | 'canceled';
  amountReceived: number;
}

export interface RefundResult {
  refundId: string;
  status: 'succeeded' | 'pending' | 'failed';
  amount: number;
}

export const STRIPE_CLIENT = Symbol('STRIPE_CLIENT');

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  readonly clientId: string | null;
  readonly publishableKey: string | null;
  readonly redirectUri: string;
  readonly stub: boolean;
  private readonly client: StripeClient | null;

  constructor(@Inject(ConfigService) private readonly config: ConfigService) {
    const secret = this.config.get<string>('STRIPE_SECRET_KEY') ?? null;
    this.clientId = this.config.get<string>('STRIPE_CONNECT_CLIENT_ID') ?? null;
    this.publishableKey = this.config.get<string>('STRIPE_PUBLISHABLE_KEY') ?? null;
    this.redirectUri =
      this.config.get<string>('STRIPE_OAUTH_REDIRECT_URI') ??
      'http://localhost:4000/v1/stripe/oauth/callback';
    this.stub = !secret;
    this.client = secret ? new StripeSdk(secret) : null;
    if (this.stub) {
      this.logger.warn(
        'StripeService running in STUB mode (no STRIPE_SECRET_KEY). Connect + charges + refunds use deterministic fakes; never deploy this to production.',
      );
    }
  }

  authorizeUrl(state: string): string {
    if (!this.clientId) {
      // Stub mode: a same-origin redirect that loops back through our
      // callback with a synthetic code so the local UI can be exercised
      // without registering a Connect application.
      const params = new URLSearchParams({ code: 'stub_code', state, scope: 'read_write' });
      return `${this.redirectUri}?${params.toString()}`;
    }
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: 'read_write',
      redirect_uri: this.redirectUri,
      state,
    });
    return `https://connect.stripe.com/oauth/authorize?${params.toString()}`;
  }

  async exchangeOauthCode(code: string): Promise<ConnectOauthResult> {
    if (this.stub || !this.client) {
      return {
        stripeAccountId: `acct_stub_${code.slice(0, 12)}`,
        scope: 'read_write',
        livemode: false,
      };
    }
    const tokenResponse = await this.client.oauth.token({
      grant_type: 'authorization_code',
      code,
    });
    if (!tokenResponse.stripe_user_id) {
      throw new Error('Stripe OAuth response missing stripe_user_id');
    }
    return {
      stripeAccountId: tokenResponse.stripe_user_id,
      scope: tokenResponse.scope ?? 'read_write',
      livemode: tokenResponse.livemode ?? false,
    };
  }

  async fetchAccount(stripeAccountId: string): Promise<StripeAccount> {
    if (this.stub || !this.client) {
      return {
        id: stripeAccountId,
        email: 'stub-merchant@example.com',
        defaultCurrency: 'usd',
        chargesEnabled: true,
        payoutsEnabled: true,
      };
    }
    const account = await this.client.accounts.retrieve(stripeAccountId);
    return {
      id: account.id,
      email: account.email ?? null,
      defaultCurrency: account.default_currency ?? null,
      chargesEnabled: account.charges_enabled ?? false,
      payoutsEnabled: account.payouts_enabled ?? false,
    };
  }

  async disconnect(stripeAccountId: string): Promise<void> {
    if (this.stub || !this.client || !this.clientId) return;
    await this.client.oauth.deauthorize({
      client_id: this.clientId,
      stripe_user_id: stripeAccountId,
    });
  }

  /**
   * Create + confirm a PaymentIntent on the merchant's connected
   * account in one call. Returns the resulting status; the caller
   * should treat anything other than 'succeeded' as a failure and
   * roll back the sale.
   */
  async chargeCard(args: {
    stripeAccountId: string;
    amountCents: number;
    currency: string;
    paymentMethodId: string;
    description?: string;
    metadata?: Record<string, string>;
    idempotencyKey?: string;
  }): Promise<ChargeResult> {
    if (this.stub || !this.client) {
      return {
        paymentIntentId: `pi_stub_${args.paymentMethodId.slice(0, 8)}_${Date.now()}`,
        status: 'succeeded',
        amountReceived: args.amountCents,
      };
    }
    const intent = await this.client.paymentIntents.create(
      {
        amount: args.amountCents,
        currency: args.currency,
        payment_method: args.paymentMethodId,
        confirm: true,
        confirmation_method: 'automatic',
        // For card-not-present at the POS we don't redirect; if a card
        // requires 3DS the cashier will see a non-succeeded status and
        // can swipe a different card.
        automatic_payment_methods: { enabled: true, allow_redirects: 'never' },
        description: args.description,
        metadata: args.metadata,
      },
      {
        stripeAccount: args.stripeAccountId,
        idempotencyKey: args.idempotencyKey,
      },
    );
    return {
      paymentIntentId: intent.id,
      status: intent.status as ChargeResult['status'],
      amountReceived: intent.amount_received ?? 0,
    };
  }

  /**
   * Verify a Stripe webhook signature against the raw request body.
   * In stub mode (or when STRIPE_WEBHOOK_SECRET is missing), returns
   * the parsed JSON so tests can drive the handler without a signed
   * payload. In production, raises if the signature doesn't match.
   */
  verifyWebhook(
    rawBody: string | Buffer,
    signatureHeader: string | undefined,
  ): {
    id: string;
    type: string;
    livemode: boolean;
    data: { object: Record<string, unknown> };
    account?: string;
  } {
    const secret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    if (this.stub || !this.client || !secret) {
      const text = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');
      const parsed = JSON.parse(text) as {
        id?: string;
        type?: string;
        livemode?: boolean;
        data?: { object?: Record<string, unknown> };
        account?: string;
      };
      if (!parsed.id || !parsed.type) {
        throw new Error('Stub webhook payload requires id + type');
      }
      return {
        id: parsed.id,
        type: parsed.type,
        livemode: parsed.livemode ?? false,
        data: { object: parsed.data?.object ?? {} },
        account: parsed.account,
      };
    }
    if (!signatureHeader) throw new Error('Missing Stripe-Signature header');
    const event = this.client.webhooks.constructEvent(rawBody, signatureHeader, secret);
    return {
      id: event.id,
      type: event.type,
      livemode: event.livemode,
      data: { object: event.data.object as unknown as Record<string, unknown> },
      account: event.account ?? undefined,
    };
  }

  async refundCharge(args: {
    stripeAccountId: string;
    paymentIntentId: string;
    amountCents: number;
    reason?: string;
    metadata?: Record<string, string>;
  }): Promise<RefundResult> {
    if (this.stub || !this.client) {
      return {
        refundId: `re_stub_${args.paymentIntentId.slice(0, 12)}_${Date.now()}`,
        status: 'succeeded',
        amount: args.amountCents,
      };
    }
    const refund = await this.client.refunds.create(
      {
        payment_intent: args.paymentIntentId,
        amount: args.amountCents,
        metadata: args.metadata,
      },
      { stripeAccount: args.stripeAccountId },
    );
    return {
      refundId: refund.id,
      status: refund.status as RefundResult['status'],
      amount: refund.amount,
    };
  }
}
