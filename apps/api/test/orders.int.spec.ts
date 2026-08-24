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
    const res = await request(app.getHttpServer())
      .post('/v1/orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        customerId,
        orderDiscountCents: 10_000,
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
