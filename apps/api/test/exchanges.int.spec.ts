/**
 * Enter an Exchange (docs/erp-exchange): the container over a customer
 * return and a replacement sales order. Covers the uneven happy path
 * (credit nets against the replacement through the store-credit
 * ledger), the restocking fee (percent + sticky override), the E1
 * approval hold, the financed-original even-exchange rule, Split
 * Exchange restoring plain-refund behavior, cancel, the no-original
 * (pre-cutover) path, and the same-customer guard.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq, sql as dsql } from 'drizzle-orm';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';

const TEST_DB_URL =
  process.env.EXCHANGES_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_exchanges';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'Exchange!2026x';

let app: INestApplication;
let businessId = '';
let locationId = '';
let customerId = '';
let otherCustomerId = '';
let v1Id = ''; // original product
let v2Id = ''; // replacement product
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

async function withDb<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
  try {
    return await fn(drizzle(sql2));
  } finally {
    await sql2.end({ timeout: 5 });
  }
}

async function seed() {
  await withDb(async (db) => {
    const passwordHash = await hashPassword(PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'exchange-test', name: 'Exchange Test Co', status: 'active' })
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
      .values({ email: 'owner@exchange-test.local', emailVerified: true, name: 'Owner' })
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
      .values({ businessId, name: 'Store', timezone: 'America/Los_Angeles', taxRateBps: 0 })
      .returning();
    locationId = loc!.id;

    const [cust] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Casey', lastName: 'Swap', email: 'casey@example.test' })
      .returning();
    customerId = cust!.id;
    const [cust2] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Alex', lastName: 'Other' })
      .returning();
    otherCustomerId = cust2!.id;

    const [p1] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'FIRM', name: 'Firm Queen' })
      .returning();
    const [va] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: p1!.id,
        sku: 'FIRM-Q',
        priceCents: 50_000,
        costCents: 20_000,
      })
      .returning();
    v1Id = va!.id;
    const [p2] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'PLUSH', name: 'Plush Queen' })
      .returning();
    const [vb] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: p2!.id,
        sku: 'PLUSH-Q',
        priceCents: 60_000,
        costCents: 25_000,
      })
      .returning();
    v2Id = vb!.id;

    await db.insert(schema.inventoryLevels).values([
      { businessId, variantId: v1Id, locationId, onHand: 20, reserved: 0 },
      { businessId, variantId: v2Id, locationId, onHand: 20, reserved: 0 },
    ]);
  });
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

function owner() {
  const base = (method: 'get' | 'post' | 'patch') => (url: string) =>
    request(app.getHttpServer())
      [method](url)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
  return { get: base('get'), post: base('post'), patch: base('patch') };
}

/** Original sold + paid (cash) + fulfilled, ready to exchange. */
async function soldOriginal(
  variantId: string,
  priceCents: number,
): Promise<{
  orderId: string;
  lineId: string;
}> {
  const created = await owner()
    .post('/v1/orders')
    .send({ locationId, customerId, confirm: true, lines: [{ variantId, quantity: 1 }] });
  expect(created.status).toBe(201);
  await owner()
    .post(`/v1/orders/${created.body.id}/payments`)
    .send({ method: 'cash', amountCents: priceCents, kind: 'deposit' })
    .expect(201);
  const fulfilled = await owner().post(`/v1/orders/${created.body.id}/fulfill`).send({});
  expect(fulfilled.status).toBe(201);
  return { orderId: created.body.id, lineId: created.body.lines[0].id };
}

