/**
 * Day 1 acceptance (STORIS cutover sprint): a cashier writes a sales
 * order for a customer, the order commits stock without decrementing
 * on-hand, a deposit lands as a `payments` row against the order, and the
 * balance due falls by exactly what was collected. Cancelling hands the
 * committed units back.
 *
 * Also covers the guard rails that keep the money honest: over-collecting
 * past the balance, cancelling an order that already holds money, and
 * role gating (an inventory clerk can't write orders or take deposits).
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, sql } from 'drizzle-orm';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';

const TEST_DB_URL =
  process.env.ORDERS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_orders';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'OrdersPass!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let customerId = '';
/** Sofa: 8 on hand, $1,299.99. */
let sofaVariantId = '';
/** Chair: 1 on hand, $199.99 — deliberately short for a 3-unit line. */
let chairVariantId = '';
let ownerCookie = '';
let cashierCookie = '';
let clerkCookie = '';

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
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    const passwordHash = await hashPassword(PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({
        slug: 'orders-test',
        name: 'Orders Test Co',
        status: 'active',
        defaultTaxRateBps: 700,
      })
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

    async function makeUser(email: string, role: string): Promise<void> {
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
    }
    await makeUser('owner@orders-test.local', 'Owner');
    await makeUser('cashier@orders-test.local', 'Cashier');
    await makeUser('clerk@orders-test.local', 'Inventory Clerk');

    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Showroom', timezone: 'America/New_York', taxRateBps: 700 })
      .returning();
    locationId = loc!.id;

    const [cust] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Dana', lastName: 'Reyes', email: 'dana@example.test' })
      .returning();
    customerId = cust!.id;

    async function makeVariant(sku: string, name: string, priceCents: number, onHand: number) {
      const [p] = await db.insert(schema.products).values({ businessId, sku, name }).returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({ businessId, productId: p!.id, sku: `${sku}-1`, priceCents })
        .returning();
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: v!.id,
        locationId,
        onHand,
        reserved: 0,
      });
      return v!.id;
    }
    sofaVariantId = await makeVariant('SOFA', 'Harbour Sofa', 129_999, 8);
    chairVariantId = await makeVariant('CHAIR', 'Harbour Chair', 19_999, 1);
  } finally {
    await sql.end({ timeout: 5 });
  }
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

