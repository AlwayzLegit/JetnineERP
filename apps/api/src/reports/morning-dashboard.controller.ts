import { BadRequestException, Controller, Get, Inject, Query } from '@nestjs/common';
import { and, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentTenant } from '../auth/current-user.decorator';
import { salesScopeCond } from '../common/sales-scope';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface StoreTile {
  locationId: string;
  locationName: string | null;
  saleCount: number;
  saleTotalCents: number;
  orderCount: number;
  orderTotalCents: number;
}

interface AssociateTile {
  userId: string | null;
  name: string | null;
  email: string | null;
  saleTotalCents: number;
  orderTotalCents: number;
  totalCents: number;
}

interface MorningDashboard {
  date: string;
  today: string;
  salesByStore: StoreTile[];
  salesByAssociate: AssociateTile[];
  deliveriesToday: {
    booked: number;
    cap: number;
    byStatus: Record<string, number>;
  };
  refundsCancellations: {
    id: string;
    action: string;
    actorEmail: string | null;
    orderNumber: string | null;
    createdAt: Date;
    changesJson: unknown;
  }[];
  modifiedOrders: {
    orderId: string;
    orderNumber: string | null;
    changeCount: number;
    actorEmails: string[];
  }[];
  openExceptions: {
    count: number;
    latest: { id: string; type: string; severity: string; summary: string; createdAt: Date }[];
  };
}

const REFUND_ACTIONS = [
  'order.return',
  'order.return_authorized',
  'order_return.cancel',
  'order.cancel',
  'order.price_adjustment',
  'sale.refund',
];
const MODIFY_ACTIONS = ['order.update', 'order.line.add', 'order.line.remove'];

/**
 * The P9 morning brief (PLAN-POS-OPERATIONS §12): yesterday's business
 * by store and by associate, today's truck load against the cap,
 * yesterday's refunds/cancellations with who did them, the daily
 * modification log, and the open exception count. The store-manager
 * view is the same endpoint scoped by `locationId`.
 *
 * Day boundaries are UTC calendar dates on created_at — consistent with
 * the Z-report convention already in use.
 */
