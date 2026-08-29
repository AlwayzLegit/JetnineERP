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
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import {
  buildPage,
  clampLimit as clampPageLimit,
  decodeCursor,
  timestampCursorOrder,
  timestampCursorWhere,
  type PageResponse,
} from '../common/pagination';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { WebhookDispatcher } from '../webhooks/webhook-dispatcher.service';

interface CustomerRow {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  notes: string | null;
  addressesJson: unknown;
  referralSource: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBody {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  notes?: string | null;
  addressesJson?: unknown;
  referralSource?: string | null;
}

type UpdateBody = CreateBody;

@TenantScoped()
@Controller('v1/customers')
export class CustomersController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(WebhookDispatcher) private readonly webhooks: WebhookDispatcher,
  ) {}

  /**
   * List customers, optionally filtered by `q` (matches name, email,
   * phone via the customers.search_tsv generated tsvector).
   */
  @Get()
  @RequirePermission('customers.view')
  async list(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('q') q?: string,
    @Query('limit') limitStr?: string,
    @Query('cursor') cursorStr?: string,
  ): Promise<PageResponse<CustomerRow>> {
    const limit = clampPageLimit(limitStr);
    if (q && q.trim().length > 0) {
      // Search returns ts_rank-ordered results; cursor pagination over a
      // dynamic ranking is not meaningful, so a single page is returned
      // with `nextCursor: null`. Clients refine with the next query.
      const normalized = q.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
      const tsq = sql`websearch_to_tsquery('simple', ${normalized})`;
      const data = await this.db
        .select(SELECT_COLS)
        .from(schema.customers)
        .where(sql`${schema.customers.searchTsv} @@ ${tsq}`)
        .orderBy(desc(sql`ts_rank(${schema.customers.searchTsv}, ${tsq})`))
        .limit(limit);
      return { data, nextCursor: null };
    }
    const cursor = decodeCursor(cursorStr);
    const where = cursor
      ? timestampCursorWhere(schema.customers.createdAt, schema.customers.id, cursor)
      : undefined;
    const rows = await this.db
      .select(SELECT_COLS)
      .from(schema.customers)
      .where(where)
      .orderBy(...timestampCursorOrder(schema.customers.createdAt, schema.customers.id))
      .limit(limit + 1);
    return buildPage(rows, limit, (r) => r.createdAt);
  }

  @Get(':id')
  @RequirePermission('customers.view')
  async get(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<CustomerRow & { recentSales: SaleSummary[] }> {
    const [row] = await this.db
      .select(SELECT_COLS)
      .from(schema.customers)
      .where(eq(schema.customers.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Customer not found');

    // Recent sales for the purchase-history section. Epic 1.10 will start
    // populating sales rows; until then this is just an empty list, which
    // the page renders as "no purchases yet".
    const recentSales = await this.db
      .select({
        id: schema.sales.id,
        number: schema.sales.number,
        status: schema.sales.status,
        totalCents: schema.sales.totalCents,
        completedAt: schema.sales.completedAt,
        createdAt: schema.sales.createdAt,
      })
      .from(schema.sales)
      .where(eq(schema.sales.customerId, id))
      .orderBy(desc(schema.sales.createdAt))
      .limit(20);

    return { ...row, recentSales };
  }

  /**
   * Customer 360 summary (Sales Views Phase 4): lifetime and
   * year-to-date activity totals over POS sales + orders, and the open
   * orders with their computed balance (Balance = Total − Amount Paid —
   * derived, never stored). Imported documents count toward totals:
   * their history is real even though their money flows are excluded
   * elsewhere.
   */
  @Get(':id/summary')
  @RequirePermission('customers.view')
  async summary(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{
    lifetime: { documents: number; totalCents: number };
    ytd: { documents: number; totalCents: number };
    openOrders: {
      id: string;
      number: string;
      status: string;
      totalCents: number;
      paidCents: number;
      balanceCents: number;
      requestedDate: string | null;
    }[];
  }> {
    const [exists] = await this.db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(eq(schema.customers.id, id))
      .limit(1);
    if (!exists) throw new NotFoundException('Customer not found');
    const yearStart = new Date(Date.UTC(new Date().getUTCFullYear(), 0, 1));

    const [saleTotals] = await this.db
      .select({
        documents: sql<number>`COUNT(*)::int`,
        totalCents: sql<number>`COALESCE(SUM(${schema.sales.totalCents}), 0)::int`,
        ytdDocuments: sql<number>`COUNT(*) FILTER (WHERE ${schema.sales.completedAt} >= ${yearStart.toISOString()}::timestamptz)::int`,
        ytdTotalCents: sql<number>`COALESCE(SUM(${schema.sales.totalCents}) FILTER (WHERE ${schema.sales.completedAt} >= ${yearStart.toISOString()}::timestamptz), 0)::int`,
      })
      .from(schema.sales)
      .where(
        and(
          eq(schema.sales.customerId, id),
          sql`${schema.sales.status} IN ('completed', 'partially_refunded', 'refunded')`,
        ),
      );
    const [orderTotals] = await this.db
      .select({
        documents: sql<number>`COUNT(*)::int`,
        totalCents: sql<number>`COALESCE(SUM(${schema.orders.totalCents}), 0)::int`,
        ytdDocuments: sql<number>`COUNT(*) FILTER (WHERE ${schema.orders.createdAt} >= ${yearStart.toISOString()}::timestamptz)::int`,
        ytdTotalCents: sql<number>`COALESCE(SUM(${schema.orders.totalCents}) FILTER (WHERE ${schema.orders.createdAt} >= ${yearStart.toISOString()}::timestamptz), 0)::int`,
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.customerId, id),
          sql`${schema.orders.status} NOT IN ('draft', 'quote', 'cancelled')`,
        ),
      );

    const open = await this.db
      .select({
        id: schema.orders.id,
        number: schema.orders.number,
        status: schema.orders.status,
        totalCents: schema.orders.totalCents,
        requestedDate: schema.orders.requestedDate,
      })
      .from(schema.orders)
      .where(
        and(
          eq(schema.orders.customerId, id),
          sql`${schema.orders.status} NOT IN ('draft', 'quote', 'cancelled', 'completed')`,
        ),
      )
      .orderBy(desc(schema.orders.createdAt))
      .limit(50);
    const paid = open.length
      ? await this.db
          .select({
            orderId: schema.payments.orderId,
            paidCents: sql<number>`COALESCE(SUM(${schema.payments.amountCents}), 0)::int`,
          })
          .from(schema.payments)
          .where(
            and(
              inArray(
                schema.payments.orderId,
                open.map((o) => o.id),
              ),
              eq(schema.payments.status, 'succeeded'),
            ),
          )
          .groupBy(schema.payments.orderId)
      : [];
    const paidBy = new Map(paid.map((p) => [p.orderId, p.paidCents]));

    return {
      lifetime: {
        documents: (saleTotals?.documents ?? 0) + (orderTotals?.documents ?? 0),
        totalCents: (saleTotals?.totalCents ?? 0) + (orderTotals?.totalCents ?? 0),
      },
      ytd: {
        documents: (saleTotals?.ytdDocuments ?? 0) + (orderTotals?.ytdDocuments ?? 0),
        totalCents: (saleTotals?.ytdTotalCents ?? 0) + (orderTotals?.ytdTotalCents ?? 0),
      },
      openOrders: open.map((o) => {
        const paidCents = paidBy.get(o.id) ?? 0;
        return { ...o, paidCents, balanceCents: o.totalCents - paidCents };
      }),
    };
  }

  @Post()
  @RequirePermission('customers.create')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: CreateBody,
  ): Promise<CustomerRow> {
    if (!hasAnyIdentity(body)) {
      throw new BadRequestException(
        'At least one of firstName, lastName, email, or phone is required',
      );
    }
    const [row] = await this.db
      .insert(schema.customers)
      .values({
        businessId: tenant.businessId!,
        email: normalize(body.email),
        phone: normalize(body.phone),
        firstName: normalize(body.firstName),
        lastName: normalize(body.lastName),
        notes: normalize(body.notes),
        addressesJson: (body.addressesJson ?? null) as never,
        referralSource: normalize(body.referralSource),
      })
      .returning(SELECT_COLS);
    if (!row) throw new BadRequestException('failed to create customer');
    await this.audit.log({
      action: 'customer.create',
      targetType: 'customer',
      targetId: row.id,
      after: {
        email: row.email,
        phone: row.phone,
        firstName: row.firstName,
        lastName: row.lastName,
      },
    });
    void this.webhooks.fire({
      businessId: tenant.businessId!,
      eventType: 'customer.created',
      payload: {
        customerId: row.id,
        email: row.email,
        phone: row.phone,
        firstName: row.firstName,
        lastName: row.lastName,
      },
    });
    return row;
  }

  @Patch(':id')
  @RequirePermission('customers.update')
  async update(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: UpdateBody,
  ): Promise<CustomerRow> {
    const [existing] = await this.db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Customer not found');

    const update: Partial<typeof schema.customers.$inferInsert> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    for (const key of [
      'email',
      'phone',
      'firstName',
      'lastName',
      'notes',
      'referralSource',
    ] as const) {
      const v = body[key as keyof UpdateBody];
      if (v !== undefined) {
        const next = normalize(v as string | null | undefined);
        if (next !== existing[key]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (update as any)[key] = next;
          before[key] = existing[key];
          after[key] = next;
        }
      }
    }
    if (body.addressesJson !== undefined) {
      update.addressesJson = body.addressesJson as never;
      before.addressesJson = existing.addressesJson;
      after.addressesJson = body.addressesJson;
    }

    if (Object.keys(after).length === 0) {
      const [unchanged] = await this.db
        .select(SELECT_COLS)
        .from(schema.customers)
        .where(eq(schema.customers.id, id))
        .limit(1);
      return unchanged!;
    }

    const [updated] = await this.db
      .update(schema.customers)
      .set(update)
      .where(eq(schema.customers.id, id))
      .returning(SELECT_COLS);
    if (!updated) throw new NotFoundException('Customer not found after update');

    await this.audit.log({
      action: 'customer.update',
      targetType: 'customer',
      targetId: id,
      before,
      after,
    });
    return updated;
  }

  @Delete(':id')
  @RequirePermission('customers.delete')
  async delete(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Customer not found');
    // Sales reference customers via ON DELETE SET NULL, so removing the
    // customer record preserves the historical sale.
    await this.db.delete(schema.customers).where(eq(schema.customers.id, id));
    await this.audit.log({
      action: 'customer.delete',
      targetType: 'customer',
      targetId: id,
      before: {
        email: existing.email,
        phone: existing.phone,
        firstName: existing.firstName,
        lastName: existing.lastName,
      },
    });
    return { deleted: true };
  }
}

interface SaleSummary {
  id: string;
  number: string;
  status: string;
  totalCents: number;
  completedAt: Date | null;
  createdAt: Date;
}

const SELECT_COLS = {
  id: schema.customers.id,
  email: schema.customers.email,
  phone: schema.customers.phone,
  firstName: schema.customers.firstName,
  lastName: schema.customers.lastName,
  notes: schema.customers.notes,
  addressesJson: schema.customers.addressesJson,
  referralSource: schema.customers.referralSource,
  createdAt: schema.customers.createdAt,
  updatedAt: schema.customers.updatedAt,
} as const;

function normalize(v: string | null | undefined): string | null {
  if (v == null) return null;
  const trimmed = String(v).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function hasAnyIdentity(body: CreateBody): boolean {
  return Boolean(
    normalize(body.firstName) ||
    normalize(body.lastName) ||
    normalize(body.email) ||
    normalize(body.phone),
  );
}

void and;
