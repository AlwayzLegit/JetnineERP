import { Controller, Get, Query } from '@nestjs/common';
import { and, eq, inArray } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { schema } from '@jetnine/db';
import {
  buildPage,
  clampLimit,
  decodeCursor,
  timestampCursorOrder,
  timestampCursorWhere,
  type PageResponse,
} from '../common/pagination';
import { TenantScoped, RequirePermission } from '../tenancy/decorators';
import { getRequestDb } from '../tenancy/request-context';

/**
 * The audit actions that count as "post-creation order changes" for the
 * owner notifications feed (PLAN-POS-OPERATIONS §4/§12). Cap overrides,
 * lock overrides, and close-out exceptions join this list when their
 * phases land (P5/P9) — they'll be audit actions too, so this endpoint
 * is the single feed for all of them.
 */
const NOTABLE_ACTIONS = [
  'order.update',
  'order.line.add',
  'order.line.remove',
  'order.cancel',
  'order.payment.take',
  'order.unlock',
] as const;

const ACTION_LABELS: Record<string, string> = {
  'order.update': 'Order edited',
  'order.line.add': 'Line added',
  'order.line.remove': 'Line removed',
  'order.cancel': 'Order cancelled',
  'order.payment.take': 'Payment taken',
  'order.unlock': 'Order unlocked (lock override)',
};

interface NotificationRow {
  id: string;
  action: string;
  label: string;
  actorName: string | null;
  actorEmail: string | null;
  orderId: string | null;
  orderNumber: string | null;
  changesJson: unknown;
  createdAt: Date;
}

/**
 * Owner dashboard notifications feed: every post-creation order change,
 * derived from the audit log rather than stored separately — the audit
 * trail is already the source of truth for "what changed, by whom".
 * Gated by audit.view (the owner/admin permission) for now; the
 * store-manager-scoped variant is P9 dashboard work.
 */
@TenantScoped()
@Controller('v1/notifications')
export class NotificationsController {
  @Get()
  @RequirePermission('audit.view')
  async list(
    @Query('limit') limitStr?: string,
    @Query('cursor') cursorStr?: string,
  ): Promise<PageResponse<NotificationRow>> {
    const limit = clampLimit(limitStr, 20);
    const db = getRequestDb();

    const conditions: SQL[] = [
      inArray(schema.auditLogs.action, [...NOTABLE_ACTIONS]),
      eq(schema.auditLogs.targetType, 'order'),
    ];
    const cursor = decodeCursor(cursorStr);
    const cursorWhere = timestampCursorWhere(
      schema.auditLogs.createdAt,
      schema.auditLogs.id,
      cursor,
    );
    if (cursorWhere) conditions.push(cursorWhere);

    const rows = await db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        actorName: schema.users.name,
        actorEmail: schema.users.email,
        targetId: schema.auditLogs.targetId,
        changesJson: schema.auditLogs.changesJson,
        createdAt: schema.auditLogs.createdAt,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId))
      .where(and(...conditions))
      .orderBy(...timestampCursorOrder(schema.auditLogs.createdAt, schema.auditLogs.id))
      .limit(limit + 1);

    // Resolve order numbers for the page in one query. targetId is text
    // (audit rows outlive their targets), so orders that were hard-deleted
    // simply resolve to null.
    const orderIds = [...new Set(rows.map((r) => r.targetId).filter((v): v is string => !!v))];
    const numbers = new Map<string, string>();
    if (orderIds.length > 0) {
      const orders = await db
        .select({ id: schema.orders.id, number: schema.orders.number })
        .from(schema.orders)
        .where(inArray(schema.orders.id, orderIds));
      for (const o of orders) numbers.set(o.id, o.number);
    }

    const enriched = rows.map((r) => ({
      id: r.id,
      action: r.action,
      label: ACTION_LABELS[r.action] ?? r.action,
      actorName: r.actorName ?? null,
      actorEmail: r.actorEmail ?? null,
      orderId: r.targetId,
      orderNumber: r.targetId ? (numbers.get(r.targetId) ?? null) : null,
      changesJson: r.changesJson,
      createdAt: r.createdAt,
    }));
    return buildPage(enriched, limit, (r) => r.createdAt);
  }
}
