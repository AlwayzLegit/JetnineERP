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
import { eq, sql } from 'drizzle-orm';
import type { Request } from 'express';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';
import { Public } from '../tenancy/decorators';
import { StripeService } from './stripe.service';

@Controller('v1/stripe')
export class StripeWebhookController {
  private readonly logger = new Logger(StripeWebhookController.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(StripeService) private readonly stripe: StripeService,
  ) {}

  /**
   * Stripe webhook endpoint. Signature-verified, idempotent (events are
   * de-duped via `stripe_webhook_events.event_id`), and Public so it
   * can be called by Stripe without our session cookie.
   *
   * Always responds 200 once the event has been received and durably
   * recorded — Stripe retries on non-2xx, and we don't want a downstream
   * handler bug to keep the same event re-firing forever. Handler
   * errors are caught and stashed in the event row for later
   * inspection.
   */
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

    let event: ReturnType<StripeService['verifyWebhook']>;
    try {
      event = this.stripe.verifyWebhook(raw, signature);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Webhook signature verification failed: ${message}`);
      throw new BadRequestException('Invalid Stripe signature');
    }

    // Dedupe: insert-or-skip on event_id. If the row already exists,
    // we've handled it (or are handling it concurrently) — return 200
    // without re-running the handler.
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
      this.logger.log(`Webhook ${event.id} already processed; skipping.`);
      return { received: true, deduped: true };
    }

    try {
      await this.dispatch(event);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Webhook handler ${event.type}/${event.id} failed: ${message}`);
      await this.db
        .update(schema.stripeWebhookEvents)
        .set({ error: message.slice(0, 2000) })
        .where(eq(schema.stripeWebhookEvents.eventId, event.id));
      // Still respond 200; Stripe would otherwise spam retries for
      // a handler-side bug. The error is durable in the table.
    }
    return { received: true };
  }

  private async dispatch(event: ReturnType<StripeService['verifyWebhook']>): Promise<void> {
    switch (event.type) {
      case 'account.updated':
        return this.handleAccountUpdated(event);
      case 'account.application.deauthorized':
        return this.handleDeauthorized(event);
      case 'charge.dispute.created':
        return this.handleDispute(event);
      default:
        this.logger.log(`Webhook ${event.type} received; no handler wired (no-op).`);
    }
  }

  private async handleAccountUpdated(
    event: ReturnType<StripeService['verifyWebhook']>,
  ): Promise<void> {
    const account = event.data.object as {
      id?: string;
      email?: string | null;
      default_currency?: string | null;
      charges_enabled?: boolean;
      payouts_enabled?: boolean;
    };
    if (!account.id) return;
    await this.db
      .update(schema.merchantStripeAccounts)
      .set({
        accountEmail: account.email ?? null,
        defaultCurrency: account.default_currency ?? null,
        chargesEnabled: account.charges_enabled ?? false,
        payoutsEnabled: account.payouts_enabled ?? false,
      })
      .where(eq(schema.merchantStripeAccounts.stripeAccountId, account.id));
  }

  private async handleDeauthorized(
    event: ReturnType<StripeService['verifyWebhook']>,
  ): Promise<void> {
    // The merchant revoked our access from their Stripe dashboard. The
    // event's `account` field carries the revoked stripe_user_id.
    const stripeAccountId = event.account;
    if (!stripeAccountId) return;
    await this.db
      .update(schema.merchantStripeAccounts)
      .set({ disconnectedAt: new Date(), chargesEnabled: false, payoutsEnabled: false })
      .where(eq(schema.merchantStripeAccounts.stripeAccountId, stripeAccountId));
  }

  private async handleDispute(event: ReturnType<StripeService['verifyWebhook']>): Promise<void> {
    const dispute = event.data.object as {
      id?: string;
      payment_intent?: string;
      amount?: number;
      reason?: string;
    };
    if (!dispute.payment_intent) return;
    // Find the sale that paid via this PaymentIntent and surface a
    // dispute audit row. We don't auto-flip status — the merchant may
    // want to contest first.
    const [payment] = await this.db
      .select({ saleId: schema.payments.saleId, businessId: schema.payments.businessId })
      .from(schema.payments)
      .where(eq(schema.payments.processorRef, dispute.payment_intent))
      .limit(1);
    if (!payment) return;

    await this.db.insert(schema.auditLogs).values({
      businessId: payment.businessId,
      actorType: 'system',
      action: 'sale.dispute',
      targetType: 'sale',
      targetId: payment.saleId,
      changesJson: {
        after: {
          disputeId: dispute.id,
          paymentIntent: dispute.payment_intent,
          amount: dispute.amount,
          reason: dispute.reason,
        },
      },
    });
    void sql; // imported for parity with other modules; not used yet here
  }
}