async function levelOf(variantId: string): Promise<{ onHand: number; reserved: number }> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    const [row] = await db
      .select()
      .from(schema.inventoryLevels)
      .where(
        and(
          eq(schema.inventoryLevels.variantId, variantId),
          eq(schema.inventoryLevels.locationId, locationId),
        ),
      );
    return { onHand: row?.onHand ?? 0, reserved: row?.reserved ?? 0 };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function movementsFor(orderId: string): Promise<{ reason: string; delta: number }[]> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    return await db
      .select({
        reason: schema.inventoryMovements.reason,
        delta: schema.inventoryMovements.delta,
      })
      .from(schema.inventoryMovements)
      .where(eq(schema.inventoryMovements.referenceId, orderId))
      .orderBy(schema.inventoryMovements.createdAt);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'orders-test-secret-orders-test-secret-x';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  ownerCookie = await captureCookie('owner@orders-test.local');
  cashierCookie = await captureCookie('cashier@orders-test.local');
  clerkCookie = await captureCookie('clerk@orders-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('New Sale backend (PLAN-POS-OPERATIONS P2a)', () => {
  // Own fixtures — the Day-1 suites assert absolute stock numbers on the
  // shared sofa, so nothing here may touch it.
  let nsVariantId = '';
  let atpVariantId = '';

  beforeAll(async () => {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      const [p1] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'NS-SOFA', name: 'NewSale Fixture Sofa' })
        .returning();
      const [v1] = await db
        .insert(schema.productVariants)
        .values({ businessId, productId: p1!.id, sku: 'NS-SOFA-V1', priceCents: 99900 })
        .returning();
      nsVariantId = v1!.id;
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: nsVariantId,
        locationId,
        onHand: 10,
        reserved: 0,
      });

      const [p2] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'ATP-1', name: 'ATP Backorder Mattress' })
        .returning();
      const [v2] = await db
        .insert(schema.productVariants)
        .values({ businessId, productId: p2!.id, sku: 'ATP-1-V1', priceCents: 49999 })
        .returning();
      atpVariantId = v2!.id;
      const [vendor] = await db
        .insert(schema.vendors)
        .values({ businessId, name: 'ATP Vendor' })
        .returning();
      const [po] = await db
        .insert(schema.purchaseOrders)
        .values({
          businessId,
          vendorId: vendor!.id,
          locationId,
          number: 'PO-ATP-1',
          status: 'ordered',
          expectedAt: new Date('2026-09-04T00:00:00Z'),
        })
        .returning();
      await db.insert(schema.purchaseOrderLines).values({
        businessId,
        purchaseOrderId: po!.id,
        variantId: atpVariantId,
        quantityOrdered: 5,
        quantityReceived: 0,
        unitCostCents: 20000,
        lineTotalCents: 100000,
      });
    } finally {
      await sql2.end({ timeout: 5 });
    }
  });

  it('Custom fee lines: no variant, untaxed, never reserved; new tenders accepted', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        confirm: true,
        lines: [
          { variantId: nsVariantId, quantity: 1 },
          { lineType: 'custom', description: 'Recycling Fee', quantity: 2, unitPriceCents: 1050 },
          { lineType: 'custom', description: 'Mattress Removal', quantity: 1, unitPriceCents: 0 },
        ],
      });
    expect(res.status).toBe(201);
    const o = res.body;
    const fee = o.lines.find((l: { description: string }) => l.description === 'Recycling Fee');
    expect(fee.variantId).toBeNull();
    expect(fee.taxCents).toBe(0); // fees are untaxed
    expect(fee.totalCents).toBe(2100);
    const removal = o.lines.find(
      (l: { description: string }) => l.description === 'Mattress Removal',
    );
    expect(removal.totalCents).toBe(0);
    expect(fee.qtyReserved).toBe(0);
    const sofa = o.lines.find((l: { variantId: string | null }) => l.variantId);
    expect(sofa.qtyReserved).toBe(1);

    const pay = await request(app.getHttpServer())
      .post(`/v1/orders/${o.id}/payments`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ method: 'venmo', amountCents: 5000, kind: 'deposit' });
    expect(pay.status).toBe(201);

    const noDesc = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        lines: [{ lineType: 'custom', quantity: 1, unitPriceCents: 100 }],
      });
    expect(noDesc.status).toBe(400);
  });

  it('Drafts: store-wide, no reservation, resumable to open', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        draft: true,
        lines: [{ variantId: nsVariantId, quantity: 1 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.lines[0].qtyReserved).toBe(0);

    const list = await request(app.getHttpServer())
      .get('/v1/orders?status=draft')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(list.status).toBe(200);
    expect(list.body.data.some((o: { id: string }) => o.id === res.body.id)).toBe(true);

    const confirmed = await request(app.getHttpServer())
      .patch(`/v1/orders/${res.body.id}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ status: 'open' });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.status).toBe('open');
    expect(confirmed.body.lines[0].qtyReserved).toBe(1);
  });

  it('Product search: stock filters and ATP date from open POs', async () => {
    const out = await request(app.getHttpServer())
      .get(`/v1/pos/product-search?q=ATP&inStock=0&locationId=${locationId}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(out.status).toBe(200);
    const hit = out.body.find((r: { variantId: string }) => r.variantId === atpVariantId);
    expect(hit).toBeTruthy();
    expect(hit.availableTotal).toBe(0);
    expect(hit.atpDate).toContain('2026-09-04');

    const inn = await request(app.getHttpServer())
      .get(`/v1/pos/product-search?q=NewSale&inStock=1&locationId=${locationId}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(inn.status).toBe(200);
    expect(inn.body.some((r: { variantId: string }) => r.variantId === nsVariantId)).toBe(true);
    expect(inn.body.every((r: { availableTotal: number }) => r.availableTotal > 0)).toBe(true);
  });
});

describe('Orders list-view + notifications (PLAN-POS-OPERATIONS P3)', () => {
  // Own fixtures again — display-status assertions must not depend on
  // what other suites did to the shared variants.
  let lvStockedVariantId = '';
  let lvEmptyVariantId = '';

  interface ListViewRow {
    id: string;
    number: string;
    customerName: string;
    displayStatus: string;
    poNumber: string | null;
    deliveryDate: string | null;
    balanceDueCents: number;
    salespersonName: string | null;
    totalCents: number;
  }

  async function listView(query = ''): Promise<ListViewRow[]> {
    const res = await request(app.getHttpServer())
      .get(`/v1/orders/list-view${query}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    return res.body.data as ListViewRow[];
  }

  beforeAll(async () => {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      const mk = async (sku: string, name: string, onHand: number) => {
        const [p] = await db.insert(schema.products).values({ businessId, sku, name }).returning();
        const [v] = await db
          .insert(schema.productVariants)
          .values({ businessId, productId: p!.id, sku: `${sku}-V1`, priceCents: 50000 })
          .returning();
        await db.insert(schema.inventoryLevels).values({
          businessId,
          variantId: v!.id,
          locationId,
          onHand,
          reserved: 0,
        });
        return v!.id;
      };
      lvStockedVariantId = await mk('LV-STOCK', 'ListView Stocked Bed', 10);
      lvEmptyVariantId = await mk('LV-EMPTY', 'ListView Backordered Bed', 0);
    } finally {
      await sql2.end({ timeout: 5 });
    }
  });

  it('Spec columns + display statuses: Draft, Quote, Reserved, Pending; balance due after payment', async () => {
    const make = async (body: Record<string, unknown>) => {
      const res = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Cookie', cashierCookie)
        .set('X-Business-Id', businessId)
        .send({ locationId, customerId, ...body });
      expect(res.status).toBe(201);
      return res.body as { id: string; number: string; totalCents: number };
    };

    const draft = await make({
      draft: true,
      lines: [{ variantId: lvStockedVariantId, quantity: 1 }],
    });
    const quote = await make({ lines: [{ variantId: lvStockedVariantId, quantity: 1 }] });
    const reserved = await make({
      confirm: true,
      lines: [{ variantId: lvStockedVariantId, quantity: 1 }],
    });
    const pending = await make({
      confirm: true,
      lines: [{ variantId: lvEmptyVariantId, quantity: 1 }],
    });

    const pay = await request(app.getHttpServer())
      .post(`/v1/orders/${reserved.id}/payments`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ method: 'cash', amountCents: 10000, kind: 'deposit' });
    expect(pay.status).toBe(201);

    const rows = await listView('?limit=100');
    const byId = new Map(rows.map((r) => [r.id, r]));

    expect(byId.get(draft.id)?.displayStatus).toBe('Draft');
    expect(byId.get(quote.id)?.displayStatus).toBe('Quote');
    expect(byId.get(reserved.id)?.displayStatus).toBe('Reserved');
    expect(byId.get(pending.id)?.displayStatus).toBe('Pending');

    const r = byId.get(reserved.id)!;
    expect(r.customerName).toBe('Dana Reyes');
    expect(r.balanceDueCents).toBe(reserved.totalCents - 10000);
    expect(r.number).toBe(reserved.number);
  });

  it('q filter matches order number and customer name', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        confirm: true,
        lines: [{ variantId: lvStockedVariantId, quantity: 1 }],
      });
    expect(res.status).toBe(201);
    const number: string = res.body.number;

    const byNumber = await listView(`?q=${encodeURIComponent(number)}`);
    expect(byNumber.some((r) => r.id === res.body.id)).toBe(true);

    const byName = await listView('?q=reyes&limit=200');
    expect(byName.some((r) => r.id === res.body.id)).toBe(true);
    expect(byName.every((r) => r.customerName === 'Dana Reyes')).toBe(true);
  });

  it('Notifications feed: post-creation order changes, attributed; gated by audit.view', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        confirm: true,
        lines: [{ variantId: lvStockedVariantId, quantity: 1 }],
      });
    expect(created.status).toBe(201);

    const patched = await request(app.getHttpServer())
      .patch(`/v1/orders/${created.body.id}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ notes: 'call before delivery' });
    expect(patched.status).toBe(200);

    const feed = await request(app.getHttpServer())
      .get('/v1/notifications?limit=50')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(feed.status).toBe(200);
    const hit = feed.body.data.find(
      (n: { orderId: string | null; action: string }) =>
        n.orderId === created.body.id && n.action === 'order.update',
    );
    expect(hit).toBeTruthy();
    expect(hit.label).toBe('Order edited');
    expect(hit.orderNumber).toBe(created.body.number);
    expect(hit.actorEmail).toBe('cashier@orders-test.local');
    // order.create is not a *post-creation* change — it must not be in the feed.
    expect(feed.body.data.some((n: { action: string }) => n.action === 'order.create')).toBe(false);

    await request(app.getHttpServer())
      .get('/v1/notifications')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .expect(403);
  });
});

describe('Documents + A1 print lock (PLAN-POS-OPERATIONS P4)', () => {
  let p4VariantId = '';

  beforeAll(async () => {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      const [vendor] = await db
        .insert(schema.vendors)
        .values({ businessId, name: 'Docs Brand Co' })
        .returning();
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'P4-BED', name: 'Docs Fixture Bed' })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({
          businessId,
          productId: p!.id,
          sku: 'P4-BED-V1',
          priceCents: 80000,
          preferredVendorId: vendor!.id,
        })
        .returning();
      p4VariantId = v!.id;
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: p4VariantId,
        locationId,
        onHand: 20,
        reserved: 0,
      });
    } finally {
      await sql2.end({ timeout: 5 });
    }
  });

  async function makeOrder(): Promise<{ id: string; number: string }> {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        confirm: true,
        // Pickup + promised date satisfies the G9 print preconditions
        // without needing a scheduled truck in this suite.
        fulfillmentType: 'pickup',
        requestedDate: '2026-09-10',
        lines: [{ variantId: p4VariantId, quantity: 1 }],
      });
    expect(res.status).toBe(201);
    return res.body;
  }

  it('Document payload: business + store + customer + line model/brand + totals', async () => {
    const order = await makeOrder();
    const res = await request(app.getHttpServer())
      .get(`/v1/orders/${order.id}/document`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.business.name).toBe('Orders Test Co');
    expect(res.body.location.name).toBe('Showroom');
    expect(res.body.customer.name).toBe('Dana Reyes');
    expect(res.body.scheduledDate).toBe('2026-09-10'); // no trip yet → requested date
    const line = res.body.lines.find((l: { model: string | null }) => l.model === 'P4-BED-V1');
    expect(line).toBeTruthy();
    expect(line.brand).toBe('Docs Brand Co');
    expect(res.body.order.totalCents).toBe(res.body.order.subtotalCents + res.body.order.taxCents);
  });

  it('Individual ticket print locks: edits refuse 409 until unlocked with a reason', async () => {
    const order = await makeOrder();

    const printed = await request(app.getHttpServer())
      .post(`/v1/orders/${order.id}/delivery-ticket-print`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(printed.status).toBe(201);
    expect(printed.body.lockedAt).toBeTruthy();

    // All guarded edit surfaces refuse while locked…
    await request(app.getHttpServer())
      .patch(`/v1/orders/${order.id}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ requestedDate: '2026-09-12' })
      .expect(409);
    // …but the G9 allowlist lets contact/notes fixes through the lock.
    await request(app.getHttpServer())
      .patch(`/v1/orders/${order.id}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ notes: 'gate code 4411' })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/v1/orders/${order.id}/lines`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ variantId: p4VariantId, quantity: 1 })
      .expect(409);
    await request(app.getHttpServer())
      .post(`/v1/orders/${order.id}/cancel`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({})
      .expect(409);

    // Cashier lacks orders.unlock; owner without a reason is a 400.
    await request(app.getHttpServer())
      .post(`/v1/orders/${order.id}/unlock`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ reason: 'customer changed size' })
      .expect(403);
    await request(app.getHttpServer())
      .post(`/v1/orders/${order.id}/unlock`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({})
      .expect(400);

    const unlocked = await request(app.getHttpServer())
      .post(`/v1/orders/${order.id}/unlock`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ reason: 'customer changed size' });
    expect(unlocked.status).toBe(201);
    expect(unlocked.body.lockedAt).toBeNull();

    await request(app.getHttpServer())
      .patch(`/v1/orders/${order.id}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ notes: 'now it works' })
      .expect(200);

    // The unlock override surfaces in the owner notifications feed with
    // its typed reason (§12 "lock overrides").
    const feed = await request(app.getHttpServer())
      .get('/v1/notifications?limit=50')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(feed.status).toBe(200);
    const hit = feed.body.data.find(
      (n: { orderId: string | null; action: string }) =>
        n.orderId === order.id && n.action === 'order.unlock',
    );
    expect(hit).toBeTruthy();
    expect(hit.label).toContain('unlocked');
    expect(hit.changesJson?.metadata?.reason).toBe('customer changed size');
  });
});

describe('Enter a Sales Order — STORIS 3-step parity fields', () => {
  it('Order carries kind, fulfillment, delivery status, fees; total includes fees', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        orderKind: 'layaway',
        fulfillmentType: 'take_with',
        deliveryStatus: 'will_call',
        deliveryInstructions: 'Call ahead 30 min',
        marketingCode: 'LABOR-DAY',
        deliveryFeeCents: 9900,
        installFeeCents: 2500,
        otherFeeCents: 500,
        otherFeeLabel: 'Recycling fee',
        billingAddress: { line1: '1 Billing Way', city: 'LA', region: 'CA', postalCode: '90001' },
        lines: [
          { variantId: sofaVariantId, quantity: 1 },
          {
            variantId: sofaVariantId,
            quantity: 1,
            fulfillmentMethod: 'delivery',
            deliveryDate: '2026-09-15',
          },
        ],
      });
    expect(res.status).toBe(201);
    const o = res.body;
    expect(o.orderKind).toBe('layaway');
    expect(o.fulfillmentType).toBe('take_with');
    expect(o.deliveryStatus).toBe('will_call');
    expect(o.marketingCode).toBe('LABOR-DAY');
    expect(o.deliveryFeeCents).toBe(9900);
    expect(o.otherFeeLabel).toBe('Recycling fee');
    // total = taxed cart + the three fee buckets
    expect(o.totalCents).toBe(o.subtotalCents - o.discountCents + o.taxCents + 9900 + 2500 + 500);
    expect(o.balanceDueCents).toBe(o.totalCents);
    // split-ticket line overrides round-trip
    expect(o.lines[0].fulfillmentMethod).toBeNull();
    expect(o.lines[1].fulfillmentMethod).toBe('delivery');
    expect(o.lines[1].deliveryDate).toBe('2026-09-15');

    // fees are editable and reprice the total
    const upd = await request(app.getHttpServer())
      .patch(`/v1/orders/${o.id}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ deliveryFeeCents: 0, deliveryStatus: 'scheduled' });
    expect(upd.status).toBe(200);
    expect(upd.body.totalCents).toBe(o.totalCents - 9900);
    expect(upd.body.deliveryStatus).toBe('scheduled');
  });

  it('Bad enums and negative fees are rejected', async () => {
    const base = { locationId, customerId, lines: [{ variantId: sofaVariantId, quantity: 1 }] };
    for (const bad of [
      { ...base, fulfillmentType: 'teleport' },
      { ...base, orderKind: 'club' },
      { ...base, deliveryStatus: 'whenever' },
      { ...base, deliveryFeeCents: -5 },
      { ...base, lines: [{ variantId: sofaVariantId, quantity: 1, fulfillmentMethod: 'nope' }] },
    ]) {
      const res = await request(app.getHttpServer())
        .post('/v1/orders')
        .set('Cookie', cashierCookie)
        .set('X-Business-Id', businessId)
        .send(bad);
      expect(res.status).toBe(400);
    }
  });
});

