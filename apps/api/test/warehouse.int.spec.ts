/**
 * Warehouse role + dashboard acceptance (owner 2026-09-01, §12.2).
 *
 * - The Inventory Clerk system role is RENAMED to Warehouse in place —
 *   same row, same id, memberships untouched; a business that already
 *   has its own "Warehouse" role is left alone.
 * - Every dashboard card is proven from real rows: inbound/overdue POs,
 *   units stuck on the dock, today's load-out with unpicked serials,
 *   tomorrow's pick list with bins and shorts, pickups aging, special
 *   orders arrived-but-unscheduled, transfers in motion, the as-is
 *   queue, and count discipline with negative on-hand.
 * - The permission boundary: Cashier sees none of it; the Warehouse
 *   role's /dashboard swaps to this home.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';
import { SystemRoleSyncService } from '../src/admin/system-role-sync.service';

const TEST_DB_URL =
  process.env.WAREHOUSE_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_warehouse';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'WhPass!2026x';
const TZ = 'America/Los_Angeles';

let app: INestApplication;
let businessId = '';
let warehouseLocId = '';
let storeLocId = '';
let vendorId = '';
let customerId = '';
let serialVariantId = '';
let plainVariantId = '';
let whCookie = '';
let cashierCookie = '';

const fixtures = {
  overduePoId: '',
  dockPoId: '',
  loadoutOrderId: '',
  picklistVariantId: '',
  stalePickupOrderId: '',
  arrivedOrderId: '',
  scheduledArrivedOrderId: '',
  transitTransferId: '',
};

const localDay = (plusDays = 0) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(
    new Date(Date.now() + plusDays * 86_400_000),
  );

function withDb<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  return fn(db).finally(() => sql.end({ timeout: 5 }));
}

async function resetTestDb() {
  const env = { ...process.env, DATABASE_URL: TEST_DB_URL };
  execFileSync('pnpm', ['exec', 'tsx', 'src/reset.ts'], {
    cwd: dbPackageRoot,
    env,
    stdio: 'inherit',
  });
  execFileSync('pnpm', ['exec', 'tsx', 'src/migrate.ts'], {
    cwd: dbPackageRoot,
    env,
    stdio: 'inherit',
  });
}

async function seed() {
  await withDb(async (db) => {
    const passwordHash = await hashPassword(PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'wh-test', name: 'Warehouse Test Co', status: 'active' })
      .returning();
    businessId = biz!.id;

    const roles = new Map<string, string>();
    for (const role of SYSTEM_ROLES) {
      const [r] = await db
        .insert(schema.roles)
        .values({ businessId, name: role.name, description: role.description, isSystem: true })
        .returning();
      roles.set(role.name, r!.id);
      if (role.permissions.length > 0) {
        await db
          .insert(schema.rolePermissions)
          .values(role.permissions.map((permission) => ({ roleId: r!.id, permission })));
      }
    }
    async function makeUser(email: string, role: string): Promise<string> {
      const [u] = await db
        .insert(schema.users)
        .values({ email, emailVerified: true, name: role })
        .returning();
      await db.insert(schema.accounts).values({
        accountId: u!.id,
        providerId: 'credential',
        userId: u!.id,
        password: passwordHash,
      });
      await db.insert(schema.memberships).values({
        businessId,
        userId: u!.id,
        roleId: roles.get(role)!,
        status: 'active',
        acceptedAt: new Date(),
      });
      return u!.id;
    }
    await makeUser('wh@wh-test.local', 'Warehouse');
    await makeUser('cashier@wh-test.local', 'Cashier');

    const locs = await db
      .insert(schema.locations)
      .values([
        { businessId, name: 'Main Warehouse', timezone: TZ, locationType: 'warehouse' },
        { businessId, name: 'A Store', timezone: TZ },
      ])
      .returning();
    warehouseLocId = locs[0]!.id;
    storeLocId = locs[1]!.id;

    const [vendor] = await db
      .insert(schema.vendors)
      .values({ businessId, name: 'Dock Vendor' })
      .returning();
    vendorId = vendor!.id;

    const [pSerial] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'WH-ADJ', name: 'Adjustable Base', serialTracked: true })
      .returning();
    const [vSerial] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: pSerial!.id,
        sku: 'WH-ADJ-V1',
        priceCents: 120_000,
        costCents: 60_000,
      })
      .returning();
    serialVariantId = vSerial!.id;

    const [pPlain] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'WH-MAT', name: 'Warehouse Mattress' })
      .returning();
    const [vPlain] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: pPlain!.id,
        sku: 'WH-MAT-V1',
        priceCents: 80_000,
        costCents: 40_000,
      })
      .returning();
    plainVariantId = vPlain!.id;

    const [cust] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Wendy', lastName: 'House' })
      .returning();
    customerId = cust!.id;
  });
}

/** One fixture per card. */
async function seedSignals() {
  await withDb(async (db) => {
    // 1. Inbound: overdue PO (expected yesterday, half received) and one
    //    due tomorrow; a store-bound PO that must NOT appear here.
    const mkPo = async (over: Partial<typeof schema.purchaseOrders.$inferInsert>) => {
      const [po] = await db
        .insert(schema.purchaseOrders)
        .values({
          businessId,
          vendorId,
          locationId: warehouseLocId,
          number: `PO-WH-${Math.random().toString(36).slice(2, 8)}`,
          status: 'ordered',
          subtotalCents: 100_000,
          ...over,
        })
        .returning();
      return po!;
    };
    const overdue = await mkPo({ expectedAt: new Date(Date.now() - 86_400_000) });
    fixtures.overduePoId = overdue.id;
    await db.insert(schema.purchaseOrderLines).values({
      businessId,
      purchaseOrderId: overdue.id,
      variantId: plainVariantId,
      quantityOrdered: 5,
      quantityReceived: 2,
      unitCostCents: 40_000,
      lineTotalCents: 200_000,
    });
    const due = await mkPo({ expectedAt: new Date(Date.now() + 86_400_000) });
    await db.insert(schema.purchaseOrderLines).values({
      businessId,
      purchaseOrderId: due.id,
      variantId: plainVariantId,
      quantityOrdered: 4,
      unitCostCents: 40_000,
      lineTotalCents: 160_000,
    });
    const storePo = await mkPo({ locationId: storeLocId });
    await db.insert(schema.purchaseOrderLines).values({
      businessId,
      purchaseOrderId: storePo.id,
      variantId: plainVariantId,
      quantityOrdered: 9,
      unitCostCents: 40_000,
      lineTotalCents: 360_000,
    });

    // 2. Dock: 3 received, 1 accepted → 2 stuck in progress.
    const dock = await mkPo({ status: 'partially_received' });
    fixtures.dockPoId = dock.id;
    await db.insert(schema.purchaseOrderLines).values({
      businessId,
      purchaseOrderId: dock.id,
      variantId: plainVariantId,
      quantityOrdered: 6,
      quantityReceived: 3,
      quantityInspected: 1,
      quantityAccepted: 1,
      unitCostCents: 40_000,
      lineTotalCents: 240_000,
    });

    // Shared helper: an order with one stock line.
    const mkOrder = async (
      over: Partial<typeof schema.orders.$inferInsert>,
      line: Partial<typeof schema.orderLines.$inferInsert>,
    ) => {
      const [order] = await db
        .insert(schema.orders)
        .values({
          businessId,
          locationId: warehouseLocId,
          number: `SO-WH-${Math.random().toString(36).slice(2, 8)}`,
          status: 'open',
          customerId,
          totalCents: 80_000,
          subtotalCents: 80_000,
          ...over,
        })
        .returning();
      const [orderLine] = await db
        .insert(schema.orderLines)
        .values({
          businessId,
          orderId: order!.id,
          variantId: plainVariantId,
          description: 'Warehouse Mattress',
          quantity: 1,
          unitPriceCents: 80_000,
          totalCents: 80_000,
          ...line,
        })
        .returning();
      return { order: order!, line: orderLine! };
    };

    // 3. Load-out today: serial-tracked line, 2 units, no serials picked.
    const loadout = await mkOrder(
      {},
      {
        variantId: serialVariantId,
        description: 'Adjustable Base',
        quantity: 2,
        qtyReserved: 2,
        unitPriceCents: 120_000,
        totalCents: 240_000,
      },
    );
    fixtures.loadoutOrderId = loadout.order.id;
    const [todayDelivery] = await db
      .insert(schema.deliveries)
      .values({
        businessId,
        locationId: warehouseLocId,
        orderId: loadout.order.id,
        scheduledDate: localDay(0),
        status: 'scheduled',
        route: 'AM-1',
      })
      .returning();
    await db.insert(schema.deliveryLines).values({
      businessId,
      deliveryId: todayDelivery!.id,
      orderLineId: loadout.line.id,
      quantity: 2,
    });

    // 4. Pick list tomorrow: pull 3, only 1 on hand, in bin B-07.
    const pick = await mkOrder({}, { quantity: 3, qtyReserved: 3, totalCents: 240_000 });
    fixtures.picklistVariantId = plainVariantId;
    const [bin] = await db
      .insert(schema.storageBins)
      .values({ businessId, locationId: warehouseLocId, code: 'B-07' })
      .returning();
    await db.insert(schema.inventoryLevels).values({
      businessId,
      variantId: plainVariantId,
      locationId: warehouseLocId,
      onHand: 1,
      reserved: 1,
      storageBinId: bin!.id,
    });
    const [tomorrowDelivery] = await db
      .insert(schema.deliveries)
      .values({
        businessId,
        locationId: warehouseLocId,
        orderId: pick.order.id,
        scheduledDate: localDay(1),
        status: 'scheduled',
      })
      .returning();
    await db.insert(schema.deliveryLines).values({
      businessId,
      deliveryId: tomorrowDelivery!.id,
      orderLineId: pick.line.id,
      quantity: 3,
    });

    // 5. Pickups: one fully reserved and 10 days old, one stock-short.
    const stale = await mkOrder(
      { fulfillmentType: 'pickup', createdAt: new Date(Date.now() - 10 * 86_400_000) },
      { qtyReserved: 1 },
    );
    fixtures.stalePickupOrderId = stale.order.id;
    await mkOrder({ fulfillmentType: 'pickup' }, { qtyReserved: 0 });

    // 6. Arrived-not-scheduled: received allocation, unfulfilled line, no
    //    delivery — and a control that HAS a live delivery.
    const mkArrival = async () => {
      const { order, line } = await mkOrder({}, { lineType: 'special_order' });
      const po = await mkPo({ status: 'received' });
      const [poLine] = await db
        .insert(schema.purchaseOrderLines)
        .values({
          businessId,
          purchaseOrderId: po.id,
          variantId: plainVariantId,
          quantityOrdered: 1,
          quantityReceived: 1,
          quantityAccepted: 1,
          unitCostCents: 40_000,
          lineTotalCents: 40_000,
        })
        .returning();
      await db.insert(schema.poLineAllocations).values({
        businessId,
        poLineId: poLine!.id,
        orderLineId: line.id,
        quantity: 1,
        status: 'received',
      });
      return order;
    };
    fixtures.arrivedOrderId = (await mkArrival()).id;
    const scheduled = await mkArrival();
    fixtures.scheduledArrivedOrderId = scheduled.id;
    await db.insert(schema.deliveries).values({
      businessId,
      locationId: warehouseLocId,
      orderId: scheduled.id,
      scheduledDate: localDay(2),
      status: 'scheduled',
    });

    // 7. Transfers: outbound draft without a ticket; inbound in transit
    //    for 5 days; a closed-short inside the 30-day window.
    const mkTransfer = async (over: Partial<typeof schema.stockTransfers.$inferInsert>) => {
      const [t] = await db
        .insert(schema.stockTransfers)
        .values({
          businessId,
          fromLocationId: warehouseLocId,
          toLocationId: storeLocId,
          number: `TR-WH-${Math.random().toString(36).slice(2, 8)}`,
          status: 'draft',
          ...over,
        })
        .returning();
      return t!;
    };
    await mkTransfer({});
    const transit = await mkTransfer({
      fromLocationId: storeLocId,
      toLocationId: warehouseLocId,
      status: 'in_transit',
      updatedAt: new Date(Date.now() - 5 * 86_400_000),
    });
    fixtures.transitTransferId = transit.id;
    await db.insert(schema.stockTransferLines).values({
      businessId,
      transferId: transit.id,
      variantId: plainVariantId,
      quantityShipped: 4,
    });
    await mkTransfer({ status: 'closed_short' });

    // 8. As-is: two pieces waiting, $400 cost each.
    await db.insert(schema.asIsItems).values({
      businessId,
      variantId: plainVariantId,
      locationId: warehouseLocId,
      quantity: 2,
      condition: 'scuffed',
      status: 'pending_review',
    });

    // 9. Counts + a ledger break only a count fixes.
    await db.insert(schema.physicalCounts).values({
      businessId,
      locationId: warehouseLocId,
      status: 'open',
      countDate: localDay(0),
    });
    await db.insert(schema.inventoryLevels).values({
      businessId,
      variantId: serialVariantId,
      locationId: warehouseLocId,
      onHand: -2,
    });
  });
}

