import { Controller, Get, Query } from '@nestjs/common';
import { and, desc, eq, gte, lt } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { schema } from '@jetnine/db';
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
 * (user_id), action, date range. Cursor-based pagination would land in a
 * later pass; for now we cap at 200 rows newest-first.
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
  ): Promise<AuditLogRow[]> {
    const limit = clampLimit(limitStr);
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
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(limit);

    return rows.map((r) => ({
      ...r,
      actorEmail: r.actorEmail ?? null,
    }));
  }
}

function clampLimit(raw: string | undefined): number {
  const n = Number(raw ?? '50');
  if (!Number.isFinite(n) || n <= 0) return 50;
  return Math.min(Math.max(Math.floor(n), 1), 200);
}
