/**
 * G4 + G5 acceptance (STORIS cutover): financing rides through the POS
 * as a first-class tender; a layaway plan schedules an order's balance
 * into installments that sum to the cent, paying one lands as ordinary
 * order money, the overdue sweep marks and reminds; commission accrues
 * at sale/order completion (split respected) and refunds net it out.
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
import { OverdueSchedulerService } from '../src/money/overdue-scheduler.service';

const TEST_DB_URL =
  process.env.MONEY_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_money';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'MoneyPass!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let customerId = '';
let variantId = '';
let ownerCookie = '';
let ownerMembershipId = '';
let secondMembershipId = '';
let commissionPlanId = '';

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
      .values({ slug: 'money-test', name: 'Money Test Co', status: 'active' })
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

    async function makeUser(email: string, role: string): Promise<string> {
      const [u] = await db
        .insert(schema.users)
        .values({ email, emailVerified: true, name: email.split('@')[0] })
        .returning();
      await db.insert(schema.accounts).values({
        accountId: u!.id,
        providerId: 'credential',
        userId: u!.id,
        password: passwordHash,
      });
      const [m] = await db
        .insert(schema.memberships)
        .values({
          businessId,
          userId: u!.id,
          roleId: roles.get(role)!,
          status: 'active',
          acceptedAt: new Date(),
        })
        .returning();
      return m!.id;
    }
    ownerMembershipId = await makeUser('owner@money-test.local', 'Owner');
    secondMembershipId = await makeUser('second@money-test.local', 'Cashier');

    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Store', timezone: 'America/Los_Angeles', taxRateBps: 0 })
      .returning();
    locationId = loc!.id;

    const [cust] = await db
      .insert(schema.customers)
      .values({
        businessId,
        firstName: 'Lay',
        lastName: 'Away',
        email: 'lay.away@example.test',
      })
      .returning();
    customerId = cust!.id;

    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'KING', name: 'King Set' })
      .returning();
    const [v] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: p!.id,
        sku: 'KING-1',
        priceCents: 100_000,
        costCents: 60_000,
      })
      .returning();
    variantId = v!.id;
    await db.insert(schema.inventoryLevels).values({
      businessId,
      variantId: v!.id,
      locationId,
      onHand: 20,
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
  };
}

const thisPeriod = new Date().toISOString().slice(0, 7);

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'money-test-secret-money-test-secret-xx';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.RESEND_API_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();
  ownerCookie = await captureCookie('owner@money-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('G5 — commissions', () => {
  it('creates a 5% percent-of-sale plan and assigns it to both salespeople', async () => {
    const res = await ownerReq()
      .post('/v1/commission-plans')
      .send({ name: 'Standard 5%', basis: 'percent_of_sale', rateBps: 500 });
    expect(res.status).toBe(201);
    commissionPlanId = res.body.id;

    for (const membershipId of [ownerMembershipId, secondMembershipId]) {
      const assign = await ownerReq()
        .post('/v1/commission-plans/assign')
        .send({ membershipId, planId: commissionPlanId });
      expect(assign.status).toBe(201);
    }
  });

  it('a financing POS sale records the tender and accrues 5%', async () => {
    const res = await ownerReq()
      .post('/v1/sales')
      .send({
        locationId,
        customerId,
        lines: [{ variantId, quantity: 1 }],
        payments: [
          {
            method: 'financing',
            amountCents: 100_000,
            financingProvider: 'Synchrony',
            financingRef: 'APP-12345',
          },
        ],
      });
    expect(res.status).toBe(201);
    const saleId = res.body.id;

    const report = await ownerReq().get(`/v1/commissions/report?period=${thisPeriod}`);
    expect(report.status).toBe(200);
    const entry = report.body.entries.find((e: { saleId: string }) => e.saleId === saleId);
    expect(entry).toBeTruthy();
    expect(entry.amountCents).toBe(5_000); // 5% of $1,000
    expect(entry.basisCents).toBe(100_000);

    // The financing details rode through to the payment row.
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const [pay] = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.saleId, saleId));
      expect(pay!.method).toBe('financing');
      expect(pay!.financingProvider).toBe('Synchrony');
      expect(pay!.financingRef).toBe('APP-12345');
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('refunding half the sale writes a negative entry that nets to 2.5%', async () => {
    // New sale to refund cleanly.
    const sale = await ownerReq()
      .post('/v1/sales')
      .send({
        locationId,
        lines: [{ variantId, quantity: 2 }],
        payments: [{ method: 'cash', amountCents: 200_000 }],
      });
    expect(sale.status).toBe(201);
    const refund = await ownerReq()
      .post(`/v1/sales/${sale.body.id}/refund`)
      .send({
        lines: [{ saleLineId: sale.body.lines[0].id, quantity: 1 }],
        reason: 'changed mind',
      });
    expect(refund.status).toBe(201);

    const report = await ownerReq().get(`/v1/commissions/report?period=${thisPeriod}`);
    const entries = report.body.entries.filter(
      (e: { saleId: string }) => e.saleId === sale.body.id,
    );
    expect(entries).toHaveLength(2);
    const accrual = entries.find((e: { amountCents: number }) => e.amountCents > 0);
    const reversal = entries.find((e: { amountCents: number }) => e.amountCents < 0);
    expect(accrual.amountCents).toBe(10_000); // 5% of $2,000
    expect(reversal.amountCents).toBe(-5_000); // half refunded
  });
});

describe('G4 — layaway plans', () => {
  let orderId = '';
  let planId = '';

  it('confirmed order + deposit + a 3-installment plan that sums to the cent', async () => {
    const order = await ownerReq()
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        lines: [{ variantId, quantity: 1 }],
        confirm: true,
        salespersonMembershipId: ownerMembershipId,
        secondSalespersonMembershipId: secondMembershipId,
        splitBps: 6000,
      });
    expect(order.status).toBe(201);
    orderId = order.body.id;
    await ownerReq()
      .post(`/v1/orders/${orderId}/payments`)
      .send({ method: 'cash', amountCents: 10_000 });

    // Balance 90_000 into 3 → 30_000 each.
    const plan = await ownerReq()
      .post(`/v1/orders/${orderId}/payment-plan`)
      .send({ type: 'layaway', frequency: 'weekly', installmentCount: 3 });
    expect(plan.status).toBe(201);
    planId = plan.body.id;
    expect(plan.body.installments).toHaveLength(3);
    const sum = plan.body.installments.reduce(
      (s: number, i: { amountCents: number }) => s + i.amountCents,
      0,
    );
    expect(sum).toBe(90_000);

    // One plan per order.
    const dup = await ownerReq()
      .post(`/v1/orders/${orderId}/payment-plan`)
      .send({ installmentCount: 2 });
    expect(dup.status).toBe(400);
  });

  it('paying an installment lands as order money and drops the balance', async () => {
    const res = await ownerReq()
      .post(`/v1/payment-plans/${planId}/installments/1/pay`)
      .send({ method: 'cash' });
    expect(res.status).toBe(201);
    expect(res.body.installments[0].status).toBe('paid');

    const order = await ownerReq().get(`/v1/orders/${orderId}`);
    expect(order.body.paidCents).toBe(40_000); // 10k deposit + 30k installment
    expect(order.body.balanceDueCents).toBe(60_000);
    const installmentPayment = order.body.payments.find(
      (p: { kind: string }) => p.kind === 'installment',
    );
    expect(installmentPayment).toBeTruthy();
  });

  it('the overdue sweep marks past-due installments and reminds the customer', async () => {
    // Backdate installment 2 straight in the DB — simulating time passing.
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      await db
        .update(schema.paymentPlanInstallments)
        .set({ dueDate: '2026-01-01' })
        .where(eq(schema.paymentPlanInstallments.seq, 2));
    } finally {
      await sql.end({ timeout: 5 });
    }
    const res = await ownerReq().post('/v1/payment-plans/run-overdue').send({});
    expect(res.status).toBe(201);
    expect(res.body.marked).toBe(1);
    expect(res.body.reminded).toBe(1);

    const report = await ownerReq().get('/v1/payment-plans/overdue-report');
    expect(report.body.rows).toHaveLength(1);
    expect(report.body.totalOverdueCents).toBe(30_000);

    const mail = await request(app.getHttpServer())
      .get('/v1/dev/email/last')
      .query({ to: 'lay.away@example.test' });
    expect(mail.status).toBe(200);
    expect(mail.body.subject).toMatch(/reminder/i);
  });

  it('the nightly scheduler runs the same sweep cross-tenant and is idempotent', async () => {
    // Backdate installment 3 too, then run the sweep the way the nightly
    // timer does — through the scheduler service on the root connection.
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      await db
        .update(schema.paymentPlanInstallments)
        .set({ dueDate: '2026-01-02' })
        .where(eq(schema.paymentPlanInstallments.seq, 3));
    } finally {
      await sql.end({ timeout: 5 });
    }
    const scheduler = app.get(OverdueSchedulerService);
    const first = await scheduler.runSweep();
    expect(first.marked).toBe(1);
    expect(first.reminded).toBe(1);
    expect(first.businesses).toBe(1);
    // Second pass: nothing newly due, nothing re-mailed.
    const second = await scheduler.runSweep();
    expect(second.marked).toBe(0);
    expect(second.reminded).toBe(0);
  });

  it('paying out the plan completes it; completing the order splits commission 60/40', async () => {
    for (const seq of [2, 3]) {
      const res = await ownerReq()
        .post(`/v1/payment-plans/${planId}/installments/${seq}/pay`)
        .send({ method: 'cash' });
      expect(res.status).toBe(201);
    }
    const plans = await ownerReq().get('/v1/payment-plans');
    const plan = plans.body.find((p: { id: string }) => p.id === planId);
    expect(plan.status).toBe('completed');

    // Fulfill (pickup) then complete — balance is zero now.
    await ownerReq().post(`/v1/orders/${orderId}/fulfill`).send({}).expect(201);
    const done = await ownerReq().post(`/v1/orders/${orderId}/complete`).send({});
    expect(done.status).toBe(201);
    expect(done.body.status).toBe('completed');

    const report = await ownerReq().get(`/v1/commissions/report?period=${thisPeriod}`);
    const entries = report.body.entries.filter((e: { orderId: string }) => e.orderId === orderId);
    expect(entries).toHaveLength(2);
    const primary = entries.find(
      (e: { membershipId: string }) => e.membershipId === ownerMembershipId,
    );
    const second = entries.find(
      (e: { membershipId: string }) => e.membershipId === secondMembershipId,
    );
    // $1,000 total, 60/40 split, 5% rate.
    expect(primary.amountCents).toBe(3_000);
    expect(second.amountCents).toBe(2_000);
  });

  it('payroll: approve then mark paid', async () => {
    const report = await ownerReq().get(`/v1/commissions/report?period=${thisPeriod}`);
    const ids = report.body.entries
      .filter((e: { status: string }) => e.status === 'pending')
      .map((e: { id: string }) => e.id);
    const approve = await ownerReq()
      .post('/v1/commissions/entries/set-status')
      .send({ entryIds: ids, status: 'approved' });
    expect(approve.body.updated).toBe(ids.length);
    const pay = await ownerReq()
      .post('/v1/commissions/entries/set-status')
      .send({ entryIds: ids, status: 'paid' });
    expect(pay.body.updated).toBe(ids.length);
  });
});