async function captureCookie(email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/sign-in/email')
    .send({ email, password: PASSWORD })
    .expect(200);
  const cookies = res.get('Set-Cookie') ?? [];
  const sessionCookie = cookies
    .map((c) => c.split(';')[0])
    .filter((c): c is string => Boolean(c?.startsWith('jetnine.session_token=')))
    .find((c) => !c.endsWith('='));
  if (!sessionCookie) throw new Error(`no session cookie for ${email}`);
  return sessionCookie;
}

function asWh(path: string) {
  return request(app.getHttpServer())
    .get(path)
    .set('Cookie', whCookie)
    .set('x-business-id', businessId);
}

beforeAll(async () => {
  await resetTestDb();
  await seed();
  await seedSignals();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'wh-test-secret-wh-test-secret-xxxxxx';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  whCookie = await captureCookie('wh@wh-test.local');
  cashierCookie = await captureCookie('cashier@wh-test.local');
}, 180_000);

afterAll(async () => {
  if (app) await app.close();
});

describe('the Warehouse role', () => {
  it('is the renamed Inventory Clerk — dashboard permission on, catalog membership sound', () => {
    const names = SYSTEM_ROLES.map((r) => r.name);
    expect(names).toContain('Warehouse');
    expect(names).not.toContain('Inventory Clerk');
    const wh = SYSTEM_ROLES.find((r) => r.name === 'Warehouse')!;
    expect(wh.permissions).toContain('warehouse.dashboard.view');
    expect(wh.permissions).toContain('inventory.receive');
    expect(wh.permissions).toContain('deliveries.schedule');
  });

  it('reports itself so /dashboard swaps to the Warehouse home', async () => {
    const res = await asWh('/v1/business/members/me').expect(200);
    expect(res.body.warehouseDashboard).toBe(true);
    expect(res.body.operationsDashboard).toBe(false);

    const cashier = await request(app.getHttpServer())
      .get('/v1/business/members/me')
      .set('Cookie', cashierCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(cashier.body.warehouseDashboard).toBe(false);
  });

  it('refuses the dashboard to a Cashier', async () => {
    for (const path of [
      '/v1/dashboard/warehouse',
      '/v1/dashboard/warehouse/loadout',
      '/v1/dashboard/warehouse/picklist',
    ]) {
      await request(app.getHttpServer())
        .get(path)
        .set('Cookie', cashierCookie)
        .set('x-business-id', businessId)
        .expect(403);
    }
  });

  it('renames an existing tenant Inventory Clerk in place, keeping memberships; a hand-built Warehouse blocks the rename', async () => {
    const { legacyBizId, legacyRoleId, conflictBizId, conflictRoleId } = await withDb(
      async (db) => {
        const [legacy] = await db
          .insert(schema.businesses)
          .values({ slug: 'wh-legacy', name: 'Legacy Co', status: 'active' })
          .returning();
        const [legacyRole] = await db
          .insert(schema.roles)
          .values({
            businessId: legacy!.id,
            name: 'Inventory Clerk',
            description: 'Manages products and inventory',
            isSystem: true,
          })
          .returning();
        const [member] = await db
          .insert(schema.users)
          .values({ email: 'clerk@wh-legacy.local', emailVerified: true, name: 'Clerk' })
          .returning();
        await db.insert(schema.memberships).values({
          businessId: legacy!.id,
          userId: member!.id,
          roleId: legacyRole!.id,
          status: 'active',
          acceptedAt: new Date(),
        });

        const [conflict] = await db
          .insert(schema.businesses)
          .values({ slug: 'wh-conflict', name: 'Conflict Co', status: 'active' })
          .returning();
        const [conflictRole] = await db
          .insert(schema.roles)
          .values({
            businessId: conflict!.id,
            name: 'Inventory Clerk',
            description: 'Manages products and inventory',
            isSystem: true,
          })
          .returning();
        await db.insert(schema.roles).values({
          businessId: conflict!.id,
          name: 'Warehouse',
          description: 'Hand-built by the owner',
          isSystem: false,
        });
        return {
          legacyBizId: legacy!.id,
          legacyRoleId: legacyRole!.id,
          conflictBizId: conflict!.id,
          conflictRoleId: conflictRole!.id,
        };
      },
    );

    const previous = process.env.SYSTEM_ROLE_SYNC;
    process.env.SYSTEM_ROLE_SYNC = '1';
    try {
      await app.get(SystemRoleSyncService).onModuleInit();
    } finally {
      if (previous === undefined) delete process.env.SYSTEM_ROLE_SYNC;
      else process.env.SYSTEM_ROLE_SYNC = previous;
    }

    // Same row, new name — the membership still points at it.
    const [renamed] = await withDb((db) =>
      db.select().from(schema.roles).where(eq(schema.roles.id, legacyRoleId)),
    );
    expect(renamed!.name).toBe('Warehouse');
    expect(renamed!.isSystem).toBe(true);
    const [membership] = await withDb((db) =>
      db.select().from(schema.memberships).where(eq(schema.memberships.businessId, legacyBizId)),
    );
    expect(membership!.roleId).toBe(legacyRoleId);

    // The conflicted business keeps both roles exactly as they were.
    const [kept] = await withDb((db) =>
      db.select().from(schema.roles).where(eq(schema.roles.id, conflictRoleId)),
    );
    expect(kept!.name).toBe('Inventory Clerk');
    const conflictRoles = await withDb((db) =>
      db.select().from(schema.roles).where(eq(schema.roles.businessId, conflictBizId)),
    );
    expect(conflictRoles.filter((r) => r.name === 'Warehouse')).toHaveLength(1);
    expect(conflictRoles.find((r) => r.name === 'Warehouse')!.isSystem).toBe(false);
  });
});

describe('the summary', () => {
  it('pins to the warehouse location and lists the picker', async () => {
    const res = await asWh('/v1/dashboard/warehouse').expect(200);
    expect(res.body.location.name).toBe('Main Warehouse');
    expect(res.body.locations[0]!.locationType).toBe('warehouse');
  });

  it('card 1 — inbound POs for THIS location, overdue leading', async () => {
    const res = await asWh('/v1/dashboard/warehouse').expect(200);
    const inbound = res.body.inbound as {
      id: string;
      overdue: boolean;
      orderedUnits: number;
      receivedUnits: number;
    }[];
    // Ordered + partially_received at the warehouse; the store PO is out.
    expect(inbound.length).toBeGreaterThanOrEqual(2);
    expect(inbound[0]!.id).toBe(fixtures.overduePoId);
    expect(inbound[0]!.overdue).toBe(true);
    expect(inbound[0]!.orderedUnits).toBe(5);
    expect(inbound[0]!.receivedUnits).toBe(2);
  });

  it('card 2 — units received but never dispositioned', async () => {
    const res = await asWh('/v1/dashboard/warehouse').expect(200);
    const dock = res.body.dock as { id: string; unitsInProgress: number }[];
    const stuck = dock.find((d) => d.id === fixtures.dockPoId);
    expect(stuck).toBeDefined();
    expect(stuck!.unitsInProgress).toBe(2);
  });

  it('card 5 — pickups with age and readiness', async () => {
    const res = await asWh('/v1/dashboard/warehouse').expect(200);
    const pickups = res.body.pickups as { orderId: string; ageDays: number; ready: boolean }[];
    expect(pickups).toHaveLength(2);
    const stale = pickups.find((p) => p.orderId === fixtures.stalePickupOrderId);
    expect(stale!.ready).toBe(true);
    expect(stale!.ageDays).toBeGreaterThanOrEqual(9);
    expect(pickups.some((p) => !p.ready)).toBe(true);
  });

  it('card 6 — arrived special orders with nothing booked', async () => {
    const res = await asWh('/v1/dashboard/warehouse').expect(200);
    const arrived = res.body.arrived as { orderId: string }[];
    expect(arrived.some((a) => a.orderId === fixtures.arrivedOrderId)).toBe(true);
    // The one with a live delivery is someone else's problem now.
    expect(arrived.some((a) => a.orderId === fixtures.scheduledArrivedOrderId)).toBe(false);
  });

  it('card 7 — transfers with direction, transit age, and ticket state', async () => {
    const res = await asWh('/v1/dashboard/warehouse').expect(200);
    const t = res.body.transfers as {
      rows: {
        id: string;
        direction: string;
        days: number | null;
        awaitingTicket: boolean;
        units: number;
      }[];
      closedShort30d: number;
    };
    const transit = t.rows.find((r) => r.id === fixtures.transitTransferId);
    expect(transit!.direction).toBe('inbound');
    expect(transit!.days).toBeGreaterThanOrEqual(4);
    expect(transit!.units).toBe(4);
    expect(t.rows.some((r) => r.awaitingTicket)).toBe(true);
    expect(t.closedShort30d).toBe(1);
  });

  it('card 8 — the as-is queue valued at cost', async () => {
    const res = await asWh('/v1/dashboard/warehouse').expect(200);
    expect(res.body.asIs.count).toBe(2);
    expect(res.body.asIs.costCents).toBe(80_000);
  });

  it('card 9 — open counts and negative on-hand', async () => {
    const res = await asWh('/v1/dashboard/warehouse').expect(200);
    expect(res.body.counts.open).toHaveLength(1);
    expect(res.body.counts.lastPostedDate).toBeNull();
    const negative = res.body.counts.negative as { onHand: number }[];
    expect(negative).toHaveLength(1);
    expect(negative[0]!.onHand).toBe(-2);
  });
});

describe('the truck', () => {
  it('card 3 — today’s load-out counts stops, pieces, and unpicked serials', async () => {
    const res = await asWh('/v1/dashboard/warehouse/loadout').expect(200);
    expect(res.body.date).toBe(localDay(0));
    expect(res.body.cap).toBe(15);
    expect(res.body.stops).toBe(1);
    expect(res.body.pieces).toBe(2);
    const row = res.body.rows[0] as { orderId: string; serialShort: boolean; customerName: string };
    expect(row.orderId).toBe(fixtures.loadoutOrderId);
    expect(row.serialShort).toBe(true);
    expect(row.customerName).toBe('Wendy House');
  });

  it('card 4 — tomorrow’s pick list with bin and shortfall', async () => {
    const res = await asWh('/v1/dashboard/warehouse/picklist').expect(200);
    expect(res.body.date).toBe(localDay(1));
    const rows = res.body.rows as {
      variantId: string;
      bin: string | null;
      quantity: number;
      onHand: number;
      short: boolean;
    }[];
    expect(rows).toHaveLength(1);
    expect(rows[0]!.variantId).toBe(fixtures.picklistVariantId);
    expect(rows[0]!.bin).toBe('B-07');
    expect(rows[0]!.quantity).toBe(3);
    expect(rows[0]!.onHand).toBe(1);
    expect(rows[0]!.short).toBe(true);
  });

  it('rejects a malformed date instead of guessing', async () => {
    await asWh('/v1/dashboard/warehouse/loadout?date=tomorrow').expect(400);
  });
});
