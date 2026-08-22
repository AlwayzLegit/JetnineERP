import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'node:crypto';
import { and, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';
import { endpointMatchesEvent, type WebhookEventType } from './webhook-events';

const REQUEST_TIMEOUT_MS = 5_000;
const RESPONSE_BODY_MAX = 8 * 1024;

/**
 * Outbound webhook fan-out. Inserts one `webhook_deliveries` row per
 * subscribed endpoint, signs the payload, fires the HTTPS POST, and
 * updates the row + endpoint counters with the result. Designed to
 * be called from request handlers via `void dispatcher.fire(...)` so
 * the request returns without waiting on slow subscribers.
 *
 * Production deployments should swap this for a Redis-backed worker
 * queue (BullMQ, Sidekiq-style) so retries survive a restart and the
 * controller doesn't keep a Node process tied up; the synchronous-
 * inline implementation here is sufficient for early customers and
 * pure fire-and-forget semantics keep the request-side simple.
 */
@Injectable()
export class WebhookDispatcher {
  private readonly logger = new Logger(WebhookDispatcher.name);

  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  /**
   * Fan out an event to every active matching endpoint. Returns the
   * generated event id so callers can log it for traceability.
   */
  async fire(args: {
    businessId: string;
    eventType: WebhookEventType;
    payload: Record<string, unknown>;
  }): Promise<string> {
    const eventId = randomUUID();
    const endpoints = await this.db
      .select()
      .from(schema.webhookEndpoints)
      .where(
        and(
          eq(schema.webhookEndpoints.businessId, args.businessId),
          eq(schema.webhookEndpoints.isActive, true),
        ),
      );
    const targets = endpoints.filter((e) => endpointMatchesEvent(e.events, args.eventType));
    if (targets.length === 0) return eventId;

    // Run all dispatches concurrently — they're independent.
    await Promise.all(
      targets.map((endpoint) =>
        this.deliverOne(endpoint, eventId, args.eventType, args.payload).catch((err) => {
          this.logger.error(
            `Webhook delivery threw outside the persistence path: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
        }),
      ),
    );
    return eventId;
  }

  /**
   * Manually fire a synthetic test event. Returns the delivery row id
   * so the UI can link directly to the result. Not for production
   * traffic — the caller is the business admin verifying their
   * endpoint is wired up correctly.
   */
  async fireTest(endpointId: string): Promise<{ deliveryId: string; status: string }> {
    const [endpoint] = await this.db
      .select()
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.id, endpointId))
      .limit(1);
    if (!endpoint) throw new Error('endpoint not found');
    const deliveryId = await this.deliverOne(
      endpoint,
      randomUUID(),
      'webhook.test' as WebhookEventType,
      { message: 'This is a test event from LA Mattress ERP.', sentAt: new Date().toISOString() },
    );
    const [delivery] = await this.db
      .select({ status: schema.webhookDeliveries.status })
      .from(schema.webhookDeliveries)
      .where(eq(schema.webhookDeliveries.id, deliveryId))
      .limit(1);
    return { deliveryId, status: delivery?.status ?? 'unknown' };
  }

  private async deliverOne(
    endpoint: typeof schema.webhookEndpoints.$inferSelect,
    eventId: string,
    eventType: WebhookEventType,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const timestamp = Math.floor(Date.now() / 1000);
    const body = JSON.stringify({
      id: eventId,
      type: eventType,
      sentAt: new Date(timestamp * 1000).toISOString(),
      data: payload,
    });
    const signature = this.sign(endpoint.secret, body, timestamp);

    const [delivery] = await this.db
      .insert(schema.webhookDeliveries)
      .values({
        businessId: endpoint.businessId,
        endpointId: endpoint.id,
        eventId,
        eventType,
        payloadJson: payload as never,
        status: 'pending',
        attempts: 1,
        lastAttemptAt: new Date(),
      })
      .returning({ id: schema.webhookDeliveries.id });
    if (!delivery) throw new Error('failed to insert delivery row');

    let status = 'failed';
    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let errorMessage: string | null = null;

    try {
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), REQUEST_TIMEOUT_MS);
      try {
        const res = await fetch(endpoint.url, {
          method: 'POST',
          signal: ac.signal,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Jetnine-Webhook/1.0',
            'X-Jetnine-Event': eventType,
            'X-Jetnine-Event-Id': eventId,
            'X-Jetnine-Timestamp': String(timestamp),
            'X-Jetnine-Signature': signature,
          },
          body,
        });
        responseStatus = res.status;
        const text = await res.text();
        responseBody = text.length > RESPONSE_BODY_MAX ? text.slice(0, RESPONSE_BODY_MAX) : text;
        status = res.ok ? 'succeeded' : 'failed';
        if (!res.ok) errorMessage = `Endpoint returned ${res.status}`;
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
    }

    await this.db
      .update(schema.webhookDeliveries)
      .set({ status, responseStatus, responseBody, errorMessage })
      .where(eq(schema.webhookDeliveries.id, delivery.id));

    if (status === 'succeeded') {
      await this.db
        .update(schema.webhookEndpoints)
        .set({
          lastSuccessAt: new Date(),
          consecutiveFailures: 0,
          totalDeliveries: sql`${schema.webhookEndpoints.totalDeliveries} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.webhookEndpoints.id, endpoint.id));
    } else {
      await this.db
        .update(schema.webhookEndpoints)
        .set({
          lastFailureAt: new Date(),
          consecutiveFailures: sql`${schema.webhookEndpoints.consecutiveFailures} + 1`,
          totalDeliveries: sql`${schema.webhookEndpoints.totalDeliveries} + 1`,
          updatedAt: new Date(),
        })
        .where(eq(schema.webhookEndpoints.id, endpoint.id));
    }
    return delivery.id;
  }

  /**
   * `t=<unix>,v1=<hmacsha256(t.body)>` — same shape Stripe uses, so
   * customers who've integrated with Stripe webhooks before will
   * find the verification code instantly familiar.
   */
  sign(secret: string, body: string, timestamp: number): string {
    const signedPayload = `${timestamp}.${body}`;
    const v1 = createHmac('sha256', secret).update(signedPayload).digest('hex');
    return `t=${timestamp},v1=${v1}`;
  }
}
