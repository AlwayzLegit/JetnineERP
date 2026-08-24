import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { and, desc, eq, inArray, lt, or } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { buildPage, clampLimit, decodeCursor, type PageResponse } from '../common/pagination';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { CommissionsService } from '../money/commissions.service';
import { WebhookDispatcher } from '../webhooks/webhook-dispatcher.service';
import {
  balanceDueCents,
  defaultDepositCents,
  deriveFulfillmentStatus,
  isLiveOrderStatus,
  paidCents,
  planFulfillment,
  remainingFulfillment,
  type FulfillmentRequest,
  type OrderStatus,
} from './order-math';
import { OrdersService } from './orders.service';

/**
 * Fallback deposit policy: a quarter down, per the plan's example. Made a
 * per-business setting when the settings surface lands; until then every
 * order can still override it at write time.
 */
const DEFAULT_DEPOSIT_RATE_BPS = 2500;

const PAYMENT_METHODS = [
  'cash',
  'card',
  'store_credit',
  'gift_card',
  'financing',
  'external_card',
  'check',
] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const FULFILLMENT_TYPES = ['delivery', 'pickup'] as const;
const LINE_TYPES = ['stock', 'special_order'] as const;

interface OrderLineInput {
  variantId?: string;
  /** Free-text override; defaults to the variant's product/variant name. */
  description?: string;
  quantity?: number;
  /** Optional override; defaults to the variant's price. */
  unitPriceCents?: number;
  lineDiscountCents?: number;
  lineType?: (typeof LINE_TYPES)[number];
}

interface AddressInput {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  phone?: string | null;
}

interface CreateOrderBody {
  locationId?: string;
  customerId?: string;
  lines?: OrderLineInput[];
  orderDiscountCents?: number;
  fulfillmentType?: (typeof FULFILLMENT_TYPES)[number];
  requestedDate?: string | null;
  address?: AddressInput;
  notes?: string | null;
  internalNotes?: string | null;
  salespersonMembershipId?: string | null;
  secondSalespersonMembershipId?: string | null;
  splitBps?: number | null;
  depositRequiredCents?: number;
  /**
   * Write the order straight to `open` (reserving stock) instead of
   * parking it as a quote. The order writer sets this once the customer
   * commits.
   */
  confirm?: boolean;
}

interface UpdateOrderBody {
  fulfillmentType?: (typeof FULFILLMENT_TYPES)[number];
  requestedDate?: string | null;
  address?: AddressInput;
  notes?: string | null;
  internalNotes?: string | null;
  salespersonMembershipId?: string | null;
  secondSalespersonMembershipId?: string | null;
  splitBps?: number | null;
  depositRequiredCents?: number;
  orderDiscountCents?: number;
  /** 'quote' → 'open' only; every other transition has its own endpoint. */
  status?: 'open';
}

interface OrderPaymentBody {
  method?: PaymentMethod;
  amountCents?: number;
  /** 'deposit' | 'balance' | 'installment'. Inferred when omitted. */
  kind?: 'deposit' | 'balance' | 'installment';
  processorRef?: string;
  financingProvider?: string;
  financingRef?: string;
}

interface CancelOrderBody {
  reason?: string | null;
}

interface OrderListRow {
  id: string;
  number: string;
  status: string;
  customerId: string;
  locationId: string;
  totalCents: number;
  depositRequiredCents: number;
  fulfillmentType: string;
  requestedDate: string | null;
  importedAt: Date | null;
  createdAt: Date;
}

interface OrderLineRow {
  id: string;
  variantId: string | null;
  description: string;
  quantity: number;
  qtyReserved: number;
  qtyFulfilled: number;
  lineType: string;
  unitPriceCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  taxRateBps: number;
}

interface OrderPaymentRow {
  id: string;
  kind: string;
  method: string;
  amountCents: number;
  status: string;
  processor: string | null;
  processorRef: string | null;
  financingProvider: string | null;
  financingRef: string | null;
  createdAt: Date;
}

interface OrderDetail extends OrderListRow {
  subtotalCents: number;
  orderDiscountCents: number;
  discountCents: number;
  taxCents: number;
  /** Derived (D-money rule): sum of succeeded payments. */
  paidCents: number;
  /** Derived: total - paid, floored at zero. */
  balanceDueCents: number;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressRegion: string | null;
  addressPostalCode: string | null;
  addressPhone: string | null;
  notes: string | null;
  internalNotes: string | null;
  salespersonMembershipId: string | null;
  secondSalespersonMembershipId: string | null;
  splitBps: number | null;
  legacyNumber: string | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  lines: OrderLineRow[];
  payments: OrderPaymentRow[];
}

