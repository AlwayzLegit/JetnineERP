/**
 * Epic 1.10 acceptance:
 *   A cashier completes a sale paid 50% cash, 50% card, sees inventory
 *   decrement, views it in the sales list, refunds a single line, and
 *   the inventory is restored.
 *
 * Also covers POS lookup (barcode + name), payment-sum validation,
 * sale numbering, and per-role permission gates.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { and, eq } from 'drizzle-orm';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';

const TEST_DB_URL =
  process.env.SALES_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_sales';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'SalesPass!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let variantAId = '';
let variantBId = '';
let cashierCookie = '';
let ownerCookie = '';
let inventoryClerkCookie = '';

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
        slug: 'sales-test',
        name: 'Sales Test Co',
        status: 'active',
        defaultTaxRateBps: 1000, // 10% — used because the location has no override
      })
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
    await makeUser('owner@sales-test.local', 'Owner');
    await makeUser('cashier@sales-test.local', 'Cashier');
    await makeUser('clerk@sales-test.local', 'Inventory Clerk');

    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Main', timezone: 'America/New_York' })
      .returning();
    locationId = loc!.id;

    const [productA] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'COKE', name: 'Coca-Cola' })
      .returning();
    const [variantA] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: productA!.id,
        sku: 'COKE-12OZ',
        barcode: '049000000443',
        priceCents: 200,
      })
      .returning();
    variantAId = variantA!.id;

    const [productB] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'CHIPS', name: 'Lay’s Classic' })
      .returning();
    const [variantB] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: productB!.id,
        sku: 'CHIPS-1OZ',
        priceCents: 150,
      })
      .returning();
    variantBId = variantB!.id;

    // Stock starts: A=10, B=5 — set directly.
    await db.insert(schema.inventoryLevels).values([
      { businessId, variantId: variantAId, locationId, onHand: 10 },
      { businessId, variantId: variantBId, locationId, onHand: 5 },
    ]);
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

async function levelOf(variantId: string): Promise<number> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    const [row] = await db
      .select()
      .from(schema.inventoryLevels)
      .where(
        and(
          eq(schema.inventoryLevels.variantId, variantId),
          eq(schema.inventoryLevels.locationId, locationId),
        ),
      );
    return row?.onHand ?? 0;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'sales-test-secret-sales-test-secret-x';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true });
  await app.init();

  ownerCookie = await captureCookie('owner@sales-test.local');
  cashierCookie = await captureCookie('cashier@sales-test.local');
  inventoryClerkCookie = await captureCookie('clerk@sales-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Epic 1.10 — POS register & sales', () => {
  it('POS lookup by exact barcode returns one row', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/pos/lookup?q=049000000443')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].productName).toBe('Coca-Cola');
    expect(res.body[0].priceCents).toBe(200);
  });

  it('POS lookup by partial name matches via ILIKE fallback', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/pos/lookup?q=coca')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.some((r: { productName: string }) => r.productName === 'Coca-Cola')).toBe(true);
  });

  it('Inventory clerk (no pos.access) is blocked from lookup', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/pos/lookup?q=coke')
      .set('Cookie', inventoryClerkCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/pos\.access/);
  });

  let saleId = '';
  let saleNumber = '';
  let saleLineAId = '';
  it('Cashier completes a 50/50 cash+card sale, decrements inventory, audit-logs', async () => {
    // Cart: 2 Coke @ $2.00 + 1 Chips @ $1.50 = $5.50 subtotal
    // Tax 10% = $0.55, total = $6.05 (605¢). Split: $3.03 cash + $3.02 card.
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [
          { variantId: variantAId, quantity: 2 },
          { variantId: variantBId, quantity: 1 },
        ],
        payments: [
          { method: 'cash', amountCents: 303 },
          { method: 'card', amountCents: 302 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('completed');
    expect(res.body.subtotalCents).toBe(550);
    expect(res.body.taxCents).toBe(55);
    expect(res.body.totalCents).toBe(605);
    expect(res.body.payments).toHaveLength(2);
    expect(res.body.lines).toHaveLength(2);
    expect(res.body.number).toMatch(/^INV-\d{4}-\d{6}$/);
    saleId = res.body.id;
    saleNumber = res.body.number;
    saleLineAId = res.body.lines.find((l: { variantId: string }) => l.variantId === variantAId).id;

    expect(await levelOf(variantAId)).toBe(8); // 10 - 2
    expect(await levelOf(variantBId)).toBe(4); // 5 - 1

    // Audit row.
    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      const audits = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, 'sale.complete'));
      expect(audits.length).toBe(1);
      expect(audits[0]!.changesJson).toMatchObject({
        after: { number: saleNumber, totalCents: 605, lineCount: 2 },
      });
    } finally {
      await sqlc.end({ timeout: 5 });
    }
  });

  it('Sale appears in the list and renders detail with payments', async () => {
    const list = await request(app.getHttpServer())
      .get('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(list.status).toBe(200);
    expect(list.body[0].id).toBe(saleId);

    const detail = await request(app.getHttpServer())
      .get(`/v1/sales/${saleId}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(detail.status).toBe(200);
    expect(detail.body.payments.map((p: { method: string }) => p.method).sort()).toEqual([
      'card',
      'cash',
    ]);
    expect(
      detail.body.lines.every((l: { refundedQuantity: number }) => l.refundedQuantity === 0),
    ).toBe(true);
  });

  it('Payment sum mismatch returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId: variantBId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 100 }], // total would be 165
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/payments sum/);
  });

  it('Cashier without pos.refund.create is denied', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/sales/${saleId}/refund`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ saleLineId: saleLineAId, quantity: 1 }] });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/pos\.refund\.create/);
  });

  it('Owner refunds 1 unit of line A, inventory restores, sale becomes partially_refunded', async () => {
    const before = await levelOf(variantAId);
    const res = await request(app.getHttpServer())
      .post(`/v1/sales/${saleId}/refund`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        reason: 'customer changed mind',
        lines: [{ saleLineId: saleLineAId, quantity: 1 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.amountCents).toBe(200); // 1 unit * $2.00
    expect(res.body.saleStatus).toBe('partially_refunded');
    expect(await levelOf(variantAId)).toBe(before + 1);

    // Detail shows refunded quantity.
    const detail = await request(app.getHttpServer())
      .get(`/v1/sales/${saleId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const lineA = detail.body.lines.find((l: { id: string }) => l.id === saleLineAId);
    expect(lineA.refundedQuantity).toBe(1);
  });

  it('Refunding more than remaining returns 400', async () => {
    // Line A had qty 2, 1 already refunded; trying to refund 5 should fail.
    const res = await request(app.getHttpServer())
      .post(`/v1/sales/${saleId}/refund`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ saleLineId: saleLineAId, quantity: 5 }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/only 1 remaining/);
  });

  it('Refunding the rest moves sale to "refunded"', async () => {
    const detail = await request(app.getHttpServer())
      .get(`/v1/sales/${saleId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const lineB = detail.body.lines.find((l: { variantId: string }) => l.variantId === variantBId);

    const res = await request(app.getHttpServer())
      .post(`/v1/sales/${saleId}/refund`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        lines: [
          { saleLineId: saleLineAId, quantity: 1 },
          { saleLineId: lineB.id, quantity: 1 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.saleStatus).toBe('refunded');
    expect(await levelOf(variantAId)).toBe(10);
    expect(await levelOf(variantBId)).toBe(5);
  });

  it('Sale numbers increment within the same year', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId: variantBId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 165 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.number).not.toBe(saleNumber);
    expect(res.body.number).toMatch(/^INV-\d{4}-\d{6}$/);
  });
});