describe('Day 1 — order spine: write, deposit, reserve', () => {
  let orderId = '';
  let orderNumber = '';

  it('Inventory Clerk (no orders.create) is denied order entry', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        lines: [{ variantId: sofaVariantId, quantity: 1 }],
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/orders\.create/);
  });

  it('Cashier writes a quote for one sofa', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        fulfillmentType: 'delivery',
        address: { line1: '14 Wharf Rd', city: 'Portland', region: 'ME', postalCode: '04101' },
        lines: [{ variantId: sofaVariantId, quantity: 1 }],
        notes: 'Deliver to the side door',
      });
    expect(res.status).toBe(201);
    orderId = res.body.id;
    orderNumber = res.body.number;

    expect(orderNumber).toMatch(/^SO-\d{4}-\d{6}$/);
    expect(res.body.status).toBe('quote');
    expect(res.body.customerId).toBe(customerId);
    expect(res.body.subtotalCents).toBe(129_999);
    expect(res.body.taxCents).toBe(9_100); // round(129999 * 7%)
    expect(res.body.totalCents).toBe(139_099);
    // 25% policy default, rounded up to the cent.
    expect(res.body.depositRequiredCents).toBe(34_775);
    expect(res.body.paidCents).toBe(0);
    expect(res.body.balanceDueCents).toBe(139_099);
    expect(res.body.lines).toHaveLength(1);
    expect(res.body.lines[0].qtyReserved).toBe(0);
  });

  it('A quote holds no stock', async () => {
    const level = await levelOf(sofaVariantId);
    expect(level).toEqual({ onHand: 8, reserved: 0 });
  });

  it('Confirming the quote commits stock without moving on-hand', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/v1/orders/${orderId}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ status: 'open' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('open');
    expect(res.body.lines[0].qtyReserved).toBe(1);

    // The sofa is still in the building — it is just spoken for.
    expect(await levelOf(sofaVariantId)).toEqual({ onHand: 8, reserved: 1 });

    const movements = await movementsFor(orderId);
    expect(movements).toEqual([{ reason: 'order_reserve', delta: 0 }]);
  });

  it('Cashier takes a deposit; the balance falls by exactly that much', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/payments`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ method: 'cash', amountCents: 34_775 });
    expect(res.status).toBe(201);
    expect(res.body.paidCents).toBe(34_775);
    expect(res.body.balanceDueCents).toBe(139_099 - 34_775);
    expect(res.body.payments).toHaveLength(1);
    // The first money in is the deposit; no caller had to say so.
    expect(res.body.payments[0].kind).toBe('deposit');
    expect(res.body.payments[0].method).toBe('cash');
  });

  it('The deposit is a payments row bound to the order, not to a sale', async () => {
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const rows = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.orderId, orderId));
      expect(rows).toHaveLength(1);
      expect(rows[0]!.saleId).toBeNull();
      expect(rows[0]!.orderId).toBe(orderId);
      expect(rows[0]!.kind).toBe('deposit');
      expect(rows[0]!.amountCents).toBe(34_775);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('A second payment is a balance, and cannot exceed what is owed', async () => {
    const tooMuch = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/payments`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ method: 'cash', amountCents: 200_000 });
    expect(tooMuch.status).toBe(400);
    expect(tooMuch.body.message).toMatch(/exceeds the balance due/);

    const partial = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/payments`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ method: 'external_card', amountCents: 10_000 });
    expect(partial.status).toBe(201);
    expect(partial.body.payments[1].kind).toBe('balance');
    expect(partial.body.paidCents).toBe(44_775);
    expect(partial.body.balanceDueCents).toBe(139_099 - 44_775);
  });

  it('Financing tender must name its provider', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/payments`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ method: 'financing', amountCents: 1_000 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/financingProvider/);
  });

  it('An order holding money cannot be cancelled out from under it', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/cancel`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ reason: 'customer changed their mind' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Refund the money/);
  });

  it('Inventory Clerk cannot take money on an order', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/payments`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ method: 'cash', amountCents: 100 });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/orders\.deposit\.take/);
  });

  it('The order is listed and readable by number', async () => {
    const list = await request(app.getHttpServer())
      .get('/v1/orders?status=open')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(list.status).toBe(200);
    expect(list.body.data.map((o: { id: string }) => o.id)).toContain(orderId);

    const detail = await request(app.getHttpServer())
      .get(`/v1/orders/${orderId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(detail.status).toBe(200);
    expect(detail.body.number).toBe(orderNumber);
    expect(detail.body.paidCents).toBe(44_775);
  });
});

describe('Day 1 — partial stock, line edits, and cancellation', () => {
  let orderId = '';

  it('Writing a confirmed order for more chairs than exist reserves what it can', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        confirm: true,
        lines: [{ variantId: chairVariantId, quantity: 3 }],
      });
    expect(res.status).toBe(201);
    orderId = res.body.id;
    expect(res.body.status).toBe('open');
    // Only 1 chair exists: the line is committed 1 of 3, and the rest is
    // a shortfall for the Day 4 special-order queue rather than an error.
    expect(res.body.lines[0].qtyReserved).toBe(1);
    expect(await levelOf(chairVariantId)).toEqual({ onHand: 1, reserved: 1 });
  });

  it('Reserving again is a no-op and reports the shortfall', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/reserve`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.order.lines[0].qtyReserved).toBe(1);
    expect(res.body.shortfalls).toHaveLength(1);
    expect(res.body.shortfalls[0].quantity).toBe(2);
    // Crucially, the second call did not double-book the chair.
    expect(await levelOf(chairVariantId)).toEqual({ onHand: 1, reserved: 1 });
  });

  it('Adding a line reprices the order and commits the new stock', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/lines`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ variantId: sofaVariantId, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.lines).toHaveLength(2);
    expect(res.body.subtotalCents).toBe(3 * 19_999 + 2 * 129_999);
    expect(res.body.lines[1].qtyReserved).toBe(2);
    // 1 already committed to the first order, plus these 2.
    expect(await levelOf(sofaVariantId)).toEqual({ onHand: 8, reserved: 3 });
  });

  it('Removing a line releases its stock and reprices', async () => {
    const before = await request(app.getHttpServer())
      .get(`/v1/orders/${orderId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const sofaLineId = before.body.lines.find(
      (l: { variantId: string }) => l.variantId === sofaVariantId,
    ).id;

    const res = await request(app.getHttpServer())
      .delete(`/v1/orders/${orderId}/lines/${sofaLineId}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.lines).toHaveLength(1);
    expect(res.body.subtotalCents).toBe(3 * 19_999);
    expect(await levelOf(sofaVariantId)).toEqual({ onHand: 8, reserved: 1 });
  });

  it('Cancelling a money-free order releases everything it held', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/cancel`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ reason: 'floor model sold instead' });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('cancelled');
    expect(res.body.cancelledAt).toBeTruthy();
    expect(res.body.internalNotes).toMatch(/floor model sold instead/);

    expect(await levelOf(chairVariantId)).toEqual({ onHand: 1, reserved: 0 });

    const movements = await movementsFor(orderId);
    expect(movements.map((m) => m.reason)).toEqual([
      'order_reserve',
      'order_reserve',
      'order_release',
      'order_release',
    ]);
  });

  it('A cancelled order refuses further edits', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/payments`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ method: 'cash', amountCents: 100 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cancelled and cannot be changed/);
  });
});

describe('Day 1 — order pricing rules', () => {
  it('An order-level discount is allocated across lines before tax', async () => {
    // Deep negotiated prices — since G6 that takes the owner (who holds
    // orders.price_override) plus a reason; the tax math is unchanged.
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        orderDiscountCents: 10_000,
        priceReason: 'negotiated floor deal',
        lines: [
          { variantId: sofaVariantId, quantity: 1, unitPriceCents: 90_000 },
          { variantId: chairVariantId, quantity: 1, unitPriceCents: 10_000 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.subtotalCents).toBe(100_000);
    expect(res.body.orderDiscountCents).toBe(10_000);
    expect(res.body.discountCents).toBe(10_000);
    // 7% on the 90,000 that survives the discount.
    expect(res.body.taxCents).toBe(6_300);
    expect(res.body.totalCents).toBe(96_300);
  });

  it('A special-order line never commits stock', async () => {
    const before = await levelOf(sofaVariantId);
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        confirm: true,
        lines: [{ variantId: sofaVariantId, quantity: 1, lineType: 'special_order' }],
      });
    expect(res.status).toBe(201);
    expect(res.body.lines[0].lineType).toBe('special_order');
    expect(res.body.lines[0].qtyReserved).toBe(0);
    expect(await levelOf(sofaVariantId)).toEqual(before);
  });

  it('An order requires a customer', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ locationId, lines: [{ variantId: sofaVariantId, quantity: 1 }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/customerId is required/);
  });

  it('Taking a deposit on a quote confirms it and commits the stock', async () => {
    // Money down means the customer committed. The invariant worth having
    // is that an order holding money is an order holding its goods.
    const before = await levelOf(sofaVariantId);
    const created = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ locationId, customerId, lines: [{ variantId: sofaVariantId, quantity: 1 }] });
    expect(created.status).toBe(201);
    expect(created.body.status).toBe('quote');
    expect(created.body.lines[0].qtyReserved).toBe(0);
    expect(await levelOf(sofaVariantId)).toEqual(before);

    const paid = await request(app.getHttpServer())
      .post(`/v1/orders/${created.body.id}/payments`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ method: 'cash', amountCents: 10_000 });
    expect(paid.status).toBe(201);
    expect(paid.body.status).toBe('open');
    expect(paid.body.lines[0].qtyReserved).toBe(1);
    expect(paid.body.payments[0].kind).toBe('deposit');
    expect(await levelOf(sofaVariantId)).toEqual({
      onHand: before.onHand,
      reserved: before.reserved + 1,
    });
  });

  it('An explicit deposit amount overrides the policy default', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        depositRequiredCents: 50_000,
        lines: [{ variantId: sofaVariantId, quantity: 1 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.depositRequiredCents).toBe(50_000);
  });
});

describe('Customer-facing status link', () => {
  let orderId = '';
  let token = '';

  it('Owner writes an order, takes a deposit, and creates a share link', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        confirm: true,
        lines: [{ variantId: sofaVariantId, quantity: 1 }],
      });
    expect(created.status).toBe(201);
    orderId = created.body.id;

    const pay = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/payments`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ method: 'cash', amountCents: 10_000 });
    expect(pay.status).toBe(201);

    const share = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/share`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(share.status).toBe(201);
    expect(share.body.token).toMatch(/^[0-9a-f]{48}$/);
    expect(share.body.path).toBe(`/track/${share.body.token}`);
    token = share.body.token;

    // Idempotent: sharing again returns the SAME token — links a
    // customer already has must keep working.
    const again = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/share`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(again.body.token).toBe(token);
  });

  it('The public endpoint serves a narrow view with NO auth at all', async () => {
    const res = await request(app.getHttpServer()).get(`/v1/public/orders/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.number).toMatch(/^SO-/);
    expect(res.body.status).toBe('open');
    expect(res.body.paidCents).toBe(10_000);
    expect(res.body.balanceCents).toBe(res.body.totalCents - 10_000);
    expect(res.body.lines.length).toBe(1);
    // The projection must not leak operational fields.
    expect(res.body.addressLine1).toBeUndefined();
    expect(res.body.internalNotes).toBeUndefined();
    expect(res.body.customerId).toBeUndefined();
  });

  it('Unknown and malformed tokens 404 without hitting order data', async () => {
    const wrong = await request(app.getHttpServer()).get(`/v1/public/orders/${'0'.repeat(48)}`);
    expect(wrong.status).toBe(404);
    const malformed = await request(app.getHttpServer()).get('/v1/public/orders/short');
    expect(malformed.status).toBe(404);
  });
});

describe('Returns, As-Is, store credit, exchanges (PLAN-POS-OPERATIONS P8)', () => {
  let p8VariantId = '';

  function owner() {
    return {
      post: (url: string) =>
        request(app.getHttpServer())
          .post(url)
          .set('Cookie', ownerCookie)
          .set('X-Business-Id', businessId),
      get: (url: string) =>
        request(app.getHttpServer())
          .get(url)
          .set('Cookie', ownerCookie)
          .set('X-Business-Id', businessId),
    };
  }

  beforeAll(async () => {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'P8-BED', name: 'Returns Fixture Bed' })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({ businessId, productId: p!.id, sku: 'P8-BED-V1', priceCents: 100000 })
        .returning();
      p8VariantId = v!.id;
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: p8VariantId,
        locationId,
        onHand: 20,
        reserved: 0,
      });
    } finally {
      await sql2.end({ timeout: 5 });
    }
  });

  async function fulfilledPaidOrder(quantity: number): Promise<{
    id: string;
    number: string;
    lineId: string;
    totalCents: number;
  }> {
    const created = await owner()
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        fulfillmentType: 'pickup',
        confirm: true,
        lines: [{ variantId: p8VariantId, quantity }],
      });
    expect(created.status).toBe(201);
    const pay = await owner()
      .post(`/v1/orders/${created.body.id}/payments`)
      .send({ method: 'cash', amountCents: created.body.totalCents });
    expect(pay.status).toBe(201);
    const ful = await owner().post(`/v1/orders/${created.body.id}/fulfill`).send({});
    expect(ful.status).toBe(201);
    return {
      id: created.body.id,
      number: created.body.number,
      lineId: created.body.lines[0].id,
      totalCents: created.body.totalCents,
    };
  }

  async function stockOf(variantId: string): Promise<number> {
    return levelOf(variantId).then((l) => l.onHand);
  }

  it('return: money reverses to the original tender, goods land in As-Is, not stock', async () => {
    const order = await fulfilledPaidOrder(2);
    const stockBefore = await stockOf(p8VariantId);

    const perUnit = Math.round(order.totalCents / 2);
    const ret = await owner()
      .post(`/v1/orders/${order.id}/return`)
      .send({ lines: [{ lineId: order.lineId, quantity: 1 }], reason: 'too firm' });
    expect(ret.status).toBe(201);
    expect(ret.body.lines[0].qtyReturned).toBe(1);
    expect(ret.body.paidCents).toBe(order.totalCents - perUnit); // negative cash row
    const refundRow = ret.body.payments.find(
      (p: { kind: string; amountCents: number }) => p.kind === 'refund',
    );
    expect(refundRow.amountCents).toBe(-perUnit);
    expect(refundRow.method).toBe('cash');

    // Goods: As-Is pending review, sellable stock untouched.
    expect(await stockOf(p8VariantId)).toBe(stockBefore);
    const queue = await owner().get('/v1/as-is?status=pending_review');
    const item = queue.body.data.find(
      (r: { referenceId: string | null }) => r.referenceId === order.id,
    );
    expect(item).toBeTruthy();
    expect(item.quantity).toBe(1);
    expect(item.source).toBe('return');

    // Over-returning is refused.
    const over = await owner()
      .post(`/v1/orders/${order.id}/return`)
      .send({ lines: [{ lineId: order.lineId, quantity: 2 }] });
    expect(over.status).toBe(400);

    // Returning the rest flips the list-view display status to Returned.
    const rest = await owner()
      .post(`/v1/orders/${order.id}/return`)
      .send({ lines: [{ lineId: order.lineId, quantity: 1 }] });
    expect(rest.status).toBe(201);
    const lv = await owner().get('/v1/orders/list-view?limit=100');
    const row = lv.body.data.find((r: { id: string }) => r.id === order.id);
    expect(row.displayStatus).toBe('Returned');

    // Review the As-Is item: restock puts it back into sellable stock.
    const reviewed = await owner().post(`/v1/as-is/${item.id}/review`).send({ action: 'restock' });
    expect(reviewed.status).toBe(201);
    expect(reviewed.body.status).toBe('restocked');
    expect(await stockOf(p8VariantId)).toBe(stockBefore + 1);
    await owner().post(`/v1/as-is/${item.id}/review`).send({ action: 'scrap' }).expect(400);
  });

  it('store credit: issued by a return, surfaces on the customer, redeems with a balance check', async () => {
    const order = await fulfilledPaidOrder(1);
    const ret = await owner()
      .post(`/v1/orders/${order.id}/return`)
      .send({
        lines: [{ lineId: order.lineId, quantity: 1 }],
        refundMethod: 'store_credit',
        reason: 'exchange credit',
      });
    expect(ret.status).toBe(201);
    // Store-credit return keeps the money: paid is unchanged.
    expect(ret.body.paidCents).toBe(order.totalCents);

    const credit = await owner().get(`/v1/customers/${customerId}/store-credit`);
    expect(credit.status).toBe(200);
    expect(credit.body.balanceCents).toBeGreaterThanOrEqual(order.totalCents);
    const balance = credit.body.balanceCents;

    // Redeem on a new order — within balance succeeds and debits the ledger…
    const next = await owner()
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        confirm: true,
        lines: [{ variantId: p8VariantId, quantity: 1 }],
      });
    expect(next.status).toBe(201);
    const redeem = await owner()
      .post(`/v1/orders/${next.body.id}/payments`)
      .send({ method: 'store_credit', amountCents: 5000 });
    expect(redeem.status).toBe(201);
    const after = await owner().get(`/v1/customers/${customerId}/store-credit`);
    expect(after.body.balanceCents).toBe(balance - 5000);

    // …and over-balance is refused.
    const tooMuch = await owner()
      .post(`/v1/orders/${next.body.id}/payments`)
      .send({ method: 'store_credit', amountCents: after.body.balanceCents + 100000 });
    expect([400]).toContain(tooMuch.status);
  });

  it('price adjustment: money-only, distinct kind, reason required', async () => {
    const order = await fulfilledPaidOrder(1);
    await owner()
      .post(`/v1/orders/${order.id}/price-adjustment`)
      .send({ amountCents: 500 })
      .expect(400); // no reason

    const adj = await owner()
      .post(`/v1/orders/${order.id}/price-adjustment`)
      .send({ amountCents: 500, reason: 'price match' });
    expect(adj.status).toBe(201);
    expect(adj.body.paidCents).toBe(order.totalCents - 500);
    const row = adj.body.payments.find((p: { kind: string }) => p.kind === 'adjustment');
    expect(row.amountCents).toBe(-500);
    // No goods moved: nothing new in As-Is for this order.
    const queue = await owner().get('/v1/as-is');
    expect(
      queue.body.data.some((r: { referenceId: string | null }) => r.referenceId === order.id),
    ).toBe(false);
  });

  it('exchange order: linked to the original, documents as Exchange Order', async () => {
    const original = await fulfilledPaidOrder(1);
    const ex = await owner()
      .post(`/v1/orders/${original.id}/exchange`)
      .send({
        confirm: true,
        lines: [{ variantId: p8VariantId, quantity: 1 }],
      });
    expect(ex.status).toBe(201);
    expect(ex.body.orderKind).toBe('exchange');
    expect(ex.body.originalOrderId).toBe(original.id);

    const doc = await owner().get(`/v1/orders/${ex.body.id}/document`);
    expect(doc.status).toBe(200);
    expect(doc.body.originalOrderNumber).toBe(original.number);
    expect(doc.body.order.creditDueCents).toBe(0);

    // The original shows as Exchanged on the orders table.
    const lv = await owner().get('/v1/orders/list-view?limit=100');
    const row = lv.body.data.find((r: { id: string }) => r.id === original.id);
    expect(row.displayStatus).toBe('Exchanged');
  });
});

describe('Return lifecycle — refund gated on goods receipt (PLAN-STORIS-GAP G3)', () => {
  let g3VariantId = '';

  function as(cookie: string) {
    return {
      post: (url: string) =>
        request(app.getHttpServer())
          .post(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
      get: (url: string) =>
        request(app.getHttpServer())
          .get(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
    };
  }
  const owner = () => as(ownerCookie);

  beforeAll(async () => {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'G3-BED', name: 'Lifecycle Fixture Bed' })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({ businessId, productId: p!.id, sku: 'G3-BED-V1', priceCents: 50000 })
        .returning();
      g3VariantId = v!.id;
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: g3VariantId,
        locationId,
        onHand: 30,
        reserved: 0,
      });
    } finally {
      await sql2.end({ timeout: 5 });
    }
  });

  async function fulfilledPaidOrder(quantity: number): Promise<{
    id: string;
    number: string;
    lineId: string;
    totalCents: number;
  }> {
    const created = await owner()
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        fulfillmentType: 'pickup',
        confirm: true,
        lines: [{ variantId: g3VariantId, quantity }],
      });
    expect(created.status).toBe(201);
    await owner()
      .post(`/v1/orders/${created.body.id}/payments`)
      .send({ method: 'cash', amountCents: created.body.totalCents })
      .expect(201);
    await owner().post(`/v1/orders/${created.body.id}/fulfill`).send({}).expect(201);
    return {
      id: created.body.id,
      number: created.body.number,
      lineId: created.body.lines[0].id,
      totalCents: created.body.totalCents,
    };
  }

  it('pickup return: authorization moves no money and no goods; receipt fires both', async () => {
    const order = await fulfilledPaidOrder(2);
    const perUnit = Math.round(order.totalCents / 2);

    const auth = await owner()
      .post(`/v1/orders/${order.id}/return`)
      .send({
        lines: [{ lineId: order.lineId, quantity: 1 }],
        fulfillment: 'pickup',
        reason: 'sagging',
      });
    expect(auth.status).toBe(201);
    // Nothing moved yet: full payment stands, nothing marked returned.
    expect(auth.body.paidCents).toBe(order.totalCents);
    expect(auth.body.lines[0].qtyReturned).toBe(0);

    const listed = await owner().get(`/v1/order-returns?orderId=${order.id}`);
    expect(listed.status).toBe(200);
    expect(listed.body.data).toHaveLength(1);
    const ret = listed.body.data[0];
    expect(ret.status).toBe('authorized');
    expect(ret.rmaNumber).toBe(`RMA-${order.number}-1`);
    expect(ret.amountCents).toBe(perUnit);
    expect(ret.lines[0].quantity).toBe(1);

    // The order now reads "Awaiting Return Pickup" on the list view.
    const lv = await owner().get('/v1/orders/list-view?limit=100');
    const row = lv.body.data.find((r: { id: string }) => r.id === order.id);
    expect(row.displayStatus).toBe('Awaiting Return Pickup');

    // Units on an open authorization are no longer returnable again.
    const over = await owner()
      .post(`/v1/orders/${order.id}/return`)
      .send({ lines: [{ lineId: order.lineId, quantity: 2 }], fulfillment: 'pickup' });
    expect(over.status).toBe(400);

    // No As-Is row yet.
    const queueBefore = await owner().get('/v1/as-is?status=pending_review');
    expect(
      queueBefore.body.data.filter(
        (r: { referenceId: string | null }) => r.referenceId === order.id,
      ),
    ).toHaveLength(0);

    // Goods received → refund row + As-Is + qtyReturned, return completed.
    await owner().post(`/v1/order-returns/${ret.id}/receive`).send({}).expect(201);
    const detail = await owner().get(`/v1/orders/${order.id}`);
    expect(detail.body.paidCents).toBe(order.totalCents - perUnit);
    expect(detail.body.lines[0].qtyReturned).toBe(1);
    const refundRow = detail.body.payments.find((p: { kind: string }) => p.kind === 'refund');
    expect(refundRow.amountCents).toBe(-perUnit);
    const queueAfter = await owner().get('/v1/as-is?status=pending_review');
    expect(
      queueAfter.body.data.filter(
        (r: { referenceId: string | null }) => r.referenceId === order.id,
      ),
    ).toHaveLength(1);
    const after = await owner().get(`/v1/order-returns?orderId=${order.id}`);
    expect(after.body.data[0].status).toBe('completed');
    expect(after.body.data[0].goodsReceivedAt).toBeTruthy();

    // Receiving twice is refused.
    await owner().post(`/v1/order-returns/${ret.id}/receive`).send({}).expect(409);
  });

  it('cancelling an authorized return frees the units and moves no money', async () => {
    const order = await fulfilledPaidOrder(1);
    const auth = await owner()
      .post(`/v1/orders/${order.id}/return`)
      .send({ lines: [{ lineId: order.lineId, quantity: 1 }], fulfillment: 'pickup' });
    expect(auth.status).toBe(201);
    const [ret] = (await owner().get(`/v1/order-returns?orderId=${order.id}`)).body.data;

    await owner()
      .post(`/v1/order-returns/${ret.id}/cancel`)
      .send({ reason: 'customer kept it' })
      .expect(201);
    const detail = await owner().get(`/v1/orders/${order.id}`);
    expect(detail.body.paidCents).toBe(order.totalCents);
    expect(detail.body.lines[0].qtyReturned).toBe(0);

    // The unit is returnable again (drop-off completes immediately).
    const again = await owner()
      .post(`/v1/orders/${order.id}/return`)
      .send({ lines: [{ lineId: order.lineId, quantity: 1 }] });
    expect(again.status).toBe(201);
    expect(again.body.lines[0].qtyReturned).toBe(1);
    expect(again.body.paidCents).toBe(0);
    // A cancelled and a completed return both carry order-scoped RMAs.
    const all = await owner().get(`/v1/order-returns?orderId=${order.id}`);
    expect(all.body.data.map((r: { rmaNumber: string }) => r.rmaNumber).sort()).toEqual([
      `RMA-${order.number}-1`,
      `RMA-${order.number}-2`,
    ]);
  });

  it('receiving is warehouse-gated: a cashier (no inventory.receive) is refused', async () => {
    const order = await fulfilledPaidOrder(1);
    await owner()
      .post(`/v1/orders/${order.id}/return`)
      .send({ lines: [{ lineId: order.lineId, quantity: 1 }], fulfillment: 'pickup' })
      .expect(201);
    const [ret] = (await owner().get(`/v1/order-returns?orderId=${order.id}`)).body.data;
    await as(cashierCookie).post(`/v1/order-returns/${ret.id}/receive`).send({}).expect(403);
  });
});

describe('Price variance 3-tier + §5 gates (PLAN-STORIS-GAP G6)', () => {
  let pvVariantId = '';

  function as(cookie: string) {
    return {
      post: (url: string) =>
        request(app.getHttpServer())
          .post(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
      get: (url: string) =>
        request(app.getHttpServer())
          .get(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
    };
  }

  beforeAll(async () => {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'G6-MATT', name: 'Variance Test Mattress' })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({
          businessId,
          productId: p!.id,
          sku: 'G6-MATT-Q',
          priceCents: 100_000,
          costCents: 60_000,
        })
        .returning();
      pvVariantId = v!.id;
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: pvVariantId,
        locationId,
        onHand: 50,
        reserved: 0,
      });
    } finally {
      await sql2.end({ timeout: 5 });
    }
  });

  function orderBody(unitPriceCents: number, extra: Record<string, unknown> = {}) {
    return {
      locationId,
      customerId,
      confirm: true,
      lines: [
        { variantId: pvVariantId, quantity: 1, unitPriceCents },
        // The recycling fee keeps the pass-through exception quiet here.
        { lineType: 'custom', description: 'Recycling Fee', quantity: 1, unitPriceCents: 1050 },
      ],
      ...extra,
    };
  }

  it('tier 1: a small discount sails through with no reason', async () => {
    const res = await as(cashierCookie).post('/v1/orders').send(orderBody(96_000));
    expect(res.status).toBe(201);
  });

  it('tier 2: a 10% discount needs a reason (REASON_REQUIRED), then passes', async () => {
    const refused = await as(cashierCookie).post('/v1/orders').send(orderBody(90_000));
    expect(refused.status).toBe(400);
    expect(refused.body.code).toBe('REASON_REQUIRED');

    const ok = await as(cashierCookie)
      .post('/v1/orders')
      .send(orderBody(90_000, { priceReason: 'competitor price match' }));
    expect(ok.status).toBe(201);

    const register = await as(ownerCookie).get('/v1/exceptions?type=price_override');
    expect(register.status).toBe(200);
    expect(register.body.data.length).toBeGreaterThan(0);
  });

  it('tier 3: a 30% discount from a cashier needs a manager override; below cost is critical', async () => {
    const refused = await as(cashierCookie)
      .post('/v1/orders')
      .send(orderBody(70_000, { priceReason: 'trying anyway' }));
    expect(refused.status).toBe(403);
    expect(refused.body.code).toBe('OVERRIDE_REQUIRED');
    expect(refused.body.permission).toBe('orders.price_override');

    const ok = await as(cashierCookie)
      .post('/v1/orders')
      .send(
        orderBody(50_000, {
          override: {
            email: 'owner@orders-test.local',
            password: PASSWORD,
            reason: 'clearance unit',
          },
        }),
      );
    expect(ok.status).toBe(201);

    // $500 < $600 cost → the exception is critical.
    const register = await as(ownerCookie).get(
      '/v1/exceptions?type=price_override&severity=critical',
    );
    expect(register.body.data.length).toBeGreaterThan(0);
    expect(register.body.data[0].summary).toMatch(/BELOW COST/);
  });

  it('the owner passes tier 3 directly with a reason (holds orders.price_override)', async () => {
    const res = await as(ownerCookie)
      .post('/v1/orders')
      .send(orderBody(70_000, { priceReason: 'floor model' }));
    expect(res.status).toBe(201);
  });

  it('layaway deposits below $100 need a manager; the exception is registered', async () => {
    const order = await as(ownerCookie)
      .post('/v1/orders')
      .send(orderBody(100_000, { orderKind: 'layaway' }));
    expect(order.status).toBe(201);

    const small = await as(cashierCookie)
      .post(`/v1/orders/${order.body.id}/payments`)
      .send({ method: 'cash', amountCents: 5_000 });
    expect(small.status).toBe(403);
    expect(small.body.code).toBe('OVERRIDE_REQUIRED');

    // The owner (orders.complete_with_balance) can open it small.
    await as(ownerCookie)
      .post(`/v1/orders/${order.body.id}/payments`)
      .send({ method: 'cash', amountCents: 5_000 })
      .expect(201);
    const register = await as(ownerCookie).get('/v1/exceptions?type=layaway_min_deposit_override');
    expect(register.body.data.length).toBeGreaterThan(0);
  });

  it('a qualifying order without the recycling fee registers the pass-through exception', async () => {
    const res = await as(ownerCookie)
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        confirm: true,
        lines: [{ variantId: pvVariantId, quantity: 1 }],
      });
    expect(res.status).toBe(201);
    const register = await as(ownerCookie).get('/v1/exceptions?type=recycling_fee_removed');
    expect(
      register.body.data.some((e: { entityId: string | null }) => e.entityId === res.body.id),
    ).toBe(true);
  });
});

describe('Print preconditions + reprint counter + unlock expiry (PLAN-STORIS-GAP G9)', () => {
  function as(cookie: string) {
    return {
      post: (url: string) =>
        request(app.getHttpServer())
          .post(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
      patch: (url: string) =>
        request(app.getHttpServer())
          .patch(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
      get: (url: string) =>
        request(app.getHttpServer())
          .get(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
    };
  }

  async function makeOrder(over: Record<string, unknown> = {}): Promise<{
    id: string;
    number: string;
    totalCents: number;
  }> {
    const res = await as(ownerCookie)
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        confirm: true,
        fulfillmentType: 'pickup',
        requestedDate: '2026-10-01',
        lines: [{ variantId: sofaVariantId, quantity: 1 }],
        ...over,
      });
    expect(res.status).toBe(201);
    return res.body;
  }

  it('a delivery order with no scheduled trip cannot print — checklist names why', async () => {
    const order = await makeOrder({ fulfillmentType: 'delivery', requestedDate: null });
    const res = await as(ownerCookie).post(`/v1/orders/${order.id}/delivery-ticket-print`).send({});
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PRINT_BLOCKED');
    const failed = res.body.checks.filter((c: { ok: boolean }) => !c.ok);
    expect(failed.map((c: { check: string }) => c.check)).toContain('scheduled_date');
  });

  it('the balance cap blocks the ticket for a cashier; a manager releases it', async () => {
    await as(ownerCookie)
      .patch('/v1/business/settings')
      .send({ ops: { maxBalanceForTicketPrintCents: 1000 } })
      .expect(200);
    try {
      const order = await makeOrder();
      // Fully unpaid — way over the $10 cap.
      const refused = await as(cashierCookie)
        .post(`/v1/orders/${order.id}/delivery-ticket-print`)
        .send({});
      expect(refused.status).toBe(403);
      expect(refused.body.code).toBe('OVERRIDE_REQUIRED');
      expect(refused.body.permission).toBe('orders.complete_with_balance');

      // The owner holds the permission — the ticket releases.
      const ok = await as(ownerCookie)
        .post(`/v1/orders/${order.id}/delivery-ticket-print`)
        .send({});
      expect(ok.status).toBe(201);
      expect(ok.body.copyNumber).toBe(1);
    } finally {
      await as(ownerCookie)
        .patch('/v1/business/settings')
        .send({ ops: { maxBalanceForTicketPrintCents: null } })
        .expect(200);
    }
  });

  it('reprints count copies and land on the exception register', async () => {
    const order = await makeOrder();
    await as(ownerCookie)
      .post(`/v1/orders/${order.id}/payments`)
      .send({ method: 'cash', amountCents: order.totalCents })
      .expect(201);
    const first = await as(ownerCookie)
      .post(`/v1/orders/${order.id}/delivery-ticket-print`)
      .send({});
    expect(first.status).toBe(201);
    expect(first.body.copyNumber).toBe(1);
    const second = await as(ownerCookie)
      .post(`/v1/orders/${order.id}/delivery-ticket-print`)
      .send({});
    expect(second.body.copyNumber).toBe(2);
    const reprints = await as(ownerCookie).get('/v1/exceptions?type=ticket_reprint');
    expect(
      reprints.body.data.some((e: { entityId: string | null }) => e.entityId === order.id),
    ).toBe(true);
  });

  it('an unlock is a 15-minute window — past it the lock re-engages', async () => {
    const order = await makeOrder();
    await as(ownerCookie).post(`/v1/orders/${order.id}/delivery-ticket-print`).send({}).expect(201);
    await as(ownerCookie)
      .post(`/v1/orders/${order.id}/unlock`)
      .send({ reason: 'fix a size' })
      .expect(201);
    // Inside the window guarded edits work.
    await as(ownerCookie)
      .patch(`/v1/orders/${order.id}`)
      .send({ requestedDate: '2026-10-02' })
      .expect(200);

    // Simulate the window passing.
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      await db
        .update(schema.orders)
        .set({ relockAt: new Date(Date.now() - 60_000) })
        .where(eq(schema.orders.id, order.id));
    } finally {
      await sql2.end({ timeout: 5 });
    }
    const relocked = await as(ownerCookie)
      .patch(`/v1/orders/${order.id}`)
      .send({ requestedDate: '2026-10-03' });
    expect(relocked.status).toBe(409);
    expect(relocked.body.message).toMatch(/re-engaged/);
    // A fresh unlock (with reason) reopens the window.
    await as(ownerCookie)
      .post(`/v1/orders/${order.id}/unlock`)
      .send({ reason: 'still fixing' })
      .expect(201);
    await as(ownerCookie)
      .patch(`/v1/orders/${order.id}`)
      .send({ requestedDate: '2026-10-04' })
      .expect(200);
  });
});

describe('Line roll-up, Past Due, auto stock release, drift, duplicate prompt (PLAN-STORIS-GAP G13+G14)', () => {
  let g13VariantId = '';

  beforeAll(async () => {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'G13-BED', name: 'Rollup Fixture Bed' })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({ businessId, productId: p!.id, sku: 'G13-BED-V1', priceCents: 40000 })
        .returning();
      g13VariantId = v!.id;
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: g13VariantId,
        locationId,
        onHand: 50,
        reserved: 0,
      });
    } finally {
      await sql2.end({ timeout: 5 });
    }
  });

  function as(cookie: string) {
    return {
      post: (url: string) =>
        request(app.getHttpServer())
          .post(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
      get: (url: string) =>
        request(app.getHttpServer())
          .get(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
    };
  }

  it('the list view rolls up line state and filters Past Due', async () => {
    const created = await as(ownerCookie)
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        confirm: true,
        fulfillmentType: 'delivery',
        requestedDate: '2020-01-15', // long past due
        lines: [
          { variantId: g13VariantId, quantity: 2 },
          { variantId: g13VariantId, quantity: 1, lineType: 'special_order' },
        ],
      });
    expect(created.status).toBe(201);

    const pastDue = await as(ownerCookie).get('/v1/orders/list-view?view=past_due&limit=100');
    expect(pastDue.status).toBe(200);
    const row = pastDue.body.data.find((r: { id: string }) => r.id === created.body.id);
    expect(row).toBeTruthy();
    // 3 units total, 2 reserved (the SO line reserves nothing), 1 SO.
    expect(row.lineSummary).toMatchObject({ units: 3, reserved: 2, specialOrder: 1 });

    // The default view also carries the roll-up.
    const all = await as(ownerCookie).get('/v1/orders/list-view?limit=100');
    const same = all.body.data.find((r: { id: string }) => r.id === created.body.id);
    expect(same.lineSummary.units).toBe(3);
  });

  it('auto stock release frees reservations on stale orders and registers each', async () => {
    const created = await as(ownerCookie)
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        confirm: true,
        fulfillmentType: 'delivery',
        requestedDate: '2020-02-01',
        lines: [{ variantId: g13VariantId, quantity: 1 }],
      });
    expect(created.status).toBe(201);
    expect(created.body.lines[0].qtyReserved).toBe(1);

    // Dry run reports without touching anything.
    const dry = await as(ownerCookie)
      .post('/v1/orders/auto-stock-release')
      .send({ days: 30, dryRun: true });
    expect(dry.status).toBe(201);
    expect(dry.body.dryRun).toBe(true);
    expect(dry.body.released.some((r: { id: string }) => r.id === created.body.id)).toBe(true);
    const still = await as(ownerCookie).get(`/v1/orders/${created.body.id}`);
    expect(still.body.lines[0].qtyReserved).toBe(1);

    // The real run releases and registers.
    const run = await as(ownerCookie).post('/v1/orders/auto-stock-release').send({ days: 30 });
    expect(run.status).toBe(201);
    expect(run.body.released.some((r: { id: string }) => r.id === created.body.id)).toBe(true);
    const after = await as(ownerCookie).get(`/v1/orders/${created.body.id}`);
    expect(after.body.lines[0].qtyReserved).toBe(0);
    const register = await as(ownerCookie).get('/v1/exceptions?type=auto_stock_release');
    expect(
      register.body.data.some((e: { entityId: string | null }) => e.entityId === created.body.id),
    ).toBe(true);
  });

  it('reservation drift shows up on the reconciliation report', async () => {
    const clean = await as(ownerCookie).get('/v1/orders/reservation-drift');
    expect(clean.status).toBe(200);

    // Introduce drift by hand: bump the level's reserved without an order.
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      await db
        .update(schema.inventoryLevels)
        .set({ reserved: sql`${schema.inventoryLevels.reserved} + 5` })
        .where(
          and(
            eq(schema.inventoryLevels.variantId, g13VariantId),
            eq(schema.inventoryLevels.locationId, locationId),
          ),
        );
      const drifted = await as(ownerCookie).get('/v1/orders/reservation-drift');
      expect(drifted.status).toBe(200);
      const hit = drifted.body.find(
        (r: { variantId: string; locationId: string }) =>
          r.variantId === g13VariantId && r.locationId === locationId,
      );
      expect(hit).toBeTruthy();
      expect(hit.driftUnits).toBe(-5);
    } finally {
      await db
        .update(schema.inventoryLevels)
        .set({ reserved: sql`${schema.inventoryLevels.reserved} - 5` })
        .where(
          and(
            eq(schema.inventoryLevels.variantId, g13VariantId),
            eq(schema.inventoryLevels.locationId, locationId),
          ),
        );
      await sql2.end({ timeout: 5 });
    }
  });

  it('open-orders summary powers the duplicate-order prompt', async () => {
    const created = await as(ownerCookie)
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        confirm: true,
        fulfillmentType: 'delivery',
        requestedDate: '2027-08-01',
        lines: [{ variantId: g13VariantId, quantity: 1 }],
      });
    expect(created.status).toBe(201);
    const open = await as(ownerCookie).get(`/v1/customers/${customerId}/open-orders`);
    expect(open.status).toBe(200);
    const hit = open.body.find((o: { id: string }) => o.id === created.body.id);
    expect(hit).toBeTruthy();
    expect(hit.requestedDate).toBe('2027-08-01');
  });
});

describe('B14 — delivery-date reservation basis + pending allocation', () => {
  let allocVariantId = '';
  let orderEarly = { id: '', number: '' }; // later-created, EARLIER delivery
  let orderLate = { id: '', number: '' }; // earlier-created, LATER delivery

  beforeAll(async () => {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      const [prod] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'ALLOC-1', name: 'Allocation Fixture Mattress' })
        .returning();
      const [variant] = await db
        .insert(schema.productVariants)
        .values({ businessId, productId: prod!.id, sku: 'ALLOC-1-V', priceCents: 49900 })
        .returning();
      allocVariantId = variant!.id;
      // Deliberately NO inventory level: both orders confirm under-reserved.
    } finally {
      await sql2.end({ timeout: 5 });
    }
  });

  async function makePendingOrder(deliveryDate: string, quantity: number) {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        confirm: true,
        fulfillmentType: 'pickup',
        requestedDate: deliveryDate,
        lines: [{ variantId: allocVariantId, quantity, deliveryDate }],
      });
    expect(res.status).toBe(201);
    expect(res.body.lines[0].qtyReserved).toBe(0);
    return { id: res.body.id as string, number: res.body.number as string };
  }

  it('Confirmed orders with no stock sit under-reserved (Pending)', async () => {
    orderLate = await makePendingOrder('2026-09-20', 2);
    orderEarly = await makePendingOrder('2026-09-05', 2);
  });

  it('Dry run ranks the earlier DELIVERY date first and moves nothing', async () => {
    await request(app.getHttpServer())
      .post('/v1/inventory/adjust')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ variantId: allocVariantId, locationId, delta: 3, reason: 'count_correction' })
      .expect(201);

    const dry = await request(app.getHttpServer())
      .post('/v1/orders/allocate-pending')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ dryRun: true });
    expect(dry.status).toBe(201);
    expect(dry.body.basis).toBe('delivery_date');
    expect(dry.body.dryRun).toBe(true);
    const mine = (dry.body.allocated as { orderId: string; units: number }[]).filter(
      (a) => a.orderId === orderEarly.id || a.orderId === orderLate.id,
    );
    expect(mine[0]!.orderId).toBe(orderEarly.id);
    expect(mine[0]!.units).toBe(2);
    expect(mine[1]!.orderId).toBe(orderLate.id);
    expect(mine[1]!.units).toBe(1);

    const level = await levelOf(allocVariantId);
    expect(level.reserved).toBe(0);
  });

  it('Real run reserves earliest delivery fully, later delivery gets the remainder', async () => {
    const run = await request(app.getHttpServer())
      .post('/v1/orders/allocate-pending')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({});
    expect(run.status).toBe(201);

    const early = await request(app.getHttpServer())
      .get(`/v1/orders/${orderEarly.id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(early.body.lines[0].qtyReserved).toBe(2);
    const late = await request(app.getHttpServer())
      .get(`/v1/orders/${orderLate.id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(late.body.lines[0].qtyReserved).toBe(1);
    expect((await levelOf(allocVariantId)).reserved).toBe(3);
  });

  it('order_date basis hands scarce stock to the first order written instead', async () => {
    await request(app.getHttpServer())
      .patch('/v1/business/settings')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ ops: { reserveBasis: 'order_date' } })
      .expect(200);

    await request(app.getHttpServer())
      .post('/v1/inventory/adjust')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ variantId: allocVariantId, locationId, delta: 1, reason: 'count_correction' })
      .expect(201);

    // orderLate was written FIRST and still needs 1 — under order_date it wins.
    const run = await request(app.getHttpServer())
      .post('/v1/orders/allocate-pending')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({});
    expect(run.status).toBe(201);
    expect(run.body.basis).toBe('order_date');
    const late = await request(app.getHttpServer())
      .get(`/v1/orders/${orderLate.id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(late.body.lines[0].qtyReserved).toBe(2);

    // Restore the owner default for any later suites.
    await request(app.getHttpServer())
      .patch('/v1/business/settings')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ ops: { reserveBasis: 'delivery_date' } })
      .expect(200);
  });

  it('PO receiving backfills a pending line automatically', async () => {
    const pending = await makePendingOrder('2026-09-25', 1);

    const vendor = await request(app.getHttpServer())
      .post('/v1/vendors')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Alloc Vendor' });
    expect(vendor.status).toBe(201);
    const po = await request(app.getHttpServer())
      .post('/v1/purchase-orders')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        vendorId: vendor.body.id,
        locationId,
        lines: [{ variantId: allocVariantId, quantity: 1, unitCostCents: 20000 }],
      });
    expect(po.status).toBe(201);
    const lineId = po.body.lines[0].id as string;

    const received = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${po.body.id}/receive`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId, quantity: 1 }] });
    expect(received.status).toBe(201);

    const after = await request(app.getHttpServer())
      .get(`/v1/orders/${pending.id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(after.body.lines[0].qtyReserved).toBe(1);
  });
});

