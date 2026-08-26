/**
 * Day 3 acceptance (STORIS cutover sprint): a confirmed order is
 * scheduled onto a truck, the truck delivers, and that moment — not
 * before — stock leaves: on-hand drops, the reservation is consumed, the
 * line's fulfilled count rises, and the order advances to fulfilled.
 * Collecting the balance and completing closes the book; the drawer and
 * the daily report pick up the order money next to sale money (D2).
 *
 * Also the guard rails: double-booking units already on a truck, quotes
 * on trucks, completing with a balance due (permission-gated), and a
 * failed delivery moving nothing.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';

const TEST_DB_URL =
  process.env.DELIVERIES_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_deliveries';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'DeliverPass!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let customerId = '';
/** Mattress: 10 on hand, $1,000 flat, taxRate 0 for round numbers. */
let mattressVariantId = '';
let ownerCookie = '';

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
      .values({ slug: 'deliveries-test', name: 'Deliveries Test Co', status: 'active' })
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

    const [u] = await db
      .insert(schema.users)
      .values({ email: 'owner@deliveries-test.local', emailVerified: true, name: 'Owner' })
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
      roleId: roles.get('Owner')!,
      status: 'active',
      acceptedAt: new Date(),
    });

    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Warehouse', timezone: 'America/Los_Angeles', taxRateBps: 0 })
      .returning();
    locationId = loc!.id;

    const [cust] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Robin', lastName: 'Ng', email: 'robin@example.test' })
      .returning();
    customerId = cust!.id;

    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'MAT', name: 'Cloud Mattress' })
      .returning();
    const [v] = await db
      .insert(schema.productVariants)
      .values({ businessId, productId: p!.id, sku: 'MAT-Q', priceCents: 100_000 })
      .returning();
    mattressVariantId = v!.id;
    await db.insert(schema.inventoryLevels).values({
      businessId,
      variantId: v!.id,
      locationId,
      onHand: 10,
      reserved: 0,
    });
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

async function level(): Promise<{ onHand: number; reserved: number }> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    const [row] = await db
      .select()
      .from(schema.inventoryLevels)
      .where(
        and(
          eq(schema.inventoryLevels.variantId, mattressVariantId),
          eq(schema.inventoryLevels.locationId, locationId),
        ),
      );
    return { onHand: row?.onHand ?? 0, reserved: row?.reserved ?? 0 };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

