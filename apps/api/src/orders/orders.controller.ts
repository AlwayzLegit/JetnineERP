import {
  BadRequestException,
  Body,
  ConflictException,
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
import { randomBytes } from 'node:crypto';
import { and, desc, eq, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import {
  buildPage,
  clampLimit,
  decodeCursor,
  encodeCursor,
  timestampCursorOrder,
  timestampCursorWhere,
  type PageResponse,
} from '../common/pagination';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { CommissionsService } from '../money/commissions.service';
import { StoreCreditService } from '../returns/store-credit.service';
import {
  SecurityOverrideService,
  type OverrideCredentials,
} from '../controls/security-override.service';
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
  'paypal',
  'venmo',
  'zelle',
  'synchrony',
  'acima',
] as const;
type PaymentMethod = (typeof PAYMENT_METHODS)[number];

const FULFILLMENT_TYPES = ['delivery', 'pickup', 'take_with', 'direct_ship'] as const;
const DELIVERY_STATUSES = ['scheduled', 'estimated', 'asap', 'will_call'] as const;
const ORDER_KINDS = ['sales_order', 'layaway', 'exchange'] as const;
const LINE_TYPES = ['stock', 'special_order', 'custom'] as const;

interface OrderLineInput {
  variantId?: string;
  /** Free-text override; defaults to the variant's product/variant name. */
  description?: string;
  quantity?: number;
  /** Optional override; defaults to the variant's price. */
  unitPriceCents?: number;
  lineDiscountCents?: number;
  lineType?: (typeof LINE_TYPES)[number];
  /** Split-ticket override of the order's fulfillment method. */
  fulfillmentMethod?: (typeof FULFILLMENT_TYPES)[number] | null;
  /** Per-line promised date (YYYY-MM-DD) when items arrive separately. */
  deliveryDate?: string | null;
}

interface AddressInput {
  line1?: string | null;
  line2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  phone?: string | null;
}

interface StepThreeFees {
  deliveryFeeCents?: number;
  installFeeCents?: number;
  otherFeeCents?: number;
  otherFeeLabel?: string | null;
}

interface CreateOrderBody extends StepThreeFees {
  locationId?: string;
  customerId?: string;
  lines?: OrderLineInput[];
  orderDiscountCents?: number;
  orderKind?: (typeof ORDER_KINDS)[number];
  fulfillmentType?: (typeof FULFILLMENT_TYPES)[number];
  deliveryStatus?: (typeof DELIVERY_STATUSES)[number] | null;
  deliveryInstructions?: string | null;
  pickupLocationId?: string | null;
  billingAddress?: AddressInput | null;
  marketingCode?: string | null;
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
  /**
   * Park as a store-wide draft instead (PLAN-POS-OPERATIONS §4): no
   * reservation, resumable by any associate, listed under status=draft.
   */
  draft?: boolean;
}

interface UpdateOrderBody extends StepThreeFees {
  fulfillmentType?: (typeof FULFILLMENT_TYPES)[number];
  orderKind?: (typeof ORDER_KINDS)[number];
  deliveryStatus?: (typeof DELIVERY_STATUSES)[number] | null;
  deliveryInstructions?: string | null;
  pickupLocationId?: string | null;
  billingAddress?: AddressInput | null;
  marketingCode?: string | null;
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
  qtyReturned: number;
  lineType: string;
  unitPriceCents: number;
  discountCents: number;
  taxCents: number;
  totalCents: number;
  taxRateBps: number;
  fulfillmentMethod: string | null;
  deliveryDate: string | null;
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
  /** Derived (§10 exchanges): paid - total, floored at zero. */
  creditDueCents: number;
  addressLine1: string | null;
  addressLine2: string | null;
  addressCity: string | null;
  addressRegion: string | null;
  addressPostalCode: string | null;
  addressPhone: string | null;
  notes: string | null;
  internalNotes: string | null;
  /** §10: the original order this exchange was written against. */
  originalOrderId: string | null;
  salespersonMembershipId: string | null;
  secondSalespersonMembershipId: string | null;
  splitBps: number | null;
  orderKind: string;
  deliveryStatus: string | null;
  deliveryInstructions: string | null;
  pickupLocationId: string | null;
  billingAddressJson: unknown;
  marketingCode: string | null;
  deliveryFeeCents: number;
  installFeeCents: number;
  otherFeeCents: number;
  otherFeeLabel: string | null;
  legacyNumber: string | null;
  /** A1 print lock: set when an individual delivery ticket was printed. */
  lockedAt: Date | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  lines: OrderLineRow[];
  payments: OrderPaymentRow[];
}

/** The one-call payload the printable documents render from (§11). */
interface OrderDocument {
  business: {
    name: string;
    logoUrl: string | null;
    invoiceHeaderNote: string | null;
    invoiceFooterNote: string | null;
  };
  location: {
    name: string;
    orderPrefix: string | null;
    addressJson: unknown;
  } | null;
  customer: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
  } | null;
  salespersonName: string | null;
  secondSalespersonName: string | null;
  /** §10: set on exchange orders — the Original Invoice #. */
  originalOrderNumber: string | null;
  /** Earliest undelivered trip date, falling back to the requested date. */
  scheduledDate: string | null;
  order: OrderDetail;
  lines: (OrderLineRow & { model: string | null; brand: string | null })[];
}