describe('Return windows + no-original returns (FAQ I4, I1/I8)', () => {
  let rwVariantId = '';

  function as(cookie: string) {
    return {
      post: (url: string) =>
        request(app.getHttpServer())
          .post(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
      patch: (url: string) =>
        request(app.getHttpServer())
          .patch(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
      get: (url: string) =>
        request(app.getHttpServer())
          .get(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
    };
  }

  async function withDb<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      return await fn(drizzle(sql2));
    } finally {
      await sql2.end({ timeout: 5 });
    }
  }

  beforeAll(async () => {
    await withDb(async (db) => {
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'RW-BED', name: 'Window Fixture Bed' })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({ businessId, productId: p!.id, sku: 'RW-BED-V1', priceCents: 50000 })
        .returning();
      rwVariantId = v!.id;
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: rwVariantId,
        locationId,
        onHand: 20,
        reserved: 0,
      });
      // The system Cashier role has no refund permission; this business
      // grants it so the window control (not the endpoint gate) is what
      // the cashier hits.
      const [cashierRole] = await db
        .select({ id: schema.roles.id })
        .from(schema.roles)
        .where(and(eq(schema.roles.businessId, businessId), eq(schema.roles.name, 'Cashier')));
      await db
        .insert(schema.rolePermissions)
        .values({ roleId: cashierRole!.id, permission: 'pos.refund.create' })
        .onConflictDoNothing();
    });
  });

  async function fulfilledPaidOrder(): Promise<{ id: string; lineId: string }> {
    const created = await as(ownerCookie)
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        fulfillmentType: 'pickup',
        confirm: true,
        lines: [{ variantId: rwVariantId, quantity: 1 }],
      });
    expect(created.status).toBe(201);
    const pay = await as(ownerCookie)
      .post(`/v1/orders/${created.body.id}/payments`)
      .send({ method: 'cash', amountCents: created.body.totalCents });
    expect(pay.status).toBe(201);
    const ful = await as(ownerCookie).post(`/v1/orders/${created.body.id}/fulfill`).send({});
    expect(ful.status).toBe(201);
    return { id: created.body.id, lineId: created.body.lines[0].id };
  }

  async function backdate(orderId: string, days: number): Promise<void> {
    const past = new Date(Date.now() - days * 86_400_000);
    await withDb((db) =>
      db
        .update(schema.orders)
        .set({ createdAt: past, completedAt: past })
        .where(eq(schema.orders.id, orderId)),
    );
  }

  it('settings: returnWindowDays validates (0 rejected) and saves', async () => {
    const bad = await as(ownerCookie)
      .patch('/v1/business/settings')
      .send({ ops: { returnWindowDays: 0 } });
    expect(bad.status).toBe(400);

    const ok = await as(ownerCookie)
      .patch('/v1/business/settings')
      .send({ ops: { returnWindowDays: 30 } });
    expect(ok.status).toBe(200);
  });

  it('inside the window a cashier returns with no override', async () => {
    const order = await fulfilledPaidOrder();
    const res = await as(cashierCookie)
      .post(`/v1/orders/${order.id}/return`)
      .send({
        lines: [{ lineId: order.lineId, quantity: 1 }],
        refundMethod: 'original',
        reason: 'sagging',
      });
    expect(res.status).toBe(201);
  });

  it('outside the window: OVERRIDE_REQUIRED for a cashier, manager credentials pass, owner passes silently', async () => {
    const order = await fulfilledPaidOrder();
    await backdate(order.id, 60);

    const refused = await as(cashierCookie)
      .post(`/v1/orders/${order.id}/return`)
      .send({
        lines: [{ lineId: order.lineId, quantity: 1 }],
        refundMethod: 'original',
        reason: 'late return',
      });
    expect(refused.status).toBe(403);
    expect(refused.body.code).toBe('OVERRIDE_REQUIRED');
    expect(refused.body.permission).toBe('returns.override_window');

    const approved = await as(cashierCookie)
      .post(`/v1/orders/${order.id}/return`)
      .send({
        lines: [{ lineId: order.lineId, quantity: 1 }],
        refundMethod: 'original',
        reason: 'late return',
        override: {
          email: 'owner@orders-test.local',
          password: PASSWORD,
          reason: 'goodwill exception',
        },
      });
    expect(approved.status).toBe(201);

    await withDb(async (db) => {
      const overrides = await db
        .select()
        .from(schema.securityOverrides)
        .where(eq(schema.securityOverrides.permission, 'returns.override_window'));
      expect(overrides).toHaveLength(1);
    });

    // The owner holds returns.override_window — no dialog, no register row.
    const order2 = await fulfilledPaidOrder();
    await backdate(order2.id, 60);
    const direct = await as(ownerCookie)
      .post(`/v1/orders/${order2.id}/return`)
      .send({
        lines: [{ lineId: order2.lineId, quantity: 1 }],
        refundMethod: 'original',
        reason: 'late return',
      });
    expect(direct.status).toBe(201);
    await withDb(async (db) => {
      const overrides = await db
        .select()
        .from(schema.securityOverrides)
        .where(eq(schema.securityOverrides.permission, 'returns.override_window'));
      expect(overrides).toHaveLength(1);
    });
  });

  it('no-original return: gated, store-credit only, goods to As-Is, exception logged', async () => {
    const stockBefore = await levelOf(rwVariantId);

    const refused = await as(cashierCookie)
      .post('/v1/order-returns/no-original')
      .send({
        customerId,
        locationId,
        referencedOrderNumber: 'STORIS-123456',
        lines: [{ variantId: rwVariantId, quantity: 1, unitRefundCents: 5000 }],
      });
    expect(refused.status).toBe(403);
    expect(refused.body.code).toBe('OVERRIDE_REQUIRED');
    expect(refused.body.permission).toBe('returns.no_original');

    const done = await as(cashierCookie)
      .post('/v1/order-returns/no-original')
      .send({
        customerId,
        locationId,
        referencedOrderNumber: 'STORIS-123456',
        reason: 'pre-cutover sale, no invoice found',
        lines: [{ variantId: rwVariantId, quantity: 1, unitRefundCents: 5000 }],
        override: {
          email: 'owner@orders-test.local',
          password: PASSWORD,
          reason: 'verified with bank statement',
        },
      });
    expect(done.status).toBe(201);
    expect(done.body.rmaNumber).toBe('RMA-NOORIG-1');
    expect(done.body.status).toBe('completed');
    expect(done.body.refundMethod).toBe('store_credit');
    expect(done.body.amountCents).toBe(5000);
    expect(done.body.orderId).toBeNull();

    await withDb(async (db) => {
      const credits = await db
        .select()
        .from(schema.storeCreditEntries)
        .where(eq(schema.storeCreditEntries.referenceId, done.body.id));
      expect(credits).toHaveLength(1);
      expect(credits[0]!.deltaCents).toBe(5000);

      const pieces = await db
        .select()
        .from(schema.asIsItems)
        .where(eq(schema.asIsItems.referenceId, done.body.id));
      expect(pieces).toHaveLength(1);
      expect(pieces[0]!.source).toBe('return');

      const events = await db
        .select()
        .from(schema.exceptionEvents)
        .where(eq(schema.exceptionEvents.type, 'no_original_return'));
      expect(events).toHaveLength(1);
      expect(events[0]!.summary).toMatch(/STORIS-123456/);
    });

    // As-Is intake, never straight to sellable stock.
    expect((await levelOf(rwVariantId)).onHand).toBe(stockBefore.onHand);

    // The register lists it with its claimed number.
    const list = await as(ownerCookie).get('/v1/order-returns');
    expect(list.status).toBe(200);
    const row = (
      list.body.data as { rmaNumber: string; referencedOrderNumber: string | null }[]
    ).find((r) => r.rmaNumber === 'RMA-NOORIG-1');
    expect(row?.referencedOrderNumber).toBe('STORIS-123456');

    const invalid = await as(ownerCookie)
      .post('/v1/order-returns/no-original')
      .send({
        customerId,
        locationId,
        lines: [{ variantId: rwVariantId, quantity: 0, unitRefundCents: 100 }],
      });
    expect(invalid.status).toBe(400);
  });
});

