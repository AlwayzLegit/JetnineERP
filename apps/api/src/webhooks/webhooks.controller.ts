import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { desc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { WebhookDispatcher } from './webhook-dispatcher.service';
import { ALL_EVENTS_WILDCARD, WEBHOOK_EVENT_TYPES } from './webhook-events';

interface EndpointView {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  isActive: boolean;
  consecutiveFailures: number;
  totalDeliveries: number;
  lastSuccessAt: Date | null;
  lastFailureAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBody {
  url?: string;
  description?: string | null;
  events?: string[];
  isActive?: boolean;
}

type UpdateBody = CreateBody;

interface DeliveryRow {
  id: string;
  endpointId: string;
  eventId: string;
  eventType: string;
  status: string;
  attempts: number;
  responseStatus: number | null;
  responseBody: string | null;
  errorMessage: string | null;
  lastAttemptAt: Date | null;
  createdAt: Date;
}

@TenantScoped()
@Controller('v1/business/webhooks')
export class WebhooksController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(WebhookDispatcher) private readonly dispatcher: WebhookDispatcher,
  ) {}

  @Get('event-types')
  @RequirePermission('webhooks.view')
  eventTypes(): { types: string[]; wildcard: string } {
    return { types: [...WEBHOOK_EVENT_TYPES], wildcard: ALL_EVENTS_WILDCARD };
  }

  @Get()
  @RequirePermission('webhooks.view')
  async list(@CurrentTenant() _tenant: RequestTenantContext): Promise<EndpointView[]> {
    const rows = await this.db
      .select({
        id: schema.webhookEndpoints.id,
        url: schema.webhookEndpoints.url,
        description: schema.webhookEndpoints.description,
        events: schema.webhookEndpoints.events,
        isActive: schema.webhookEndpoints.isActive,
        consecutiveFailures: schema.webhookEndpoints.consecutiveFailures,
        totalDeliveries: schema.webhookEndpoints.totalDeliveries,
        lastSuccessAt: schema.webhookEndpoints.lastSuccessAt,
        lastFailureAt: schema.webhookEndpoints.lastFailureAt,
        createdAt: schema.webhookEndpoints.createdAt,
        updatedAt: schema.webhookEndpoints.updatedAt,
      })
      .from(schema.webhookEndpoints)
      .orderBy(schema.webhookEndpoints.createdAt);
    return rows.map((r) => ({ ...r, events: r.events ?? [] }));
  }

  @Post()
  @RequirePermission('webhooks.manage')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: CreateBody,
  ): Promise<EndpointView & { secret: string }> {
    const url = body.url?.trim();
    if (!url || !/^https?:\/\//i.test(url)) {
      throw new BadRequestException('url must be an absolute http(s) URL');
    }
    const events = body.events ?? [];
    validateEvents(events);
    const secret = `whsk_${randomBytes(24).toString('hex')}`;

    let row;
    try {
      [row] = await this.db
        .insert(schema.webhookEndpoints)
        .values({
          businessId: tenant.businessId!,
          url,
          secret,
          description: body.description?.trim() || null,
          events,
          isActive: body.isActive ?? true,
        })
        .returning();
    } catch (err) {
      const root = unwrap(err);
      if (
        (root as { constraint_name?: string }).constraint_name ===
        'webhook_endpoints_business_url_uniq'
      ) {
        throw new BadRequestException(`A webhook for "${url}" already exists`);
      }
      throw err;
    }
    if (!row) throw new BadRequestException('failed to create webhook');

    await this.audit.log({
      action: 'webhook.create',
      targetType: 'webhook_endpoint',
      targetId: row.id,
      after: { url, events, isActive: row.isActive },
    });

    return { ...endpointView(row), secret };
  }

  @Patch(':id')
  @RequirePermission('webhooks.manage')
  async update(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: UpdateBody,
  ): Promise<EndpointView> {
    const [existing] = await this.db
      .select()
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Webhook endpoint not found');

    const update: Partial<typeof schema.webhookEndpoints.$inferInsert> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (body.url !== undefined) {
      const next = body.url.trim();
      if (!/^https?:\/\//i.test(next)) {
        throw new BadRequestException('url must be an absolute http(s) URL');
      }
      if (next !== existing.url) {
        update.url = next;
        before.url = existing.url;
        after.url = next;
      }
    }
    if (body.description !== undefined) {
      const next = body.description?.trim() || null;
      if (next !== existing.description) {
        update.description = next;
        before.description = existing.description;
        after.description = next;
      }
    }
    if (body.events !== undefined) {
      validateEvents(body.events);
      update.events = body.events;
      before.events = existing.events;
      after.events = body.events;
    }
    if (body.isActive !== undefined && body.isActive !== existing.isActive) {
      update.isActive = body.isActive;
      before.isActive = existing.isActive;
      after.isActive = body.isActive;
    }

    if (Object.keys(after).length === 0) return endpointView(existing);

    const [updated] = await this.db
      .update(schema.webhookEndpoints)
      .set(update)
      .where(eq(schema.webhookEndpoints.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Webhook endpoint not found after update');

    await this.audit.log({
      action: 'webhook.update',
      targetType: 'webhook_endpoint',
      targetId: id,
      before,
      after,
    });
    return endpointView(updated);
  }

  @Delete(':id')
  @RequirePermission('webhooks.manage')
  async delete(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Webhook endpoint not found');

    await this.db.delete(schema.webhookEndpoints).where(eq(schema.webhookEndpoints.id, id));
    await this.audit.log({
      action: 'webhook.delete',
      targetType: 'webhook_endpoint',
      targetId: id,
      before: { url: existing.url, events: existing.events },
    });
    return { deleted: true };
  }

  /**
   * Fire a synthetic `webhook.test` event to a single endpoint. The
   * response is awaited so the UI can show the merchant whether their
   * receiver responded 200 immediately.
   */
  @Post(':id/test')
  @RequirePermission('webhooks.manage')
  async testFire(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ deliveryId: string; status: string }> {
    const [endpoint] = await this.db
      .select({ id: schema.webhookEndpoints.id })
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.id, id))
      .limit(1);
    if (!endpoint) throw new NotFoundException('Webhook endpoint not found');
    return this.dispatcher.fireTest(id);
  }

  @Get(':id/deliveries')
  @RequirePermission('webhooks.view')
  async deliveries(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Query('limit') limitStr?: string,
  ): Promise<DeliveryRow[]> {
    const limit = clampLimit(limitStr, 50);
    const rows = await this.db
      .select({
        id: schema.webhookDeliveries.id,
        endpointId: schema.webhookDeliveries.endpointId,
        eventId: schema.webhookDeliveries.eventId,
        eventType: schema.webhookDeliveries.eventType,
        status: schema.webhookDeliveries.status,
        attempts: schema.webhookDeliveries.attempts,
        responseStatus: schema.webhookDeliveries.responseStatus,
        responseBody: schema.webhookDeliveries.responseBody,
        errorMessage: schema.webhookDeliveries.errorMessage,
        lastAttemptAt: schema.webhookDeliveries.lastAttemptAt,
        createdAt: schema.webhookDeliveries.createdAt,
      })
      .from(schema.webhookDeliveries)
      .where(eq(schema.webhookDeliveries.endpointId, id))
      .orderBy(desc(schema.webhookDeliveries.createdAt))
      .limit(limit);
    return rows;
  }
}

