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
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { SecurityOverrideService } from '../controls/security-override.service';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { OrderReturnsService } from './order-returns.service';

export interface OrderReturnRow {
  id: string;
  orderId: string;
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
    orderLineId: string;
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
  ) {}

  @Get()
  @RequirePermission('orders.view')
  async list(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('orderId') orderId?: string,
    @Query('status') status?: string,
  ): Promise<OrderReturnRow[]> {
    const rows = await this.db
      .select()
      .from(schema.orderReturns)
      .where(
        and(
          eq(schema.orderReturns.businessId, tenant.businessId!),
          orderId ? eq(schema.orderReturns.orderId, orderId) : undefined,
          status ? eq(schema.orderReturns.status, status) : undefined,
        ),
      )
      .orderBy(desc(schema.orderReturns.authorizedAt))
      .limit(200);
    if (rows.length === 0) return [];

    const lines = await this.db
      .select({
        id: schema.orderReturnLines.id,
        returnId: schema.orderReturnLines.returnId,
        orderLineId: schema.orderReturnLines.orderLineId,
        description: schema.orderLines.description,
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
    return rows.map((r) => ({
      id: r.id,
      orderId: r.orderId,
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
  ): Promise<{ status: string }> {
    await this.returns.receiveGoods(id, actor?.id ?? null);
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
      targetId: ret.orderId,
      metadata: {
        rmaNumber: ret.rmaNumber,
        reason: reason.reasonText,
        reasonCode: reason.reasonCode,
      },
    });
    return { status: 'cancelled' };
  }
}
