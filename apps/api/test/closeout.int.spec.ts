/**
 * P9 acceptance (PLAN-POS-OPERATIONS §9/§12):
 *
 * - Daily close-out: flags open cash drawers, today's undelivered
 *   trips, and delivered-with-balance orders onto the exception
 *   register; runs the nightly Auto Stock Release; idempotent per
 *   location+date.
 * - Morning dashboard: business by store, today's deliveries vs cap,
 *   refunds/cancellations with the associate, the modification log,
 *   and the open-exception count.
 * - Commission clawback: a completed order accrues; a return claws the
 *   returned fraction back as a negative entry.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, desc, eq } from 'drizzle-orm';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';

const TEST_DB_URL =
  process.env.CLOSEOUT_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_closeout';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'ClosePass!2026';
const TODAY = new Date().toISOString().slice(0, 10);

let app: INestApplication;
let businessId = '';
let locationId = '';
let customerId = '';
let variantId = '';
let ownerCookie = '';
let ownerMembershipId = '';
let ownerUserId = '';

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
      .values({ slug: 'close-test', name: 'Closeout Test Co', status: 'active' })
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
      .values({ email: 'owner@close-test.local', emailVerified: true, name: 'Owner' })
      .returning();
    ownerUserId = u!.id;
    await db.insert(schema.accounts).values({
      accountId: u!.id,
      providerId: 'credential',
      userId: u!.id,
      password: passwordHash,
    });
    const [membership] = await db
      .insert(schema.memberships)
      .values({
        businessId,
        userId: u!.id,
        roleId: roles.get('Owner')!,
        status: 'active',
        acceptedAt: new Date(),
      })
      .returning();
    ownerMembershipId = membership!.id;

    // A 5% commission plan on the owner so accrual + clawback fire.
    const [plan] = await db
      .insert(schema.commissionPlans)
      .values({ businessId, name: 'Flat 5%', basis: 'percent_of_sale', rateBps: 500 })
      .returning();
    await db
      .update(schema.memberships)
      .set({ commissionPlanId: plan!.id })
      .where(eq(schema.memberships.id, ownerMembershipId));

    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Close Store', timezone: 'America/Los_Angeles' })
      .returning();
    locationId = loc!.id;

    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'CLOSE-BED', name: 'Closeout Fixture Bed' })
      .returning();
    const [v] = await db
      .insert(schema.productVariants)
      .values({ businessId, productId: p!.id, sku: 'CLOSE-BED-V1', priceCents: 100000 })
      .returning();
    variantId = v!.id;
    await db.insert(schema.inventoryLevels).values({
      businessId,
      variantId,
      locationId,
      onHand: 40,
      reserved: 0,
    });

    const [cust] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Carla', lastName: 'Close' })
      .returning();
    customerId = cust!.id;

    // An open cash drawer for the close to flag.
    await db.insert(schema.cashShifts).values({
      businessId,
      locationId,
      openedByUserId: ownerUserId,
      openingFloatCents: 20000,
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

function owner() {
  const server = app.getHttpServer();
  return {
    post: (url: string) =>
      request(server).post(url).set('Cookie', ownerCookie).set('X-Business-Id', businessId),
    patch: (url: string) =>
      request(server).patch(url).set('Cookie', ownerCookie).set('X-Business-Id', businessId),
    get: (url: string) =>
      request(server).get(url).set('Cookie', ownerCookie).set('X-Business-Id', businessId),
  };
}

async function makeOrder(opts: {
  quantity: number;
  requestedDate?: string;
  pay?: 'full' | 'half' | 'none';
  fulfill?: boolean;
  complete?: boolean;
  salesperson?: boolean;
}): Promise<{ id: string; number: string; lineId: string; totalCents: number }> {
  const created = await owner()
    .post('/v1/orders')
    .send({
      locationId,
      customerId,
      fulfillmentType: 'pickup',
      confirm: true,
      ...(opts.requestedDate ? { requestedDate: opts.requestedDate } : {}),
      ...(opts.salesperson ? { salespersonMembershipId: ownerMembershipId } : {}),
      lines: [{ variantId, quantity: opts.quantity }],
    });
  expect(created.status).toBe(201);
  const id = created.body.id as string;
  const total = created.body.totalCents as number;
  if (opts.pay && opts.pay !== 'none') {
    const cents = opts.pay === 'full' ? total : Math.floor(total / 2);
    await owner()
      .post(`/v1/orders/${id}/payments`)
      .send({ method: 'cash', amountCents: cents })
      .expect(201);
  }
  if (opts.fulfill) {
    await owner().post(`/v1/orders/${id}/fulfill`).send({}).expect(201);
  }
  if (opts.complete) {
    const res = await owner().post(`/v1/orders/${id}/complete`).send({ allowBalance: true });
    expect(res.status).toBe(201);
  }
  return { id, number: created.body.number, lineId: created.body.lines[0].id, totalCents: total };
}

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'close-test-secret-close-test-secret-x';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  const res = await request(app.getHttpServer())
    .post('/api/auth/sign-in/email')
    .send({ email: 'owner@close-test.local', password: PASSWORD })
    .expect(200);
  const cookie = (res.get('Set-Cookie') ?? [])
    .map((c) => c.split(';')[0])
    .filter((c): c is string => Boolean(c?.startsWith('jetnine.session_token=')))
    .find((c) => !c.endsWith('='));
  if (!cookie) throw new Error('no session cookie');
  ownerCookie = cookie;
});

afterAll(async () => {
  if (app) await app.close();
});

describe('P9 — commission accrual + return clawback', () => {
  it('completion accrues; a half return claws half back', async () => {
    const order = await makeOrder({
      quantity: 2,
      pay: 'full',
      fulfill: true,
      complete: true,
      salesperson: true,
    });

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const accrued = await db
        .select()
        .from(schema.commissionEntries)
        .where(eq(schema.commissionEntries.orderId, order.id));
      expect(accrued).toHaveLength(1);
      expect(accrued[0]!.amountCents).toBe(Math.round((order.totalCents * 500) / 10000));

      // Drop-off return of 1 of 2 units → immediate clawback.
      await owner()
        .post(`/v1/orders/${order.id}/return`)
        .send({ lines: [{ lineId: order.lineId, quantity: 1 }], reason: 'too soft' })
        .expect(201);

      const after = await db
        .select()
        .from(schema.commissionEntries)
        .where(eq(schema.commissionEntries.orderId, order.id))
        .orderBy(desc(schema.commissionEntries.createdAt));
      expect(after).toHaveLength(2);
      const clawback = after.find((e) => e.amountCents < 0)!;
      expect(clawback).toBeTruthy();
      expect(clawback.notes).toMatch(/return clawback/);
      // Half the order came back → half the commission comes back.
      expect(Math.abs(clawback.amountCents)).toBe(Math.round(accrued[0]!.amountCents / 2));
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});

describe('P9 — daily close-out', () => {
  let staleOrderId = '';

  it('flags open drawers, undelivered trips, and delivered-with-balance; releases stale stock', async () => {
    // Today's delivery that never completes.
    const undelivered = await makeOrder({ quantity: 1, pay: 'full' });
    await owner()
      .post(`/v1/orders/${undelivered.id}/deliveries`)
      .send({ scheduledDate: TODAY })
      .expect(201);

    // Delivered but still owing (fulfilled, half paid).
    await makeOrder({ quantity: 1, pay: 'half', fulfill: true });

    // Stale reserved order for the nightly Auto Stock Release.
    const stale = await makeOrder({ quantity: 1, requestedDate: '2020-03-01' });
    staleOrderId = stale.id;
    const before = await owner().get(`/v1/orders/${stale.id}`);
    expect(before.body.lines[0].qtyReserved).toBe(1);

    const run = await owner()
      .post('/v1/closeouts/run')
      .send({ locationId, date: TODAY })
      .expect(201);
    expect(run.body.alreadyRan).toBe(false);
    expect(run.body.findings.openCashShifts).toBe(1);
    expect(run.body.findings.undeliveredToday).toBeGreaterThanOrEqual(1);
    expect(run.body.findings.deliveredWithBalance).toBeGreaterThanOrEqual(1);
    expect(run.body.stockReleasedCount).toBeGreaterThanOrEqual(1);

    // The stale order actually let go of its unit.
    const released = await owner().get(`/v1/orders/${staleOrderId}`);
    expect(released.body.lines[0].qtyReserved).toBe(0);

    // Findings landed on the exception register.
    for (const type of ['close_out_cash', 'close_out_deliveries', 'close_out_balance']) {
      const rows = await owner().get(`/v1/exceptions?type=${type}`);
      expect(rows.status).toBe(200);
      expect(rows.body.length).toBeGreaterThanOrEqual(1);
    }

    // History row exists; a second run for the same day is a no-op.
    const history = await owner().get('/v1/closeouts');
    expect(history.body.some((r: { closeDate: string }) => r.closeDate === TODAY)).toBe(true);
    const again = await owner()
      .post('/v1/closeouts/run')
      .send({ locationId, date: TODAY })
      .expect(201);
    expect(again.body.alreadyRan).toBe(true);
  });
});

describe('P9 — morning dashboard', () => {
  it('reports the day by store and associate, deliveries vs cap, refunds, and the mod log', async () => {
    // A post-creation edit for the modification log.
    const edited = await makeOrder({ quantity: 1, pay: 'none', salesperson: true });
    await owner().patch(`/v1/orders/${edited.id}`).send({ notes: 'call first' }).expect(200);

    const brief = await owner().get(`/v1/dashboard/morning?date=${TODAY}`).expect(200);
    const b = brief.body;

    const storeTile = b.salesByStore.find(
      (s: { locationId: string }) => s.locationId === locationId,
    );
    expect(storeTile).toBeTruthy();
    expect(storeTile.orderCount).toBeGreaterThanOrEqual(4);
    expect(storeTile.locationName).toBe('Close Store');

    // Orders carrying a salesperson attribute to the associate tile.
    const assoc = b.salesByAssociate.find(
      (a: { email: string | null }) => a.email === 'owner@close-test.local',
    );
    expect(assoc).toBeTruthy();
    expect(assoc.orderTotalCents).toBeGreaterThan(0);

    // Today's truck load against the cap.
    expect(b.deliveriesToday.booked).toBeGreaterThanOrEqual(1);
    expect(b.deliveriesToday.cap).toBe(15);

    // The clawback test's return shows under refunds with the actor.
    expect(
      b.refundsCancellations.some(
        (r: { action: string; actorEmail: string | null }) =>
          r.action === 'order.return' && r.actorEmail === 'owner@close-test.local',
      ),
    ).toBe(true);

    // The PATCH shows in the modification log.
    expect(b.modifiedOrders.some((m: { orderId: string }) => m.orderId === edited.id)).toBe(true);

    // Close-out findings count as open exceptions.
    expect(b.openExceptions.count).toBeGreaterThanOrEqual(3);
  });

  it('scopes to a location and hides from roles without reports.sales.view', async () => {
    const scoped = await owner()
      .get(`/v1/dashboard/morning?date=${TODAY}&locationId=${locationId}`)
      .expect(200);
    expect(scoped.body.salesByStore).toHaveLength(1);

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const [cashierRole] = await db
        .select({ id: schema.roles.id })
        .from(schema.roles)
        .where(and(eq(schema.roles.businessId, businessId), eq(schema.roles.name, 'Cashier')))
        .limit(1);
      const passwordHash = await hashPassword(PASSWORD);
      const [u] = await db
        .insert(schema.users)
        .values({ email: 'cashier@close-test.local', emailVerified: true, name: 'Cashier' })
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
        roleId: cashierRole!.id,
        status: 'active',
        acceptedAt: new Date(),
      });
    } finally {
      await sql.end({ timeout: 5 });
    }
    const res = await request(app.getHttpServer())
      .post('/api/auth/sign-in/email')
      .send({ email: 'cashier@close-test.local', password: PASSWORD })
      .expect(200);
    const cookie = (res.get('Set-Cookie') ?? [])
      .map((c) => c.split(';')[0])
      .filter((c): c is string => Boolean(c?.startsWith('jetnine.session_token=')))
      .find((c) => !c.endsWith('='));
    await request(app.getHttpServer())
      .get(`/v1/dashboard/morning`)
      .set('Cookie', cookie!)
      .set('X-Business-Id', businessId)
      .expect(403);
  });
});
