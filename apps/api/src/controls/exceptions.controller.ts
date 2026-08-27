import {
  BadRequestException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { and, eq, gte, isNull, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import {
  buildPage,
  clampLimit,
  decodeCursor,
  timestampCursorOrder,
  timestampCursorWhere,
  type PageResponse,
} from '../common/pagination';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface ExceptionRow {
  id: string;
  type: string;
  severity: string;
  actorUserId: string | null;
  actorEmail: string | null;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  metadataJson: unknown;
  acknowledgedAt: Date | null;
  acknowledgedByEmail: string | null;
  createdAt: Date;
}

interface DigestRow {
  actorUserId: string | null;
  actorEmail: string | null;
  total: number;
  byType: Record<string, number>;
}

/**
 * The exception register (PLAN-STORIS-GAP §0.3): filterable, severity-
 * tagged, acknowledge-able — the artifact that catches people, unlike a
 * feed that gets scrolled past. `/digest` is §2's highest-ROI report:
 * per-associate exception counts over a window, ranked, so outliers
 * surface themselves.
 */
@TenantScoped()
@Controller('v1/exceptions')
export class ExceptionsController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  @Get()
  @RequirePermission('audit.view')
  async list(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('open') open?: string,
    @Query('severity') severity?: string,
    @Query('type') type?: string,
    @Query('actorUserId') actorUserId?: string,
    @Query('limit') limitStr?: string,
    @Query('cursor') cursorStr?: string,
  ): Promise<PageResponse<ExceptionRow>> {
    const limit = clampLimit(limitStr);
    const cursor = decodeCursor(cursorStr);
    const actor = alias(schema.users, 'actor');
    const ackUser = alias(schema.users, 'ack_user');

    const conditions: (SQL | undefined)[] = [
      eq(schema.exceptionEvents.businessId, tenant.businessId!),
      open === '1' ? isNull(schema.exceptionEvents.acknowledgedAt) : undefined,
      severity ? eq(schema.exceptionEvents.severity, severity) : undefined,
      type ? eq(schema.exceptionEvents.type, type) : undefined,
      actorUserId ? eq(schema.exceptionEvents.actorUserId, actorUserId) : undefined,
    ];
    if (cursor) {
      conditions.push(
        timestampCursorWhere(schema.exceptionEvents.createdAt, schema.exceptionEvents.id, cursor)!,
      );
    }

    const rows = await this.db
      .select({
        id: schema.exceptionEvents.id,
        type: schema.exceptionEvents.type,
        severity: schema.exceptionEvents.severity,
        actorUserId: schema.exceptionEvents.actorUserId,
        actorEmail: actor.email,
        entityType: schema.exceptionEvents.entityType,
        entityId: schema.exceptionEvents.entityId,
        summary: schema.exceptionEvents.summary,
        metadataJson: schema.exceptionEvents.metadataJson,
        acknowledgedAt: schema.exceptionEvents.acknowledgedAt,
        acknowledgedByEmail: ackUser.email,
        createdAt: schema.exceptionEvents.createdAt,
      })
      .from(schema.exceptionEvents)
      .leftJoin(actor, eq(actor.id, schema.exceptionEvents.actorUserId))
      .leftJoin(ackUser, eq(ackUser.id, schema.exceptionEvents.acknowledgedByUserId))
      .where(and(...conditions))
      .orderBy(...timestampCursorOrder(schema.exceptionEvents.createdAt, schema.exceptionEvents.id))
      .limit(limit + 1);

    return buildPage(rows, limit, (r) => r.createdAt);
  }

  /** Per-associate ranked digest over the trailing window (default 7 days). */
  @Get('digest')
  @RequirePermission('audit.view')
  async digest(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('days') daysStr?: string,
  ): Promise<DigestRow[]> {
    const days = Math.min(90, Math.max(1, Number(daysStr) || 7));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.db
      .select({
        actorUserId: schema.exceptionEvents.actorUserId,
        actorEmail: schema.users.email,
        type: schema.exceptionEvents.type,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.exceptionEvents)
      .leftJoin(schema.users, eq(schema.users.id, schema.exceptionEvents.actorUserId))
      .where(
        and(
          eq(schema.exceptionEvents.businessId, tenant.businessId!),
          gte(schema.exceptionEvents.createdAt, since),
        ),
      )
      .groupBy(schema.exceptionEvents.actorUserId, schema.users.email, schema.exceptionEvents.type);

    const byActor = new Map<string, DigestRow>();
    for (const r of rows) {
      const key = r.actorUserId ?? 'system';
      const entry = byActor.get(key) ?? {
        actorUserId: r.actorUserId,
        actorEmail: r.actorEmail,
        total: 0,
        byType: {},
      };
      entry.total += r.count;
      entry.byType[r.type] = (entry.byType[r.type] ?? 0) + r.count;
      byActor.set(key, entry);
    }
    return [...byActor.values()].sort((a, b) => b.total - a.total);
  }

  @Post(':id/ack')
  @RequirePermission('audit.view')
  async acknowledge(
    @CurrentTenant() _tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<{ acknowledgedAt: Date }> {
    const [row] = await this.db
      .select()
      .from(schema.exceptionEvents)
      .where(eq(schema.exceptionEvents.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Exception not found');
    if (row.acknowledgedAt) {
      throw new BadRequestException('Exception is already acknowledged');
    }
    const now = new Date();
    await this.db
      .update(schema.exceptionEvents)
      .set({ acknowledgedAt: now, acknowledgedByUserId: actor?.id ?? null })
      .where(eq(schema.exceptionEvents.id, id));
    return { acknowledgedAt: now };
  }
}
