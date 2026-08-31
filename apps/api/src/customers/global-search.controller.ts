import { Controller, Get, Inject, Query } from '@nestjs/common';
import { and, desc, eq, isNotNull, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentTenant } from '../auth/current-user.decorator';
import { salesScopeCond } from '../common/sales-scope';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface SearchResults {
  customers: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  }[];
  orders: {
    id: string;
    number: string;
    legacyNumber: string | null;
    status: string;
    totalCents: number;
    requestedDate: string | null;
    customerName: string | null;
  }[];
  sales: {
    id: string;
    number: string;
    totalCents: number;
    createdAt: Date;
    customerName: string | null;
    imported: boolean;
  }[];
}

const customerName = sql<string>`NULLIF(TRIM(CONCAT(COALESCE(${schema.customers.firstName}, ''), ' ', COALESCE(${schema.customers.lastName}, ''))), '')`;

/**
 * The global omnibox (manager-dashboard handoff G1, the one Critical
 * finding): a caller identifies themselves by phone number or name, and
 * the person answering must reach their record from ANY page. One query
 * matches customers (name, email, phone — phone compared digits-to-
 * digits so "(818) 555-0199", "818.555.0199" and "8185550199" all hit)
 * and documents by number, current or legacy STORIS. Orders and sales
 * respect the caller's data scope like every list view.
 */
@TenantScoped()
@Controller('v1/search')
export class GlobalSearchController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  @Get()
  @RequirePermission('orders.view')
  async search(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('q') qRaw?: string,
  ): Promise<SearchResults> {
    const q = (qRaw ?? '').trim();
    if (q.length < 2) return { customers: [], orders: [], sales: [] };
    const like = `%${q}%`;
    const digits = q.replace(/\D/g, '');
    const businessId = tenant.businessId!;

    const customers = await this.db
      .select({
        id: schema.customers.id,
        name: customerName,
        phone: schema.customers.phone,
        email: schema.customers.email,
      })
      .from(schema.customers)
      .where(
        and(
          eq(schema.customers.businessId, businessId),
          or(
            sql`CONCAT(COALESCE(${schema.customers.firstName}, ''), ' ', COALESCE(${schema.customers.lastName}, '')) ILIKE ${like}`,
            sql`${schema.customers.email} ILIKE ${like}`,
            digits.length >= 3
              ? sql`(regexp_replace(COALESCE(${schema.customers.phone}, ''), '\\D', '', 'g') LIKE ${`%${digits}%`} OR regexp_replace(COALESCE(${schema.customers.phone2}, ''), '\\D', '', 'g') LIKE ${`%${digits}%`})`
              : sql`false`,
          ),
        ),
      )
      .orderBy(desc(schema.customers.updatedAt))
      .limit(8);

    const orders = await this.db
      .select({
        id: schema.orders.id,
        number: schema.orders.number,
        legacyNumber: schema.orders.legacyNumber,
        status: schema.orders.status,
        totalCents: schema.orders.totalCents,
        requestedDate: schema.orders.requestedDate,
        customerName,
      })
      .from(schema.orders)
      .leftJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
      .where(
        and(
          eq(schema.orders.businessId, businessId),
          or(
            sql`${schema.orders.number} ILIKE ${like}`,
            and(
              isNotNull(schema.orders.legacyNumber),
              sql`${schema.orders.legacyNumber} ILIKE ${like}`,
            ),
          ),
          salesScopeCond(tenant, schema.orders.locationId),
        ),
      )
      .orderBy(desc(schema.orders.createdAt))
      .limit(8);

    const sales = await this.db
      .select({
        id: schema.sales.id,
        number: schema.sales.number,
        totalCents: schema.sales.totalCents,
        createdAt: schema.sales.createdAt,
        customerName,
        imported: sql<boolean>`${schema.sales.importedAt} IS NOT NULL`,
      })
      .from(schema.sales)
      .leftJoin(schema.customers, eq(schema.customers.id, schema.sales.customerId))
      .where(
        and(
          eq(schema.sales.businessId, businessId),
          sql`${schema.sales.number} ILIKE ${like}`,
          salesScopeCond(tenant, schema.sales.locationId),
        ),
      )
      .orderBy(desc(schema.sales.createdAt))
      .limit(5);

    return { customers, orders, sales };
  }
}
