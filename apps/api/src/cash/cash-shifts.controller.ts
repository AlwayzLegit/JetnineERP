import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { and, eq, gte, isNull, lt, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import {
  buildPage,
  clampLimit,
  decodeCursor,
  timestampCursorOrder,
  timestampCursorWhere,
  type PageResponse,
} from '../common/pagination';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface OpenBody {
  locationId?: string;
  openingFloatCents?: number;
  notes?: string;
}

interface CloseBody {
  countedCashCents?: number;
  notes?: string;
}

interface ShiftRow {
  id: string;
  locationId: string;
  locationName: string | null;
  openedByUserId: string;
  openedByEmail: string | null;
  openedAt: Date;
  openingFloatCents: number;
  closedByUserId: string | null;
  closedByEmail: string | null;
  closedAt: Date | null;
  expectedCashCents: number | null;
  countedCashCents: number | null;
  varianceCents: number | null;
  notes: string | null;
}

@TenantScoped()
@Controller('v1/cash-shifts')
export class CashShiftsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /**
   * Open a new cash drawer shift at a location with an opening float
   * (in cents). Refuses to open if there's already an open shift at the
   * same location — close that one first.
   */
  @Post()
  @RequirePermission('pos.cash.open')
  async open(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: OpenBody,
  ): Promise<ShiftRow> {
    if (!body.locationId) throw new BadRequestException('locationId is required');
    if (
      typeof body.openingFloatCents !== 'number' ||
      !Number.isInteger(body.openingFloatCents) ||
      body.openingFloatCents < 0
    ) {
      throw new BadRequestException('openingFloatCents must be a non-negative integer');
    }
    const [location] = await this.db
      .select({ id: schema.locations.id })
      .from(schema.locations)
      .where(eq(schema.locations.id, body.locationId))
      .limit(1);
    if (!location) throw new NotFoundException('Location not found');

    const [existing] = await this.db
      .select({ id: schema.cashShifts.id })
      .from(schema.cashShifts)
      .where(
        and(eq(schema.cashShifts.locationId, body.locationId), isNull(schema.cashShifts.closedAt)),
      )
      .limit(1);
    if (existing) {
      throw new ConflictException(
        `An open cash shift already exists at this location (${existing.id})`,
      );
    }

    const [row] = await this.db
      .insert(schema.cashShifts)
      .values({
        businessId: tenant.businessId!,
        locationId: body.locationId,
        openedByUserId: actor.id,
        openingFloatCents: body.openingFloatCents,
        notes: body.notes ?? null,
      })
      .returning();
    if (!row) throw new BadRequestException('failed to open shift');

    await this.audit.log({
      action: 'cash_shift.open',
      targetType: 'cash_shift',
      targetId: row.id,
      after: {
        locationId: body.locationId,
        openingFloatCents: body.openingFloatCents,
      },
    });
    return this.hydrate(row.id);
  }

  /**
   * Close a shift: capture the counted cash, compute expected cash from
   * the cash payments that completed during the shift's window, and
   * persist the variance.
   */
  @Post(':id/close')
  @RequirePermission('pos.cash.reconcile')
  async close(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: CloseBody,
  ): Promise<ShiftRow> {
    if (
      typeof body.countedCashCents !== 'number' ||
      !Number.isInteger(body.countedCashCents) ||
      body.countedCashCents < 0
    ) {
      throw new BadRequestException('countedCashCents must be a non-negative integer');
    }
    const [shift] = await this.db
      .select()
      .from(schema.cashShifts)
      .where(eq(schema.cashShifts.id, id))
      .limit(1);
    if (!shift) throw new NotFoundException('Shift not found');
    if (shift.closedAt) throw new ForbiddenException('Shift is already closed');

    const closedAt = new Date();
    const cashRows = await this.db
      .select({
        cashIn: sql<number>`COALESCE(SUM(${schema.payments.amountCents}), 0)::int`,
      })
      .from(schema.payments)
      .innerJoin(schema.sales, eq(schema.sales.id, schema.payments.saleId))
      .where(
        and(
          eq(schema.sales.locationId, shift.locationId),
          eq(schema.payments.method, 'cash'),
          eq(schema.payments.status, 'succeeded'),
          gte(schema.sales.completedAt, shift.openedAt),
          lt(schema.sales.completedAt, closedAt),
        ),
      );
    // Order deposits/balances taken in cash during the shift land in the
    // same drawer as sale payments (D2). Imported legacy orders are
    // excluded per D8 — their money never touched this drawer.
    const orderCashRows = await this.db
      .select({
        cashIn: sql<number>`COALESCE(SUM(${schema.payments.amountCents}), 0)::int`,
      })
      .from(schema.payments)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.payments.orderId))
      .where(
        and(
          eq(schema.orders.locationId, shift.locationId),
          eq(schema.payments.method, 'cash'),
          eq(schema.payments.status, 'succeeded'),
          gte(schema.payments.createdAt, shift.openedAt),
          lt(schema.payments.createdAt, closedAt),
          isNull(schema.orders.importedAt),
        ),
      );
    const cashIn = (cashRows[0]?.cashIn ?? 0) + (orderCashRows[0]?.cashIn ?? 0);

    const expectedCashCents = shift.openingFloatCents + cashIn;
    const varianceCents = body.countedCashCents - expectedCashCents;

    await this.db
      .update(schema.cashShifts)
      .set({
        closedByUserId: actor.id,
        closedAt,
        expectedCashCents,
        countedCashCents: body.countedCashCents,
        varianceCents,
        notes: body.notes ?? shift.notes,
      })
      .where(eq(schema.cashShifts.id, id));

    await this.audit.log({
      action: 'cash_shift.close',
      targetType: 'cash_shift',
      targetId: id,
      after: { expectedCashCents, countedCashCents: body.countedCashCents, varianceCents },
    });
    void tenant;
    return this.hydrate(id);
  }

  @Get()
  @RequirePermission('pos.cash.open')
  async list(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('locationId') locationId?: string,
    @Query('limit') limitStr?: string,
    @Query('cursor') cursorStr?: string,
  ): Promise<PageResponse<ShiftRow>> {
    const limit = clampLimit(limitStr);
    const conditions: SQL[] = [];
    if (locationId) conditions.push(eq(schema.cashShifts.locationId, locationId));
    const cursor = decodeCursor(cursorStr);
    if (cursor) {
      conditions.push(
        timestampCursorWhere(schema.cashShifts.openedAt, schema.cashShifts.id, cursor)!,
      );
    }
    const rows = await this.db
      .select({
        id: schema.cashShifts.id,
        locationId: schema.cashShifts.locationId,
        locationName: schema.locations.name,
        openedByUserId: schema.cashShifts.openedByUserId,
        openedAt: schema.cashShifts.openedAt,
        openingFloatCents: schema.cashShifts.openingFloatCents,
        closedByUserId: schema.cashShifts.closedByUserId,
        closedAt: schema.cashShifts.closedAt,
        expectedCashCents: schema.cashShifts.expectedCashCents,
        countedCashCents: schema.cashShifts.countedCashCents,
        varianceCents: schema.cashShifts.varianceCents,
        notes: schema.cashShifts.notes,
      })
      .from(schema.cashShifts)
      .leftJoin(schema.locations, eq(schema.locations.id, schema.cashShifts.locationId))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(...timestampCursorOrder(schema.cashShifts.openedAt, schema.cashShifts.id))
      .limit(limit + 1);
    const enriched = rows.map((r) => ({ ...r, openedByEmail: null, closedByEmail: null }));
    return buildPage(enriched, limit, (r) => r.openedAt);
  }

  @Get(':id')
  @RequirePermission('pos.cash.open')
  async get(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<ShiftRow> {
    return this.hydrate(id);
  }

  private async hydrate(id: string): Promise<ShiftRow> {
    const [row] = await this.db
      .select({
        id: schema.cashShifts.id,
        locationId: schema.cashShifts.locationId,
        locationName: schema.locations.name,
        openedByUserId: schema.cashShifts.openedByUserId,
        openedByEmail: schema.users.email,
        openedAt: schema.cashShifts.openedAt,
        openingFloatCents: schema.cashShifts.openingFloatCents,
        closedByUserId: schema.cashShifts.closedByUserId,
        closedAt: schema.cashShifts.closedAt,
        expectedCashCents: schema.cashShifts.expectedCashCents,
        countedCashCents: schema.cashShifts.countedCashCents,
        varianceCents: schema.cashShifts.varianceCents,
        notes: schema.cashShifts.notes,
      })
      .from(schema.cashShifts)
      .leftJoin(schema.locations, eq(schema.locations.id, schema.cashShifts.locationId))
      .leftJoin(schema.users, eq(schema.users.id, schema.cashShifts.openedByUserId))
      .where(eq(schema.cashShifts.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Shift not found');
    // closedByEmail requires a separate lookup since the join above is on
    // openedByUserId.
    let closedByEmail: string | null = null;
    if (row.closedByUserId) {
      const [closer] = await this.db
        .select({ email: schema.users.email })
        .from(schema.users)
        .where(eq(schema.users.id, row.closedByUserId))
        .limit(1);
      closedByEmail = closer?.email ?? null;
    }
    return { ...row, closedByEmail };
  }
}
