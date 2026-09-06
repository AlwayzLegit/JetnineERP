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
import { eq } from 'drizzle-orm';
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
  // rawBody: the Stripe Billing webhook verifies the raw request body (same as main.ts).
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
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

  // ---- PLAN §15.5 — Stripe Billing (stub mode: no STRIPE_SECRET_KEY) ----

  const webhook = (event: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post('/v1/billing/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(event);
  const unix = (d: Date) => Math.floor(d.getTime() / 1000);
  let stubCustomerId = '';

  it('Subscription view exposes Stripe Billing state (configured in stub mode)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/billing/subscription')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.accountKind).toBe('saas');
    expect(res.body.stripeBilling).toMatchObject({
      configured: true,
      stubMode: true,
      subscriptionId: null,
    });
  });

  it('Checkout (stub) returns a redirect URL and remembers a customer', async () => {
    const bad = await request(app.getHttpServer())
      .post('/v1/billing/checkout')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ plan: 'enterprise' });
    expect(bad.status).toBe(400);

    const res = await request(app.getHttpServer())
      .post('/v1/billing/checkout')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ plan: 'pro' });
    expect(res.status).toBe(201);
    expect(res.body.stub).toBe(true);
    expect(res.body.url).toContain('/settings/billing?checkout=success');

    const view = await request(app.getHttpServer())
      .get('/v1/billing/subscription')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    stubCustomerId = view.body.stripeBilling.customerId;
    expect(stubCustomerId).toMatch(/^cus_stub_/);
    // Checkout alone activates nothing — the webhook does.
    expect(view.body.status).toBe('canceled');
  });

  it('Cashier cannot start checkout (permission), portal works for the owner', async () => {
    const denied = await request(app.getHttpServer())
      .post('/v1/billing/checkout')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ plan: 'pro' });
    expect(denied.status).toBe(403);

    const portal = await request(app.getHttpServer())
      .post('/v1/billing/portal')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(portal.status).toBe(201);
    expect(portal.body.url).toContain('portal=stub');
  });

  it('checkout.session.completed activates the subscription and writes resume', async () => {
    const res = await webhook({
      id: 'evt_test_checkout_1',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_1',
          mode: 'subscription',
          customer: stubCustomerId,
          subscription: 'sub_test_1',
          client_reference_id: businessId,
          metadata: { businessId, plan: 'pro' },
        },
      },
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });

    const view = await request(app.getHttpServer())
      .get('/v1/billing/subscription')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(view.body.status).toBe('active');
    expect(view.body.plan).toBe('pro');
    expect(view.body.readOnly).toBe(false);
    expect(view.body.stripeBilling.subscriptionId).toBe('sub_test_1');

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

  it('invoice.paid records one ledger row per invoice, even when redelivered', async () => {
    const start = new Date();
    const end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    const event = {
      id: 'evt_test_invoice_paid_1',
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_test_1',
          number: 'INV-0001',
          customer: stubCustomerId,
          subscription: 'sub_test_1',
          amount_paid: 20000,
          currency: 'usd',
          hosted_invoice_url: 'https://invoice.stripe.com/i/in_test_1',
          status_transitions: { paid_at: unix(start) },
          lines: { data: [{ period: { start: unix(start), end: unix(end) } }] },
        },
      },
    };
    const first = await webhook(event);
    expect(first.status).toBe(200);
    expect(first.body).toEqual({ received: true });
    const again = await webhook(event);
    expect(again.body).toEqual({ received: true, deduped: true });
    // A different event about the same invoice (Stripe sends both).
    const succeeded = await webhook({
      ...event,
      id: 'evt_test_invoice_paid_1b',
      type: 'invoice.payment_succeeded',
    });
    expect(succeeded.body).toEqual({ received: true });

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const rows = await db
        .select()
        .from(schema.subscriptionPayments)
        .where(eq(schema.subscriptionPayments.businessId, businessId));
      expect(rows).toHaveLength(1);
      expect(rows[0]).toMatchObject({
        amountCents: 20000,
        currencyCode: 'USD',
        status: 'paid',
        method: 'stripe',
        reference: 'in_test_1',
      });
      expect(rows[0]!.note).toContain('INV-0001');
      expect(rows[0]!.periodEnd?.getTime()).toBe(Math.floor(end.getTime() / 1000) * 1000);

      const [sub] = await db
        .select()
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.businessId, businessId));
      expect(sub!.status).toBe('active');
      expect(sub!.currentPeriodEnd?.getTime()).toBe(Math.floor(end.getTime() / 1000) * 1000);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('invoice.payment_failed flips to past_due and read-only; a sale returns 402', async () => {
    const res = await webhook({
      id: 'evt_test_invoice_failed_1',
      type: 'invoice.payment_failed',
      data: {
        object: {
          id: 'in_test_2',
          customer: stubCustomerId,
          subscription: 'sub_test_1',
          amount_due: 20000,
          currency: 'usd',
        },
      },
    });
    expect(res.status).toBe(200);

    const view = await request(app.getHttpServer())
      .get('/v1/billing/subscription')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(view.body.status).toBe('past_due');
    expect(view.body.readOnly).toBe(true);

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

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const rows = await db
        .select({
          status: schema.subscriptionPayments.status,
          reference: schema.subscriptionPayments.reference,
        })
        .from(schema.subscriptionPayments)
        .where(eq(schema.subscriptionPayments.businessId, businessId));
      expect(rows.map((r) => r.status).sort()).toEqual(['failed', 'paid']);
      expect(rows.find((r) => r.status === 'failed')!.reference).toBe('in_test_2:failed');
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('customer.subscription.updated syncs status, quantity and period from Stripe', async () => {
    const end = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000);
    const res = await webhook({
      id: 'evt_test_sub_updated_1',
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_test_1',
          customer: stubCustomerId,
          status: 'active',
          cancel_at_period_end: true,
          items: {
            data: [
              { quantity: 3, price: { id: 'price_stub_starter' }, current_period_end: unix(end) },
            ],
          },
        },
      },
    });
    expect(res.status).toBe(200);
    const view = await request(app.getHttpServer())
      .get('/v1/billing/subscription')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(view.body.status).toBe('active');
    expect(view.body.readOnly).toBe(false);
    expect(view.body.plan).toBe('starter');
    expect(view.body.paidLocationCount).toBe(3);
    expect(new Date(view.body.cancelAtPeriodEnd).getTime()).toBe(unix(end) * 1000);
  });

  it('customer.subscription.deleted cancels; agency accounts are ignored by Stripe state', async () => {
    const res = await webhook({
      id: 'evt_test_sub_deleted_1',
      type: 'customer.subscription.deleted',
      data: { object: { id: 'sub_test_1', customer: stubCustomerId, status: 'canceled' } },
    });
    expect(res.status).toBe(200);
    const view = await request(app.getHttpServer())
      .get('/v1/billing/subscription')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(view.body.status).toBe('canceled');
    expect(view.body.readOnly).toBe(true);

    // Flip to agency: checkout is refused and a Stripe event cannot block it.
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      await db
        .update(schema.businesses)
        .set({ accountKind: 'agency' })
        .where(eq(schema.businesses.id, businessId));
    } finally {
      await sql.end({ timeout: 5 });
    }
    const checkout = await request(app.getHttpServer())
      .post('/v1/billing/checkout')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ plan: 'pro' });
    expect(checkout.status).toBe(409);

    const failed = await webhook({
      id: 'evt_test_invoice_failed_agency',
      type: 'invoice.payment_failed',
      data: {
        object: { id: 'in_test_3', customer: stubCustomerId, amount_due: 5000, currency: 'usd' },
      },
    });
    expect(failed.status).toBe(200);
    const agencyView = await request(app.getHttpServer())
      .get('/v1/billing/subscription')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(agencyView.body.accountKind).toBe('agency');
    expect(agencyView.body.readOnly).toBe(false);
  });
});