/**
 * Sales orders (cutover gap G1). An order is written now and delivered
 * later, so unlike a POS sale it carries a customer, a deposit, committed
 * stock, and a balance the store collects at fulfillment.
 *
 * Fulfillment itself — deliveries, stock decrement, order completion —
 * lands with the `deliveries` module on Day 3. What this module owns is
 * the order spine: write it, price it, commit stock to it, take money
 * against it, cancel it.
 */
@TenantScoped()
@Controller('v1')
export class OrdersController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(WebhookDispatcher) private readonly webhooks: WebhookDispatcher,
    @Inject(CommissionsService) private readonly commissions: CommissionsService,
  ) {}

  @Get('orders')
  @RequirePermission('orders.view')
  async list(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('limit') limitStr?: string,
    @Query('cursor') cursorStr?: string,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
  ): Promise<PageResponse<OrderListRow>> {
    const limit = clampLimit(limitStr);
    const cursor = decodeCursor(cursorStr);
    const filters = [];
    if (status) filters.push(eq(schema.orders.status, status));
    if (customerId) filters.push(eq(schema.orders.customerId, customerId));
    if (cursor) {
      filters.push(
        or(
          lt(schema.orders.createdAt, new Date(cursor.v as string)),
          and(
            eq(schema.orders.createdAt, new Date(cursor.v as string)),
            lt(schema.orders.id, cursor.id),
          ),
        )!,
      );
    }

    const rows = await this.db
      .select({
        id: schema.orders.id,
        number: schema.orders.number,
        status: schema.orders.status,
        customerId: schema.orders.customerId,
        locationId: schema.orders.locationId,
        totalCents: schema.orders.totalCents,
        depositRequiredCents: schema.orders.depositRequiredCents,
        fulfillmentType: schema.orders.fulfillmentType,
        requestedDate: schema.orders.requestedDate,
        importedAt: schema.orders.importedAt,
        createdAt: schema.orders.createdAt,
      })
      .from(schema.orders)
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(desc(schema.orders.createdAt), desc(schema.orders.id))
      .limit(limit + 1);
    return buildPage(rows, limit, (r) => r.createdAt);
  }

  @Get('orders/:id')
  @RequirePermission('orders.view')
  async get(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<OrderDetail> {
    return this.loadDetail(id);
  }

  /**
   * Write an order. Runs inside the request's RLS transaction, so a
   * failure part-way through (a bad line, a reservation that can't be
   * written) rolls back the header, the lines, and the stock commitment
   * together.
   */
  @Post('orders')
  @RequirePermission('orders.create')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: CreateOrderBody,
  ): Promise<OrderDetail> {
    if (!body.locationId) throw new BadRequestException('locationId is required');
    if (!body.customerId) throw new BadRequestException('customerId is required');
    if (!body.lines || body.lines.length === 0) {
      throw new BadRequestException('lines must contain at least one entry');
    }
    const fulfillmentType = body.fulfillmentType ?? 'delivery';
    if (!FULFILLMENT_TYPES.includes(fulfillmentType)) {
      throw new BadRequestException("fulfillmentType must be 'delivery' or 'pickup'");
    }
    if (body.splitBps != null && (body.splitBps < 0 || body.splitBps > 10000)) {
      throw new BadRequestException('splitBps must be between 0 and 10000');
    }
    const orderDiscountCents = body.orderDiscountCents ?? 0;
    if (!Number.isInteger(orderDiscountCents) || orderDiscountCents < 0) {
      throw new BadRequestException('orderDiscountCents must be a non-negative integer');
    }
    if (
      body.depositRequiredCents !== undefined &&
      (!Number.isInteger(body.depositRequiredCents) || body.depositRequiredCents < 0)
    ) {
      throw new BadRequestException('depositRequiredCents must be a non-negative integer');
    }

    const [location] = await this.db
      .select({ id: schema.locations.id, taxRateBps: schema.locations.taxRateBps })
      .from(schema.locations)
      .where(eq(schema.locations.id, body.locationId))
      .limit(1);
    if (!location) throw new NotFoundException('Location not found');

    const [customer] = await this.db
      .select({ id: schema.customers.id })
      .from(schema.customers)
      .where(eq(schema.customers.id, body.customerId))
      .limit(1);
    if (!customer) throw new NotFoundException('Customer not found');

    const priced = await this.priceLines(tenant, body.locationId, body.lines);

    const number = await this.orders.generateOrderNumber(this.db, tenant.businessId!);
    const [order] = await this.db
      .insert(schema.orders)
      .values({
        businessId: tenant.businessId!,
        locationId: body.locationId,
        number,
        status: 'quote',
        customerId: body.customerId,
        salespersonMembershipId: body.salespersonMembershipId ?? tenant.membershipId ?? null,
        secondSalespersonMembershipId: body.secondSalespersonMembershipId ?? null,
        splitBps: body.splitBps ?? null,
        orderDiscountCents,
        fulfillmentType,
        addressLine1: body.address?.line1 ?? null,
        addressLine2: body.address?.line2 ?? null,
        addressCity: body.address?.city ?? null,
        addressRegion: body.address?.region ?? null,
        addressPostalCode: body.address?.postalCode ?? null,
        addressPhone: body.address?.phone ?? null,
        requestedDate: body.requestedDate ?? null,
        notes: body.notes ?? null,
        internalNotes: body.internalNotes ?? null,
      })
      .returning();
    if (!order) throw new BadRequestException('failed to create order');

    await this.db.insert(schema.orderLines).values(
      priced.map((l) => ({
        businessId: tenant.businessId!,
        orderId: order.id,
        variantId: l.variantId,
        description: l.description,
        quantity: l.quantity,
        lineType: l.lineType,
        unitPriceCents: l.unitPriceCents,
        discountCents: l.lineDiscountCents,
        taxRateBps: l.taxRateBps,
        taxClassId: l.taxClassId,
        // Placeholders — recomputeTotals prices every line against the
        // whole cart (the order discount is allocated pro-rata) and
        // writes the real numbers back.
        taxCents: 0,
        totalCents: 0,
      })),
    );

    const totals = await this.orders.recomputeTotals(this.db, order.id);

    // Deposit policy: explicit amount wins, otherwise the default rate.
    const depositRequiredCents =
      body.depositRequiredCents ?? defaultDepositCents(totals.totalCents, DEFAULT_DEPOSIT_RATE_BPS);
    await this.db
      .update(schema.orders)
      .set({ depositRequiredCents, updatedAt: new Date() })
      .where(eq(schema.orders.id, order.id));

    // Confirming commits stock immediately. A quote deliberately holds
    // nothing — otherwise every browsing customer would tie up inventory.
    if (body.confirm) {
      await this.orders.reserveOrder(this.db, {
        businessId: tenant.businessId!,
        orderId: order.id,
        locationId: body.locationId,
        actorUserId: actor?.id ?? null,
      });
      await this.db
        .update(schema.orders)
        .set({ status: 'open', updatedAt: new Date() })
        .where(eq(schema.orders.id, order.id));
    }

    await this.audit.log({
      action: 'order.create',
      targetType: 'order',
      targetId: order.id,
      after: {
        number: order.number,
        status: body.confirm ? 'open' : 'quote',
        totalCents: totals.totalCents,
        depositRequiredCents,
        lineCount: priced.length,
        customerId: order.customerId,
      },
    });

    const detail = await this.loadDetail(order.id);
    this.fireOrderEvent('order.created', tenant.businessId!, detail);
    return detail;
  }

  @Patch('orders/:id')
  @RequirePermission('orders.update')
  async update(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: UpdateOrderBody,
  ): Promise<OrderDetail> {
    const order = await this.requireLiveOrder(id);

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.fulfillmentType !== undefined) {
      if (!FULFILLMENT_TYPES.includes(body.fulfillmentType)) {
        throw new BadRequestException("fulfillmentType must be 'delivery' or 'pickup'");
      }
      patch.fulfillmentType = body.fulfillmentType;
    }
    if (body.requestedDate !== undefined) patch.requestedDate = body.requestedDate;
    if (body.notes !== undefined) patch.notes = body.notes;
    if (body.internalNotes !== undefined) patch.internalNotes = body.internalNotes;
    if (body.salespersonMembershipId !== undefined) {
      patch.salespersonMembershipId = body.salespersonMembershipId;
    }
    if (body.secondSalespersonMembershipId !== undefined) {
      patch.secondSalespersonMembershipId = body.secondSalespersonMembershipId;
    }
    if (body.splitBps !== undefined) {
      if (body.splitBps != null && (body.splitBps < 0 || body.splitBps > 10000)) {
        throw new BadRequestException('splitBps must be between 0 and 10000');
      }
      patch.splitBps = body.splitBps;
    }
    if (body.depositRequiredCents !== undefined) {
      if (!Number.isInteger(body.depositRequiredCents) || body.depositRequiredCents < 0) {
        throw new BadRequestException('depositRequiredCents must be a non-negative integer');
      }
      patch.depositRequiredCents = body.depositRequiredCents;
    }
    if (body.address) {
      if (body.address.line1 !== undefined) patch.addressLine1 = body.address.line1;
      if (body.address.line2 !== undefined) patch.addressLine2 = body.address.line2;
      if (body.address.city !== undefined) patch.addressCity = body.address.city;
      if (body.address.region !== undefined) patch.addressRegion = body.address.region;
      if (body.address.postalCode !== undefined) patch.addressPostalCode = body.address.postalCode;
      if (body.address.phone !== undefined) patch.addressPhone = body.address.phone;
    }

    let repriced = false;
    if (body.orderDiscountCents !== undefined) {
      if (!Number.isInteger(body.orderDiscountCents) || body.orderDiscountCents < 0) {
        throw new BadRequestException('orderDiscountCents must be a non-negative integer');
      }
      patch.orderDiscountCents = body.orderDiscountCents;
      repriced = true;
    }

    await this.db.update(schema.orders).set(patch).where(eq(schema.orders.id, id));
    if (repriced) await this.orders.recomputeTotals(this.db, id);

    // Confirming a quote is the one status change this endpoint accepts;
    // it commits stock the same way `create({confirm:true})` does.
    if (body.status === 'open') {
      if (order.status !== 'quote') {
        throw new BadRequestException(`Cannot confirm an order in status '${order.status}'`);
      }
      await this.orders.reserveOrder(this.db, {
        businessId: tenant.businessId!,
        orderId: id,
        locationId: order.locationId,
        actorUserId: actor?.id ?? null,
      });
      await this.db
        .update(schema.orders)
        .set({ status: 'open', updatedAt: new Date() })
        .where(eq(schema.orders.id, id));
    }

    await this.audit.log({
      action: 'order.update',
      targetType: 'order',
      targetId: id,
      before: { status: order.status, totalCents: order.totalCents },
      after: { ...patch, status: body.status ?? order.status },
    });

    return this.loadDetail(id);
  }

  /** Append a line and reprice. Reserves immediately if the order is live. */
  @Post('orders/:id/lines')
  @RequirePermission('orders.update')
  async addLine(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: OrderLineInput,
  ): Promise<OrderDetail> {
    const order = await this.requireLiveOrder(id);
    const [priced] = await this.priceLines(tenant, order.locationId, [body]);

    const [line] = await this.db
      .insert(schema.orderLines)
      .values({
        businessId: tenant.businessId!,
        orderId: id,
        variantId: priced!.variantId,
        description: priced!.description,
        quantity: priced!.quantity,
        lineType: priced!.lineType,
        unitPriceCents: priced!.unitPriceCents,
        discountCents: priced!.lineDiscountCents,
        taxRateBps: priced!.taxRateBps,
        taxClassId: priced!.taxClassId,
        taxCents: 0,
        totalCents: 0,
      })
      .returning();

    await this.orders.recomputeTotals(this.db, id);
    if (order.status !== 'quote') {
      await this.orders.reserveOrder(this.db, {
        businessId: tenant.businessId!,
        orderId: id,
        locationId: order.locationId,
        actorUserId: actor?.id ?? null,
      });
    }

    await this.audit.log({
      action: 'order.line.add',
      targetType: 'order',
      targetId: id,
      after: { lineId: line!.id, variantId: line!.variantId, quantity: line!.quantity },
    });
    return this.loadDetail(id);
  }

  /**
   * Remove a line, releasing whatever it had committed. A line that has
   * already been (partly) delivered can't be removed — that's a refund,
   * not an edit.
   */
  @Delete('orders/:id/lines/:lineId')
  @RequirePermission('orders.update')
  async removeLine(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Param('lineId') lineId: string,
  ): Promise<OrderDetail> {
    const order = await this.requireLiveOrder(id);
    const [line] = await this.db
      .select()
      .from(schema.orderLines)
      .where(and(eq(schema.orderLines.id, lineId), eq(schema.orderLines.orderId, id)))
      .limit(1);
    if (!line) throw new NotFoundException('Order line not found');
    if (line.qtyFulfilled > 0) {
      throw new BadRequestException(
        'Cannot remove a line that has already been fulfilled — refund it instead',
      );
    }

    if (line.variantId && line.qtyReserved > 0) {
      await this.orders.applyReleases(this.db, {
        businessId: tenant.businessId!,
        orderId: id,
        locationId: order.locationId,
        actorUserId: actor?.id ?? null,
        releases: [{ orderLineId: line.id, variantId: line.variantId, quantity: line.qtyReserved }],
        // The row is about to be deleted; skipping its update avoids a
        // pointless write against a doomed row.
        updateLines: false,
      });
    }

    await this.db.delete(schema.orderLines).where(eq(schema.orderLines.id, lineId));
    await this.orders.recomputeTotals(this.db, id);

    await this.audit.log({
      action: 'order.line.remove',
      targetType: 'order',
      targetId: id,
      before: { lineId, variantId: line.variantId, quantity: line.quantity },
    });
    return this.loadDetail(id);
  }

  /**
   * Commit stock to the order. Safe to call repeatedly — only the units a
   * line still lacks are ever reserved — which is what makes it usable as
   * a "try again now that the truck arrived" action.
   *
   * Anything stock can't cover comes back as a shortfall rather than an
   * error: the order is still valid, those units just have to be bought
   * (the Day 4 special-order queue).
   */
  @Post('orders/:id/reserve')
  @RequirePermission('orders.update')
  async reserve(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<{ order: OrderDetail; shortfalls: { orderLineId: string; quantity: number }[] }> {
    const order = await this.requireLiveOrder(id);
    const plan = await this.orders.reserveOrder(this.db, {
      businessId: tenant.businessId!,
      orderId: id,
      locationId: order.locationId,
      actorUserId: actor?.id ?? null,
    });

    if (order.status === 'quote' && plan.reservations.length > 0) {
      await this.db
        .update(schema.orders)
        .set({ status: 'open', updatedAt: new Date() })
        .where(eq(schema.orders.id, id));
    }

    await this.audit.log({
      action: 'order.reserve',
      targetType: 'order',
      targetId: id,
      after: {
        reserved: plan.reservations.reduce((s, r) => s + r.quantity, 0),
        short: plan.shortfalls.reduce((s, r) => s + r.quantity, 0),
      },
    });

    return {
      order: await this.loadDetail(id),
      shortfalls: plan.shortfalls.map((s) => ({
        orderLineId: s.orderLineId,
        quantity: s.quantity,
      })),
    };
  }

  /** Hand every committed unit back without cancelling the order. */
  @Post('orders/:id/release')
  @RequirePermission('orders.update')
  async release(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
  ): Promise<OrderDetail> {
    const order = await this.requireLiveOrder(id);
    const released = await this.orders.releaseOrder(this.db, {
      businessId: tenant.businessId!,
      orderId: id,
      locationId: order.locationId,
      actorUserId: actor?.id ?? null,
    });

    await this.audit.log({
      action: 'order.release',
      targetType: 'order',
      targetId: id,
      after: { released: released.reduce((s, r) => s + r.quantity, 0) },
    });
    return this.loadDetail(id);
  }

  /**
   * Take money against an order. A deposit and a balance payment are the
   * same row with a different `kind` (D2) — which is exactly why the cash
   * drawer picks both up without knowing orders exist.
   */
  @Post('orders/:id/payments')
  @RequirePermission('orders.deposit.take')
  async takePayment(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: OrderPaymentBody,
  ): Promise<OrderDetail> {
    const order = await this.requireLiveOrder(id);

    if (!body.method || !PAYMENT_METHODS.includes(body.method)) {
      throw new BadRequestException(`method must be one of: ${PAYMENT_METHODS.join(', ')}`);
    }
    if (
      typeof body.amountCents !== 'number' ||
      !Number.isInteger(body.amountCents) ||
      body.amountCents <= 0
    ) {
      throw new BadRequestException('amountCents must be a positive integer');
    }
    if (body.method === 'financing' && !body.financingProvider) {
      throw new BadRequestException('financing payments must name a financingProvider');
    }

    const existing = await this.db
      .select({ amountCents: schema.payments.amountCents, status: schema.payments.status })
      .from(schema.payments)
      .where(eq(schema.payments.orderId, id));
    const due = balanceDueCents(order.totalCents, existing);
    if (body.amountCents > due) {
      throw new BadRequestException(
        `amountCents (${body.amountCents}) exceeds the balance due (${due})`,
      );
    }

    // Infer the kind: the first money in is the deposit, the rest is
    // balance. An explicit kind (an installment against a plan) wins.
    const kind = body.kind ?? (paidCents(existing) === 0 ? 'deposit' : 'balance');

    // Money down means the customer committed, so a quote becomes an open
    // order and commits its stock here. Taking a deposit is one action at
    // the register, and this keeps the invariant worth having: an order
    // holding money is an order holding its goods.
    if (order.status === 'quote') {
      await this.orders.reserveOrder(this.db, {
        businessId: tenant.businessId!,
        orderId: id,
        locationId: order.locationId,
        actorUserId: actor?.id ?? null,
      });
      await this.db
        .update(schema.orders)
        .set({ status: 'open', updatedAt: new Date() })
        .where(eq(schema.orders.id, id));
    }

    const [payment] = await this.db
      .insert(schema.payments)
      .values({
        businessId: tenant.businessId!,
        saleId: null,
        orderId: id,
        kind,
        method: body.method,
        amountCents: body.amountCents,
        processor: body.method === 'card' ? 'manual' : null,
        processorRef: body.processorRef ?? null,
        financingProvider: body.financingProvider ?? null,
        financingRef: body.financingRef ?? null,
        status: 'succeeded',
      })
      .returning();

    await this.audit.log({
      action: 'order.payment.take',
      targetType: 'order',
      targetId: id,
      after: {
        paymentId: payment!.id,
        kind,
        method: body.method,
        amountCents: body.amountCents,
      },
    });

    const detail = await this.loadDetail(id);
    this.fireOrderEvent('order.payment_received', tenant.businessId!, detail, {
      paymentId: payment!.id,
      kind,
      method: body.method,
      amountCents: body.amountCents,
    });
    return detail;
  }

  /**
   * Cancel an order and release everything it holds. Refusing to cancel
   * an order that has collected money is deliberate: that money has to be
   * refunded or moved first, and silently orphaning it would leave the
   * drawer out of balance.
   */
  /**
   * Pickup fulfillment: the customer takes the goods over the counter, no
   * truck involved. Same stock semantics as a delivered delivery. Omitted
   * lines → everything still owed.
   */
  @Post('orders/:id/fulfill')
  @RequirePermission('deliveries.complete')
  async fulfill(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { lines?: { orderLineId?: string; quantity?: number }[] },
  ): Promise<OrderDetail> {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'quote') {
      throw new BadRequestException('Confirm the order before fulfilling it');
    }
    if (order.completedAt || order.cancelledAt) {
      throw new BadRequestException('This order is closed');
    }

    const lines = await this.db
      .select({
        id: schema.orderLines.id,
        variantId: schema.orderLines.variantId,
        quantity: schema.orderLines.quantity,
        qtyReserved: schema.orderLines.qtyReserved,
        qtyFulfilled: schema.orderLines.qtyFulfilled,
      })
      .from(schema.orderLines)
      .where(eq(schema.orderLines.orderId, id));

    const requests: FulfillmentRequest[] =
      body.lines && body.lines.length > 0
        ? body.lines.map((l) => ({
            orderLineId: String(l.orderLineId ?? ''),
            quantity: Number(l.quantity ?? 0),
          }))
        : remainingFulfillment(lines);
    if (requests.length === 0) throw new BadRequestException('Nothing left to fulfill');
    const plan = planFulfillment(lines, requests);
    if (plan.errors.length > 0) throw new BadRequestException(plan.errors.join('; '));

    await this.orders.applyFulfillment(this.db, {
      businessId: tenant.businessId!,
      orderId: id,
      locationId: order.locationId,
      actorUserId: actor?.id ?? null,
      steps: plan.steps,
    });
    const after = await this.db
      .select({
        quantity: schema.orderLines.quantity,
        qtyFulfilled: schema.orderLines.qtyFulfilled,
      })
      .from(schema.orderLines)
      .where(eq(schema.orderLines.orderId, id));
    await this.db
      .update(schema.orders)
      .set({ status: deriveFulfillmentStatus(after), updatedAt: new Date() })
      .where(eq(schema.orders.id, id));

    await this.audit.log({
      action: 'order.fulfill',
      targetType: 'order',
      targetId: id,
      after: { units: plan.steps.reduce((s, x) => s + x.quantity, 0), mode: 'pickup' },
    });
    return this.loadDetail(id);
  }

  /**
   * Close the book on an order. Requires every unit fulfilled, and the
   * money in — a balance due needs either zero or the explicit
   * `orders.complete_with_balance` permission (AR, G8). Whatever tiny
   * reservation residue remains (a cancelled line's units, a shortfall
   * that never arrived) is released so the stock ledger ends clean.
   */
  @Post('orders/:id/complete')
  @RequirePermission('orders.deposit.take')
  async complete(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: { allowBalance?: boolean },
  ): Promise<OrderDetail> {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');
    if (order.completedAt) throw new BadRequestException('Order is already completed');
    if (order.cancelledAt) throw new BadRequestException('A cancelled order cannot be completed');
    if (order.status !== 'fulfilled') {
      throw new BadRequestException('Deliver or hand over every unit before completing the order');
    }

    const payments = await this.db
      .select({ amountCents: schema.payments.amountCents, status: schema.payments.status })
      .from(schema.payments)
      .where(eq(schema.payments.orderId, id));
    const due = balanceDueCents(order.totalCents, payments);
    if (due > 0) {
      if (!body.allowBalance) {
        throw new BadRequestException(
          `Balance due is ${due} cents — collect it, or complete with balance explicitly`,
        );
      }
      if (!tenant.permissions.has('orders.complete_with_balance')) {
        throw new ForbiddenException('You are not allowed to complete an order with a balance due');
      }
    }

    // End clean: any reservation left (shortfall units that never shipped)
    // goes back to the pool.
    await this.orders.releaseOrder(this.db, {
      businessId: tenant.businessId!,
      orderId: id,
      locationId: order.locationId,
      actorUserId: actor?.id ?? null,
    });
    await this.db
      .update(schema.orders)
      .set({ status: 'completed', completedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.orders.id, id));

    // Commission accrues at completion (G5), split per split_bps;
    // imported orders never accrue (D8) — enforced in the service.
    await this.commissions.accrueForOrder(this.db, {
      businessId: tenant.businessId!,
      orderId: id,
    });

    await this.audit.log({
      action: 'order.complete',
      targetType: 'order',
      targetId: id,
      after: { balanceDueCents: due, withBalance: due > 0 },
    });
    const detail = await this.loadDetail(id);
    this.fireOrderEvent('order.completed', tenant.businessId!, detail);
    return detail;
  }

  @Post('orders/:id/cancel')
  @RequirePermission('orders.cancel')
  async cancel(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: CancelOrderBody,
  ): Promise<OrderDetail> {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'cancelled') throw new BadRequestException('Order is already cancelled');
    if (order.status === 'completed') {
      throw new BadRequestException('A completed order cannot be cancelled — refund it instead');
    }

    const payments = await this.db
      .select({ amountCents: schema.payments.amountCents, status: schema.payments.status })
      .from(schema.payments)
      .where(eq(schema.payments.orderId, id));
    if (paidCents(payments) > 0) {
      throw new ForbiddenException('Refund the money collected on this order before cancelling it');
    }

    await this.orders.releaseOrder(this.db, {
      businessId: tenant.businessId!,
      orderId: id,
      locationId: order.locationId,
      actorUserId: actor?.id ?? null,
    });
    await this.db
      .update(schema.orders)
      .set({
        status: 'cancelled',
        cancelledAt: new Date(),
        internalNotes: body.reason
          ? [order.internalNotes, `Cancelled: ${body.reason}`].filter(Boolean).join('\n')
          : order.internalNotes,
        updatedAt: new Date(),
      })
      .where(eq(schema.orders.id, id));

    await this.audit.log({
      action: 'order.cancel',
      targetType: 'order',
      targetId: id,
      before: { status: order.status },
      after: { status: 'cancelled', reason: body.reason ?? null },
    });

    const detail = await this.loadDetail(id);
    this.fireOrderEvent('order.cancelled', tenant.businessId!, detail);
    return detail;
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------

  /**
   * Resolve variants, prices, and the tax rate for a batch of line
   * inputs. Rate resolution matches the POS exactly — per-location tax
   * class override, then the class fallback, then the location default,
   * then the business default — so an order and a sale of the same item
   * on the same day are taxed identically.
   */
  private async priceLines(
    tenant: RequestTenantContext,
    locationId: string,
    inputs: readonly OrderLineInput[],
  ): Promise<
    {
      variantId: string;
      description: string;
      quantity: number;
      unitPriceCents: number;
      lineDiscountCents: number;
      lineType: string;
      taxRateBps: number;
      taxClassId: string | null;
    }[]
  > {
    const variantIds = inputs.map((l) => {
      if (!l.variantId) throw new BadRequestException('lines[].variantId is required');
      if (!Number.isInteger(l.quantity) || (l.quantity ?? 0) <= 0) {
        throw new BadRequestException('lines[].quantity must be a positive integer');
      }
      if (l.lineType && !LINE_TYPES.includes(l.lineType)) {
        throw new BadRequestException("lines[].lineType must be 'stock' or 'special_order'");
      }
      return l.variantId;
    });

    const variants = await this.db
      .select({
        id: schema.productVariants.id,
        priceCents: schema.productVariants.priceCents,
        productName: schema.products.name,
        variantName: schema.productVariants.name,
        taxClassId: schema.products.taxClassId,
        taxClassFallbackRateBps: schema.taxClasses.rateBps,
      })
      .from(schema.productVariants)
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .leftJoin(schema.taxClasses, eq(schema.taxClasses.id, schema.products.taxClassId))
      .where(inArray(schema.productVariants.id, variantIds));
    const byId = new Map(variants.map((v) => [v.id, v]));
    for (const id of variantIds) {
      if (!byId.has(id)) throw new NotFoundException(`Variant not found: ${id}`);
    }

    const taxClassIds = Array.from(
      new Set(variants.map((v) => v.taxClassId).filter((id): id is string => Boolean(id))),
    );
    const overrideMap = new Map<string, number>();
    if (taxClassIds.length > 0) {
      const overrides = await this.db
        .select({
          taxClassId: schema.taxClassRates.taxClassId,
          rateBps: schema.taxClassRates.rateBps,
        })
        .from(schema.taxClassRates)
        .where(
          and(
            inArray(schema.taxClassRates.taxClassId, taxClassIds),
            eq(schema.taxClassRates.locationId, locationId),
          ),
        );
      for (const o of overrides) overrideMap.set(o.taxClassId, o.rateBps);
    }

    const [location] = await this.db
      .select({ taxRateBps: schema.locations.taxRateBps })
      .from(schema.locations)
      .where(eq(schema.locations.id, locationId))
      .limit(1);
    let fallbackRateBps = location?.taxRateBps ?? null;
    if (fallbackRateBps == null) {
      const [biz] = await this.db
        .select({ defaultTaxRateBps: schema.businesses.defaultTaxRateBps })
        .from(schema.businesses)
        .where(eq(schema.businesses.id, tenant.businessId!))
        .limit(1);
      fallbackRateBps = biz?.defaultTaxRateBps ?? 0;
    }

    return inputs.map((l) => {
      const v = byId.get(l.variantId!)!;
      const lineDiscountCents = l.lineDiscountCents ?? 0;
      if (!Number.isInteger(lineDiscountCents) || lineDiscountCents < 0) {
        throw new BadRequestException('lines[].lineDiscountCents must be a non-negative integer');
      }
      const description =
        l.description ?? [v.productName, v.variantName].filter(Boolean).join(' — ');
      return {
        variantId: v.id,
        description,
        quantity: l.quantity!,
        unitPriceCents: l.unitPriceCents ?? v.priceCents,
        lineDiscountCents,
        lineType: l.lineType ?? 'stock',
        taxRateBps:
          (v.taxClassId ? overrideMap.get(v.taxClassId) : undefined) ??
          v.taxClassFallbackRateBps ??
          fallbackRateBps!,
        taxClassId: v.taxClassId,
      };
    });
  }

  /** Load an order, refusing anything that is finished or cancelled. */
  private async requireLiveOrder(id: string): Promise<typeof schema.orders.$inferSelect> {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');
    if (!isLiveOrderStatus(order.status)) {
      throw new BadRequestException(
        `Order is ${order.status as OrderStatus} and cannot be changed`,
      );
    }
    return order;
  }

  private async loadDetail(id: string): Promise<OrderDetail> {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');

    const lines = await this.db
      .select()
      .from(schema.orderLines)
      .where(eq(schema.orderLines.orderId, id))
      .orderBy(schema.orderLines.createdAt);

    const payments = await this.db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.orderId, id))
      .orderBy(schema.payments.createdAt);

    return {
      id: order.id,
      number: order.number,
      status: order.status,
      customerId: order.customerId,
      locationId: order.locationId,
      subtotalCents: order.subtotalCents,
      orderDiscountCents: order.orderDiscountCents,
      discountCents: order.discountCents,
      taxCents: order.taxCents,
      totalCents: order.totalCents,
      paidCents: paidCents(payments),
      balanceDueCents: balanceDueCents(order.totalCents, payments),
      depositRequiredCents: order.depositRequiredCents,
      fulfillmentType: order.fulfillmentType,
      requestedDate: order.requestedDate,
      addressLine1: order.addressLine1,
      addressLine2: order.addressLine2,
      addressCity: order.addressCity,
      addressRegion: order.addressRegion,
      addressPostalCode: order.addressPostalCode,
      addressPhone: order.addressPhone,
      notes: order.notes,
      internalNotes: order.internalNotes,
      salespersonMembershipId: order.salespersonMembershipId,
      secondSalespersonMembershipId: order.secondSalespersonMembershipId,
      splitBps: order.splitBps,
      importedAt: order.importedAt,
      legacyNumber: order.legacyNumber,
      completedAt: order.completedAt,
      cancelledAt: order.cancelledAt,
      createdAt: order.createdAt,
      lines: lines.map((l) => ({
        id: l.id,
        variantId: l.variantId,
        description: l.description,
        quantity: l.quantity,
        qtyReserved: l.qtyReserved,
        qtyFulfilled: l.qtyFulfilled,
        lineType: l.lineType,
        unitPriceCents: l.unitPriceCents,
        discountCents: l.discountCents,
        taxCents: l.taxCents,
        totalCents: l.totalCents,
        taxRateBps: l.taxRateBps,
      })),
      payments: payments.map((p) => ({
        id: p.id,
        kind: p.kind,
        method: p.method,
        amountCents: p.amountCents,
        status: p.status,
        processor: p.processor,
        processorRef: p.processorRef,
        financingProvider: p.financingProvider,
        financingRef: p.financingRef,
        createdAt: p.createdAt,
      })),
    };
  }

  /**
   * Fire-and-forget outbound webhook. Imported history stays silent
   * (D8) — replaying two years of STORIS orders must not spray a
   * customer's integrations with events that already happened.
   */
  private fireOrderEvent(
    eventType: 'order.created' | 'order.payment_received' | 'order.cancelled' | 'order.completed',
    businessId: string,
    order: OrderDetail,
    extra?: Record<string, unknown>,
  ): void {
    if (order.importedAt) return;
    void this.webhooks.fire({
      businessId,
      eventType,
      payload: {
        orderId: order.id,
        number: order.number,
        status: order.status,
        customerId: order.customerId,
        locationId: order.locationId,
        totalCents: order.totalCents,
        paidCents: order.paidCents,
        balanceDueCents: order.balanceDueCents,
        ...extra,
      },
    });
  }
}
