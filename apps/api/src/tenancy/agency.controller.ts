import { Controller, Get, Inject } from '@nestjs/common';
import { and, eq, gte, inArray, isNull, lt, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';

export interface AgencyBusinessRow {
  businessId: string;
  businessSlug: string;
  businessName: string;
  status: string;
  roleName: string;
  branding: { accentColor?: string; logoUrl?: string; publicName?: string } | null;
  /**
   * Today's UTC sales — null when the caller's role in THAT business
   * lacks `reports.sales.view` (money visibility is a per-business
   * grant; membership alone shows only the card).
   */
  todaySalesCents: number | null;
  todaySaleCount: number | null;
  openOrdersCount: number | null;
}

/**
 * Cross-business roll-up for people who run several businesses on the
 * platform (an agency, a franchise owner, a multi-store operator).
 * Deliberately NOT @TenantScoped — it aggregates across every business
 * the signed-in user belongs to, following the same pattern as
 * `GET /v1/auth/me`: the query itself is scoped to the caller's active
 * memberships, so nobody sees a business they aren't a member of.
 */
@Controller('v1/agency')
export class AgencyController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  @Get('overview')
  async overview(
    @CurrentUser() user: CurrentUserPayload,
  ): Promise<{ businesses: AgencyBusinessRow[] }> {
    const memberships = await this.db
      .select({
        businessId: schema.businesses.id,
        businessSlug: schema.businesses.slug,
        businessName: schema.businesses.name,
        status: schema.businesses.status,
        brandingJson: schema.businesses.brandingJson,
        roleId: schema.memberships.roleId,
        roleName: schema.roles.name,
      })
      .from(schema.memberships)
      .innerJoin(schema.businesses, eq(schema.businesses.id, schema.memberships.businessId))
      .innerJoin(schema.roles, eq(schema.roles.id, schema.memberships.roleId))
      .where(and(eq(schema.memberships.userId, user.id), eq(schema.memberships.status, 'active')));
    if (memberships.length === 0) return { businesses: [] };

    // Which of the caller's roles may see money?
    const roleIds = [...new Set(memberships.map((m) => m.roleId))];
    const grants = await this.db
      .select({ roleId: schema.rolePermissions.roleId })
      .from(schema.rolePermissions)
      .where(
        and(
          inArray(schema.rolePermissions.roleId, roleIds),
          eq(schema.rolePermissions.permission, 'reports.sales.view'),
        ),
      );
    const canSeeMoney = new Set(grants.map((g) => g.roleId));

    const businessIds = memberships.map((m) => m.businessId);
    const moneyIds = memberships
      .filter((m) => user.isSuperAdmin || canSeeMoney.has(m.roleId))
      .map((m) => m.businessId);

    const dayStart = new Date(`${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`);
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const salesByBusiness = new Map<string, { totalCents: number; count: number }>();
    const ordersByBusiness = new Map<string, number>();
    if (moneyIds.length > 0) {
      const salesRows = await this.db
        .select({
          businessId: schema.sales.businessId,
          totalCents: sql<number>`COALESCE(SUM(${schema.sales.totalCents}), 0)::int`,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(schema.sales)
        .where(
          and(
            inArray(schema.sales.businessId, moneyIds),
            gte(schema.sales.completedAt, dayStart),
            lt(schema.sales.completedAt, dayEnd),
            sql`${schema.sales.status} IN ('completed', 'partially_refunded', 'refunded')`,
            isNull(schema.sales.importedAt),
          ),
        )
        .groupBy(schema.sales.businessId);
      for (const r of salesRows) {
        salesByBusiness.set(r.businessId, { totalCents: r.totalCents, count: r.count });
      }

      const orderRows = await this.db
        .select({
          businessId: schema.orders.businessId,
          count: sql<number>`COUNT(*)::int`,
        })
        .from(schema.orders)
        .where(
          and(
            inArray(schema.orders.businessId, moneyIds),
            sql`${schema.orders.status} IN ('open', 'confirmed', 'partially_fulfilled', 'fulfilled')`,
          ),
        )
        .groupBy(schema.orders.businessId);
      for (const r of orderRows) ordersByBusiness.set(r.businessId, r.count);
    }
    void businessIds;

    const businesses: AgencyBusinessRow[] = memberships.map((m) => {
      const money = user.isSuperAdmin || canSeeMoney.has(m.roleId);
      const sales = salesByBusiness.get(m.businessId);
      return {
        businessId: m.businessId,
        businessSlug: m.businessSlug,
        businessName: m.businessName,
        status: m.status,
        roleName: m.roleName,
        branding: (m.brandingJson as AgencyBusinessRow['branding']) ?? null,
        todaySalesCents: money ? (sales?.totalCents ?? 0) : null,
        todaySaleCount: money ? (sales?.count ?? 0) : null,
        openOrdersCount: money ? (ordersByBusiness.get(m.businessId) ?? 0) : null,
      };
    });
    businesses.sort((a, b) => a.businessName.localeCompare(b.businessName));
    return { businesses };
  }
}