describe('FIFO COGS — fulfillment consumes layers, pre-costing stock synthesizes opening layers', () => {
  let fifoVariantId = '';

  async function withDb2<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      return await fn(drizzle(sql2));
    } finally {
      await sql2.end({ timeout: 5 });
    }
  }

  function asOwner() {
    return {
      post: (url: string) =>
        request(app.getHttpServer())
          .post(url)
          .set('Cookie', ownerCookie)
          .set('X-Business-Id', businessId),
    };
  }

  async function fulfillOne(quantity: number): Promise<string> {
    const created = await asOwner()
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        fulfillmentType: 'pickup',
        confirm: true,
        lines: [{ variantId: fifoVariantId, quantity }],
      });
    expect(created.status).toBe(201);
    const pay = await asOwner()
      .post(`/v1/orders/${created.body.id}/payments`)
      .send({ method: 'cash', amountCents: created.body.totalCents });
    expect(pay.status).toBe(201);
    const ful = await asOwner().post(`/v1/orders/${created.body.id}/fulfill`).send({});
    expect(ful.status).toBe(201);
    return created.body.id as string;
  }

  it('pre-costing stock: fulfilling synthesizes a fully-consumed opening layer at catalog cost', async () => {
    fifoVariantId = await withDb2(async (db) => {
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'COGS-BED', name: 'COGS Fixture Bed' })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({
          businessId,
          productId: p!.id,
          sku: 'COGS-BED-V1',
          priceCents: 80000,
          costCents: 30000,
        })
        .returning();
      // Stock exists but predates costing — no layers.
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: v!.id,
        locationId,
        onHand: 10,
        reserved: 0,
      });
      return v!.id;
    });

    const orderId = await fulfillOne(2);

    await withDb2(async (db) => {
      const layers = await db
        .select()
        .from(schema.costLayers)
        .where(eq(schema.costLayers.variantId, fifoVariantId));
      expect(layers).toHaveLength(1);
      expect(layers[0]!.sourceType).toBe('opening');
      expect(layers[0]!.unitCostCents).toBe(30000);
      expect(layers[0]!.quantityReceived).toBe(2);
      expect(layers[0]!.quantityRemaining).toBe(0);

      const consumptions = await db
        .select()
        .from(schema.costConsumptions)
        .where(eq(schema.costConsumptions.layerId, layers[0]!.id));
      expect(consumptions).toHaveLength(1);
      expect(consumptions[0]!.quantity).toBe(2);
      expect(consumptions[0]!.unitCostCents).toBe(30000);
      expect(consumptions[0]!.referenceType).toBe('order_fulfill');
      expect(consumptions[0]!.referenceId).toBe(orderId);
    });
  });

  it('layered stock is consumed FIFO before any new synthesis', async () => {
    // A real receipt creates a layer; the next fulfillment eats it.
    const recv = await asOwner()
      .post('/v1/inventory/receive')
      .send({ locationId, lines: [{ variantId: fifoVariantId, quantity: 5 }] });
    expect(recv.status).toBe(201);

    await fulfillOne(3);

    await withDb2(async (db) => {
      const layers = await db
        .select()
        .from(schema.costLayers)
        .where(
          and(
            eq(schema.costLayers.variantId, fifoVariantId),
            eq(schema.costLayers.sourceType, 'receive'),
          ),
        );
      expect(layers).toHaveLength(1);
      expect(layers[0]!.unitCostCents).toBe(30000); // catalog cost fallback
      expect(layers[0]!.quantityRemaining).toBe(2); // 5 received − 3 fulfilled

      // No second opening layer was needed.
      const opening = await db
        .select()
        .from(schema.costLayers)
        .where(
          and(
            eq(schema.costLayers.variantId, fifoVariantId),
            eq(schema.costLayers.sourceType, 'opening'),
          ),
        );
      expect(opening).toHaveLength(1);
    });
  });

  it('a zero-cost consumption raises the C9 zero_cost_layer exception', async () => {
    const bareVariantId = await withDb2(async (db) => {
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'NOCOST', name: 'No Cost Fixture' })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({ businessId, productId: p!.id, sku: 'NOCOST-V1', priceCents: 10000 })
        .returning();
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: v!.id,
        locationId,
        onHand: 4,
        reserved: 0,
      });
      return v!.id;
    });

    const created = await asOwner()
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        fulfillmentType: 'pickup',
        confirm: true,
        lines: [{ variantId: bareVariantId, quantity: 1 }],
      });
    expect(created.status).toBe(201);
    await asOwner()
      .post(`/v1/orders/${created.body.id}/payments`)
      .send({ method: 'cash', amountCents: created.body.totalCents })
      .expect(201);
    await asOwner().post(`/v1/orders/${created.body.id}/fulfill`).send({}).expect(201);

    await withDb2(async (db) => {
      const events = await db
        .select()
        .from(schema.exceptionEvents)
        .where(
          and(
            eq(schema.exceptionEvents.type, 'zero_cost_layer'),
            eq(schema.exceptionEvents.entityId, bareVariantId),
          ),
        );
      expect(events.length).toBeGreaterThan(0);
    });
  });
});