function ownerReq() {
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
    patch: (url: string) =>
      request(app.getHttpServer())
        .patch(url)
        .set('Cookie', ownerCookie)
        .set('X-Business-Id', businessId),
  };
}

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'deliveries-test-secret-deliveries-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  ownerCookie = await captureCookie('owner@deliveries-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Day 3 — deliveries: schedule, deliver, collect, complete', () => {
  let orderId = '';
  let deliveryId = '';
  const today = new Date().toISOString().slice(0, 10);

  it('writes and confirms a 2-mattress order with a deposit', async () => {
    const res = await ownerReq()
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        fulfillmentType: 'delivery',
        address: { line1: '9 Pier Ave', city: 'Santa Monica', region: 'CA', postalCode: '90401' },
        lines: [{ variantId: mattressVariantId, quantity: 2 }],
        confirm: true,
      });
    expect(res.status).toBe(201);
    orderId = res.body.id;
    expect(res.body.status).toBe('open');
    expect(res.body.totalCents).toBe(200_000);

    const dep = await ownerReq()
      .post(`/v1/orders/${orderId}/payments`)
      .send({ method: 'cash', amountCents: 50_000 });
    expect(dep.status).toBe(201);
    expect(dep.body.paidCents).toBe(50_000);
    expect(dep.body.balanceDueCents).toBe(150_000);

    expect(await level()).toEqual({ onHand: 10, reserved: 2 });
  });

  it('refuses to schedule a quote', async () => {
    const quote = await ownerReq()
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        lines: [{ variantId: mattressVariantId, quantity: 1 }],
      });
    expect(quote.status).toBe(201);
    const res = await ownerReq()
      .post(`/v1/orders/${quote.body.id}/deliveries`)
      .send({ scheduledDate: today });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Confirm the order/);
  });

  it('schedules the whole order onto a truck (default lines)', async () => {
    const res = await ownerReq()
      .post(`/v1/orders/${orderId}/deliveries`)
      .send({ scheduledDate: today, windowStart: '09:00', windowEnd: '12:00' });
    expect(res.status).toBe(201);
    deliveryId = res.body.id;
    expect(res.body.status).toBe('scheduled');
    expect(res.body.orderNumber).toMatch(/^SO-/);
    expect(res.body.lines).toHaveLength(1);
    expect(res.body.lines[0].quantity).toBe(2);
    expect(res.body.balanceDueCents).toBe(150_000);
    // Scheduling moves no stock.
    expect(await level()).toEqual({ onHand: 10, reserved: 2 });
  });

  it('refuses to double-book units already on that truck', async () => {
    const res = await ownerReq()
      .post(`/v1/orders/${orderId}/deliveries`)
      .send({ scheduledDate: today });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Nothing left to schedule/);
  });

  it('shows up on the calendar for today', async () => {
    const res = await ownerReq().get(`/v1/deliveries?from=${today}&to=${today}`);
    expect(res.status).toBe(200);
    const mine = res.body.filter((d: { id: string }) => d.id === deliveryId);
    expect(mine).toHaveLength(1);
    expect(mine[0].customerName).toBe('Robin Ng');
    expect(mine[0].addressLine1).toBe('9 Pier Ave');
  });

  it('a failed delivery moves nothing and frees the units', async () => {
    const fail = await ownerReq()
      .post(`/v1/deliveries/${deliveryId}/complete`)
      .send({ failed: true, notes: 'nobody home' });
    expect(fail.status).toBe(201);
    expect(fail.body.status).toBe('failed');
    expect(await level()).toEqual({ onHand: 10, reserved: 2 });

    // The units are schedulable again.
    const again = await ownerReq()
      .post(`/v1/orders/${orderId}/deliveries`)
      .send({ scheduledDate: today });
    expect(again.status).toBe(201);
    deliveryId = again.body.id;
  });

  it('delivering moves the stock: on-hand down, reservation consumed, order fulfilled', async () => {
    const res = await ownerReq().post(`/v1/deliveries/${deliveryId}/complete`).send({});
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('delivered');

    expect(await level()).toEqual({ onHand: 8, reserved: 0 });

    const order = await ownerReq().get(`/v1/orders/${orderId}`);
    expect(order.body.status).toBe('fulfilled');
    expect(order.body.lines[0].qtyFulfilled).toBe(2);
    expect(order.body.lines[0].qtyReserved).toBe(0);
  });

  it('cannot complete the order while a balance is due (Owner lacks nothing but says no allowBalance)', async () => {
    const res = await ownerReq().post(`/v1/orders/${orderId}/complete`).send({});
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Balance due/);
  });

  it('collects the balance and completes; the order closes clean', async () => {
    const pay = await ownerReq()
      .post(`/v1/orders/${orderId}/payments`)
      .send({ method: 'cash', amountCents: 150_000 });
    expect(pay.status).toBe(201);
    expect(pay.body.balanceDueCents).toBe(0);

    const done = await ownerReq().post(`/v1/orders/${orderId}/complete`).send({});
    expect(done.status).toBe(201);
    expect(done.body.status).toBe('completed');
    expect(done.body.balanceDueCents).toBe(0);
  });

  it('the daily report counts the order money in the tender mix', async () => {
    const res = await ownerReq().get(`/v1/reports/sales/daily?start=${today}&end=${today}`);
    expect(res.status).toBe(200);
    const cash = res.body.byPaymentMethod.find((m: { method: string }) => m.method === 'cash');
    // $500 deposit + $1,500 balance, no POS sales in this suite.
    expect(cash?.amountCents).toBe(200_000);
    const day = res.body.orderPaymentsByDay.find((d: { day: string }) => d.day === today);
    expect(day?.amountCents).toBe(200_000);
  });

  it('the cash drawer picks up order payments taken during the shift', async () => {
    const open = await ownerReq()
      .post('/v1/cash-shifts')
      .send({ locationId, openingFloatCents: 10_000 });
    expect(open.status).toBe(201);
    const shiftId = open.body.id;

    // Money taken while the drawer is open: another confirmed order + deposit.
    const order2 = await ownerReq()
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        lines: [{ variantId: mattressVariantId, quantity: 1 }],
        confirm: true,
      });
    expect(order2.status).toBe(201);
    const dep = await ownerReq()
      .post(`/v1/orders/${order2.body.id}/payments`)
      .send({ method: 'cash', amountCents: 25_000 });
    expect(dep.status).toBe(201);

    const close = await ownerReq()
      .post(`/v1/cash-shifts/${shiftId}/close`)
      .send({ countedCashCents: 35_000 });
    expect(close.status).toBe(201);
    expect(close.body.expectedCashCents).toBe(35_000); // 10,000 float + 25,000 deposit
    expect(close.body.varianceCents).toBe(0);
  });

  it('pickup orders fulfill over the counter without a truck', async () => {
    const res = await ownerReq()
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        fulfillmentType: 'pickup',
        lines: [{ variantId: mattressVariantId, quantity: 1 }],
        confirm: true,
      });
    expect(res.status).toBe(201);
    const pickupId = res.body.id;
    const before = await level();

    const ful = await ownerReq().post(`/v1/orders/${pickupId}/fulfill`).send({});
    expect(ful.status).toBe(201);
    expect(ful.body.status).toBe('fulfilled');

    const after = await level();
    expect(after.onHand).toBe(before.onHand - 1);
  });
});