/** Replacement order written against the original + an authorized pickup return. */
async function legsFor(
  originalOrderId: string,
  originalLineId: string,
  replacementVariantId: string,
): Promise<{ saleOrderId: string; returnId: string }> {
  const replacement = await owner()
    .post(`/v1/orders/${originalOrderId}/exchange`)
    .send({ locationId, confirm: true, lines: [{ variantId: replacementVariantId, quantity: 1 }] });
  expect(replacement.status).toBe(201);
  const authorized = await owner()
    .post(`/v1/orders/${originalOrderId}/return`)
    .send({ lines: [{ lineId: originalLineId, quantity: 1 }], fulfillment: 'pickup' });
  expect(authorized.status).toBe(201);
  const returns = await owner().get(
    `/v1/order-returns?orderId=${originalOrderId}&status=authorized`,
  );
  expect(returns.body).toHaveLength(1);
  return { saleOrderId: replacement.body.id, returnId: returns.body[0].id };
}

async function ledgerBalance(custId: string): Promise<number> {
  return withDb(async (db) => {
    const [row] = await db
      .select({ sum: dsql<number>`coalesce(sum(${schema.storeCreditEntries.deltaCents}), 0)::int` })
      .from(schema.storeCreditEntries)
      .where(eq(schema.storeCreditEntries.customerId, custId));
    return row?.sum ?? 0;
  });
}

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'exchange-test-secret-exchange-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.RESEND_API_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();
  ownerCookie = await captureCookie('owner@exchange-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Enter an Exchange — container over a return and a replacement order', () => {
  it('uneven exchange: return credit nets against the replacement through the ledger', async () => {
    const orig = await soldOriginal(v1Id, 50_000);
    const { saleOrderId, returnId } = await legsFor(orig.orderId, orig.lineId, v2Id);

    const bound = await owner().post('/v1/exchanges').send({ saleOrderId, returnId });
    expect(bound.status).toBe(201);
    expect(bound.body.number).toMatch(/^EX-\d{4}-\d{6}$/);
    expect(bound.body.status).toBe('open');
    expect(bound.body.settlement.returnCents).toBe(50_000);
    expect(bound.body.settlement.creditCents).toBe(50_000);
    expect(bound.body.settlement.saleTotalCents).toBe(60_000);

    // The pair is spoken for.
    const dup = await owner().post('/v1/exchanges').send({ saleOrderId, returnId });
    expect(dup.status).toBe(409);

    // Goods come back → settlement fires against the replacement.
    await owner().post(`/v1/order-returns/${returnId}/receive`).send({}).expect(201);

    const detail = await owner().get(`/v1/exchanges/${bound.body.id}`);
    expect(detail.body.settlement.salePaidCents).toBe(50_000);
    expect(detail.body.settlement.saleBalanceDueCents).toBe(10_000);

    await withDb(async (db) => {
      // Credit landed on the replacement as a store-credit tender…
      const salePayments = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.orderId, saleOrderId));
      expect(salePayments).toHaveLength(1);
      expect(salePayments[0]!.method).toBe('store_credit');
      expect(salePayments[0]!.amountCents).toBe(50_000);
      // …no cash refund on the original…
      const origPayments = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.orderId, orig.orderId));
      expect(origPayments.filter((p) => p.amountCents < 0)).toHaveLength(0);
      // …the goods staged in As-Is review…
      const pieces = await db
        .select()
        .from(schema.asIsItems)
        .where(
          and(
            eq(schema.asIsItems.referenceType, 'order'),
            eq(schema.asIsItems.referenceId, orig.orderId),
          ),
        );
      expect(pieces).toHaveLength(1);
    });
    // …and the ledger nets to zero (issue then redeem).
    expect(await ledgerBalance(customerId)).toBe(0);
  });

  it('restocking fee: percent of the credit, sticky override, both audited', async () => {
    await owner()
      .patch('/v1/business/settings')
      .send({ ops: { restockingFeePercent: 10 } })
      .expect(200);

    const orig = await soldOriginal(v1Id, 50_000);
    const { saleOrderId, returnId } = await legsFor(orig.orderId, orig.lineId, v2Id);

    // Overriding away from the calculated 5,000 needs the permission
    // (the owner has it) and marks the fee sticky.
    const bound = await owner()
      .post('/v1/exchanges')
      .send({ saleOrderId, returnId, restockingFeeCents: 2_000 });
    expect(bound.status).toBe(201);
    expect(bound.body.restockingFeeCents).toBe(2_000);
    expect(bound.body.restockingFeeOverridden).toBe(true);
    expect(bound.body.settlement.creditCents).toBe(48_000);

    await owner().post(`/v1/order-returns/${returnId}/receive`).send({}).expect(201);
    const detail = await owner().get(`/v1/exchanges/${bound.body.id}`);
    expect(detail.body.settlement.salePaidCents).toBe(48_000);
    expect(detail.body.settlement.saleBalanceDueCents).toBe(12_000);
    expect(await ledgerBalance(customerId)).toBe(0);

    await withDb(async (db) => {
      const [auditRow] = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, 'exchange.restocking_fee.override'))
        .limit(1);
      expect(auditRow).toBeTruthy();
    });

    await owner()
      .patch('/v1/business/settings')
      .send({ ops: { restockingFeePercent: null } })
      .expect(200);
  });

  it('E1 hold: a held exchange refuses settlement until approved', async () => {
    await owner()
      .patch('/v1/business/settings')
      .send({ ops: { exchangeHoldAtEntry: true } })
      .expect(200);

    const orig = await soldOriginal(v1Id, 50_000);
    const { saleOrderId, returnId } = await legsFor(orig.orderId, orig.lineId, v2Id);
    const bound = await owner().post('/v1/exchanges').send({ saleOrderId, returnId });
    expect(bound.status).toBe(201);
    expect(bound.body.status).toBe('on_hold');

    const blocked = await owner().post(`/v1/order-returns/${returnId}/receive`).send({});
    expect(blocked.status).toBe(409);
    expect(blocked.body.message).toMatch(/held for approval/);

    const approved = await owner().post(`/v1/exchanges/${bound.body.id}/approve`).send({});
    expect(approved.status).toBe(201);
    expect(approved.body.status).toBe('open');
    await owner().post(`/v1/order-returns/${returnId}/receive`).send({}).expect(201);

    await owner()
      .patch('/v1/business/settings')
      .send({ ops: { exchangeHoldAtEntry: false } })
      .expect(200);
  });

  it('financed original: only a like-for-like even exchange binds', async () => {
    const created = await owner()
      .post('/v1/orders')
      .send({ locationId, customerId, confirm: true, lines: [{ variantId: v1Id, quantity: 1 }] });
    expect(created.status).toBe(201);
    await withDb(async (db) => {
      await db.insert(schema.payments).values({
        businessId,
        saleId: null,
        orderId: created.body.id,
        kind: 'deposit',
        method: 'financing',
        amountCents: 50_000,
        status: 'succeeded',
        financingProvider: 'Acima',
        financingRef: 'FIN-1',
      });
    });
    await owner().post(`/v1/orders/${created.body.id}/fulfill`).send({}).expect(201);

    const { saleOrderId, returnId } = await legsFor(
      created.body.id,
      created.body.lines[0].id,
      v2Id,
    );
    const uneven = await owner().post('/v1/exchanges').send({ saleOrderId, returnId });
    expect(uneven.status).toBe(400);
    expect(uneven.body.message).toMatch(/financed/);

    const mismatched = await owner()
      .post('/v1/exchanges')
      .send({ saleOrderId, returnId, evenExchange: true });
    expect(mismatched.status).toBe(400);
    expect(mismatched.body.message).toMatch(/like-for-like/);

    // A same-variant replacement qualifies.
    const even = await owner()
      .post(`/v1/orders/${created.body.id}/exchange`)
      .send({ locationId, confirm: true, lines: [{ variantId: v1Id, quantity: 1 }] });
    expect(even.status).toBe(201);
    const ok = await owner()
      .post('/v1/exchanges')
      .send({ saleOrderId: even.body.id, returnId, evenExchange: true });
    expect(ok.status).toBe(201);
    expect(ok.body.evenExchange).toBe(true);
  });

  it('split dissolves the container — the return refunds plainly again', async () => {
    const orig = await soldOriginal(v1Id, 50_000);
    const { saleOrderId, returnId } = await legsFor(orig.orderId, orig.lineId, v2Id);
    const bound = await owner().post('/v1/exchanges').send({ saleOrderId, returnId });
    expect(bound.status).toBe(201);

    const split = await owner().post(`/v1/exchanges/${bound.body.id}/split`).send({});
    expect(split.status).toBe(201);
    expect(split.body.status).toBe('split');

    await owner().post(`/v1/order-returns/${returnId}/receive`).send({}).expect(201);
    await withDb(async (db) => {
      // Plain refund path: negative tender back on the ORIGINAL order…
      const origPayments = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.orderId, orig.orderId));
      expect(origPayments.filter((p) => p.amountCents < 0)).toHaveLength(1);
      // …and nothing landed on the replacement.
      const salePayments = await db
        .select()
        .from(schema.payments)
        .where(eq(schema.payments.orderId, saleOrderId));
      expect(salePayments).toHaveLength(0);
    });
  });

  it('cancel voids the container and the return authorization together', async () => {
    const orig = await soldOriginal(v1Id, 50_000);
    const { saleOrderId, returnId } = await legsFor(orig.orderId, orig.lineId, v2Id);
    const bound = await owner().post('/v1/exchanges').send({ saleOrderId, returnId });
    expect(bound.status).toBe(201);

    const cancelled = await owner()
      .post(`/v1/exchanges/${bound.body.id}/cancel`)
      .send({ reason: 'Customer changed their mind' });
    expect(cancelled.status).toBe(201);
    expect(cancelled.body.status).toBe('cancelled');

    const returns = await owner().get(`/v1/order-returns?orderId=${orig.orderId}`);
    expect(returns.body[0].status).toBe('cancelled');
  });

  it('no-original (pre-cutover) exchange applies the banked credit at bind', async () => {
    const noOrig = await owner()
      .post('/v1/order-returns/no-original')
      .send({
        customerId,
        locationId,
        referencedOrderNumber: 'STORIS-445566',
        lines: [{ variantId: v1Id, quantity: 1, unitRefundCents: 30_000 }],
      });
    expect(noOrig.status).toBe(201);
    expect(await ledgerBalance(customerId)).toBe(30_000);

    const replacement = await owner()
      .post('/v1/orders')
      .send({ locationId, customerId, confirm: true, lines: [{ variantId: v2Id, quantity: 1 }] });
    expect(replacement.status).toBe(201);

    const bound = await owner()
      .post('/v1/exchanges')
      .send({ saleOrderId: replacement.body.id, returnId: noOrig.body.id });
    expect(bound.status).toBe(201);
    expect(bound.body.referencedOrderNumber).toBe('STORIS-445566');
    expect(bound.body.settlement.salePaidCents).toBe(30_000);
    expect(bound.body.settlement.saleBalanceDueCents).toBe(30_000);
    expect(await ledgerBalance(customerId)).toBe(0);
  });

  it('the replacement must bill the return customer', async () => {
    const orig = await soldOriginal(v1Id, 50_000);
    const authorized = await owner()
      .post(`/v1/orders/${orig.orderId}/return`)
      .send({ lines: [{ lineId: orig.lineId, quantity: 1 }], fulfillment: 'pickup' });
    expect(authorized.status).toBe(201);
    const returns = await owner().get(
      `/v1/order-returns?orderId=${orig.orderId}&status=authorized`,
    );
    const strangerOrder = await owner()
      .post('/v1/orders')
      .send({
        locationId,
        customerId: otherCustomerId,
        confirm: true,
        lines: [{ variantId: v2Id, quantity: 1 }],
      });
    expect(strangerOrder.status).toBe(201);
    const bound = await owner()
      .post('/v1/exchanges')
      .send({ saleOrderId: strangerOrder.body.id, returnId: returns.body[0].id });
    expect(bound.status).toBe(400);
    expect(bound.body.message).toMatch(/same customer/);
  });
});