@TenantScoped()
@Controller('v1/dashboard')
export class MorningDashboardController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  @Get('morning')
  @RequirePermission('reports.sales.view')
  async morning(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('date') dateStr?: string,
    @Query('locationId') locationId?: string,
  ): Promise<MorningDashboard> {
    const date = dateStr ?? new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }
    const today = new Date().toISOString().slice(0, 10);
    const businessId = tenant.businessId!;

    // --- Yesterday's business, by store ----------------------------------
    const saleAgg = await this.db
      .select({
        locationId: schema.sales.locationId,
        count: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${schema.sales.totalCents}), 0)::int`,
      })
      .from(schema.sales)
      .where(
        and(
          eq(schema.sales.businessId, businessId),
          eq(schema.sales.status, 'completed'),
          isNull(schema.sales.importedAt),
          sql`${schema.sales.createdAt}::date = ${date}`,
          locationId ? eq(schema.sales.locationId, locationId) : undefined,
          salesScopeCond(tenant, schema.sales.locationId),
        ),
      )
      .groupBy(schema.sales.locationId);
    const orderAgg = await this.db
      .select({
        locationId: schema.orders.locationId,
        count: sql<number>`count(*)::int`,
        total: sql<number>`coalesce(sum(${schema.orders.totalCents}), 0)::int`,
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.businessId, businessId),
          sql`${schema.orders.status} NOT IN ('draft', 'quote', 'cancelled')`,
          isNull(schema.orders.importedAt),
          sql`${schema.orders.createdAt}::date = ${date}`,
          salesScopeCond(tenant, schema.orders.locationId),
          locationId ? eq(schema.orders.locationId, locationId) : undefined,
        ),
      )
      .groupBy(schema.orders.locationId);

    const storeMap = new Map<string, StoreTile>();
    const store = (id: string): StoreTile => {
      const s = storeMap.get(id) ?? {
        locationId: id,
        locationName: null,
        saleCount: 0,
        saleTotalCents: 0,
        orderCount: 0,
        orderTotalCents: 0,
      };
      storeMap.set(id, s);
      return s;
    };
    for (const r of saleAgg) {
      const s = store(r.locationId);
      s.saleCount = r.count;
      s.saleTotalCents = r.total;
    }
    for (const r of orderAgg) {
      const s = store(r.locationId);
      s.orderCount = r.count;
      s.orderTotalCents = r.total;
    }
    if (storeMap.size > 0) {
      const names = await this.db
        .select({ id: schema.locations.id, name: schema.locations.name })
        .from(schema.locations)
        .where(inArray(schema.locations.id, [...storeMap.keys()]));
      for (const n of names) {
        const s = storeMap.get(n.id);
        if (s) s.locationName = n.name;
      }
    }

    // --- Yesterday's business, by associate ------------------------------
    const associateMap = new Map<string, AssociateTile>();
    const associate = (userId: string): AssociateTile => {
      const a = associateMap.get(userId) ?? {
        userId,
        name: null,
        email: null,
        saleTotalCents: 0,
        orderTotalCents: 0,
        totalCents: 0,
      };
      associateMap.set(userId, a);
      return a;
    };
    const salesByUser = await this.db
      .select({
        userId: schema.sales.associateUserId,
        total: sql<number>`coalesce(sum(${schema.sales.totalCents}), 0)::int`,
      })
      .from(schema.sales)
      .where(
        and(
          eq(schema.sales.businessId, businessId),
          eq(schema.sales.status, 'completed'),
          isNull(schema.sales.importedAt),
          sql`${schema.sales.createdAt}::date = ${date}`,
          locationId ? eq(schema.sales.locationId, locationId) : undefined,
          salesScopeCond(tenant, schema.sales.locationId),
        ),
      )
      .groupBy(schema.sales.associateUserId);
    for (const r of salesByUser) {
      if (r.userId) associate(r.userId).saleTotalCents += r.total;
    }
    // Orders attribute by salesperson membership with the split applied.
    const dayOrders = await this.db
      .select({
        totalCents: schema.orders.totalCents,
        primary: schema.orders.salespersonMembershipId,
        second: schema.orders.secondSalespersonMembershipId,
        splitBps: schema.orders.splitBps,
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.businessId, businessId),
          sql`${schema.orders.status} NOT IN ('draft', 'quote', 'cancelled')`,
          isNull(schema.orders.importedAt),
          sql`${schema.orders.createdAt}::date = ${date}`,
          salesScopeCond(tenant, schema.orders.locationId),
          locationId ? eq(schema.orders.locationId, locationId) : undefined,
        ),
      );
    const membershipIds = [
      ...new Set(dayOrders.flatMap((o) => [o.primary, o.second]).filter(Boolean) as string[]),
    ];
    const memberUsers = new Map<string, string>();
    if (membershipIds.length > 0) {
      const rows = await this.db
        .select({ id: schema.memberships.id, userId: schema.memberships.userId })
        .from(schema.memberships)
        .where(inArray(schema.memberships.id, membershipIds));
      for (const r of rows) memberUsers.set(r.id, r.userId);
    }
    for (const o of dayOrders) {
      if (!o.primary) continue;
      const primaryUser = memberUsers.get(o.primary);
      const secondUser = o.second ? memberUsers.get(o.second) : null;
      const split = o.second && o.splitBps != null ? o.splitBps : 10000;
      if (primaryUser) {
        associate(primaryUser).orderTotalCents += Math.round((o.totalCents * split) / 10000);
      }
      if (secondUser) {
        associate(secondUser).orderTotalCents += Math.round(
          (o.totalCents * (10000 - split)) / 10000,
        );
      }
    }
    if (associateMap.size > 0) {
      const users = await this.db
        .select({ id: schema.users.id, name: schema.users.name, email: schema.users.email })
        .from(schema.users)
        .where(inArray(schema.users.id, [...associateMap.keys()]));
      for (const u of users) {
        const a = associateMap.get(u.id);
        if (a) {
          a.name = u.name;
          a.email = u.email;
        }
      }
    }
    for (const a of associateMap.values()) a.totalCents = a.saleTotalCents + a.orderTotalCents;

    // --- Today's deliveries vs the cap -----------------------------------
    const deliveriesToday = await this.db
      .select({
        status: schema.deliveries.status,
        count: sql<number>`count(*)::int`,
      })
      .from(schema.deliveries)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.deliveries.orderId))
      .where(
        and(
          eq(schema.deliveries.businessId, businessId),
          eq(schema.deliveries.scheduledDate, today),
          sql`${schema.deliveries.status} != 'cancelled'`,
          locationId ? eq(schema.orders.locationId, locationId) : undefined,
        ),
      )
      .groupBy(schema.deliveries.status);
    const byStatus: Record<string, number> = {};
    let booked = 0;
    for (const r of deliveriesToday) {
      byStatus[r.status] = r.count;
      booked += r.count;
    }
    const [biz] = await this.db
      .select({ ops: schema.businesses.opsSettingsJson })
      .from(schema.businesses)
      .where(eq(schema.businesses.id, businessId))
      .limit(1);
    const cap = (biz?.ops as { deliveryDailyCap?: number } | null)?.deliveryDailyCap ?? 15;

    // --- Refunds / cancellations with the associate ----------------------
    const refundRows = await this.db
      .select({
        id: schema.auditLogs.id,
        action: schema.auditLogs.action,
        actorEmail: schema.users.email,
        targetType: schema.auditLogs.targetType,
        targetId: schema.auditLogs.targetId,
        changesJson: schema.auditLogs.changesJson,
        createdAt: schema.auditLogs.createdAt,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId))
      .where(
        and(
          eq(schema.auditLogs.businessId, businessId),
          inArray(schema.auditLogs.action, REFUND_ACTIONS),
          sql`${schema.auditLogs.createdAt}::date = ${date}`,
        ),
      )
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(50);

    // --- The daily modification log --------------------------------------
    const modRows = await this.db
      .select({
        actorEmail: schema.users.email,
        targetId: schema.auditLogs.targetId,
      })
      .from(schema.auditLogs)
      .leftJoin(schema.users, eq(schema.users.id, schema.auditLogs.actorUserId))
      .where(
        and(
          eq(schema.auditLogs.businessId, businessId),
          inArray(schema.auditLogs.action, MODIFY_ACTIONS),
          sql`${schema.auditLogs.createdAt}::date = ${date}`,
        ),
      );
    const modByOrder = new Map<string, { changeCount: number; actorEmails: Set<string> }>();
    for (const r of modRows) {
      if (!r.targetId) continue;
      const m = modByOrder.get(r.targetId) ?? { changeCount: 0, actorEmails: new Set<string>() };
      m.changeCount += 1;
      if (r.actorEmail) m.actorEmails.add(r.actorEmail);
      modByOrder.set(r.targetId, m);
    }

    // Resolve order numbers for both audit-derived tiles.
    const orderIds = [
      ...new Set(
        [
          ...refundRows
            .filter((r) => r.targetType === 'order' && r.targetId)
            .map((r) => r.targetId!),
          ...modByOrder.keys(),
        ].filter(Boolean),
      ),
    ];
    const numberById = new Map<string, string>();
    if (orderIds.length > 0) {
      const rows = await this.db
        .select({ id: schema.orders.id, number: schema.orders.number })
        .from(schema.orders)
        .where(inArray(schema.orders.id, orderIds));
      for (const r of rows) numberById.set(r.id, r.number);
    }

    // --- Open exceptions --------------------------------------------------
    const [openCount] = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.exceptionEvents)
      .where(
        and(
          eq(schema.exceptionEvents.businessId, businessId),
          isNull(schema.exceptionEvents.acknowledgedAt),
        ),
      );
    const latestExceptions = await this.db
      .select({
        id: schema.exceptionEvents.id,
        type: schema.exceptionEvents.type,
        severity: schema.exceptionEvents.severity,
        summary: schema.exceptionEvents.summary,
        createdAt: schema.exceptionEvents.createdAt,
      })
      .from(schema.exceptionEvents)
      .where(
        and(
          eq(schema.exceptionEvents.businessId, businessId),
          isNull(schema.exceptionEvents.acknowledgedAt),
        ),
      )
      .orderBy(desc(schema.exceptionEvents.createdAt))
      .limit(5);

    return {
      date,
      today,
      salesByStore: [...storeMap.values()].sort(
        (a, b) => b.saleTotalCents + b.orderTotalCents - (a.saleTotalCents + a.orderTotalCents),
      ),
      salesByAssociate: [...associateMap.values()].sort((a, b) => b.totalCents - a.totalCents),
      deliveriesToday: { booked, cap, byStatus },
      refundsCancellations: refundRows.map((r) => ({
        id: r.id,
        action: r.action,
        actorEmail: r.actorEmail,
        orderNumber: r.targetId ? (numberById.get(r.targetId) ?? null) : null,
        createdAt: r.createdAt,
        changesJson: r.changesJson,
      })),
      modifiedOrders: [...modByOrder.entries()]
        .map(([orderId, m]) => ({
          orderId,
          orderNumber: numberById.get(orderId) ?? null,
          changeCount: m.changeCount,
          actorEmails: [...m.actorEmails],
        }))
        .sort((a, b) => b.changeCount - a.changeCount)
        .slice(0, 20),
      openExceptions: { count: openCount?.count ?? 0, latest: latestExceptions },
    };
  }
}
