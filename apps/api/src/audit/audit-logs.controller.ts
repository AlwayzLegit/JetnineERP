import { Controller, Get, Inject, Query, Res } from '@nestjs/common';
import { and, desc, eq, gte, lt } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { Response } from 'express';
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
import { AuditService } from './audit.service';

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
 * (user_id), action, target (type + id), date range. Cursor-paginated
 * newest-first. The target filter is what turns this into a per-record
 * timeline — the order detail page reads its history through it.
 */
@TenantScoped()
@Controller('v1/audit-logs')
export class AuditLogsController {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  @Get()
  @RequirePermission('audit.view')
  async list(
    @Query('actorUserId') actorUserId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
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
    if (targetType) conditions.push(eq(schema.auditLogs.targetType, targetType));
    if (targetId) conditions.push(eq(schema.auditLogs.targetId, targetId));
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

  /**
   * AUD-006 (sysadmin pack): the audit stream is exportable — same
   * filters as the list, CSV, capped at 10,000 rows newest-first. The
   * export is itself an audit event (AUD-003: privileged reads are
   * events), so pulling the log leaves a trace in the log.
   */
  @Get('export.csv')
  @RequirePermission('audit.view')
  async exportCsv(
    @Res() res: Response,
    @Query('actorUserId') actorUserId?: string,
    @Query('action') action?: string,
    @Query('targetType') targetType?: string,
    @Query('targetId') targetId?: string,
    @Query('since') since?: string,
    @Query('until') until?: string,
  ): Promise<void> {
    const db = getRequestDb();
    const conditions: SQL[] = [];
    if (actorUserId) conditions.push(eq(schema.auditLogs.actorUserId, actorUserId));
    if (action) conditions.push(eq(schema.auditLogs.action, action));
    if (targetType) conditions.push(eq(schema.auditLogs.targetType, targetType));
    if (targetId) conditions.push(eq(schema.auditLogs.targetId, targetId));
    if (since) {
      const d = new Date(since);
      if (!Number.isNaN(d.getTime())) conditions.push(gte(schema.auditLogs.createdAt, d));
    }
    if (until) {
      const d = new Date(until);
      if (!Number.isNaN(d.getTime())) conditions.push(lt(schema.auditLogs.createdAt, d));
    }

    const rows = await db
      .select({
        createdAt: schema.auditLogs.createdAt,
        action: schema.auditLogs.action,
        actorEmail: schema.users.email,
        actorType: schema.auditLogs.actorType,
        targetType: schema.auditLogs.targetType,
        targetId: schema.auditLogs.targetId,
        changesJson: schema.auditLogs.changesJson,
        ip: schema.auditLogs.ip,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(schema.auditLogs.createdAt), desc(schema.auditLogs.id))
      .limit(10_000);

    await this.audit.log({
      action: 'audit.export',
      targetType: 'audit_log',
      metadata: {
        rows: rows.length,
        filters: { actorUserId, action, targetType, targetId, since, until },
      },
    });

    const esc = (v: unknown): string => {
      if (v == null) return '';
      const s = typeof v === 'string' ? v : JSON.stringify(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = 'created_at,action,actor_email,actor_type,target_type,target_id,changes,ip';
    const lines = rows.map((r) =>
      [
        r.createdAt.toISOString(),
        r.action,
        r.actorEmail,
        r.actorType,
        r.targetType,
        r.targetId,
        r.changesJson,
        r.ip,
      ]
        .map(esc)
        .join(','),
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
    res.send([header, ...lines].join('\n'));
  }
}
