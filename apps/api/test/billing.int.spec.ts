/**
 * Epic 1.12 acceptance: a business in trial, when the trial ends without
 * payment, becomes read-only across all UIs except billing settings.
 *
 * Walks through:
 *  - new business starts in 14-day trial with a subscription row
 *  - while in-trial, the cashier can ring sales (writes succeed)
 *  - dev/expire-trial flips status to past_due and trialEndsAt < now
 *  - now non-billing writes return 402, but GETs and /v1/billing/* still
 *    work (so the user can fix billing without being locked out)
 *  - subscribe to a paid plan flips status back to active and writes
 *    succeed again
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';

const TEST_DB_URL =
  process.env.BILLING_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_billing';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'BillPass!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let variantId = '';
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
    const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    const [biz] = await db
      .insert(schema.businesses)
      .values({
        slug: 'billing-test',
        name: 'Billing Test Co',
        status: 'trial',
        trialEndsAt: trialEnd,
      })
      .returning();
    businessId = biz!.id;
    await db.insert(schema.subscriptions).values({
      businessId,
      plan: 'starter',
      status: 'trial',
      trialEndsAt: trialEnd,
    });

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
    await makeUser('owner@billing-test.local', 'Owner');
    await makeUser('cashier@billing-test.local', 'Cashier');

    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Main', timezone: 'America/New_York' })
      .returning();
    locationId = loc!.id;
    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'A', name: 'Widget' })
      .returning();
    const [v] = await db
      .insert(schema.productVariants)
      .values({ businessId, productId: p!.id, sku: 'A-1', priceCents: 1000 })
      .returning();
    variantId = v!.id;
    await db.insert(schema.inventoryLevels).values({
      businessId,
      variantId,
      locationId,
      onHand: 50,
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

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'billing-test-secret-billing-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true });
  await app.init();

  ownerCookie = await captureCookie('owner@billing-test.local');
  cashierCookie = await captureCookie('cashier@billing-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Epic 1.12 — Billing & read-only mode', () => {
  it('Subscription view reflects the trial state', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/billing/subscription')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('trial');
    expect(res.body.trialExpired).toBe(false);
    expect(res.body.readOnly).toBe(false);
    expect(res.body.locationCount).toBe(1);
    expect(res.body.monthlyPriceCents).toBeGreaterThan(0);
  });

  it('In-trial cashier can ring a sale (writes succeed)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 1000 }],
      });
    expect(res.status).toBe(201);
  });

  it('Plans catalog lists Starter and Pro', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/billing/plans')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    const ids = res.body.map((p: { id: string }) => p.id).sort();
    expect(ids).toEqual(['pro', 'starter']);
  });

  it('Expiring the trial flips the subscription to past_due and read-only', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/billing/dev/expire-trial')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('past_due');
    expect(res.body.readOnly).toBe(true);
  });

  it('After lapse, ringing a sale returns 402 Payment Required', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 1000 }],
      });
    expect(res.status).toBe(402);
    expect(res.body.message).toMatch(/Subscription required/);
  });

  it('GETs still work after lapse (read-only, not locked out)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/sales')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
  });

  it('Billing endpoints stay open after lapse so the user can fix it', async () => {
    const sub = await request(app.getHttpServer())
      .get('/v1/billing/subscription')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(sub.status).toBe(200);
    expect(sub.body.readOnly).toBe(true);
  });

  it('Subscribing to Pro flips status back to active and writes resume', async () => {
    const sub = await request(app.getHttpServer())
      .post('/v1/billing/subscribe')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ plan: 'pro' });
    expect(sub.status).toBe(201);
    expect(sub.body.status).toBe('active');
    expect(sub.body.plan).toBe('pro');
    expect(sub.body.readOnly).toBe(false);

    const sale = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 1000 }],
      });
    expect(sale.status).toBe(201);
  });

  it('Plan switch (PATCH) updates the plan but keeps active status', async () => {
    const res = await request(app.getHttpServer())
      .patch('/v1/billing/subscription')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ plan: 'starter' });
    expect(res.status).toBe(200);
    expect(res.body.plan).toBe('starter');
    expect(res.body.status).toBe('active');
  });

  it('Cancel transitions status to canceled and re-enters read-only', async () => {
    const cancel = await request(app.getHttpServer())
      .post('/v1/billing/cancel')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(cancel.status).toBe(201);
    expect(cancel.body.status).toBe('canceled');
    expect(cancel.body.readOnly).toBe(true);

    const sale = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 1000 }],
      });
    expect(sale.status).toBe(402);
  });
});
