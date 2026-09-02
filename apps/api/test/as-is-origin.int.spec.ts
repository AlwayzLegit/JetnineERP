/**
 * As-Is review provenance (owner 2026-09-02): every piece says where it
 * came from — the invoice (sale or order) with its customer, the RMA
 * when a return authorized it, the transfer or PO for consolidation and
 * defect intake — resolved from reference_type/id so the review screen
 * can link straight to the document.
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
  process.env.AS_IS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_as_is';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'AsIsPass!2026xx';

let app: INestApplication;
let businessId = '';
let cookie = '';
const ids = { sale: '', order: '', transfer: '', po: '', customer: '' };

function withDb<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  return fn(db).finally(() => sql.end({ timeout: 5 }));
}

async function resetTestDb() {
  const env = { ...process.env, DATABASE_URL: TEST_DB_URL };
  for (const script of ['src/reset.ts', 'src/migrate.ts']) {
    execFileSync('pnpm', ['exec', 'tsx', script], { cwd: dbPackageRoot, env, stdio: 'inherit' });
  }
}

async function seed() {
  await withDb(async (db) => {
    const passwordHash = await hashPassword(PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'asis-test', name: 'As-Is Test Co', status: 'active' })
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
      .values({ email: 'wh@asis-test.local', emailVerified: true, name: 'Warehouse' })
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
      roleId: roles.get('Warehouse')!,
      status: 'active',
      acceptedAt: new Date(),
    });
    const locs = await db
      .insert(schema.locations)
      .values([
        { businessId, name: 'A Store', timezone: 'America/Los_Angeles' },
        {
          businessId,
          name: 'Main Warehouse',
          timezone: 'America/Los_Angeles',
          locationType: 'warehouse',
        },
      ])
      .returning();
    const store = locs[0]!.id;
    const wh = locs[1]!.id;
    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'AI-MAT', name: 'Queen As-Is Mattress' })
      .returning();
    const [v] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: p!.id,
        sku: 'AI-MAT-V',
        priceCents: 90_000,
        costCents: 40_000,
      })
      .returning();
    const [cust] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Ada', lastName: 'Return' })
      .returning();
    ids.customer = cust!.id;

    // 1. Register sale + refund → as-is by 'refund'.
    const [sale] = await db
      .insert(schema.sales)
      .values({
        businessId,
        locationId: store,
        number: 'S-AI-001',
        status: 'completed',
        customerId: cust!.id,
        subtotalCents: 90_000,
        totalCents: 90_000,
      })
      .returning();
    ids.sale = sale!.id;
    const [refund] = await db
      .insert(schema.refunds)
      .values({ businessId, saleId: sale!.id, reason: 'comfort', amountCents: 90_000 })
      .returning();
    // 2. Order + RMA → as-is by 'order_return'.
    const [order] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId: store,
        number: 'SO-AI-002',
        status: 'completed',
        customerId: cust!.id,
        subtotalCents: 90_000,
        totalCents: 90_000,
      })
      .returning();
    ids.order = order!.id;
    const [ret] = await db
      .insert(schema.orderReturns)
      .values({
        businessId,
        orderId: order!.id,
        customerId: cust!.id,
        rmaNumber: 'RMA-AI-002',
        status: 'received',
        amountCents: 90_000,
      })
      .returning();
    // 3. Transfer from the store → as-is by 'stock_transfer'.
    const [transfer] = await db
      .insert(schema.stockTransfers)
      .values({
        businessId,
        number: 'TR-AI-003',
        fromLocationId: store,
        toLocationId: wh,
        status: 'received',
      })
      .returning();
    ids.transfer = transfer!.id;
    // 4. Vendor + PO defect → as-is by 'purchase_order'.
    const [vendor] = await db
      .insert(schema.vendors)
      .values({ businessId, name: 'Helix' })
      .returning();
    const [po] = await db
      .insert(schema.purchaseOrders)
      .values({
        businessId,
        vendorId: vendor!.id,
        locationId: wh,
        number: 'PO-AI-004',
        status: 'received',
        subtotalCents: 0,
      })
      .returning();
    ids.po = po!.id;

    await db.insert(schema.asIsItems).values([
      {
        businessId,
        variantId: v!.id,
        locationId: store,
        quantity: 1,
        source: 'return',
        referenceType: 'refund',
        referenceId: refund!.id,
        pieceNumber: 'P-1',
      },
      {
        businessId,
        variantId: v!.id,
        locationId: store,
        quantity: 1,
        source: 'return',
        referenceType: 'order_return',
        referenceId: ret!.id,
        pieceNumber: 'P-2',
      },
      {
        businessId,
        variantId: v!.id,
        locationId: wh,
        quantity: 1,
        source: 'transfer',
        referenceType: 'stock_transfer',
        referenceId: transfer!.id,
        pieceNumber: 'P-3',
        createdAt: new Date(Date.now() - 90 * 86_400_000),
      },
      {
        businessId,
        variantId: v!.id,
        locationId: wh,
        quantity: 1,
        source: 'defect',
        referenceType: 'purchase_order',
        referenceId: po!.id,
        pieceNumber: 'P-4',
        createdAt: new Date(Date.now() - 90 * 86_400_000),
      },
      {
        businessId,
        variantId: v!.id,
        locationId: wh,
        quantity: 1,
        source: 'warranty',
        referenceType: 'manual',
        pieceNumber: 'P-5',
      },
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

beforeAll(async () => {
  await resetTestDb();
  await seed();
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'asis-test-secret-asis-test-secret-xxx';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();
  cookie = await captureCookie('wh@asis-test.local');
}, 180_000);

afterAll(async () => {
  if (app) await app.close();
});

describe('As-Is review provenance', () => {
  it('resolves every piece to the document it came from', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/as-is?limit=50')
      .set('Cookie', cookie)
      .set('x-business-id', businessId)
      .expect(200);
    const byPiece = new Map(res.body.data.map((r: { pieceNumber: string }) => [r.pieceNumber, r]));
    expect(byPiece.size).toBe(5);
    expect((byPiece.get('P-1') as { origin: unknown }).origin).toMatchObject({
      kind: 'sale',
      documentId: ids.sale,
      documentNumber: 'S-AI-001',
      customerId: ids.customer,
      customerName: 'Ada Return',
      rmaNumber: null,
    });
    expect((byPiece.get('P-2') as { origin: unknown }).origin).toMatchObject({
      kind: 'order_return',
      documentId: ids.order,
      documentNumber: 'SO-AI-002',
      rmaNumber: 'RMA-AI-002',
      customerName: 'Ada Return',
    });
    expect((byPiece.get('P-3') as { origin: unknown }).origin).toMatchObject({
      kind: 'stock_transfer',
      documentId: ids.transfer,
      documentNumber: 'TR-AI-003',
      fromName: 'A Store',
      customerName: null,
    });
    expect((byPiece.get('P-4') as { origin: unknown }).origin).toMatchObject({
      kind: 'purchase_order',
      documentId: ids.po,
      documentNumber: 'PO-AI-004',
      fromName: 'Helix',
    });
    expect((byPiece.get('P-5') as { origin: unknown }).origin).toBeNull();
  });

  it('carries the origin on the aging view too', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/as-is/aging')
      .set('Cookie', cookie)
      .set('x-business-id', businessId)
      .expect(200);
    // Only the two backdated pieces are old enough for the aging view.
    const pieces = res.body.map((r: { pieceNumber: string }) => r.pieceNumber).sort();
    expect(pieces).toEqual(['P-3', 'P-4']);
    expect(res.body.every((r: { origin: unknown }) => r.origin != null)).toBe(true);
  });
});
