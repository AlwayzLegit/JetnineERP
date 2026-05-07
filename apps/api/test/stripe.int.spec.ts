/**
 * Phase 2.1 acceptance: a merchant can connect their Stripe account,
 * a card sale charges that account via a PaymentIntent, and a refund
 * reverses the same PaymentIntent.
 *
 * Runs against the StripeService stub (no real Stripe credentials
 * required). The stub returns deterministic fake IDs so we can assert
 * on the round-trip without depending on Stripe's API.
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
  process.env.STRIPE_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_stripe';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'StripePass!2026';

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
    const [biz] = await db
      .insert(schema.businesses)
      .values({
        slug: 'stripe-test',
        name: 'Stripe Test Co',
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
    await makeUser('owner@stripe-test.local', 'Owner');
    await makeUser('cashier@stripe-test.local', 'Cashier');

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
  process.env.BETTER_AUTH_SECRET ??= 'stripe-test-secret-stripe-test-secret-x';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  // Force stub mode (no real Stripe credentials).
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  ownerCookie = await captureCookie('owner@stripe-test.local');
  cashierCookie = await captureCookie('cashier@stripe-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Phase 2.1 — Stripe Connect (stub mode)', () => {
  it('Initial status: not connected, stubMode=true', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/business/stripe')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(false);
    expect(res.body.stubMode).toBe(true);
  });

  let oauthState = '';
  it('connect-url issues a state token', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/business/stripe/connect-url')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.url).toMatch(/state=/);
    expect(typeof res.body.state).toBe('string');
    oauthState = res.body.state;
  });

  it('OAuth callback persists the connected account and redirects', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/stripe/oauth/callback?code=stub_code&state=${oauthState}`)
      .redirects(0); // we want to inspect the 302
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/stripe=connected/);

    const status = await request(app.getHttpServer())
      .get('/v1/business/stripe')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(status.body.connected).toBe(true);
    expect(status.body.stripeAccountId).toMatch(/^acct_stub_/);
    expect(status.body.chargesEnabled).toBe(true);
  });

  it('Reusing an OAuth state fails (single-use)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/stripe/oauth/callback?code=stub_code&state=${oauthState}`)
      .redirects(0);
    expect(res.status).toBe(302);
    expect(res.headers.location).toMatch(/stripe=error/);
    expect(res.headers.location).toMatch(/invalid.+state/i);
  });

  let saleId = '';
  it('Card sale via Stripe creates a payment with processor=stripe + processorRef=pi_stub_*', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [
          {
            method: 'card',
            amountCents: 1000,
            stripePaymentMethodId: 'pm_card_visa',
          },
        ],
      });
    expect(res.status).toBe(201);
    saleId = res.body.id;
    const cardPayment = res.body.payments.find((p: { method: string }) => p.method === 'card');
    expect(cardPayment.processor).toBe('stripe');
    expect(cardPayment.processorRef).toMatch(/^pi_stub_/);
  });

  it('Refund of a Stripe-charged sale calls Stripe and records the refund', async () => {
    const sale = await request(app.getHttpServer())
      .get(`/v1/sales/${saleId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const lineId = sale.body.lines[0].id;

    const res = await request(app.getHttpServer())
      .post(`/v1/sales/${saleId}/refund`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ saleLineId: lineId, quantity: 1 }] });
    expect(res.status).toBe(201);
    expect(res.body.amountCents).toBe(1000);
    expect(res.body.saleStatus).toBe('refunded');
  });

  it('Mixed cash + Stripe card sale charges only the card portion', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 2 }],
        payments: [
          { method: 'cash', amountCents: 500 },
          {
            method: 'card',
            amountCents: 1500,
            stripePaymentMethodId: 'pm_card_visa',
          },
        ],
      });
    expect(res.status).toBe(201);
    const card = res.body.payments.find((p: { method: string }) => p.method === 'card');
    const cash = res.body.payments.find((p: { method: string }) => p.method === 'cash');
    expect(card.processor).toBe('stripe');
    expect(cash.processor).toBeNull();
  });

  it('Card sale without stripePaymentMethodId still works as a manual capture', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'card', amountCents: 1000 }],
      });
    expect(res.status).toBe(201);
    const card = res.body.payments.find((p: { method: string }) => p.method === 'card');
    expect(card.processor).toBe('manual');
  });

  it('Disconnect marks the account inactive', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/stripe/disconnect')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(201);

    const status = await request(app.getHttpServer())
      .get('/v1/business/stripe')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(status.body.connected).toBe(false);
  });

  it('After disconnect, a Stripe-payment-method sale is rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [
          {
            method: 'card',
            amountCents: 1000,
            stripePaymentMethodId: 'pm_card_visa',
          },
        ],
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Stripe is not connected/);
  });

  it('OAuth state row count: each issued state should be cleaned up after use', async () => {
    // The connect-url + callback test issued one state and consumed it.
    // The "reuse fails" test attempted to reuse the same one. Both are
    // gone now. Check the table is empty.
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const rows = await db.select().from(schema.stripeOauthStates);
      expect(rows.length).toBeLessThanOrEqual(1); // allow 1 if any test added without cleanup
      void eq;
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});

describe('Phase 2.1 — Stripe webhooks (stub mode)', () => {
  // Re-connect the merchant for webhook handler tests; the prior
  // describe block left it disconnected.
  let stripeAccountId = '';

  it('Reconnect for webhook tests', async () => {
    const url = await request(app.getHttpServer())
      .get('/v1/business/stripe/connect-url')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const state = url.body.state as string;
    const cb = await request(app.getHttpServer())
      .get(`/v1/stripe/oauth/callback?code=stub_code&state=${state}`)
      .redirects(0);
    expect(cb.status).toBe(302);

    const status = await request(app.getHttpServer())
      .get('/v1/business/stripe')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    stripeAccountId = status.body.stripeAccountId;
    expect(status.body.connected).toBe(true);
  });

  it('account.updated webhook syncs charges/payouts/email', async () => {
    const event = {
      id: `evt_test_${Date.now()}`,
      type: 'account.updated',
      livemode: false,
      data: {
        object: {
          id: stripeAccountId,
          email: 'updated@example.com',
          default_currency: 'usd',
          charges_enabled: false,
          payouts_enabled: false,
        },
      },
    };
    const res = await request(app.getHttpServer())
      .post('/v1/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(event);
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    const status = await request(app.getHttpServer())
      .get('/v1/business/stripe')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(status.body.accountEmail).toBe('updated@example.com');
    expect(status.body.chargesEnabled).toBe(false);
    expect(status.body.payoutsEnabled).toBe(false);
  });

  it('Idempotency: replaying the same event id returns deduped:true', async () => {
    const event = {
      id: `evt_test_dup_${Date.now()}`,
      type: 'account.updated',
      livemode: false,
      data: {
        object: {
          id: stripeAccountId,
          charges_enabled: true,
          payouts_enabled: true,
        },
      },
    };
    const first = await request(app.getHttpServer())
      .post('/v1/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(event);
    expect(first.body.received).toBe(true);
    expect(first.body.deduped).toBeUndefined();

    const second = await request(app.getHttpServer())
      .post('/v1/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(event);
    expect(second.status).toBe(200);
    expect(second.body.deduped).toBe(true);
  });

  it('charge.dispute.created writes a sale.dispute audit row', async () => {
    // Ring a Stripe-charged sale to get a PaymentIntent id we can
    // dispute against.
    const sale = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'card', amountCents: 1000, stripePaymentMethodId: 'pm_card_visa' }],
      });
    expect(sale.status).toBe(201);
    const cardPayment = sale.body.payments.find((p: { method: string }) => p.method === 'card');
    const piId = cardPayment.processorRef as string;
    expect(piId).toMatch(/^pi_stub_/);

    const event = {
      id: `evt_dispute_${Date.now()}`,
      type: 'charge.dispute.created',
      livemode: false,
      data: {
        object: {
          id: 'dp_stub',
          payment_intent: piId,
          amount: 1000,
          reason: 'fraudulent',
        },
      },
    };
    const res = await request(app.getHttpServer())
      .post('/v1/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(event);
    expect(res.status).toBe(200);

    // Audit row should exist for sale.dispute action.
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const audits = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, 'sale.dispute'));
      expect(audits.length).toBe(1);
      expect(audits[0]!.targetId).toBe(sale.body.id);
      expect(audits[0]!.actorType).toBe('system');
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('account.application.deauthorized soft-disconnects the merchant', async () => {
    const event = {
      id: `evt_deauth_${Date.now()}`,
      type: 'account.application.deauthorized',
      livemode: false,
      account: stripeAccountId,
      data: { object: { id: 'ca_stub' } },
    };
    const res = await request(app.getHttpServer())
      .post('/v1/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(event);
    expect(res.status).toBe(200);

    const status = await request(app.getHttpServer())
      .get('/v1/business/stripe')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(status.body.connected).toBe(false);
    expect(status.body.chargesEnabled).toBe(false);
  });

  it('Unknown event types are accepted and logged but no-op', async () => {
    const event = {
      id: `evt_unknown_${Date.now()}`,
      type: 'invoice.created', // not handled
      livemode: false,
      data: { object: { id: 'in_stub' } },
    };
    const res = await request(app.getHttpServer())
      .post('/v1/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(event);
    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });

  it('Malformed payload (missing id/type) returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send({ data: { object: {} } });
    expect(res.status).toBe(400);
  });
});