/** Step-3 fee fields must be non-negative integer cents. */
function assertFees(body: StepThreeFees): void {
  for (const [k, v] of [
    ['deliveryFeeCents', body.deliveryFeeCents],
    ['installFeeCents', body.installFeeCents],
    ['otherFeeCents', body.otherFeeCents],
  ] as const) {
    if (v !== undefined && (!Number.isInteger(v) || v < 0)) {
      throw new BadRequestException(`${k} must be a non-negative integer`);
    }
  }
}

/** Validated per-line fulfillment override, or NULL to inherit the order's. */
function lineFulfillment(line: OrderLineInput | undefined): string | null {
  const m = line?.fulfillmentMethod;
  if (m == null) return null;
  if (!FULFILLMENT_TYPES.includes(m)) {
    throw new BadRequestException(
      `line fulfillmentMethod must be one of ${FULFILLMENT_TYPES.join(', ')}`,
    );
  }
  return m;
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
    @Inject(StoreCreditService) private readonly storeCredit: StoreCreditService,
    @Inject(SecurityOverrideService) private readonly overrides: SecurityOverrideService,
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

  /**
   * The spec's orders table (PLAN-POS-OPERATIONS §8): one page of orders
   * with everything the columns need — customer, salesperson, balance
   * due, delivery date — plus the STORIS display status derived from the
   * order's real state (Draft → Pending → On PO → Reserved → Scheduled →
   * Out for Delivery → Delivered; Quote/Layaway/Cancelled as applicable).
   */
  @Get('orders/list-view')
  @RequirePermission('orders.view')
  async listView(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('limit') limitStr?: string,
    @Query('cursor') cursorStr?: string,
    @Query('status') status?: string,
    @Query('q') q?: string,
  ): Promise<
    PageResponse<{
      id: string;
      number: string;
      customerName: string;
      displayStatus: string;
      poNumber: string | null;
      deliveryDate: string | null;
      balanceDueCents: number;
      salespersonName: string | null;
      totalCents: number;
      createdAt: Date;
    }>
  > {
    const limit = clampLimit(limitStr);
    const cursor = decodeCursor(cursorStr);
    const filters = [];
    if (status) filters.push(eq(schema.orders.status, status));
    if (q?.trim()) {
      const like = `%${q.trim()}%`;
      filters.push(
        sql`(${schema.orders.number} ILIKE ${like} OR ${schema.customers.firstName} ILIKE ${like} OR ${schema.customers.lastName} ILIKE ${like})`,
      );
    }
    const cursorWhere = timestampCursorWhere(schema.orders.createdAt, schema.orders.id, cursor);
    if (cursorWhere) filters.push(cursorWhere);

    const rows = await this.db
      .select({
        id: schema.orders.id,
        number: schema.orders.number,
        status: schema.orders.status,
        orderKind: schema.orders.orderKind,
        totalCents: schema.orders.totalCents,
        requestedDate: schema.orders.requestedDate,
        createdAt: schema.orders.createdAt,
        firstName: schema.customers.firstName,
        lastName: schema.customers.lastName,
        salespersonName: schema.users.name,
      })
      .from(schema.orders)
      .innerJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
      .leftJoin(
        schema.memberships,
        eq(schema.memberships.id, schema.orders.salespersonMembershipId),
      )
      .leftJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
      .where(filters.length > 0 ? and(...filters) : undefined)
      .orderBy(...timestampCursorOrder(schema.orders.createdAt, schema.orders.id))
      .limit(limit + 1);

    const pageRows = rows.slice(0, limit);
    const ids = pageRows.map((r) => r.id);
    const paid = new Map<string, number>();
    const deliveryState = new Map<string, { date: string | null; status: string }>();
    const poByOrder = new Map<string, string>();
    const reservedShort = new Set<string>();
    const fullyReturned = new Set<string>();
    const exchangedOriginals = new Set<string>();
    if (ids.length > 0) {
      const pays = await this.db
        .select({
          orderId: schema.payments.orderId,
          cents: sql<number>`coalesce(sum(${schema.payments.amountCents}), 0)::int`,
        })
        .from(schema.payments)
        .where(and(inArray(schema.payments.orderId, ids), eq(schema.payments.status, 'succeeded')))
        .groupBy(schema.payments.orderId);
      for (const p of pays) if (p.orderId) paid.set(p.orderId, p.cents);

      // Undelivered trips, most advanced status first per order.
      const trips = await this.db
        .select({
          orderId: schema.deliveries.orderId,
          scheduledDate: schema.deliveries.scheduledDate,
          status: schema.deliveries.status,
        })
        .from(schema.deliveries)
        .where(
          and(
            inArray(schema.deliveries.orderId, ids),
            inArray(schema.deliveries.status, ['scheduled', 'loaded', 'out_for_delivery']),
          ),
        );
      for (const t of trips) {
        const cur = deliveryState.get(t.orderId);
        if (!cur || t.status === 'out_for_delivery') {
          deliveryState.set(t.orderId, { date: t.scheduledDate, status: t.status });
        }
      }

      // Lines still owed by an open PO → "On PO (#…)".
      const allocs = await this.db
        .select({
          orderId: schema.orderLines.orderId,
          poNumber: schema.purchaseOrders.number,
        })
        .from(schema.poLineAllocations)
        .innerJoin(
          schema.orderLines,
          eq(schema.orderLines.id, schema.poLineAllocations.orderLineId),
        )
        .innerJoin(
          schema.purchaseOrderLines,
          eq(schema.purchaseOrderLines.id, schema.poLineAllocations.poLineId),
        )
        .innerJoin(
          schema.purchaseOrders,
          eq(schema.purchaseOrders.id, schema.purchaseOrderLines.purchaseOrderId),
        )
        .where(
          and(
            inArray(schema.orderLines.orderId, ids),
            sql`${schema.purchaseOrderLines.quantityOrdered} > ${schema.purchaseOrderLines.quantityReceived}`,
          ),
        );
      for (const a of allocs) if (!poByOrder.has(a.orderId)) poByOrder.set(a.orderId, a.poNumber);

      // §10 display statuses: fully-returned orders and originals with
      // an exchange written against them.
      const returnAgg = await this.db
        .select({
          orderId: schema.orderLines.orderId,
          fulfilled: sql<number>`coalesce(sum(${schema.orderLines.qtyFulfilled}), 0)::int`,
          returned: sql<number>`coalesce(sum(${schema.orderLines.qtyReturned}), 0)::int`,
        })
        .from(schema.orderLines)
        .where(inArray(schema.orderLines.orderId, ids))
        .groupBy(schema.orderLines.orderId);
      for (const r of returnAgg) {
        if (r.returned > 0 && r.returned >= r.fulfilled) fullyReturned.add(r.orderId);
      }
      const exchangeChildren = await this.db
        .select({ originalOrderId: schema.orders.originalOrderId })
        .from(schema.orders)
        .where(
          and(
            inArray(schema.orders.originalOrderId, ids),
            sql`${schema.orders.status} != 'cancelled'`,
          ),
        );
      for (const r of exchangeChildren) {
        if (r.originalOrderId) exchangedOriginals.add(r.originalOrderId);
      }

      // Stock lines not yet fully reserved → still "Pending".
      const shorts = await this.db
        .select({ orderId: schema.orderLines.orderId })
        .from(schema.orderLines)
        .where(
          and(
            inArray(schema.orderLines.orderId, ids),
            eq(schema.orderLines.lineType, 'stock'),
            sql`${schema.orderLines.qtyReserved} + ${schema.orderLines.qtyFulfilled} < ${schema.orderLines.quantity}`,
          ),
        );
      for (const r of shorts) reservedShort.add(r.orderId);
    }

    const enriched = pageRows.map((r) => {
      const balance = Math.max(0, r.totalCents - (paid.get(r.id) ?? 0));
      const trip = deliveryState.get(r.id);
      let displayStatus: string;
      if (r.status === 'draft') displayStatus = 'Draft';
      else if (r.status === 'quote') displayStatus = 'Quote';
      else if (r.status === 'cancelled') displayStatus = 'Cancelled';
      else if (fullyReturned.has(r.id)) displayStatus = 'Returned';
      else if (exchangedOriginals.has(r.id)) displayStatus = 'Exchanged';
      else if (r.status === 'completed' || r.status === 'fulfilled') displayStatus = 'Delivered';
      else if (r.orderKind === 'layaway' && balance > 0) displayStatus = 'Layaway';
      else if (trip?.status === 'out_for_delivery') displayStatus = 'Out for Delivery';
      else if (trip) displayStatus = 'Scheduled';
      else if (poByOrder.has(r.id)) displayStatus = 'On PO';
      else if (!reservedShort.has(r.id)) displayStatus = 'Reserved';
      else displayStatus = 'Pending';
      return {
        id: r.id,
        number: r.number,
        customerName: [r.firstName, r.lastName].filter(Boolean).join(' ') || '—',
        displayStatus,
        poNumber: displayStatus === 'On PO' ? (poByOrder.get(r.id) ?? null) : null,
        deliveryDate: trip?.date ?? r.requestedDate,
        balanceDueCents: balance,
        salespersonName: r.salespersonName ?? null,
        totalCents: r.totalCents,
        createdAt: r.createdAt,
      };
    });
    const hasMore = rows.length > limit;
    const last = pageRows[pageRows.length - 1];
    return {
      data: enriched,
      nextCursor: hasMore && last ? encodeCursor(last.createdAt, last.id) : null,
    };
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
      throw new BadRequestException(
        `fulfillmentType must be one of ${FULFILLMENT_TYPES.join(', ')}`,
      );
    }
    const orderKind = body.orderKind ?? 'sales_order';
    if (!ORDER_KINDS.includes(orderKind)) {
      throw new BadRequestException(`orderKind must be one of ${ORDER_KINDS.join(', ')}`);
    }
    if (body.deliveryStatus != null && !DELIVERY_STATUSES.includes(body.deliveryStatus)) {
      throw new BadRequestException(
        `deliveryStatus must be one of ${DELIVERY_STATUSES.join(', ')}`,
      );
    }
    assertFees(body);
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

    if (body.pickupLocationId) {
      const [pickup] = await this.db
        .select({ id: schema.locations.id })
        .from(schema.locations)
        .where(eq(schema.locations.id, body.pickupLocationId))
        .limit(1);
      if (!pickup) throw new NotFoundException('Pickup location not found');
    }

    const priced = await this.priceLines(tenant, body.locationId, body.lines);

    const number = await this.orders.generateOrderNumber(
      this.db,
      tenant.businessId!,
      body.locationId,
    );
    const [order] = await this.db
      .insert(schema.orders)
      .values({
        businessId: tenant.businessId!,
        locationId: body.locationId,
        number,
        status: body.draft ? 'draft' : 'quote',
        customerId: body.customerId,
        salespersonMembershipId: body.salespersonMembershipId ?? tenant.membershipId ?? null,
        secondSalespersonMembershipId: body.secondSalespersonMembershipId ?? null,
        splitBps: body.splitBps ?? null,
        orderDiscountCents,
        orderKind,
        fulfillmentType,
        deliveryStatus: body.deliveryStatus ?? null,
        deliveryInstructions: body.deliveryInstructions ?? null,
        pickupLocationId: body.pickupLocationId ?? null,
        billingAddressJson: (body.billingAddress ?? null) as never,
        marketingCode: body.marketingCode ?? null,
        deliveryFeeCents: body.deliveryFeeCents ?? 0,
        installFeeCents: body.installFeeCents ?? 0,
        otherFeeCents: body.otherFeeCents ?? 0,
        otherFeeLabel: body.otherFeeLabel ?? null,
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
      priced.map((l, i) => ({
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
        fulfillmentMethod: lineFulfillment(body.lines![i]),
        deliveryDate: body.lines![i]?.deliveryDate ?? null,
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
    this.assertUnlocked(order);

    const patch: Record<string, unknown> = { updatedAt: new Date() };
    if (body.fulfillmentType !== undefined) {
      if (!FULFILLMENT_TYPES.includes(body.fulfillmentType)) {
        throw new BadRequestException(
          `fulfillmentType must be one of ${FULFILLMENT_TYPES.join(', ')}`,
        );
      }
      patch.fulfillmentType = body.fulfillmentType;
    }
    if (body.orderKind !== undefined) {
      if (!ORDER_KINDS.includes(body.orderKind)) {
        throw new BadRequestException(`orderKind must be one of ${ORDER_KINDS.join(', ')}`);
      }
      patch.orderKind = body.orderKind;
    }
    if (body.deliveryStatus !== undefined) {
      if (body.deliveryStatus != null && !DELIVERY_STATUSES.includes(body.deliveryStatus)) {
        throw new BadRequestException(
          `deliveryStatus must be one of ${DELIVERY_STATUSES.join(', ')}`,
        );
      }
      patch.deliveryStatus = body.deliveryStatus;
    }
    if (body.deliveryInstructions !== undefined)
      patch.deliveryInstructions = body.deliveryInstructions;
    if (body.marketingCode !== undefined) patch.marketingCode = body.marketingCode;
    if (body.billingAddress !== undefined) patch.billingAddressJson = body.billingAddress as never;
    if (body.pickupLocationId !== undefined) {
      if (body.pickupLocationId) {
        const [pickup] = await this.db
          .select({ id: schema.locations.id })
          .from(schema.locations)
          .where(eq(schema.locations.id, body.pickupLocationId))
          .limit(1);
        if (!pickup) throw new NotFoundException('Pickup location not found');
      }
      patch.pickupLocationId = body.pickupLocationId;
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
    if (
      body.deliveryFeeCents !== undefined ||
      body.installFeeCents !== undefined ||
      body.otherFeeCents !== undefined ||
      body.otherFeeLabel !== undefined
    ) {
      assertFees(body);
      if (body.deliveryFeeCents !== undefined) patch.deliveryFeeCents = body.deliveryFeeCents;
      if (body.installFeeCents !== undefined) patch.installFeeCents = body.installFeeCents;
      if (body.otherFeeCents !== undefined) patch.otherFeeCents = body.otherFeeCents;
      if (body.otherFeeLabel !== undefined) patch.otherFeeLabel = body.otherFeeLabel;
      repriced = true;
    }
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
      if (order.status !== 'quote' && order.status !== 'draft') {
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
    this.assertUnlocked(order);
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
    this.assertUnlocked(order);
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

    // §10: store credit is a real ledger — the tender checks the
    // customer's balance and writes the redemption (throws 400 when the
    // balance can't cover it, before any of this commits… the request
    // transaction rolls the payment row back with it).
    if (body.method === 'store_credit') {
      await this.storeCredit.redeem(this.db, {
        businessId: tenant.businessId!,
        customerId: order.customerId,
        amountCents: body.amountCents,
        referenceType: 'payment',
        referenceId: payment!.id,
        actorUserId: actor?.id ?? null,
      });
    }

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

  /**
   * Create (or return) the order's customer-facing share token. The
   * public page at /track/<token> shows a narrow read-only view;
   * generating is idempotent so re-sharing never invalidates a link a
   * customer already has.
   */
  @Post('orders/:id/share')
  @RequirePermission('orders.view')
  async share(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ token: string; path: string }> {
    const [order] = await this.db
      .select({ id: schema.orders.id, publicToken: schema.orders.publicToken })
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');
    let token = order.publicToken;
    if (!token) {
      const fresh = randomBytes(24).toString('hex');
      // Guarded write: two staff sharing at once must not overwrite a
      // token whose URL the other response already handed out.
      const [written] = await this.db
        .update(schema.orders)
        .set({ publicToken: fresh, updatedAt: new Date() })
        .where(and(eq(schema.orders.id, id), isNull(schema.orders.publicToken)))
        .returning({ publicToken: schema.orders.publicToken });
      if (written) {
        token = fresh;
        await this.audit.log({
          action: 'order.share_link_created',
          targetType: 'order',
          targetId: id,
        });
      } else {
        const [reread] = await this.db
          .select({ publicToken: schema.orders.publicToken })
          .from(schema.orders)
          .where(eq(schema.orders.id, id))
          .limit(1);
        token = reread?.publicToken ?? fresh;
      }
    }
    return { token, path: `/track/${token}` };
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
    this.assertUnlocked(order);

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

  /**
   * Record an *individual* delivery-ticket print. Per amendment A1 this
   * is the action that locks the order (batch printing never calls
   * this): the ticket is on the truck, so the paper and the system must
   * not diverge. Locking a live order re-stamps `lockedAt` on re-print;
   * finished/cancelled orders can still print (a reprint for the file)
   * without any lock taking effect.
   */
  @Post('orders/:id/delivery-ticket-print')
  @RequirePermission('orders.update')
  async deliveryTicketPrint(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ lockedAt: Date | null }> {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');

    if (!isLiveOrderStatus(order.status)) return { lockedAt: order.lockedAt };

    const lockedAt = new Date();
    await this.db
      .update(schema.orders)
      .set({ lockedAt, updatedAt: lockedAt })
      .where(eq(schema.orders.id, id));
    await this.audit.log({
      action: 'order.lock',
      targetType: 'order',
      targetId: id,
      metadata: { trigger: 'delivery_ticket_print' },
    });
    return { lockedAt };
  }

  /**
   * Clear the A1 print lock. Gated on `orders.unlock` at the point of
   * action (PLAN-STORIS-GAP §0.1): a user holding the permission
   * proceeds; a user without it gets 403 OVERRIDE_REQUIRED and can
   * retry under an authorized user's credentials — the override is
   * stamped in the security_overrides register with both identities.
   * The reason is coded (class `exception`) once the business has codes
   * defined; free text is the transitional fallback (A9).
   */
  @Post('orders/:id/unlock')
  async unlock(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: { reason?: string; reasonCodeId?: string; override?: OverrideCredentials },
  ): Promise<OrderDetail> {
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');
    if (!order.lockedAt) throw new BadRequestException('Order is not locked');

    const overrideResult = await this.overrides.require({
      permission: 'orders.unlock',
      action: `Unlock printed order ${order.number}`,
      entityType: 'order',
      entityId: id,
      before: { lockedAt: order.lockedAt.toISOString() },
      after: { lockedAt: null },
      override: body.override,
    });
    const reason = await this.overrides.resolveReason('exception', {
      reasonCodeId: body.reasonCodeId ?? body.override?.reasonCodeId,
      reason: body.reason ?? body.override?.reason,
    });

    await this.db
      .update(schema.orders)
      .set({ lockedAt: null, updatedAt: new Date() })
      .where(eq(schema.orders.id, id));
    await this.audit.log({
      action: 'order.unlock',
      targetType: 'order',
      targetId: id,
      metadata: {
        reason: reason.reasonText,
        reasonCode: reason.reasonCode,
        ...(overrideResult.overridden
          ? { authorizingUserId: overrideResult.authorizingUserId }
          : {}),
      },
    });
    return this.loadDetail(id);
  }

  /**
   * §10 return: goods come back, money goes out, and every returned
   * unit lands in the As-Is queue — never straight back to sellable
   * stock. No restocking fee. Refunds reverse the original tenders
   * proportionally (negative payment rows, newest tender first) or land
   * on the customer's store-credit ledger.
   */
  @Post('orders/:id/return')
  @RequirePermission('pos.refund.create')
  async returnGoods(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body()
    body: {
      lines?: { lineId?: string; quantity?: number }[];
      refundMethod?: 'original' | 'store_credit';
      reason?: string | null;
    },
  ): Promise<OrderDetail> {
    if (!body.lines || body.lines.length === 0) {
      throw new BadRequestException('lines must contain at least one entry');
    }
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');
    if (order.status === 'cancelled' || order.status === 'draft' || order.status === 'quote') {
      throw new BadRequestException(`Cannot return against a ${order.status} order`);
    }

    const lines = await this.db
      .select()
      .from(schema.orderLines)
      .where(eq(schema.orderLines.orderId, id));
    const byId = new Map(lines.map((l) => [l.id, l]));

    let amountCents = 0;
    const validated: { line: (typeof lines)[number]; quantity: number; perUnit: number }[] = [];
    for (const r of body.lines) {
      if (!r.lineId) throw new BadRequestException('lines[].lineId is required');
      const line = byId.get(r.lineId);
      if (!line) throw new NotFoundException(`Order line not found: ${r.lineId}`);
      if (!Number.isInteger(r.quantity) || (r.quantity ?? 0) <= 0) {
        throw new BadRequestException('lines[].quantity must be a positive integer');
      }
      const returnable = line.qtyFulfilled - line.qtyReturned;
      if (r.quantity! > returnable) {
        throw new BadRequestException(
          `Cannot return ${r.quantity} of line ${line.id}: only ${returnable} delivered unit(s) remain returnable`,
        );
      }
      // Refund what the customer actually paid for the unit: the line
      // total plus its tax share (order lines keep tax separately).
      const perUnit = Math.round((line.totalCents + line.taxCents) / line.quantity);
      validated.push({ line, quantity: r.quantity!, perUnit });
      amountCents += perUnit * r.quantity!;
    }

    const toStoreCredit = body.refundMethod === 'store_credit';
    const payments = await this.db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.orderId, id))
      .orderBy(desc(schema.payments.createdAt));
    const collected = paidCents(payments);
    if (!toStoreCredit && amountCents > collected) {
      throw new BadRequestException(
        `Refund (${amountCents}) exceeds the money collected (${collected}) — use store credit for the difference`,
      );
    }

    // Goods: bump the returned counters and stage everything in As-Is.
    for (const v of validated) {
      await this.db
        .update(schema.orderLines)
        .set({ qtyReturned: v.line.qtyReturned + v.quantity })
        .where(eq(schema.orderLines.id, v.line.id));
      if (v.line.variantId) {
        await this.db.insert(schema.asIsItems).values({
          businessId: tenant.businessId!,
          variantId: v.line.variantId,
          locationId: order.locationId,
          quantity: v.quantity,
          source: 'return',
          referenceType: 'order',
          referenceId: order.id,
          notes: body.reason ?? null,
        });
      }
    }

    // Money: proportional-enough reversal — walk the original tenders
    // newest first, writing negative payment rows until the refund is
    // covered (mirrors the sales refund's allocation order).
    if (toStoreCredit) {
      await this.storeCredit.issue(this.db, {
        businessId: tenant.businessId!,
        customerId: order.customerId,
        amountCents,
        reason: body.reason ?? `Return on ${order.number}`,
        referenceType: 'order_return',
        referenceId: order.id,
        actorUserId: actor?.id ?? null,
      });
    } else {
      let remaining = amountCents;
      for (const p of payments) {
        if (remaining <= 0) break;
        if (p.status !== 'succeeded' || p.amountCents <= 0) continue;
        const slice = Math.min(remaining, p.amountCents);
        await this.db.insert(schema.payments).values({
          businessId: tenant.businessId!,
          saleId: null,
          orderId: id,
          kind: 'refund',
          method: p.method,
          amountCents: -slice,
          status: 'succeeded',
        });
        remaining -= slice;
      }
    }

    await this.audit.log({
      action: 'order.return',
      targetType: 'order',
      targetId: id,
      after: {
        amountCents,
        refundMethod: toStoreCredit ? 'store_credit' : 'original',
        unitCount: validated.reduce((s, v) => s + v.quantity, 0),
        reason: body.reason ?? null,
      },
    });
    return this.loadDetail(id);
  }

  /**
   * §10 price adjustment / partial refund — money only, no goods. A
   * distinct transaction type from a return: nothing enters As-Is and
   * no quantities change.
   */
  @Post('orders/:id/price-adjustment')
  @RequirePermission('pos.refund.create')
  async priceAdjustment(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body()
    body: {
      amountCents?: number;
      reason?: string;
      reasonCodeId?: string;
      refundMethod?: 'original' | 'store_credit';
    },
  ): Promise<OrderDetail> {
    if (!Number.isInteger(body.amountCents) || (body.amountCents ?? 0) <= 0) {
      throw new BadRequestException('amountCents must be a positive integer');
    }
    // Coded reason (class `adjustment`) once the registry has codes;
    // free text stays as the transitional fallback (gap amendment A9).
    const adjReason = await this.overrides.resolveReason('adjustment', {
      reasonCodeId: body.reasonCodeId,
      reason: body.reason,
    });
    const [order] = await this.db
      .select()
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!order) throw new NotFoundException('Order not found');

    const payments = await this.db
      .select()
      .from(schema.payments)
      .where(eq(schema.payments.orderId, id))
      .orderBy(desc(schema.payments.createdAt));
    const collected = paidCents(payments);
    const toStoreCredit = body.refundMethod === 'store_credit';
    if (!toStoreCredit && body.amountCents! > collected) {
      throw new BadRequestException(
        `Adjustment (${body.amountCents}) exceeds the money collected (${collected})`,
      );
    }

    if (toStoreCredit) {
      await this.storeCredit.issue(this.db, {
        businessId: tenant.businessId!,
        customerId: order.customerId,
        amountCents: body.amountCents!,
        reason: adjReason.reasonText ?? adjReason.reasonCode ?? 'price adjustment',
        referenceType: 'order_return',
        referenceId: order.id,
        actorUserId: actor?.id ?? null,
      });
    } else {
      let remaining = body.amountCents!;
      for (const p of payments) {
        if (remaining <= 0) break;
        if (p.status !== 'succeeded' || p.amountCents <= 0) continue;
        const slice = Math.min(remaining, p.amountCents);
        await this.db.insert(schema.payments).values({
          businessId: tenant.businessId!,
          saleId: null,
          orderId: id,
          kind: 'adjustment',
          method: p.method,
          amountCents: -slice,
          status: 'succeeded',
        });
        remaining -= slice;
      }
    }

    await this.audit.log({
      action: 'order.price_adjustment',
      targetType: 'order',
      targetId: id,
      after: {
        amountCents: body.amountCents,
        refundMethod: toStoreCredit ? 'store_credit' : 'original',
        reason: adjReason.reasonText,
        reasonCode: adjReason.reasonCode,
      },
    });
    return this.loadDetail(id);
  }

  /**
   * §10 Exchange Order: a new order written against the original
   * invoice. The document prints as "Exchange Order" with the Original
   * Invoice # prominent; the return portion is handled by the return
   * endpoint (old goods → As-Is; credit covers the new goods).
   */
  @Post('orders/:id/exchange')
  @RequirePermission('orders.create')
  async createExchange(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Param('id') id: string,
    @Body() body: CreateOrderBody,
  ): Promise<OrderDetail> {
    const [original] = await this.db
      .select({
        id: schema.orders.id,
        number: schema.orders.number,
        status: schema.orders.status,
        customerId: schema.orders.customerId,
        locationId: schema.orders.locationId,
      })
      .from(schema.orders)
      .where(eq(schema.orders.id, id))
      .limit(1);
    if (!original) throw new NotFoundException('Original order not found');
    if (
      original.status === 'draft' ||
      original.status === 'quote' ||
      original.status === 'cancelled'
    ) {
      throw new BadRequestException(`Cannot write an exchange against a ${original.status} order`);
    }

    const created = await this.create(tenant, actor, {
      ...body,
      customerId: original.customerId,
      locationId: body.locationId ?? original.locationId,
      orderKind: 'exchange',
    });
    await this.db
      .update(schema.orders)
      .set({ originalOrderId: original.id, updatedAt: new Date() })
      .where(eq(schema.orders.id, created.id));

    await this.audit.log({
      action: 'order.exchange.create',
      targetType: 'order',
      targetId: created.id,
      metadata: { originalOrderId: original.id, originalNumber: original.number },
    });
    return this.loadDetail(created.id);
  }

  /**
   * Everything a printed document needs in one payload (PLAN-POS-
   * OPERATIONS §11): the order detail plus business branding + admin
   * header/footer notes, the store block, the customer (Sold To),
   * salesperson names, per-line model/brand, the scheduled date from the
   * earliest undelivered trip, and the payments list. The web print
   * views (invoice, delivery ticket, batch) all render from this.
   */
  @Get('orders/:id/document')
  @RequirePermission('orders.view')
  async document(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<OrderDocument> {
    const detail = await this.loadDetail(id);

    const [biz] = await this.db
      .select({
        name: schema.businesses.name,
        brandingJson: schema.businesses.brandingJson,
        opsSettingsJson: schema.businesses.opsSettingsJson,
      })
      .from(schema.businesses)
      .where(eq(schema.businesses.id, tenant.businessId!))
      .limit(1);
    const branding = (biz?.brandingJson ?? {}) as { logoUrl?: string; publicName?: string };
    const ops = (biz?.opsSettingsJson ?? {}) as {
      invoiceHeaderNote?: string;
      invoiceFooterNote?: string;
    };

    const [location] = await this.db
      .select({
        name: schema.locations.name,
        orderPrefix: schema.locations.orderPrefix,
        addressJson: schema.locations.addressJson,
      })
      .from(schema.locations)
      .where(eq(schema.locations.id, detail.locationId))
      .limit(1);

    const [customer] = await this.db
      .select({
        id: schema.customers.id,
        firstName: schema.customers.firstName,
        lastName: schema.customers.lastName,
        email: schema.customers.email,
        phone: schema.customers.phone,
      })
      .from(schema.customers)
      .where(eq(schema.customers.id, detail.customerId))
      .limit(1);

    const salespersonName = async (membershipId: string | null) => {
      if (!membershipId) return null;
      const [row] = await this.db
        .select({ name: schema.users.name, email: schema.users.email })
        .from(schema.memberships)
        .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
        .where(eq(schema.memberships.id, membershipId))
        .limit(1);
      return row?.name ?? row?.email ?? null;
    };

    // Scheduled Date box = the earliest trip still owed to the customer.
    const [trip] = await this.db
      .select({ scheduledDate: schema.deliveries.scheduledDate })
      .from(schema.deliveries)
      .where(
        and(
          eq(schema.deliveries.orderId, id),
          inArray(schema.deliveries.status, ['scheduled', 'loaded', 'out_for_delivery']),
        ),
      )
      .orderBy(schema.deliveries.scheduledDate)
      .limit(1);

    // Line grid Model | Brand: model = variant SKU, brand = the
    // variant's preferred vendor (closest thing the catalog has to a
    // brand field — flagged as a v1 convention).
    const variantIds = detail.lines.map((l) => l.variantId).filter((v): v is string => Boolean(v));
    const lineMeta = new Map<string, { model: string | null; brand: string | null }>();
    if (variantIds.length > 0) {
      const rows = await this.db
        .select({
          variantId: schema.productVariants.id,
          model: schema.productVariants.sku,
          brand: schema.vendors.name,
        })
        .from(schema.productVariants)
        .leftJoin(schema.vendors, eq(schema.vendors.id, schema.productVariants.preferredVendorId))
        .where(inArray(schema.productVariants.id, variantIds));
      for (const r of rows) lineMeta.set(r.variantId, { model: r.model, brand: r.brand });
    }

    // §10 Exchange Order doc: the Original Invoice # prints prominently.
    let originalOrderNumber: string | null = null;
    if (detail.originalOrderId) {
      const [orig] = await this.db
        .select({ number: schema.orders.number })
        .from(schema.orders)
        .where(eq(schema.orders.id, detail.originalOrderId))
        .limit(1);
      originalOrderNumber = orig?.number ?? null;
    }

    return {
      business: {
        name: branding.publicName ?? biz?.name ?? '',
        logoUrl: branding.logoUrl ?? null,
        invoiceHeaderNote: ops.invoiceHeaderNote ?? null,
        invoiceFooterNote: ops.invoiceFooterNote ?? null,
      },
      location: location
        ? {
            name: location.name,
            orderPrefix: location.orderPrefix ?? null,
            addressJson: location.addressJson ?? null,
          }
        : null,
      customer: customer
        ? {
            id: customer.id,
            name: [customer.firstName, customer.lastName].filter(Boolean).join(' ') || '(no name)',
            email: customer.email,
            phone: customer.phone,
          }
        : null,
      salespersonName: await salespersonName(detail.salespersonMembershipId),
      secondSalespersonName: await salespersonName(detail.secondSalespersonMembershipId),
      originalOrderNumber,
      scheduledDate: trip?.scheduledDate ?? detail.requestedDate,
      order: detail,
      lines: detail.lines.map((l) => ({
        ...l,
        model: l.variantId ? (lineMeta.get(l.variantId)?.model ?? null) : null,
        brand: l.variantId ? (lineMeta.get(l.variantId)?.brand ?? null) : null,
      })),
    };
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
    for (const l of inputs) {
      if (!Number.isInteger(l.quantity) || (l.quantity ?? 0) <= 0) {
        throw new BadRequestException('lines[].quantity must be a positive integer');
      }
      if (l.lineType && !LINE_TYPES.includes(l.lineType)) {
        throw new BadRequestException(`lines[].lineType must be one of ${LINE_TYPES.join(', ')}`);
      }
      // Custom lines (PLAN-POS-OPERATIONS §4: recycling fee, removal, misc
      // charges) have no variant: they need their own description + price,
      // never reserve stock, and are untaxed (CA recycling fees are not
      // taxable; taxable merchandise is always a variant line).
      if (!l.variantId) {
        if (l.lineType !== 'custom') {
          throw new BadRequestException('lines[].variantId is required for product lines');
        }
        if (!l.description?.trim()) {
          throw new BadRequestException('custom lines need a description');
        }
        if (!Number.isInteger(l.unitPriceCents) || (l.unitPriceCents ?? -1) < 0) {
          throw new BadRequestException('custom lines need a non-negative unitPriceCents');
        }
      } else if (l.lineType === 'custom') {
        throw new BadRequestException('custom lines must not reference a variant');
      }
    }
    const variantIds = inputs.map((l) => l.variantId).filter((id): id is string => Boolean(id));

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
      const lineDiscountCents = l.lineDiscountCents ?? 0;
      if (!Number.isInteger(lineDiscountCents) || lineDiscountCents < 0) {
        throw new BadRequestException('lines[].lineDiscountCents must be a non-negative integer');
      }
      if (!l.variantId) {
        return {
          variantId: null as unknown as string,
          description: l.description!.trim(),
          quantity: l.quantity!,
          unitPriceCents: l.unitPriceCents!,
          lineDiscountCents,
          lineType: 'custom',
          taxRateBps: 0,
          taxClassId: null,
        };
      }
      const v = byId.get(l.variantId)!;
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

  /**
   * A1: an individually-printed delivery ticket freezes the order — no
   * edits while it's on the truck. Unlocking (POST :id/unlock, its own
   * permission, typed reason) clears the freeze.
   */
  private assertUnlocked(order: { lockedAt: Date | null }): void {
    if (order.lockedAt) {
      throw new ConflictException(
        'Order is locked — its delivery ticket has been printed. Unlock it with a reason before editing.',
      );
    }
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
      creditDueCents: Math.max(0, paidCents(payments) - order.totalCents),
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
      originalOrderId: order.originalOrderId,
      salespersonMembershipId: order.salespersonMembershipId,
      secondSalespersonMembershipId: order.secondSalespersonMembershipId,
      splitBps: order.splitBps,
      orderKind: order.orderKind,
      deliveryStatus: order.deliveryStatus,
      deliveryInstructions: order.deliveryInstructions,
      pickupLocationId: order.pickupLocationId,
      billingAddressJson: order.billingAddressJson,
      marketingCode: order.marketingCode,
      deliveryFeeCents: order.deliveryFeeCents,
      installFeeCents: order.installFeeCents,
      otherFeeCents: order.otherFeeCents,
      otherFeeLabel: order.otherFeeLabel,
      importedAt: order.importedAt,
      legacyNumber: order.legacyNumber,
      lockedAt: order.lockedAt,
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
        qtyReturned: l.qtyReturned,
        lineType: l.lineType,
        unitPriceCents: l.unitPriceCents,
        discountCents: l.discountCents,
        taxCents: l.taxCents,
        totalCents: l.totalCents,
        taxRateBps: l.taxRateBps,
        fulfillmentMethod: l.fulfillmentMethod,
        deliveryDate: l.deliveryDate,
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
