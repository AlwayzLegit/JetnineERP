import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  Query,
} from '@nestjs/common';
import { and, asc, eq, gte, inArray, isNull, lt, or, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface InboundRow {
  id: string;
  number: string;
  vendorName: string | null;
  expectedAt: Date | null;
  orderedUnits: number;
  receivedUnits: number;
  overdue: boolean;
}

interface DockRow {
  id: string;
  number: string;
  vendorName: string | null;
  /** Received or inspected but not yet accepted/rejected. */
  unitsInProgress: number;
  lastActivityAt: Date;
}

interface PickupRow {
  orderId: string;
  number: string;
  customerName: string | null;
  ageDays: number;
  /** Every stock line reserved or fulfilled — stageable now. */
  ready: boolean;
}

interface ArrivedRow {
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  description: string;
  quantity: number;
  arrivedAt: Date;
}

interface TransferRow {
  id: string;
  number: string;
  direction: 'inbound' | 'outbound';
  otherLocationName: string | null;
  status: string;
  units: number;
  /** in_transit only: days since it shipped (last update). */
  days: number | null;
  awaitingTicket: boolean;
}

interface WarehouseSummary {
  date: string;
  location: { id: string; name: string; timezone: string };
  locations: { id: string; name: string; locationType: string }[];
  inbound: InboundRow[];
  dock: DockRow[];
  pickups: PickupRow[];
  arrived: ArrivedRow[];
  transfers: { rows: TransferRow[]; closedShort30d: number };
  asIs: {
    count: number;
    costCents: number;
    oldestAt: Date | null;
    rows: {
      id: string;
      productName: string;
      quantity: number;
      condition: string | null;
      createdAt: Date;
    }[];
  };
  counts: {
    open: { id: string; countDate: string; status: string }[];
    lastPostedDate: string | null;
    negative: { variantId: string; productName: string; sku: string | null; onHand: number }[];
  };
}

interface LoadoutRow {
  deliveryId: string;
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  route: string | null;
  driverName: string | null;
  status: string;
  pieces: number;
  /** A serial-tracked line on the truck without its serials picked. */
  serialShort: boolean;
}

interface PicklistRow {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  bin: string | null;
  quantity: number;
  onHand: number;
  short: boolean;
  serialShort: boolean;
}

const LIVE_DELIVERY = ['scheduled', 'out', 'out_for_delivery'];

/**
 * The Warehouse home (owner 2026-09-01, §12.2): the receiving pipeline,
 * the trucks, and every "goods are here — close the loop" queue, pinned
 * to ONE location the member works (warehouse-type locations lead the
 * picker). Same shape as the other role homes: `/dashboard` opens here
 * for the Warehouse role; anyone else with the permission reaches it at
 * `/warehouse`.
 *
 * Split endpoints for the same reason the Operations home is split: the
 * summary is one bundle of small indexed reads, while the load-out and
 * pick-list join through delivery lines and fetch independently.
 */
@TenantScoped()
@Controller('v1/dashboard/warehouse')
export class WarehouseDashboardController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  @Get()
  @RequirePermission('warehouse.dashboard.view')
  async summary(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('locationId') locationId?: string,
  ): Promise<WarehouseSummary> {
    const businessId = tenant.businessId!;
    const { loc, locations } = await this.pickLocation(tenant, businessId, locationId);
    const [dayRow] = await this.db
      .select({ today: sql<string>`(now() AT TIME ZONE ${loc.timezone})::date::text` })
      .from(schema.businesses)
      .where(eq(schema.businesses.id, businessId))
      .limit(1);

    const [inbound, dock, pickups, arrived, transfers, asIs, counts] = await Promise.all([
      this.inbound(businessId, loc.id),
      this.dock(businessId, loc.id),
      this.pickups(businessId, loc.id),
      this.arrived(businessId, loc.id),
      this.transfers(businessId, loc.id),
      this.asIs(businessId, loc.id),
      this.counts(businessId, loc.id),
    ]);

    return {
      date: dayRow!.today,
      location: { id: loc.id, name: loc.name, timezone: loc.timezone },
      locations,
      inbound,
      dock,
      pickups,
      arrived,
      transfers,
      asIs,
      counts,
    };
  }

  /** Card 3 — today's truck: stops vs cap, pieces, unpicked serials. */
  @Get('loadout')
  @RequirePermission('warehouse.dashboard.view')
  async loadout(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('locationId') locationId?: string,
    @Query('date') date?: string,
  ) {
    const businessId = tenant.businessId!;
    const { loc } = await this.pickLocation(tenant, businessId, locationId);
    const day = parseDay(date) ?? (await this.localToday(businessId, loc.timezone, 0));
    const rows = await this.deliveryRows(businessId, loc.id, day, LIVE_DELIVERY);

    const [biz] = await this.db
      .select({ opsSettingsJson: schema.businesses.opsSettingsJson })
      .from(schema.businesses)
      .where(eq(schema.businesses.id, businessId))
      .limit(1);
    const ops = (biz?.opsSettingsJson ?? {}) as { deliveryDailyCap?: number | null };
    const cap = ops.deliveryDailyCap && ops.deliveryDailyCap > 0 ? ops.deliveryDailyCap : 15;

    return {
      date: day,
      cap,
      stops: rows.length,
      pieces: rows.reduce((s, r) => s + r.pieces, 0),
      rows,
    };
  }

  /**
   * Card 4 — tomorrow's pull, aggregated per variant with the bin, so
   * staging can start this afternoon. `short` compares against on-hand:
   * these units are reserved to these orders, so reserved is not
   * subtracted — the question is whether the goods physically exist.
   */
  @Get('picklist')
  @RequirePermission('warehouse.dashboard.view')
  async picklist(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('locationId') locationId?: string,
    @Query('date') date?: string,
  ) {
    const businessId = tenant.businessId!;
    const { loc } = await this.pickLocation(tenant, businessId, locationId);
    const day = parseDay(date) ?? (await this.localToday(businessId, loc.timezone, 1));

    const lines = await this.db
      .select({
        variantId: schema.orderLines.variantId,
        productName: schema.products.name,
        variantName: schema.productVariants.name,
        sku: schema.productVariants.sku,
        serialTracked: schema.products.serialTracked,
        quantity: schema.deliveryLines.quantity,
        lineQuantity: schema.orderLines.quantity,
        serialUnitIds: schema.orderLines.serialUnitIds,
        lineType: schema.orderLines.lineType,
      })
      .from(schema.deliveryLines)
      .innerJoin(schema.deliveries, eq(schema.deliveries.id, schema.deliveryLines.deliveryId))
      .innerJoin(schema.orderLines, eq(schema.orderLines.id, schema.deliveryLines.orderLineId))
      .leftJoin(schema.productVariants, eq(schema.productVariants.id, schema.orderLines.variantId))
      .leftJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(
        and(
          eq(schema.deliveries.businessId, businessId),
          eq(schema.deliveries.locationId, loc.id),
          eq(schema.deliveries.scheduledDate, day),
          inArray(schema.deliveries.status, LIVE_DELIVERY),
        ),
      );

    const byVariant = new Map<string, PicklistRow>();
    for (const l of lines) {
      if (!l.variantId || l.lineType !== 'stock') continue;
      const row = byVariant.get(l.variantId) ?? {
        variantId: l.variantId,
        productName: l.productName ?? '(deleted)',
        variantName: l.variantName,
        sku: l.sku,
        bin: null,
        quantity: 0,
        onHand: 0,
        short: false,
        serialShort: false,
      };
      row.quantity += l.quantity;
      if (l.serialTracked && (l.serialUnitIds?.length ?? 0) < l.lineQuantity) {
        row.serialShort = true;
      }
      byVariant.set(l.variantId, row);
    }
    if (byVariant.size > 0) {
      const levels = await this.db
        .select({
          variantId: schema.inventoryLevels.variantId,
          onHand: schema.inventoryLevels.onHand,
          bin: schema.storageBins.code,
        })
        .from(schema.inventoryLevels)
        .leftJoin(
          schema.storageBins,
          eq(schema.storageBins.id, schema.inventoryLevels.storageBinId),
        )
        .where(
          and(
            eq(schema.inventoryLevels.businessId, businessId),
            eq(schema.inventoryLevels.locationId, loc.id),
            inArray(schema.inventoryLevels.variantId, [...byVariant.keys()]),
          ),
        );
      for (const level of levels) {
        const row = byVariant.get(level.variantId);
        if (!row) continue;
        row.onHand = level.onHand;
        row.bin = level.bin;
      }
      for (const row of byVariant.values()) row.short = row.onHand < row.quantity;
    }
    const rows = [...byVariant.values()].sort(
      (a, b) =>
        (a.bin ?? 'zzz').localeCompare(b.bin ?? 'zzz') ||
        a.productName.localeCompare(b.productName),
    );
    return { date: day, rows };
  }

  // ------------------------------------------------------------- internals

  private async pickLocation(
    tenant: RequestTenantContext,
    businessId: string,
    locationId?: string,
  ) {
    const rows = await this.db
      .select({
        id: schema.locations.id,
        name: schema.locations.name,
        timezone: schema.locations.timezone,
        locationType: schema.locations.locationType,
      })
      .from(schema.locations)
      .where(
        and(
          eq(schema.locations.businessId, businessId),
          eq(schema.locations.isActive, true),
          tenant.dataScope === 'store'
            ? inArray(schema.locations.id, tenant.scopeLocationIds ?? [])
            : undefined,
        ),
      )
      .orderBy(schema.locations.name);
    // The building this role works is usually the warehouse — lead with it.
    const ordered = [
      ...rows.filter((r) => r.locationType === 'warehouse'),
      ...rows.filter((r) => r.locationType !== 'warehouse'),
    ];
    if (ordered.length === 0)
      throw new BadRequestException('No locations are available to this member');
    const loc = locationId ? ordered.find((l) => l.id === locationId) : ordered[0];
    if (!loc) throw new ForbiddenException('You are not approved for that location');
    return { loc, locations: ordered };
  }

  private async localToday(businessId: string, tz: string, plusDays: number): Promise<string> {
    const [row] = await this.db
      .select({ day: sql<string>`((now() AT TIME ZONE ${tz})::date + ${plusDays}::int)::text` })
      .from(schema.businesses)
      .where(eq(schema.businesses.id, businessId))
      .limit(1);
    return row!.day;
  }

  /** Card 1 — open POs shipping here: due, overdue, and how far along. */
  private async inbound(businessId: string, locationId: string): Promise<InboundRow[]> {
    const rows = await this.db
      .select({
        id: schema.purchaseOrders.id,
        number: schema.purchaseOrders.number,
        vendorName: schema.vendors.name,
        expectedAt: schema.purchaseOrders.expectedAt,
        orderedUnits: sql<number>`COALESCE(SUM(${schema.purchaseOrderLines.quantityOrdered}), 0)::int`,
        receivedUnits: sql<number>`COALESCE(SUM(${schema.purchaseOrderLines.quantityReceived}), 0)::int`,
      })
      .from(schema.purchaseOrders)
      .leftJoin(schema.vendors, eq(schema.vendors.id, schema.purchaseOrders.vendorId))
      .leftJoin(
        schema.purchaseOrderLines,
        eq(schema.purchaseOrderLines.purchaseOrderId, schema.purchaseOrders.id),
      )
      .where(
        and(
          eq(schema.purchaseOrders.businessId, businessId),
          eq(schema.purchaseOrders.locationId, locationId),
          inArray(schema.purchaseOrders.status, ['ordered', 'partially_received']),
          isNull(schema.purchaseOrders.deletedAt),
        ),
      )
      .groupBy(
        schema.purchaseOrders.id,
        schema.purchaseOrders.number,
        schema.vendors.name,
        schema.purchaseOrders.expectedAt,
      )
      .orderBy(sql`${schema.purchaseOrders.expectedAt} ASC NULLS LAST`)
      .limit(50);
    const now = Date.now();
    return rows
      .map((r) => ({ ...r, overdue: r.expectedAt != null && r.expectedAt.getTime() < now }))
      .sort((a, b) => Number(b.overdue) - Number(a.overdue));
  }

  /**
   * Card 2 — goods physically in the building but not yet sellable:
   * received or inspected units that nobody has accepted or rejected.
   * The most expensive invisible state a warehouse has.
   */
  private async dock(businessId: string, locationId: string): Promise<DockRow[]> {
    const inProgress = sql<number>`COALESCE(SUM(GREATEST(${schema.purchaseOrderLines.quantityReceived} - ${schema.purchaseOrderLines.quantityAccepted} - ${schema.purchaseOrderLines.quantityRejected}, 0)), 0)::int`;
    const rows = await this.db
      .select({
        id: schema.purchaseOrders.id,
        number: schema.purchaseOrders.number,
        vendorName: schema.vendors.name,
        unitsInProgress: inProgress,
        lastActivityAt: schema.purchaseOrders.updatedAt,
      })
      .from(schema.purchaseOrders)
      .leftJoin(schema.vendors, eq(schema.vendors.id, schema.purchaseOrders.vendorId))
      .innerJoin(
        schema.purchaseOrderLines,
        eq(schema.purchaseOrderLines.purchaseOrderId, schema.purchaseOrders.id),
      )
      .where(
        and(
          eq(schema.purchaseOrders.businessId, businessId),
          eq(schema.purchaseOrders.locationId, locationId),
          isNull(schema.purchaseOrders.deletedAt),
          sql`${schema.purchaseOrders.status} NOT IN ('canceled')`,
        ),
      )
      .groupBy(
        schema.purchaseOrders.id,
        schema.purchaseOrders.number,
        schema.vendors.name,
        schema.purchaseOrders.updatedAt,
      )
      .having(
        sql`SUM(GREATEST(${schema.purchaseOrderLines.quantityReceived} - ${schema.purchaseOrderLines.quantityAccepted} - ${schema.purchaseOrderLines.quantityRejected}, 0)) > 0`,
      )
      .orderBy(asc(schema.purchaseOrders.updatedAt));
    return rows;
  }

  /** Card 5 — pickup orders staged (or stageable) and how long waiting. */
  private async pickups(businessId: string, locationId: string): Promise<PickupRow[]> {
    const orders = await this.db
      .select({
        orderId: schema.orders.id,
        number: schema.orders.number,
        createdAt: schema.orders.createdAt,
        customerFirst: schema.customers.firstName,
        customerLast: schema.customers.lastName,
      })
      .from(schema.orders)
      .leftJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
      .where(
        and(
          eq(schema.orders.businessId, businessId),
          eq(schema.orders.fulfillmentType, 'pickup'),
          inArray(schema.orders.status, ['open', 'partially_fulfilled']),
          isNull(schema.orders.importedAt),
          or(
            eq(schema.orders.pickupLocationId, locationId),
            and(isNull(schema.orders.pickupLocationId), eq(schema.orders.locationId, locationId)),
          ),
        ),
      )
      .orderBy(asc(schema.orders.createdAt))
      .limit(50);
    if (orders.length === 0) return [];

    const lines = await this.db
      .select({
        orderId: schema.orderLines.orderId,
        quantity: schema.orderLines.quantity,
        qtyReserved: schema.orderLines.qtyReserved,
        qtyFulfilled: schema.orderLines.qtyFulfilled,
        lineType: schema.orderLines.lineType,
      })
      .from(schema.orderLines)
      .where(
        inArray(
          schema.orderLines.orderId,
          orders.map((o) => o.orderId),
        ),
      );
    const readyBy = new Map<string, boolean>();
    for (const o of orders) readyBy.set(o.orderId, true);
    for (const l of lines) {
      if (l.lineType !== 'stock') continue;
      if (l.qtyReserved + l.qtyFulfilled < l.quantity) readyBy.set(l.orderId, false);
    }
    const now = Date.now();
    return orders.map((o) => ({
      orderId: o.orderId,
      number: o.number,
      customerName: [o.customerFirst, o.customerLast].filter(Boolean).join(' ') || null,
      ageDays: Math.floor((now - o.createdAt.getTime()) / 86_400_000),
      ready: readyBy.get(o.orderId) ?? false,
    }));
  }

  /**
   * Card 6 — the customer's special order ARRIVED and nobody booked the
   * next step: allocation received, line unfulfilled, and no live
   * delivery on the order. The highest-value queue on the page.
   */
  private async arrived(businessId: string, locationId: string): Promise<ArrivedRow[]> {
    const rows = await this.db
      .select({
        orderId: schema.orders.id,
        orderNumber: schema.orders.number,
        fulfillmentType: schema.orders.fulfillmentType,
        customerFirst: schema.customers.firstName,
        customerLast: schema.customers.lastName,
        description: schema.orderLines.description,
        quantity: schema.poLineAllocations.quantity,
        arrivedAt: schema.poLineAllocations.updatedAt,
      })
      .from(schema.poLineAllocations)
      .innerJoin(
        schema.purchaseOrderLines,
        eq(schema.purchaseOrderLines.id, schema.poLineAllocations.poLineId),
      )
      .innerJoin(
        schema.purchaseOrders,
        eq(schema.purchaseOrders.id, schema.purchaseOrderLines.purchaseOrderId),
      )
      .innerJoin(schema.orderLines, eq(schema.orderLines.id, schema.poLineAllocations.orderLineId))
      .innerJoin(schema.orders, eq(schema.orders.id, schema.orderLines.orderId))
      .leftJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
      .where(
        and(
          eq(schema.poLineAllocations.businessId, businessId),
          eq(schema.poLineAllocations.status, 'received'),
          eq(schema.purchaseOrders.locationId, locationId),
          inArray(schema.orders.status, ['open', 'partially_fulfilled']),
          sql`${schema.orderLines.qtyFulfilled} < ${schema.orderLines.quantity}`,
          sql`NOT EXISTS (SELECT 1 FROM deliveries d WHERE d.order_id = ${schema.orders.id} AND d.status IN ('scheduled', 'out', 'out_for_delivery'))`,
        ),
      )
      .orderBy(asc(schema.poLineAllocations.updatedAt))
      .limit(50);
    return rows.map((r) => ({
      orderId: r.orderId,
      orderNumber: r.orderNumber,
      customerName: [r.customerFirst, r.customerLast].filter(Boolean).join(' ') || null,
      description: r.description,
      quantity: r.quantity,
      arrivedAt: r.arrivedAt,
    }));
  }

  /** Card 7 — transfers touching this building, and where they stand. */
  private async transfers(
    businessId: string,
    locationId: string,
  ): Promise<{ rows: TransferRow[]; closedShort30d: number }> {
    const fromLoc = alias(schema.locations, 'from_loc');
    const toLoc = alias(schema.locations, 'to_loc');
    const rows = await this.db
      .select({
        id: schema.stockTransfers.id,
        number: schema.stockTransfers.number,
        status: schema.stockTransfers.status,
        fromLocationId: schema.stockTransfers.fromLocationId,
        toLocationId: schema.stockTransfers.toLocationId,
        fromName: fromLoc.name,
        toName: toLoc.name,
        ticketPrintedAt: schema.stockTransfers.ticketPrintedAt,
        updatedAt: schema.stockTransfers.updatedAt,
        units: sql<number>`COALESCE(SUM(${schema.stockTransferLines.quantityShipped}), 0)::int`,
      })
      .from(schema.stockTransfers)
      .leftJoin(fromLoc, eq(fromLoc.id, schema.stockTransfers.fromLocationId))
      .leftJoin(toLoc, eq(toLoc.id, schema.stockTransfers.toLocationId))
      .leftJoin(
        schema.stockTransferLines,
        eq(schema.stockTransferLines.transferId, schema.stockTransfers.id),
      )
      .where(
        and(
          eq(schema.stockTransfers.businessId, businessId),
          inArray(schema.stockTransfers.status, ['draft', 'in_transit']),
          or(
            eq(schema.stockTransfers.fromLocationId, locationId),
            eq(schema.stockTransfers.toLocationId, locationId),
          ),
        ),
      )
      .groupBy(
        schema.stockTransfers.id,
        schema.stockTransfers.number,
        schema.stockTransfers.status,
        schema.stockTransfers.fromLocationId,
        schema.stockTransfers.toLocationId,
        fromLoc.name,
        toLoc.name,
        schema.stockTransfers.ticketPrintedAt,
        schema.stockTransfers.updatedAt,
      )
      .orderBy(asc(schema.stockTransfers.updatedAt))
      .limit(50);

    const now = Date.now();
    const mapped: TransferRow[] = rows.map((r) => {
      const outbound = r.fromLocationId === locationId;
      return {
        id: r.id,
        number: r.number,
        direction: outbound ? 'outbound' : 'inbound',
        otherLocationName: outbound ? r.toName : r.fromName,
        status: r.status,
        units: r.units,
        days:
          r.status === 'in_transit' ? Math.floor((now - r.updatedAt.getTime()) / 86_400_000) : null,
        awaitingTicket: r.status === 'draft' && r.ticketPrintedAt == null,
      };
    });

    const [shortCount] = await this.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.stockTransfers)
      .where(
        and(
          eq(schema.stockTransfers.businessId, businessId),
          eq(schema.stockTransfers.status, 'closed_short'),
          gte(schema.stockTransfers.updatedAt, new Date(now - 30 * 86_400_000)),
          or(
            eq(schema.stockTransfers.fromLocationId, locationId),
            eq(schema.stockTransfers.toLocationId, locationId),
          ),
        ),
      );
    return { rows: mapped, closedShort30d: shortCount?.count ?? 0 };
  }

  /** Card 8 — damage waiting for a decision is silent shrink. */
  private async asIs(businessId: string, locationId: string) {
    const rows = await this.db
      .select({
        id: schema.asIsItems.id,
        quantity: schema.asIsItems.quantity,
        condition: schema.asIsItems.condition,
        createdAt: schema.asIsItems.createdAt,
        productName: schema.products.name,
        costCents: schema.productVariants.costCents,
      })
      .from(schema.asIsItems)
      .innerJoin(schema.productVariants, eq(schema.productVariants.id, schema.asIsItems.variantId))
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(
        and(
          eq(schema.asIsItems.businessId, businessId),
          eq(schema.asIsItems.locationId, locationId),
          eq(schema.asIsItems.status, 'pending_review'),
        ),
      )
      .orderBy(asc(schema.asIsItems.createdAt))
      .limit(50);
    return {
      count: rows.reduce((s, r) => s + r.quantity, 0),
      costCents: rows.reduce((s, r) => s + r.quantity * (r.costCents ?? 0), 0),
      oldestAt: rows[0]?.createdAt ?? null,
      rows: rows.slice(0, 10).map((r) => ({
        id: r.id,
        productName: r.productName ?? '(deleted)',
        quantity: r.quantity,
        condition: r.condition,
        createdAt: r.createdAt,
      })),
    };
  }

  /** Card 9 — count discipline + the ledger breaks only a count fixes. */
  private async counts(businessId: string, locationId: string) {
    const open = await this.db
      .select({
        id: schema.physicalCounts.id,
        countDate: schema.physicalCounts.countDate,
        status: schema.physicalCounts.status,
      })
      .from(schema.physicalCounts)
      .where(
        and(
          eq(schema.physicalCounts.businessId, businessId),
          eq(schema.physicalCounts.locationId, locationId),
          inArray(schema.physicalCounts.status, ['open', 'counting']),
        ),
      )
      .orderBy(asc(schema.physicalCounts.countDate));

    const [last] = await this.db
      .select({ countDate: schema.physicalCounts.countDate })
      .from(schema.physicalCounts)
      .where(
        and(
          eq(schema.physicalCounts.businessId, businessId),
          eq(schema.physicalCounts.locationId, locationId),
          eq(schema.physicalCounts.status, 'posted'),
        ),
      )
      .orderBy(sql`${schema.physicalCounts.countDate} DESC`)
      .limit(1);

    const negative = await this.db
      .select({
        variantId: schema.inventoryLevels.variantId,
        onHand: schema.inventoryLevels.onHand,
        productName: schema.products.name,
        sku: schema.productVariants.sku,
      })
      .from(schema.inventoryLevels)
      .innerJoin(
        schema.productVariants,
        eq(schema.productVariants.id, schema.inventoryLevels.variantId),
      )
      .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(
        and(
          eq(schema.inventoryLevels.businessId, businessId),
          eq(schema.inventoryLevels.locationId, locationId),
          lt(schema.inventoryLevels.onHand, 0),
        ),
      )
      .limit(20);

    return {
      open,
      lastPostedDate: last?.countDate ?? null,
      negative: negative.map((n) => ({
        variantId: n.variantId,
        productName: n.productName ?? '(deleted)',
        sku: n.sku,
        onHand: n.onHand,
      })),
    };
  }

  /** Shared by loadout: one row per delivery with pieces + serial state. */
  private async deliveryRows(
    businessId: string,
    locationId: string,
    day: string,
    statuses: string[],
  ): Promise<LoadoutRow[]> {
    const driverUser = alias(schema.users, 'driver_user');
    const rows = await this.db
      .select({
        deliveryId: schema.deliveries.id,
        orderId: schema.deliveries.orderId,
        orderNumber: schema.orders.number,
        customerFirst: schema.customers.firstName,
        customerLast: schema.customers.lastName,
        windowStart: schema.deliveries.windowStart,
        windowEnd: schema.deliveries.windowEnd,
        route: schema.deliveries.route,
        driverName: driverUser.name,
        status: schema.deliveries.status,
        pieces: sql<number>`COALESCE(SUM(${schema.deliveryLines.quantity}), 0)::int`,
        serialShort: sql<boolean>`BOOL_OR(${schema.products.serialTracked} AND COALESCE(array_length(${schema.orderLines.serialUnitIds}, 1), 0) < ${schema.orderLines.quantity})`,
      })
      .from(schema.deliveries)
      .innerJoin(schema.orders, eq(schema.orders.id, schema.deliveries.orderId))
      .leftJoin(schema.customers, eq(schema.customers.id, schema.orders.customerId))
      .leftJoin(schema.memberships, eq(schema.memberships.id, schema.deliveries.driverMembershipId))
      .leftJoin(driverUser, eq(driverUser.id, schema.memberships.userId))
      .leftJoin(schema.deliveryLines, eq(schema.deliveryLines.deliveryId, schema.deliveries.id))
      .leftJoin(schema.orderLines, eq(schema.orderLines.id, schema.deliveryLines.orderLineId))
      .leftJoin(schema.productVariants, eq(schema.productVariants.id, schema.orderLines.variantId))
      .leftJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .where(
        and(
          eq(schema.deliveries.businessId, businessId),
          eq(schema.deliveries.locationId, locationId),
          eq(schema.deliveries.scheduledDate, day),
          inArray(schema.deliveries.status, statuses),
        ),
      )
      .groupBy(
        schema.deliveries.id,
        schema.deliveries.orderId,
        schema.orders.number,
        schema.customers.firstName,
        schema.customers.lastName,
        schema.deliveries.windowStart,
        schema.deliveries.windowEnd,
        schema.deliveries.route,
        driverUser.name,
        schema.deliveries.status,
        schema.deliveries.routePosition,
      )
      .orderBy(sql`${schema.deliveries.routePosition} ASC NULLS LAST`);
    return rows.map((r) => ({
      deliveryId: r.deliveryId,
      orderId: r.orderId,
      orderNumber: r.orderNumber,
      customerName: [r.customerFirst, r.customerLast].filter(Boolean).join(' ') || null,
      windowStart: r.windowStart,
      windowEnd: r.windowEnd,
      route: r.route,
      driverName: r.driverName,
      status: r.status,
      pieces: r.pieces,
      serialShort: r.serialShort ?? false,
    }));
  }
}

/** YYYY-MM-DD or nothing — anything else is a caller bug. */
function parseDay(raw: string | undefined): string | null {
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new BadRequestException('date must be YYYY-MM-DD');
  }
  return raw;
}