function validateEvents(events: string[]): void {
  if (!Array.isArray(events) || events.length === 0) {
    throw new BadRequestException('events must be a non-empty array');
  }
  const allowed = new Set<string>([...WEBHOOK_EVENT_TYPES, ALL_EVENTS_WILDCARD]);
  for (const e of events) {
    if (typeof e !== 'string' || !allowed.has(e)) {
      throw new BadRequestException(
        `Unknown event type "${e}". Allowed: ${[...allowed].join(', ')}`,
      );
    }
  }
}

function endpointView(r: typeof schema.webhookEndpoints.$inferSelect): EndpointView {
  return {
    id: r.id,
    url: r.url,
    description: r.description,
    events: r.events ?? [],
    isActive: r.isActive,
    consecutiveFailures: r.consecutiveFailures,
    totalDeliveries: r.totalDeliveries,
    lastSuccessAt: r.lastSuccessAt,
    lastFailureAt: r.lastFailureAt,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

function unwrap(err: unknown): unknown {
  let current: unknown = err;
  for (let i = 0; i < 5; i++) {
    if (
      current &&
      typeof current === 'object' &&
      'cause' in current &&
      (current as { cause?: unknown }).cause
    ) {
      current = (current as { cause: unknown }).cause;
    } else {
      return current;
    }
  }
  return current;
}

function clampLimit(raw: string | undefined, def: number): number {
  const n = Number(raw ?? String(def));
  if (!Number.isFinite(n) || n <= 0) return def;
  return Math.min(Math.max(Math.floor(n), 1), 200);
}
