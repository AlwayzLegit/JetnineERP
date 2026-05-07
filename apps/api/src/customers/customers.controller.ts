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
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface CustomerRow {
  id: string;
  email: string | null;
  phone: string | null;
  firstName: string | null;
  lastName: string | null;
  notes: string | null;
  addressesJson: unknown;
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
}

type UpdateBody = CreateBody;

@TenantScoped()
@Controller('v1/customers')
export class CustomersController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
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
  ): Promise<CustomerRow[]> {
    const limit = clampLimit(limitStr);
    if (q && q.trim().length > 0) {
      // Normalize the search input the same way the generated tsvector
      // does (replace punctuation with spaces) so a user typing
      // "bob@example" or "+1 (555) 999-9999" hits the same tokens that
      // were stored.
      const normalized = q.replace(/[^a-zA-Z0-9]+/g, ' ').trim();
      const tsq = sql`websearch_to_tsquery('simple', ${normalized})`;
      return this.db
        .select(SELECT_COLS)
        .from(schema.customers)
        .where(sql`${schema.customers.searchTsv} @@ ${tsq}`)
        .orderBy(desc(sql`ts_rank(${schema.customers.searchTsv}, ${tsq})`))
        .limit(limit);
    }
    return this.db
      .select(SELECT_COLS)
      .from(schema.customers)
      .orderBy(asc(schema.customers.lastName), asc(schema.customers.firstName))
      .limit(limit);
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

    for (const key of ['email', 'phone', 'firstName', 'lastName', 'notes'] as const) {
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

function clampLimit(raw: string | undefined): number {
  const n = Number(raw ?? '50');
  if (!Number.isFinite(n) || n <= 0) return 50;
  return Math.min(Math.max(Math.floor(n), 1), 200);
}

// `and` is imported but not currently used; keeping the import registered
// in case future filters (status, date) need composite WHERE clauses.
void and;
