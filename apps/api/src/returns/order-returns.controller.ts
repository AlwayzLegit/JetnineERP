import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { and, eq, inArray, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import {
  buildPage,
  clampLimit,
  decodeCursor,
  timestampCursorOrder,
  timestampCursorWhere,
  type PageResponse,
} from '../common/pagination';
import { ExceptionsService } from '../controls/exceptions.service';
import { SecurityOverrideService } from '../controls/security-override.service';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { OrderReturnsService } from './order-returns.service';
import { StoreCreditService } from './store-credit.service';

export interface OrderReturnRow {
  id: string;
  /** Null for a no-original return (SEC-RTN-NOORIG). */
  orderId: string | null;
  customerId: string | null;
  referencedOrderNumber: string | null;
  rmaNumber: string;
  status: string;
  fulfillment: string;
  refundMethod: string;
  amountCents: number;
  reason: string | null;
  authorizedAt: Date;
  goodsReceivedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  cancelReason: string | null;
  lines: {
    id: string;
    orderLineId: string | null;
    description: string | null;
    quantity: number;
    perUnitCents: number;
    reasonCode: string | null;
    reason: string | null;
  }[];
}

/**
 * Return documents (PLAN-STORIS-GAP §8 / A7). Authorization happens on
 * the order (`POST /v1/orders/:id/return`); this surface is the rest of
 * the lifecycle: the warehouse receiving the goods back (which fires
 * the refund), cancelling an authorized return, and listing.
 */
@TenantScoped()
@Controller('v1/order-returns')
export class OrderReturnsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(OrderReturnsService) private readonly returns: OrderReturnsService,
    @Inject(SecurityOverrideService) private readonly overrides: SecurityOverrideService,
    @Inject(StoreCreditService) private readonly storeCredit: StoreCreditService,
    @Inject(ExceptionsService) private readonly exceptions: ExceptionsService,
  ) {}

  @Get()
  @RequirePermission('orders.view')
  async list(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('orderId') orderId?: string,
    @Query('status') status?: string,
    @Query('limit') limitStr?: string,
    @Query('cursor') cursorStr?: string,
  ): Promise<PageResponse<OrderReturnRow>> {
    const limit = clampLimit(limitStr);
    const conditions: SQL[] = [eq(schema.orderReturns.businessId, tenant.businessId!)];
    if (orderId) conditions.push(eq(schema.orderReturns.orderId, orderId));
    if (status) conditions.push(eq(schema.orderReturns.status, status));
    const cursor = decodeCursor(cursorStr);
    if (cursor) {
      conditions.push(
        timestampCursorWhere(schema.orderReturns.authorizedAt, schema.orderReturns.id, cursor)!,
      );
    }
    const fetched = await this.db
      .select()
      .from(schema.orderReturns)
      .where(and(...conditions))
      .orderBy(...timestampCursorOrder(schema.orderReturns.authorizedAt, schema.orderReturns.id))
      .limit(limit + 1);
    const page = buildPage(fetched, limit, (r) => r.authorizedAt);
    const rows = page.data;
    if (rows.length === 0) return { data: [], nextCursor: null };

    const lines = await this.db
      .select({
        id: schema.orderReturnLines.id,
        returnId: schema.orderReturnLines.returnId,
        orderLineId: schema.orderReturnLines.orderLineId,
        description: sql<
          string | null
        >`coalesce(${schema.orderLines.description}, ${schema.orderReturnLines.description})`,
        quantity: schema.orderReturnLines.quantity,
        perUnitCents: schema.orderReturnLines.perUnitCents,
        reasonCode: schema.reasonCodes.code,
        reason: schema.orderReturnLines.reason,
      })
      .from(schema.orderReturnLines)
      .leftJoin(schema.orderLines, eq(schema.orderLines.id, schema.orderReturnLines.orderLineId))
      .leftJoin(schema.reasonCodes, eq(schema.reasonCodes.id, schema.orderReturnLines.reasonCodeId))
      .where(
        inArray(
          schema.orderReturnLines.returnId,
          rows.map((r) => r.id),
        ),
      );
    const byReturn = new Map<string, OrderReturnRow['lines']>();
    for (const l of lines) {
      const list = byReturn.get(l.returnId) ?? [];
      list.push({
        id: l.id,
        orderLineId: l.orderLineId,
        description: l.description,
        quantity: l.quantity,
        perUnitCents: l.perUnitCents,
        reasonCode: l.reasonCode,
        reason: l.reason,
      });
      byReturn.set(l.returnId, list);
    }
    const data = rows.map((r) => ({
      id: r.id,
      orderId: r.orderId,
      customerId: r.customerId,
      referencedOrderNumber: r.referencedOrderNumber,
      rmaNumber: r.rmaNumber,
      status: r.status,
      fulfillment: r.fulfillment,
      refundMethod: r.refundMethod,
      amountCents: r.amountCents,
      reason: r.reason,
      authorizedAt: r.authorizedAt,
      goodsReceivedAt: r.goodsReceivedAt,
      completedAt: r.completedAt,
      cancelledAt: r.cancelledAt,
      cancelReason: r.cancelReason,
      lines: byReturn.get(r.id) ?? [],
    }));
    return { data, nextCursor: page.nextCursor };
  }

  /**
   * No-original return (RTN-010/011, SEC-RTN-NOORIG): the customer has
   * no findable order — pre-cutover sale, lost paperwork, bogus number.
   * Gated on `returns.no_original` at the point of action (a manager
   * passes, anyone else needs a manager's credentials). Controls, since
   * this path bypasses the original document entirely:
   *   - refund is STORE CREDIT ONLY (no original tender exists to cap
   *     a cash refund against),
   *   - goods stage in As-Is review like every other return (G10 —
   *     never silently sellable),
   *   - whatever order number the customer claimed is recorded
   *     verbatim, and every no-original return lands in the exception
   *     register for loss prevention.
   * Goods are in hand by definition, so the document is written
   * completed in one step — the RMA lifecycle endpoints don't apply.
   */
  @Post('no-original')
  @RequirePermission('pos.refund.create')
  async noOriginal(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body()
    body: {
      customerId?: string;
      locationId?: string;
      referencedOrderNumber?: string | null;
      reason?: string | null;
      lines?: {
        variantId?: string;
        quantity?: number;
        unitRefundCents?: number;
        reasonCodeId?: string;
        reason?: string;
      }[];
      override?: import('../controls/security-override.service').OverrideCredentials;
    },
  ): Promise<OrderReturnRow> {
    if (!body.customerId) throw new BadRequestException('customerId is required');
    if (!body.locationId) throw new BadRequestException('locationId is required');
    if (!body.lines || body.lines.length === 0) {
      throw new BadRequestException('lines must contain at least one entry');
    }
    if (body.lines.length > 50) throw new BadRequestException('at most 50 lines');

    await this.overrides.require({
      permission: 'returns.no_original',
      action: `Return without an original order${body.referencedOrderNumber ? ` (customer claimed ${body.referencedOrderNumber})` : ''}`,
      entityType: 'order_return',
      override: body.override,
    });

    const [customer] = await this.db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(eq(schema.customers.id, body.customerId))
      .limit(1);
    if (!customer) throw new NotFoundException('Customer not found');
    const [location] = await this.db
      .select({ id: schema.locations.id })
      .from(schema.locations)
      .where(eq(schema.locations.id, body.locationId))
      .limit(1);
    if (!location) throw new NotFoundException('Location not found');

    const variantIds: string[] = [];
    for (const l of body.lines) {
      if (!l.variantId) throw new BadRequestException('lines[].variantId is required');
      if (!Number.isInteger(l.quantity) || (l.quantity ?? 0) <= 0) {
        throw new BadRequestException('lines[].quantity must be a positive integer');
      }
      if (!Number.isInteger(l.unitRefundCents) || (l.unitRefundCents ?? -1) < 0) {
        throw new BadRequestException('lines[].unitRefundCents must be a non-negative integer');
      }
      variantIds.push(l.variantId);
    }
    const variants = await this.db
      .select({
        id: schema.productVariants.id,
        variantName: schema.productVariants.name,
        productName: schema.products.name,
      })
      .from(schema.productVariants)
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(inArray(schema.productVariants.id, variantIds));
    const variantById = new Map(variants.map((v) => [v.id, v]));
    for (const vid of variantIds) {
      if (!variantById.has(vid)) throw new NotFoundException(`Variant not found: ${vid}`);
    }

    // Coded reasons (class `return`) with the A9 free-text fallback,
    // exactly like the with-order return path.
    const resolved: {
      variantId: string;
      description: string;
      quantity: number;
      perUnitCents: number;
      reasonCodeId: string | null;
      reason: string | null;
    }[] = [];
    let amountCents = 0;
    for (const l of body.lines) {
      const v = variantById.get(l.variantId!)!;
      const lineReason = await this.overrides.resolveReason(
        'return',
        { reasonCodeId: l.reasonCodeId, reason: l.reason ?? body.reason ?? null },
        { required: false },
      );
      resolved.push({
        variantId: l.variantId!,
        description: [v.productName, v.variantName].filter(Boolean).join(' — '),
        quantity: l.quantity!,
        perUnitCents: l.unitRefundCents!,
        reasonCodeId: lineReason.reasonCodeId,
        reason: lineReason.reasonText,
      });
      amountCents += l.quantity! * l.unitRefundCents!;
    }

    const [prior] = await this.db
      .select({ priorCount: sql<number>`count(*)::int` })
      .from(schema.orderReturns)
      .where(sql`${schema.orderReturns.orderId} is null`);
    const rmaNumber = `RMA-NOORIG-${(prior?.priorCount ?? 0) + 1}`;

    const now = new Date();
    const [ret] = await this.db
      .insert(schema.orderReturns)
      .values({
        businessId: tenant.businessId!,
        orderId: null,
        customerId: body.customerId,
        referencedOrderNumber: body.referencedOrderNumber?.trim() || null,
        rmaNumber,
        status: 'completed',
        fulfillment: 'drop_off',
        refundMethod: 'store_credit',
        amountCents,
        reason: body.reason ?? null,
        createdByUserId: actor?.id ?? null,
        goodsReceivedAt: now,
        receivedByUserId: actor?.id ?? null,
        completedAt: now,
      })
      .returning();
    if (!ret) throw new BadRequestException('failed to create return');

    await this.db.insert(schema.orderReturnLines).values(
      resolved.map((r) => ({
        businessId: tenant.businessId!,
        returnId: ret.id,
        orderLineId: null,
        variantId: r.variantId,
        description: r.description,
        quantity: r.quantity,
        perUnitCents: r.perUnitCents,
        reasonCodeId: r.reasonCodeId,
        reason: r.reason,
      })),
    );

    // Goods stage in As-Is review — one piece per unit (G10).
    for (const r of resolved) {
      const pieces = await this.db
        .insert(schema.asIsItems)
        .values(
          Array.from({ length: r.quantity }, () => ({
            businessId: tenant.businessId!,
            variantId: r.variantId,
            locationId: body.locationId!,
            quantity: 1,
            source: 'return',
            referenceType: 'order_return',
            referenceId: ret.id,
            reasonCodeId: r.reasonCodeId,
            notes: r.reason ?? `No-original return ${rmaNumber}`,
          })),
        )
        .returning({ id: schema.asIsItems.id });
      for (const piece of pieces) {
        await this.db
          .update(schema.asIsItems)
          .set({ pieceNumber: `AS-${piece.id.slice(0, 8).toUpperCase()}` })
          .where(eq(schema.asIsItems.id, piece.id));
      }
    }

    if (amountCents > 0) {
      await this.storeCredit.issue(this.db, {
        businessId: tenant.businessId!,
        customerId: body.customerId,
        amountCents,
        reason: `No-original return ${rmaNumber}`,
        referenceType: 'order_return',
        referenceId: ret.id,
        actorUserId: actor?.id ?? null,
      });
    }

    // RTN-011 loss prevention: every no-original return is an exception.
    await this.exceptions.record({
      type: 'no_original_return',
      severity: 'warning',
      entityType: 'order_return',
      entityId: ret.id,
      summary: `No-original return ${rmaNumber}: ${amountCents} cents in store credit${body.referencedOrderNumber ? ` — customer claimed order "${body.referencedOrderNumber}"` : ''}`,
      metadata: {
        customerId: body.customerId,
        amountCents,
        referencedOrderNumber: body.referencedOrderNumber ?? null,
        lines: resolved.map((r) => ({ variantId: r.variantId, quantity: r.quantity })),
      },
    });
    await this.audit.log({
      action: 'return.no_original',
      targetType: 'order_return',
      targetId: ret.id,
      after: {
        rmaNumber,
        customerId: body.customerId,
        amountCents,
        referencedOrderNumber: body.referencedOrderNumber ?? null,
        lineCount: resolved.length,
      },
    });

    return {
      id: ret.id,
      orderId: null,
      customerId: ret.customerId,
      referencedOrderNumber: ret.referencedOrderNumber,
      rmaNumber,
      status: ret.status,
      fulfillment: ret.fulfillment,
      refundMethod: ret.refundMethod,
      amountCents,
      reason: ret.reason,
      authorizedAt: ret.authorizedAt,
      goodsReceivedAt: ret.goodsReceivedAt,
      completedAt: ret.completedAt,
      cancelledAt: null,
      cancelReason: null,
      lines: resolved.map((r) => ({
        id: '',
        orderLineId: null,
        description: r.description,
        quantity: r.quantity,
        perUnitCents: r.perUnitCents,
        reasonCode: null,
        reason: r.reason,
      })),
    };
  }

  /**
   * The physical event: goods are back in the building. Warehouse-side
   * permission — the money was already authorized by the return writer,
   * this step executes it (A7: refund fires at goods receipt).
   */
  @Post(':id/receive')
  @RequirePermission('inventory.receive')
  async receive(
    @CurrentTenant() _tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { locationId?: string | null },
  ): Promise<{ status: string }> {
    await this.returns.receiveGoods(id, actor?.id ?? null, {
      receiveLocationId: body?.locationId ?? null,
    });
    return { status: 'completed' };
  }

  /** Void an authorized return before the goods come back. */
  @Post(':id/cancel')
  async cancel(
    @CurrentTenant() _tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body()
    body: {
      reason?: string;
      reasonCodeId?: string;
      override?: import('../controls/security-override.service').OverrideCredentials;
    },
  ): Promise<{ status: string }> {
    const [ret] = await this.db
      .select()
      .from(schema.orderReturns)
      .where(eq(schema.orderReturns.id, id))
      .limit(1);
    if (!ret) throw new NotFoundException('Return not found');
    if (ret.status !== 'authorized') {
      throw new ConflictException(`Return ${ret.rmaNumber} is already ${ret.status}`);
    }
    await this.overrides.require({
      permission: 'pos.refund.create',
      action: `Cancel return authorization ${ret.rmaNumber}`,
      entityType: 'order_return',
      entityId: id,
      override: body.override,
    });
    const reason = await this.overrides.resolveReason('exception', {
      reasonCodeId: body.reasonCodeId,
      reason: body.reason,
    });
    if (!reason.reasonText && !reason.reasonCode) {
      throw new BadRequestException('A reason is required to cancel a return');
    }
    await this.db
      .update(schema.orderReturns)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledByUserId: actor?.id ?? null,
        cancelReason: reason.reasonText,
      })
      .where(eq(schema.orderReturns.id, id));
    await this.audit.log({
      action: 'order_return.cancel',
      targetType: 'order',
      targetId: ret.orderId ?? ret.id,
      metadata: {
        rmaNumber: ret.rmaNumber,
        reason: reason.reasonText,
        reasonCode: reason.reasonCode,
      },
    });
    return { status: 'cancelled' };
  }
}
