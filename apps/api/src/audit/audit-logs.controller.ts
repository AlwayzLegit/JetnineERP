import { Controller, Get, Query } from '@nestjs/common';
import { and, eq, gte, lt } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { schema } from '@jetnine/db';
import {
  buildPage,
  clampLimit as clampPageLimit,
  decodeCursor,
  timestampCursorOrder,
  timestampCursorWhere,
  type PageResponse,
} from '../common/pagination';
import { TenantScoped, RequirePermission } from '../tenancy/decorators';
import { getRequestDb } from '../tenancy/request-context';

interface AuditLogRow {
  id: string;
  action: string;
  actorUserId: string | null;
  actorEmail: string | null;
  actorType: string;
  targetType: string | null;
  targetId: string | null;
  changesJson: unknown;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

/**
 * Read-only viewer for the current business's audit log. Filters: actor
 * (user_id), action, date range. Cursor-paginated newest-first.
 */
@TenantScoped()
@Controller('v1/audit-logs')
export class AuditLogsController {
  @Get()
  @RequirePermission('audit.view')
  async list(
    @Query('actorUserId') actorUserId?: string,
    @Query('action') action?: string,
    @Query('since') since?: string,
    @Query('until') until?: string,
    @Query('limit') limitStr?: string,
    @Query('cursor') cursorStr?: string,
  ): Promise<PageResponse<AuditLogRow>> {
    const limit = clampPageLimit(limitStr);
    const db = getRequestDb();

    const conditions: SQL[] = [];
    if (actorUserId) conditions.push(eq(schema.auditLogs.actorUserId, actorUserId));
    if (action) conditions.push(eq(schema.auditLogs.action, action));
    if (since) {
      const sinceDate = new Date(since);
      if (!Number.isNaN(sinceDate.getTime())) {
        conditions.push(gte(schema.auditLogs.createdAt, sinceDate));
      }
    }
    if (until) {
      const untilDate = new Date(until);
      if (!Number.isNaN(untilDate.getTime())) {
        conditions.push(lt(schema.auditLogs.createdAt, untilDate));
      }
    }
    const cursor = decodeCursor(cursorStr);
    if (cursor) {
      conditions.push(
        timestampCursorWhere(schema.auditLogs.createdAt, schema.auditLogs.id, cursor)!,
      );
    }

    const where = conditions.length ? and(...conditions) : undefined;

    const rows = await db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        actorUserId: schema.auditLogs.actorUserId,
        actorEmail: schema.users.email,
        actorType: schema.auditLogs.actorType,
        targetType: schema.auditLogs.targetType,
        targetId: schema.auditLogs.targetId,
        changesJson: schema.auditLogs.changesJson,
        ip: schema.auditLogs.ip,
        userAgent: schema.auditLogs.userAgent,
        createdAt: schema.auditLogs.createdAt,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId))
      .where(where)
      .orderBy(...timestampCursorOrder(schema.auditLogs.createdAt, schema.auditLogs.id))
      .limit(limit + 1);

    const enriched = rows.map((r) => ({ ...r, actorEmail: r.actorEmail ?? null }));
    return buildPage(enriched, limit, (r) => r.createdAt);
  }
}
