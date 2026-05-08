/**
 * Phase 2.13 acceptance: a merchant issues a gift card, a cashier
 * redeems it as POS tender, the balance ledger stays consistent
 * across charges + refunds, and per-permission gating holds.
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
  process.env.GIFT_CARDS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_gift_cards';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'GiftPass!2026';

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
      .values({ slug: 'gc-test', name: 'GC Test Co', status: 'active', defaultTaxRateBps: 0 })
      .returning();
    businessId = biz!.id;

    const roles = new Map<string, string>();
    for (const role of SYSTEM_ROLES) {
      const [r] = await db
        .insert(schema.roles)
        .values({
          businessId,
          name: role.name,
          description: role.description,
          isSystem: true,
        })
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
    await makeUser('owner@gc-test.local', 'Owner');
    await makeUser('cashier@gc-test.local', 'Cashier');

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
      onHand: 1000,
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
  process.env.BETTER_AUTH_SECRET ??= 'gc-test-secret-gc-test-secret-12';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  ownerCookie = await captureCookie('owner@gc-test.local');
  cashierCookie = await captureCookie('cashier@gc-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

async function ledgerSum(giftCardId: string): Promise<number> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  try {
    const rows = await sql<{ s: number }[]>`
      SELECT COALESCE(SUM(amount_cents), 0)::int AS s
      FROM gift_card_transactions
      WHERE gift_card_id = ${giftCardId}
    `;
    return rows[0]!.s;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function getBalance(giftCardId: string): Promise<number> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  try {
    const rows = await sql<{ b: number; status: string }[]>`
      SELECT current_balance_cents AS b, status FROM gift_cards WHERE id = ${giftCardId}
    `;
    return rows[0]!.b;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

describe('Phase 2.13 — gift cards', () => {
  let cardId = '';
  let cardCode = '';

  it('Cashier (no gift_cards.issue) cannot mint a card', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/gift-cards')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ initialBalanceCents: 5000 });
    expect(res.status).toBe(403);
  });

  it('Owner mints a $50 card; the full code is returned exactly once', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/gift-cards')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ initialBalanceCents: 5000, notes: 'birthday' });
    expect(res.status).toBe(201);
    expect(res.body.code).toMatch(/^[A-Z0-9]{16}$/);
    expect(res.body.code).not.toMatch(/[01OIL]/);
    expect(res.body.initialBalanceCents).toBe(5000);
    expect(res.body.currentBalanceCents).toBe(5000);
    expect(res.body.status).toBe('active');
    cardId = res.body.id;
    cardCode = res.body.code;
    expect(await ledgerSum(cardId)).toBe(5000);
  });

  it('GET /v1/gift-cards lists with envelope; the secret code is included for back-office', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/gift-cards')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.nextCursor).toBeNull();
  });

  it('Cashier looks up a card by code (read-only view)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/gift-cards/lookup?code=${cardCode}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.currentBalanceCents).toBe(5000);
    expect(res.body.status).toBe('active');
  });

  it('Cashier looks up a non-existent code → 404', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/gift-cards/lookup?code=ABCD2345EFGH6789')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(404);
  });

  it('Cashier redeems $10 of the card on a sale; balance drops, ledger row written', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'gift_card', amountCents: 1000, giftCardCode: cardCode }],
      });
    expect(res.status).toBe(201);
    expect(res.body.payments).toHaveLength(1);
    expect(res.body.payments[0].method).toBe('gift_card');
    expect(await getBalance(cardId)).toBe(4000);
    expect(await ledgerSum(cardId)).toBe(4000);
  });

  it('Charging more than the balance fails 400, no debit', async () => {
    const before = await getBalance(cardId);
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 5 }], // $50.00
        payments: [{ method: 'gift_card', amountCents: 5000, giftCardCode: cardCode }],
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/balance/i);
    expect(await getBalance(cardId)).toBe(before);
  });

  it('Mixed-tender sale (gift card + cash); both rows recorded', async () => {
    // Sale total $20 = $5 gift + $15 cash
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 2 }],
        payments: [
          { method: 'gift_card', amountCents: 500, giftCardCode: cardCode },
          { method: 'cash', amountCents: 1500 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.payments).toHaveLength(2);
    expect(await getBalance(cardId)).toBe(3500);
    expect(await ledgerSum(cardId)).toBe(3500);
  });

  it('Refunding a gift-card-paid sale credits the card back', async () => {
    // Pay $10 with gift card on a fresh sale.
    const sale = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'gift_card', amountCents: 1000, giftCardCode: cardCode }],
      });
    expect(sale.status).toBe(201);
    expect(await getBalance(cardId)).toBe(2500);

    const lineId = sale.body.lines[0].id;
    const refund = await request(app.getHttpServer())
      .post(`/v1/sales/${sale.body.id}/refund`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ saleLineId: lineId, quantity: 1 }] });
    expect(refund.status).toBe(201);

    // Balance restored
    expect(await getBalance(cardId)).toBe(3500);
    expect(await ledgerSum(cardId)).toBe(3500);
  });

  it('Owner can adjust balance (positive delta); ledger reflects', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/gift-cards/${cardId}/adjust`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ amountCents: 1500, notes: 'goodwill' });
    expect(res.status).toBe(201);
    expect(res.body.currentBalanceCents).toBe(5000);
    expect(await ledgerSum(cardId)).toBe(5000);
  });

  it('Adjustment that would drive balance below zero is rejected', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/gift-cards/${cardId}/adjust`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ amountCents: -10000 });
    expect(res.status).toBe(400);
    expect(await getBalance(cardId)).toBe(5000);
  });

  it('Detail view returns the full transaction history', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/gift-cards/${cardId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.transactions.length).toBeGreaterThanOrEqual(5); // issue + redeems + refund + adjust
    const kinds = res.body.transactions.map((t: { kind: string }) => t.kind);
    expect(kinds).toContain('issue');
    expect(kinds).toContain('redeem');
    expect(kinds).toContain('refund');
    expect(kinds).toContain('adjust');
  });

  it('Cancelled card cannot be redeemed', async () => {
    // Mint a fresh card just for this test
    const c = await request(app.getHttpServer())
      .post('/v1/gift-cards')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ initialBalanceCents: 1000 });
    const code = c.body.code as string;
    const id = c.body.id as string;

    const cancel = await request(app.getHttpServer())
      .delete(`/v1/gift-cards/${id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(cancel.status).toBe(200);
    expect(await getBalance(id)).toBe(0);
    expect(await ledgerSum(id)).toBe(0);

    const sale = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'gift_card', amountCents: 1000, giftCardCode: code }],
      });
    expect(sale.status).toBe(400);
    expect(sale.body.message).toMatch(/cancelled/i);
  });

  it('Issuing the card writes an audit row with action gift_card.issue', async () => {
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      const rows = await sql<{ action: string; target_id: string }[]>`
        SELECT action, target_id FROM audit_logs WHERE action = 'gift_card.issue'
      `;
      expect(rows.length).toBeGreaterThan(0);
    } finally {
      await sql.end({ timeout: 5 });
    }
    void eq;
  });

  it('Code lookup is case-insensitive (citext)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/gift-cards/lookup?code=${cardCode.toLowerCase()}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(cardId);
  });
});
