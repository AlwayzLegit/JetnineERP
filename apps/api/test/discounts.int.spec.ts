/**
 * Phase 2.6 acceptance: a merchant can define discount codes
 * (percent + fixed kinds, with optional window / usage limits /
 * per-customer limits / minimum subtotal), and at sale time a
 * cashier applies a code that the backend validates and records as
 * a redemption.
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

const TEST_DB_URL =
  process.env.DISCOUNTS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_discounts';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'DiscPass!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let variantId = '';
let customerAId = '';
let customerBId = '';
let ownerCookie = '';
let cashierCookie = '';

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
        slug: 'disc-test',
        name: 'Discount Test Co',
        status: 'active',
        defaultTaxRateBps: 0,
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
    await makeUser('owner@disc-test.local', 'Owner');
    await makeUser('cashier@disc-test.local', 'Cashier');

    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Main', timezone: 'America/New_York' })
      .returning();
    locationId = loc!.id;
    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'WIDGET', name: 'Widget' })
      .returning();
    const [v] = await db
      .insert(schema.productVariants)
      .values({ businessId, productId: p!.id, sku: 'WIDGET-1', priceCents: 1000 })
      .returning();
    variantId = v!.id;
    await db.insert(schema.inventoryLevels).values({
      businessId,
      variantId,
      locationId,
      onHand: 1000,
    });

    const [custA] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Alice', email: 'alice@example.test' })
      .returning();
    customerAId = custA!.id;
    const [custB] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Bob', email: 'bob@example.test' })
      .returning();
    customerBId = custB!.id;
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

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'disc-test-secret-disc-test-secret-x';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  ownerCookie = await captureCookie('owner@disc-test.local');
  cashierCookie = await captureCookie('cashier@disc-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Phase 2.6 — Discount codes', () => {
  let percentId = '';
  let fixedId = '';

  it('Owner creates a 15% percent code', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/discount-codes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        code: 'SAVE15',
        kind: 'percent',
        value: 1500,
        description: 'Loyalty bonus',
      });
    expect(res.status).toBe(201);
    expect(res.body.code).toBe('SAVE15');
    expect(res.body.usageCount).toBe(0);
    percentId = res.body.id;
  });

  it('Owner creates a $5 fixed code with usage limit 2 + min subtotal $10', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/discount-codes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        code: 'WELCOME5',
        kind: 'fixed',
        value: 500,
        usageLimit: 2,
        minSubtotalCents: 1000,
      });
    expect(res.status).toBe(201);
    fixedId = res.body.id;
  });

  it('Code is case-insensitive — duplicate "save15" is rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/discount-codes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ code: 'save15', kind: 'percent', value: 100 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/);
  });

  it('Cashier (no discounts.manage) cannot create but can list (discounts.view)', async () => {
    const list = await request(app.getHttpServer())
      .get('/v1/business/discount-codes')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(list.status).toBe(200);
    expect(list.body.length).toBeGreaterThan(0);

    const create = await request(app.getHttpServer())
      .post('/v1/business/discount-codes')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ code: 'HACKER', kind: 'fixed', value: 9999 });
    expect(create.status).toBe(403);
  });

  it('Apply SAVE15 on $20 sale → discount = $3, total = $17', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 2 }], // $20.00
        discountCode: 'SAVE15',
        payments: [{ method: 'cash', amountCents: 1700 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.subtotalCents).toBe(2000);
    expect(res.body.discountCents).toBe(300);
    expect(res.body.totalCents).toBe(1700);
  });

  it('Case-insensitive: applying "save15" works the same way', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }], // $10.00
        discountCode: 'save15',
        payments: [{ method: 'cash', amountCents: 850 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.discountCents).toBe(150);
  });

  it('Sending both discountCode and orderDiscountCents returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        discountCode: 'SAVE15',
        orderDiscountCents: 100,
        payments: [{ method: 'cash', amountCents: 800 }],
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cannot supply both/);
  });

  it('Min subtotal: WELCOME5 below $10 → 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1, lineDiscountCents: 200 }], // net $8 < $10 min
        discountCode: 'WELCOME5',
        payments: [{ method: 'cash', amountCents: 800 }],
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/at least \$10\.00/);
  });

  it('Fixed $5 off on $10 sale → total $5; usageCount → 1', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }], // $10.00, meets $10 min
        discountCode: 'WELCOME5',
        payments: [{ method: 'cash', amountCents: 500 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.discountCents).toBe(500);
    expect(res.body.totalCents).toBe(500);

    const list = await request(app.getHttpServer())
      .get('/v1/business/discount-codes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const fixed = list.body.find((c: { id: string }) => c.id === fixedId);
    expect(fixed.usageCount).toBe(1);
  });

  it('Second use exhausts WELCOME5; third use is rejected (limit 2)', async () => {
    // Second use — fine.
    const ok = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        discountCode: 'WELCOME5',
        payments: [{ method: 'cash', amountCents: 500 }],
      });
    expect(ok.status).toBe(201);

    const overLimit = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        discountCode: 'WELCOME5',
        payments: [{ method: 'cash', amountCents: 500 }],
      });
    expect(overLimit.status).toBe(400);
    expect(overLimit.body.message).toMatch(/usage limit/);
  });

  it('Inactive code is rejected', async () => {
    await request(app.getHttpServer())
      .patch(`/v1/business/discount-codes/${percentId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ isActive: false });

    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        discountCode: 'SAVE15',
        payments: [{ method: 'cash', amountCents: 850 }],
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/inactive/);

    // Re-enable for later tests.
    await request(app.getHttpServer())
      .patch(`/v1/business/discount-codes/${percentId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ isActive: true });
  });

  it('Window: code in the future → "not yet valid"', async () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const created = await request(app.getHttpServer())
      .post('/v1/business/discount-codes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ code: 'BLACKFRIDAY', kind: 'percent', value: 2500, startsAt: future });
    expect(created.status).toBe(201);

    const sale = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        discountCode: 'BLACKFRIDAY',
        payments: [{ method: 'cash', amountCents: 750 }],
      });
    expect(sale.status).toBe(400);
    expect(sale.body.message).toMatch(/not yet valid/);
  });

  it('Per-customer limit: requires customerId; once exceeded, blocked', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/business/discount-codes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ code: 'NEWBIE', kind: 'fixed', value: 100, perCustomerLimit: 1 });
    expect(created.status).toBe(201);

    // No customer attached → 400.
    const noCust = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        discountCode: 'NEWBIE',
        payments: [{ method: 'cash', amountCents: 900 }],
      });
    expect(noCust.status).toBe(400);
    expect(noCust.body.message).toMatch(/requires an attached customer/);

    // Customer A: first redemption succeeds.
    const okA = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        customerId: customerAId,
        discountCode: 'NEWBIE',
        payments: [{ method: 'cash', amountCents: 900 }],
      });
    expect(okA.status).toBe(201);

    // Customer A again → blocked.
    const blocked = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        customerId: customerAId,
        discountCode: 'NEWBIE',
        payments: [{ method: 'cash', amountCents: 900 }],
      });
    expect(blocked.status).toBe(400);
    expect(blocked.body.message).toMatch(/per-customer limit/);

    // Customer B: still allowed.
    const okB = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        customerId: customerBId,
        discountCode: 'NEWBIE',
        payments: [{ method: 'cash', amountCents: 900 }],
      });
    expect(okB.status).toBe(201);
  });

  it('Redemptions table records every applied use', async () => {
    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      const all = await db.select().from(schema.discountRedemptions);
      // SAVE15 used 2x, WELCOME5 used 2x, NEWBIE used 2x → 6 total.
      expect(all.length).toBe(6);
      const newbieRedemptions = all.filter((r) => r.discountCodeId !== '' && r.customerId != null);
      expect(newbieRedemptions.length).toBe(2);
    } finally {
      await sqlc.end({ timeout: 5 });
    }
  });

  it('Unknown code returns 404', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        discountCode: 'NOSUCHCODE',
        payments: [{ method: 'cash', amountCents: 1000 }],
      });
    expect(res.status).toBe(404);
  });

  it('Delete a code sweeps its redemptions and writes audit metadata', async () => {
    const list = await request(app.getHttpServer())
      .get('/v1/business/discount-codes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const target = list.body.find((c: { code: string }) => c.code === 'SAVE15');
    expect(target.usageCount).toBe(2);

    const del = await request(app.getHttpServer())
      .delete(`/v1/business/discount-codes/${target.id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(del.status).toBe(200);

    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      const audits = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, 'discount_code.delete'));
      expect(audits.length).toBe(1);
      expect(audits[0]!.changesJson).toMatchObject({
        metadata: { redemptionsRemoved: 2 },
      });
    } finally {
      await sqlc.end({ timeout: 5 });
    }
  });
});