describe('Fulfill-from stock location + my-orders filter', () => {
  let warehouseId = '';
  let wVariantId = '';

  beforeAll(async () => {
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const [wh] = await db
        .insert(schema.locations)
        .values({
          businessId,
          name: 'Central Warehouse',
          timezone: 'America/New_York',
          taxRateBps: 0,
          locationType: 'warehouse',
        })
        .returning();
      warehouseId = wh!.id;
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'WH-ONLY', name: 'Warehouse-only King' })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({ businessId, productId: p!.id, sku: 'WH-ONLY-1', priceCents: 50_000 })
        .returning();
      wVariantId = v!.id;
      // Stock ONLY at the warehouse — the showroom has none.
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: wVariantId,
        locationId: warehouseId,
        onHand: 5,
        reserved: 0,
      });
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  async function levelAt(variantId: string, locId: string) {
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const [row] = await db
        .select()
        .from(schema.inventoryLevels)
        .where(
          and(
            eq(schema.inventoryLevels.variantId, variantId),
            eq(schema.inventoryLevels.locationId, locId),
          ),
        );
      return { onHand: row?.onHand ?? 0, reserved: row?.reserved ?? 0 };
    } finally {
      await sql.end({ timeout: 5 });
    }
  }

  let whOrderId = '';

  it('order sold at the showroom reserves at the warehouse when stockLocationId says so', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        stockLocationId: warehouseId,
        customerId,
        fulfillmentType: 'delivery',
        confirm: true,
        lines: [{ variantId: wVariantId, quantity: 2 }],
      });
    expect(res.status).toBe(201);
    whOrderId = res.body.id;
    expect(res.body.stockLocationId).toBe(warehouseId);

    const wh = await levelAt(wVariantId, warehouseId);
    expect(wh.reserved).toBe(2);
    const store = await levelAt(wVariantId, locationId);
    expect(store.reserved).toBe(0);
  });

  it('stockLocationId cannot move while units are reserved; release frees it', async () => {
    const blocked = await request(app.getHttpServer())
      .patch(`/v1/orders/${whOrderId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ stockLocationId: null });
    expect(blocked.status).toBe(400);
    expect(blocked.body.message).toMatch(/release/i);

    await request(app.getHttpServer())
      .post(`/v1/orders/${whOrderId}/release`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .expect(201);
    expect((await levelAt(wVariantId, warehouseId)).reserved).toBe(0);

    const moved = await request(app.getHttpServer())
      .patch(`/v1/orders/${whOrderId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ stockLocationId: null });
    expect(moved.status).toBe(200);

    // Re-point back at the warehouse and re-reserve for the fulfill test.
    await request(app.getHttpServer())
      .patch(`/v1/orders/${whOrderId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ stockLocationId: warehouseId })
      .expect(200);
    await request(app.getHttpServer())
      .post(`/v1/orders/${whOrderId}/reserve`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .expect(201);
    expect((await levelAt(wVariantId, warehouseId)).reserved).toBe(2);
  });

  it('fulfillment consumes warehouse stock, never the showroom', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${whOrderId}/fulfill`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({});
    expect(res.status).toBe(201);

    const wh = await levelAt(wVariantId, warehouseId);
    expect(wh.onHand).toBe(3);
    expect(wh.reserved).toBe(0);
    const store = await levelAt(wVariantId, locationId);
    expect(store.onHand).toBe(0);
    expect(store.reserved).toBe(0);
  });

  it('mine=1 returns only orders credited to the caller, on both list endpoints', async () => {
    // Cashier writes an order — salesperson defaults to their membership.
    const mineRes = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        fulfillmentType: 'take_with',
        lines: [{ variantId: sofaVariantId, quantity: 1 }],
      });
    expect(mineRes.status).toBe(201);
    const cashierOrderId = mineRes.body.id as string;

    const cashierMine = await request(app.getHttpServer())
      .get('/v1/orders?mine=1&limit=50')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(cashierMine.status).toBe(200);
    const cashierIds = cashierMine.body.data.map((o: { id: string }) => o.id);
    expect(cashierIds).toContain(cashierOrderId);
    expect(cashierIds).not.toContain(whOrderId);

    const ownerMine = await request(app.getHttpServer())
      .get('/v1/orders?mine=1&limit=50')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const ownerIds = ownerMine.body.data.map((o: { id: string }) => o.id);
    expect(ownerIds).toContain(whOrderId);
    expect(ownerIds).not.toContain(cashierOrderId);

    const listView = await request(app.getHttpServer())
      .get('/v1/orders/list-view?mine=1&limit=50')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(listView.status).toBe(200);
    const lvIds = listView.body.data.map((o: { id: string }) => o.id);
    expect(lvIds).toContain(cashierOrderId);
    expect(lvIds).not.toContain(whOrderId);
  });
});