describe('Dispatch: capacity cap + zip routes (PLAN-POS-OPERATIONS P5)', () => {
  // Far-future date so the Day-3 suite's bookings never count here.
  const capDay = '2027-03-15';

  async function makeDeliveryOrder(): Promise<string> {
    const res = await ownerReq()
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        fulfillmentType: 'delivery',
        address: { line1: '1 Route St', city: 'Glendale', region: 'CA', postalCode: '91205' },
        lines: [{ variantId: mattressVariantId, quantity: 1 }],
        confirm: true,
      });
    expect(res.status).toBe(201);
    return res.body.id;
  }

  it('routes auto-suggest from the ship-to zip and stay editable', async () => {
    const orderId = await makeDeliveryOrder();
    const res = await ownerReq()
      .post(`/v1/orders/${orderId}/deliveries`)
      .send({ scheduledDate: capDay });
    expect(res.status).toBe(201);
    expect(res.body.route).toBe('912xx'); // 91205 → 912xx

    const renamed = await ownerReq()
      .patch(`/v1/deliveries/${res.body.id}`)
      .send({ route: 'Glendale AM' });
    expect(renamed.status).toBe(200);
    expect(renamed.body.route).toBe('Glendale AM');
  });

  it('soft cap: 409 without confirm, booked with confirm, override in the owner feed', async () => {
    // Shrink the cap to 2 so the test doesn't need 15 bookings.
    const ops = await ownerReq()
      .patch('/v1/business/settings')
      .send({ ops: { deliveryDailyCap: 2 } });
    expect(ops.status).toBe(200);

    // One trip already exists on capDay from the route test → book the 2nd.
    const secondOrder = await makeDeliveryOrder();
    const second = await ownerReq()
      .post(`/v1/orders/${secondOrder}/deliveries`)
      .send({ scheduledDate: capDay });
    expect(second.status).toBe(201);

    const cap = await ownerReq().get(`/v1/deliveries/capacity?from=${capDay}&to=${capDay}`);
    expect(cap.status).toBe(200);
    expect(cap.body.cap).toBe(2);
    expect(cap.body.days).toEqual([{ date: capDay, booked: 2, remaining: 0 }]);

    // Third booking: refused plainly, allowed with the override flag.
    const thirdOrder = await makeDeliveryOrder();
    const refused = await ownerReq()
      .post(`/v1/orders/${thirdOrder}/deliveries`)
      .send({ scheduledDate: capDay });
    expect(refused.status).toBe(409);
    expect(refused.body.message).toMatch(/at capacity \(2\/2/);

    const overridden = await ownerReq()
      .post(`/v1/orders/${thirdOrder}/deliveries`)
      .send({ scheduledDate: capDay, confirmOverCapacity: true });
    expect(overridden.status).toBe(201);

    const feed = await ownerReq().get('/v1/notifications?limit=50');
    expect(feed.status).toBe(200);
    const hit = feed.body.data.find(
      (n: { action: string; orderId: string | null }) =>
        n.action === 'delivery.cap_override' && n.orderId === thirdOrder,
    );
    expect(hit).toBeTruthy();
    expect(hit.label).toBe('Delivery booked over capacity');
    expect(hit.changesJson?.metadata?.cap).toBe(2);
    expect(hit.changesJson?.metadata?.scheduledDate).toBe(capDay);

    // Restore the default cap for anything running after this suite.
    await ownerReq()
      .patch('/v1/business/settings')
      .send({ ops: { deliveryDailyCap: null } });
  });
});
