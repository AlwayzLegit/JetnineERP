/**
 * Phase 2.7 acceptance: a merchant configures an outbound webhook
 * endpoint, the dispatcher signs+POSTs events to it whenever the
 * business produces matching activity, and a delivery row is
 * persisted on every attempt. Signature verification matches the
 * Stripe-style `t=<unix>,v1=<hmac>` format so consumers have a
 * familiar verification path.
 */
import { execFileSync } from 'node:child_process';
import { createServer, type Server } from 'node:http';
import { createHmac } from 'node:crypto';
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
  process.env.WEBHOOKS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_webhooks';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'WebhookPass!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let variantId = '';
let ownerCookie = '';
let cashierCookie = '';
let receiverServer: Server;
let receiverUrl = '';

interface ReceivedRequest {
  body: string;
  headers: Record<string, string>;
}
const received: ReceivedRequest[] = [];
let nextStatus = 200;

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
        slug: 'wh-test',
        name: 'Webhook Test Co',
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
    await makeUser('owner@wh-test.local', 'Owner');
    await makeUser('cashier@wh-test.local', 'Cashier');

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
      onHand: 100,
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

async function startReceiver(): Promise<void> {
  await new Promise<void>((resolve) => {
    receiverServer = createServer((req, res) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk;
      });
      req.on('end', () => {
        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(req.headers)) {
          if (typeof v === 'string') headers[k] = v;
        }
        received.push({ body, headers });
        res.statusCode = nextStatus;
        res.end(nextStatus === 200 ? 'ok' : 'simulated failure');
      });
    });
    receiverServer.listen(0, '127.0.0.1', () => {
      const addr = receiverServer.address();
      if (addr && typeof addr === 'object') {
        receiverUrl = `http://127.0.0.1:${addr.port}/hook`;
      }
      resolve();
    });
  });
}

async function waitForReceived(min: number, timeoutMs = 5000): Promise<void> {
  const start = Date.now();
  while (received.length < min && Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 50));
  }
}

beforeAll(async () => {
  await startReceiver();
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'wh-test-secret-wh-test-secret-x';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  ownerCookie = await captureCookie('owner@wh-test.local');
  cashierCookie = await captureCookie('cashier@wh-test.local');
});

afterAll(async () => {
  if (app) await app.close();
  await new Promise<void>((resolve) => receiverServer.close(() => resolve()));
});

describe('Phase 2.7 — Outbound webhooks', () => {
  let endpointId = '';
  let endpointSecret = '';
  it('Owner creates a webhook subscribing to sale.created + customer.created', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/webhooks')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        url: receiverUrl,
        description: 'Test endpoint',
        events: ['sale.created', 'customer.created'],
      });
    expect(res.status).toBe(201);
    expect(res.body.url).toBe(receiverUrl);
    expect(res.body.secret).toMatch(/^whsk_/);
    endpointId = res.body.id;
    endpointSecret = res.body.secret;
  });

  it('Cashier (no webhooks.view) cannot list', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/business/webhooks')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(403);
  });

  it('Owner-listed view does NOT echo the secret', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/business/webhooks')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body[0]).not.toHaveProperty('secret');
  });

  it('Test-fire delivers a webhook.test event and records success', async () => {
    received.length = 0;
    nextStatus = 200;
    const res = await request(app.getHttpServer())
      .post(`/v1/business/webhooks/${endpointId}/test`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('succeeded');
    expect(received.length).toBe(1);
    const r = received[0]!;
    expect(r.headers['x-jetnine-event']).toBe('webhook.test');
    expect(r.headers['x-jetnine-event-id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
    // Verify signature ourselves to prove the same recipe works.
    const sig = r.headers['x-jetnine-signature']!;
    const ts = r.headers['x-jetnine-timestamp']!;
    const expected = createHmac('sha256', endpointSecret).update(`${ts}.${r.body}`).digest('hex');
    expect(sig).toBe(`t=${ts},v1=${expected}`);
  });

  it('Sale creation fires sale.created to the endpoint', async () => {
    received.length = 0;
    nextStatus = 200;
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

    await waitForReceived(1);
    expect(received.length).toBe(1);
    const r = received[0]!;
    expect(r.headers['x-jetnine-event']).toBe('sale.created');
    const body = JSON.parse(r.body);
    expect(body.type).toBe('sale.created');
    expect(body.data.saleId).toBe(sale.body.id);
    expect(body.data.totalCents).toBe(1000);
  });

  it('Customer creation fires customer.created', async () => {
    received.length = 0;
    const res = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ firstName: 'Alice', email: 'alice@example.test' });
    expect(res.status).toBe(201);

    await waitForReceived(1);
    expect(received.length).toBe(1);
    const body = JSON.parse(received[0]!.body);
    expect(body.type).toBe('customer.created');
    expect(body.data.email).toBe('alice@example.test');
  });

  it('Events outside the subscription list are not delivered', async () => {
    received.length = 0;
    // We did NOT subscribe to inventory.adjusted; trigger an
    // adjustment and confirm the receiver sees nothing.
    const res = await request(app.getHttpServer())
      .post('/v1/inventory/adjust')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ variantId, locationId, delta: 1, reason: 'count_correction' });
    expect(res.status).toBe(201);

    // Brief wait — there's no event to match, so the dispatcher is a
    // no-op, but we want to be sure nothing arrives.
    await new Promise((r) => setTimeout(r, 200));
    expect(received.length).toBe(0);
  });

  it('Failed delivery records status=failed and increments consecutiveFailures', async () => {
    received.length = 0;
    nextStatus = 500;
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
    await waitForReceived(1);

    // Wait until the dispatcher persists the outcome.
    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      let endpoint;
      for (let i = 0; i < 30; i++) {
        [endpoint] = await db
          .select()
          .from(schema.webhookEndpoints)
          .where(eq(schema.webhookEndpoints.id, endpointId))
          .limit(1);
        if (endpoint && (endpoint.consecutiveFailures ?? 0) > 0) break;
        await new Promise((r) => setTimeout(r, 100));
      }
      expect(endpoint!.consecutiveFailures).toBeGreaterThan(0);
      expect(endpoint!.lastFailureAt).not.toBeNull();
    } finally {
      await sqlc.end({ timeout: 5 });
    }
    nextStatus = 200;
  });

  it('Wildcard subscription delivers any event type', async () => {
    received.length = 0;
    // Replace the endpoint's subscription with the wildcard.
    await request(app.getHttpServer())
      .patch(`/v1/business/webhooks/${endpointId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ events: ['*'] });

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

    await waitForReceived(1);
    expect(received.length).toBe(1);
    const body = JSON.parse(received[0]!.body);
    expect(body.type).toBe('sale.created');
  });

  it('Deactivating an endpoint suppresses deliveries', async () => {
    received.length = 0;
    await request(app.getHttpServer())
      .patch(`/v1/business/webhooks/${endpointId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ isActive: false });

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
    await new Promise((r) => setTimeout(r, 200));
    expect(received.length).toBe(0);
  });

  it('Deliveries endpoint surfaces history per endpoint', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/business/webhooks/${endpointId}/deliveries`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    const types = (res.body as { eventType: string }[]).map((d) => d.eventType);
    expect(types).toContain('sale.created');
    expect(types).toContain('webhook.test');
    expect(types).toContain('customer.created');
  });

  it('Unknown event type in events array returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/webhooks')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        url: 'http://localhost:9999/hook2',
        events: ['nonsense.event'],
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Unknown event type/);
  });

  it('Duplicate URL on the same business returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/webhooks')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        url: receiverUrl,
        events: ['sale.created'],
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/);
  });
});
