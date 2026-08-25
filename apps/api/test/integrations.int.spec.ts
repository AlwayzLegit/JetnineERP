/**
 * One-click integrations acceptance: connect a (fake) Shopify with an
 * API token, sync, and the store's customers/products/paid orders land
 * through the import pipeline — idempotently (D7): a second sync
 * duplicates nothing, and a changed record updates in place. Sales
 * arrive as imported history (D8).
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { and, eq, isNotNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';
import { INTEGRATION_FETCH } from '../src/integrations/integrations.module';

const TEST_DB_URL =
  process.env.INTEGRATIONS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_integrations';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'IntegrationsPass!26';

let app: INestApplication;
let businessId = '';
let ownerCookie = '';
let verifySql: ReturnType<typeof postgres>;
let verifyDb: ReturnType<typeof drizzle>;

// --- The fake Shopify. Mutable so tests can change upstream data. ---

const fakeShop = {
  customers: [
    { id: 9001, first_name: 'Alma', last_name: 'Rivera', email: 'alma@fake.test', phone: '555-1' },
    { id: 9002, first_name: 'Ben', last_name: 'Okafor', email: 'ben@fake.test', phone: '555-2' },
  ],
  products: [
    {
      id: 7001,
      title: 'Cloud Mattress',
      product_type: 'Mattresses',
      variants: [
        { id: 71, sku: 'CLOUD-Q', title: 'Queen', price: '899.00', barcode: '111' },
        { id: 72, sku: 'CLOUD-K', title: 'King', price: '1099.00', barcode: '112' },
      ],
    },
  ],
  orders: [
    {
      id: 5001,
      order_number: 1001,
      customer: { id: 9001 },
      created_at: '2026-07-04T12:00:00Z',
      total_price: '972.42',
      total_tax: '73.42',
      financial_status: 'paid',
    },
  ],
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

const fakeFetch: typeof fetch = async (input) => {
  const url = String(input);
  if (!url.startsWith('https://fake-shop.myshopify.com/admin/api/')) {
    return new Response('not found', { status: 404 });
  }
  if (url.includes('/shop.json')) return jsonResponse({ shop: { name: 'Fake Shop' } });
  if (url.includes('/customers.json')) return jsonResponse({ customers: fakeShop.customers });
  if (url.includes('/products.json')) return jsonResponse({ products: fakeShop.products });
  if (url.includes('/orders.json')) return jsonResponse({ orders: fakeShop.orders });
  return new Response('not found', { status: 404 });
};

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
      .values({ slug: 'integrations-test', name: 'Integrations Test Co', status: 'active' })
      .returning();
    businessId = biz!.id;
    for (const role of SYSTEM_ROLES) {
      const [r] = await db
        .insert(schema.roles)
        .values({ businessId, name: role.name, description: role.description, isSystem: true })
        .returning();
      if (role.permissions.length > 0) {
        await db
          .insert(schema.rolePermissions)
          .values(role.permissions.map((permission) => ({ roleId: r!.id, permission })));
      }
      if (role.name === 'Owner') {
        const [u] = await db
          .insert(schema.users)
          .values({ email: 'owner@integrations-test.local', emailVerified: true, name: 'Owner' })
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
          roleId: r!.id,
          status: 'active',
          acceptedAt: new Date(),
        });
      }
    }
    await db
      .insert(schema.locations)
      .values({ businessId, name: 'Main Store', timezone: 'America/Los_Angeles', taxRateBps: 0 });
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

function api() {
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
    delete: (url: string) =>
      request(app.getHttpServer())
        .delete(url)
        .set('Cookie', ownerCookie)
        .set('X-Business-Id', businessId),
  };
}

beforeAll(async () => {
  await resetTestDb();
  await seed();
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'integrations-test-secret-integrations!!';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.RESEND_API_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(INTEGRATION_FETCH)
    .useValue(fakeFetch)
    .compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();
  ownerCookie = await captureCookie('owner@integrations-test.local');
  verifySql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  verifyDb = drizzle(verifySql);
}, 120_000);

afterAll(async () => {
  if (verifySql) await verifySql.end({ timeout: 5 });
  if (app) await app.close();
});

describe('one-click platform integrations', () => {
  it('lists the provider catalog with nothing connected', async () => {
    const res = await api().get('/v1/integrations');
    expect(res.status).toBe(200);
    const providers = res.body.map((p: { provider: string }) => p.provider).sort();
    expect(providers).toEqual(['shopify', 'wix', 'woocommerce']);
    expect(res.body.every((p: { connected: boolean }) => !p.connected)).toBe(true);
  });

  it('rejects bad credentials at connect time', async () => {
    const res = await api()
      .post('/v1/integrations/shopify/connect')
      .send({
        credentials: { shopDomain: 'wrong-shop.myshopify.com', accessToken: 'nope' },
        locationName: 'Main Store',
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Could not connect/);
  });

  it('connects with working credentials (verified against the platform)', async () => {
    const res = await api()
      .post('/v1/integrations/shopify/connect')
      .send({
        credentials: { shopDomain: 'fake-shop.myshopify.com', accessToken: 'tok_123' },
        locationName: 'Main Store',
      });
    expect(res.status).toBe(201);
    expect(res.body.detail).toContain('Fake Shop');
    const list = await api().get('/v1/integrations');
    const shopify = list.body.find((p: { provider: string }) => p.provider === 'shopify');
    expect(shopify.connected).toBe(true);
    // Credentials never round-trip to the client.
    expect(JSON.stringify(list.body)).not.toContain('tok_123');
  });

  it('sync pulls customers, products, and paid orders through the import pipeline', async () => {
    const res = await api().post('/v1/integrations/shopify/sync?wait=1').send({});
    expect(res.status).toBe(201);
    const byEntity = Object.fromEntries(
      res.body.results.map((r: { entity: string }) => [r.entity, r]),
    );
    expect(byEntity.customer).toMatchObject({ pulled: 2, committed: 2, skipped: 0 });
    expect(byEntity.product).toMatchObject({ pulled: 2, committed: 2, skipped: 0 });
    expect(byEntity.sale).toMatchObject({ pulled: 1, committed: 1, skipped: 0 });

    const customers = await verifyDb
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.businessId, businessId));
    expect(customers).toHaveLength(2);
    expect(customers.map((c) => c.email).sort()).toEqual(['alma@fake.test', 'ben@fake.test']);

    const variants = await verifyDb
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.businessId, businessId));
    expect(variants.map((v) => [v.sku, v.priceCents]).sort()).toEqual([
      ['CLOUD-K', 109_900],
      ['CLOUD-Q', 89_900],
    ]);

    const sales = await verifyDb
      .select()
      .from(schema.sales)
      .where(and(eq(schema.sales.businessId, businessId), isNotNull(schema.sales.importedAt)));
    expect(sales).toHaveLength(1);
    expect(sales[0]!.number).toBe('shp-1001');
    expect(sales[0]!.totalCents).toBe(97_242);
  });

  it('re-sync is idempotent and applies upstream edits in place (D7)', async () => {
    fakeShop.customers[0]!.first_name = 'Almudena';
    const res = await api().post('/v1/integrations/shopify/sync?wait=1').send({});
    expect(res.status).toBe(201);

    const customers = await verifyDb
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.businessId, businessId));
    expect(customers).toHaveLength(2); // no duplicates
    expect(customers.find((c) => c.email === 'alma@fake.test')?.firstName).toBe('Almudena');

    const sales = await verifyDb
      .select()
      .from(schema.sales)
      .where(eq(schema.sales.businessId, businessId));
    expect(sales).toHaveLength(1);
  });

  it('default (no wait) sync runs detached: returns started, finishes in the background', async () => {
    const res = await api().post('/v1/integrations/shopify/sync').send({});
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ started: true, syncStatus: 'running' });

    // Poll the list until the background job leaves 'running'.
    let final: { syncStatus?: string; lastResult?: { results?: unknown[] } } | undefined;
    for (let i = 0; i < 100; i++) {
      await new Promise((r) => setTimeout(r, 100));
      const list = await api().get('/v1/integrations');
      final = list.body.find((p: { provider: string }) => p.provider === 'shopify');
      if (final?.syncStatus !== 'running') break;
    }
    expect(final?.syncStatus).toBe('idle');
    expect(final?.lastResult?.results).toBeTruthy();

    // Still idempotent when run detached.
    const customers = await verifyDb
      .select()
      .from(schema.customers)
      .where(eq(schema.customers.businessId, businessId));
    expect(customers).toHaveLength(2);
  });

  it('disconnect wipes credentials and blocks syncs', async () => {
    await api().delete('/v1/integrations/shopify').expect(200);
    const res = await api().post('/v1/integrations/shopify/sync').send({});
    expect(res.status).toBe(400);
    const [row] = await verifyDb
      .select()
      .from(schema.integrations)
      .where(eq(schema.integrations.businessId, businessId));
    expect(row!.credentialsJson).toEqual({});
    expect(row!.status).toBe('disconnected');
  });
});
