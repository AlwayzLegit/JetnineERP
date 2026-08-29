/**
 * Phase 2.5 acceptance: a merchant can define tax classes (e.g.
 * exempt for groceries, 10% for prepared food), assign them to
 * products, and at sale time each line is taxed at its product's
 * class rate — falling back to the location/business default for
 * products without a class.
 *
 * Also covers tax-class CRUD, the unique-name guard, deleting a
 * class with attached products (those products fall back to the
 * default), and that line.taxCents is persisted on sale_lines.
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
  process.env.TAXES_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_taxes';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'TaxPass!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let coffeeProductId = '';
let coffeeVariantId = '';
let milkProductId = '';
let milkVariantId = '';
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
        slug: 'taxes-test',
        name: 'Taxes Test Co',
        status: 'active',
        defaultTaxRateBps: 1000, // 10% — applies to lines without a tax class
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
    await makeUser('owner@taxes-test.local', 'Owner');
    await makeUser('cashier@taxes-test.local', 'Cashier');

    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Main', timezone: 'America/New_York' })
      .returning();
    locationId = loc!.id;

    const [coffeeProduct] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'COFFEE', name: 'Coffee' })
      .returning();
    coffeeProductId = coffeeProduct!.id;
    const [coffeeVariant] = await db
      .insert(schema.productVariants)
      .values({ businessId, productId: coffeeProduct!.id, sku: 'COFFEE-1', priceCents: 500 })
      .returning();
    coffeeVariantId = coffeeVariant!.id;

    const [milkProduct] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'MILK', name: 'Milk' })
      .returning();
    milkProductId = milkProduct!.id;
    const [milkVariant] = await db
      .insert(schema.productVariants)
      .values({ businessId, productId: milkProduct!.id, sku: 'MILK-1', priceCents: 300 })
      .returning();
    milkVariantId = milkVariant!.id;

    await db.insert(schema.inventoryLevels).values([
      { businessId, variantId: coffeeVariantId, locationId, onHand: 100 },
      { businessId, variantId: milkVariantId, locationId, onHand: 100 },
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

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'taxes-test-secret-taxes-test-secret-x';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  ownerCookie = await captureCookie('owner@taxes-test.local');
  cashierCookie = await captureCookie('cashier@taxes-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Phase 2.5 — Tax classes', () => {
  let exemptClassId = '';
  let preparedClassId = '';
  it('Owner creates an exempt tax class (0%)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/tax-classes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Exempt', rateBps: 0, description: 'Groceries, etc.' });
    expect(res.status).toBe(201);
    expect(res.body.rateBps).toBe(0);
    expect(res.body.productCount).toBe(0);
    exemptClassId = res.body.id;
  });

  it('Owner creates a prepared-food tax class (15%)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/tax-classes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Prepared', rateBps: 1500 });
    expect(res.status).toBe(201);
    preparedClassId = res.body.id;
  });

  it('Duplicate name returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/tax-classes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Exempt', rateBps: 0 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/);
  });

  it('Cashier (no business.settings.update) can list but not create', async () => {
    const list = await request(app.getHttpServer())
      .get('/v1/business/tax-classes')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    // cashier doesn't have business.settings.view either, so this 403s.
    expect(list.status).toBe(403);

    const create = await request(app.getHttpServer())
      .post('/v1/business/tax-classes')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Hacker', rateBps: 999 });
    expect(create.status).toBe(403);
  });

  it('Assign Exempt to milk + Prepared to coffee via PATCH /v1/products/:id', async () => {
    const milkRes = await request(app.getHttpServer())
      .patch(`/v1/products/${milkProductId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ taxClassId: exemptClassId });
    expect(milkRes.status).toBe(200);
    expect(milkRes.body.taxClassId).toBe(exemptClassId);

    const coffeeRes = await request(app.getHttpServer())
      .patch(`/v1/products/${coffeeProductId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ taxClassId: preparedClassId });
    expect(coffeeRes.status).toBe(200);
    expect(coffeeRes.body.taxClassId).toBe(preparedClassId);
  });

  it('Mixed sale: coffee 15%, milk 0% — tax = 15% × $5 + 0 = $0.75', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [
          { variantId: coffeeVariantId, quantity: 1 }, // $5.00 × 15% = $0.75
          { variantId: milkVariantId, quantity: 1 }, // $3.00 × 0% = $0.00
        ],
        payments: [{ method: 'cash', amountCents: 875 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.subtotalCents).toBe(800);
    expect(res.body.taxCents).toBe(75);
    expect(res.body.totalCents).toBe(875);
    // Per-line taxCents persisted to sale_lines.
    const coffeeLine = res.body.lines.find(
      (l: { variantId: string }) => l.variantId === coffeeVariantId,
    );
    const milkLine = res.body.lines.find(
      (l: { variantId: string }) => l.variantId === milkVariantId,
    );
    expect(coffeeLine.totalCents).toBe(500);
    expect(milkLine.totalCents).toBe(300);
  });

  it('Product without a tax class falls back to location/business default (10%)', async () => {
    // Detach milk's class so it falls back to the 10% business default.
    await request(app.getHttpServer())
      .patch(`/v1/products/${milkProductId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ taxClassId: null });

    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId: milkVariantId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 330 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.taxCents).toBe(30); // 300 × 10%
  });

  it('PATCH a tax-class rate, audit-log diffs the change', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/v1/business/tax-classes/${preparedClassId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ rateBps: 2000 });
    expect(res.status).toBe(200);
    expect(res.body.rateBps).toBe(2000);

    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      const audits = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, 'tax_class.update'));
      expect(audits.length).toBeGreaterThanOrEqual(1);
      expect(audits.at(-1)!.changesJson).toMatchObject({
        before: { rateBps: 1500 },
        after: { rateBps: 2000 },
      });
    } finally {
      await sqlc.end({ timeout: 5 });
    }
  });

  it('Delete a tax class — referencing products fall back to the default; audit metadata records the count', async () => {
    // Coffee currently uses Prepared. Delete Prepared.
    const list = await request(app.getHttpServer())
      .get('/v1/business/tax-classes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const prepared = list.body.find((c: { id: string }) => c.id === preparedClassId);
    expect(prepared.productCount).toBe(1);

    const del = await request(app.getHttpServer())
      .delete(`/v1/business/tax-classes/${preparedClassId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(del.status).toBe(200);

    // Coffee now has null tax_class_id.
    const coffee = await request(app.getHttpServer())
      .get(`/v1/products/${coffeeProductId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(coffee.body.taxClassId).toBeNull();
  });

  it('isDefault is single-flip: promoting one demotes the other', async () => {
    const a = await request(app.getHttpServer())
      .post('/v1/business/tax-classes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Standard', rateBps: 875, isDefault: true });
    expect(a.body.isDefault).toBe(true);

    const b = await request(app.getHttpServer())
      .post('/v1/business/tax-classes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Reduced', rateBps: 200, isDefault: true });
    expect(b.body.isDefault).toBe(true);

    const list = await request(app.getHttpServer())
      .get('/v1/business/tax-classes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const defaults = list.body.filter((c: { isDefault: boolean }) => c.isDefault);
    expect(defaults.length).toBe(1);
    expect(defaults[0].id).toBe(b.body.id);
  });

  it('Phase 2.18: per-location override shadows the class fallback at sale time', async () => {
    // Mint a fresh "Apparel" tax class with a 10% fallback.
    const apparel = await request(app.getHttpServer())
      .post('/v1/business/tax-classes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Apparel', rateBps: 1000 });
    expect(apparel.status).toBe(201);
    const apparelId = apparel.body.id as string;

    // Create a second location ("NJ") and override the rate to 0%.
    const njLoc = await request(app.getHttpServer())
      .post('/v1/business/locations')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'NJ Outlet', timezone: 'America/New_York' });
    expect(njLoc.status).toBe(201);
    const njLocationId = njLoc.body.id as string;
    // Inventory at the new location for the coffee variant.
    {
      const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
      try {
        await sql`INSERT INTO inventory_levels (business_id, variant_id, location_id, on_hand)
                  VALUES (${businessId}, ${coffeeVariantId}, ${njLocationId}, 100)`;
      } finally {
        await sql.end({ timeout: 5 });
      }
    }

    // Tag coffee with the Apparel class (we're not modeling real
    // categories — the test only cares that a class is attached so
    // the override path lights up).
    await request(app.getHttpServer())
      .patch(`/v1/products/${coffeeProductId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ taxClassId: apparelId });

    // Override: 0% in NJ.
    const upsert = await request(app.getHttpServer())
      .put(`/v1/business/tax-classes/${apparelId}/rates/${njLocationId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ rateBps: 0 });
    expect(upsert.status).toBe(200);
    expect(upsert.body.rateBps).toBe(0);

    // Sale at the original location uses the 10% fallback.
    const mainSale = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        lines: [{ variantId: coffeeVariantId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 550 }],
      });
    expect(mainSale.status).toBe(201);
    expect(mainSale.body.taxCents).toBe(50); // 500 * 10%
    expect(mainSale.body.totalCents).toBe(550);

    // Sale at the NJ location uses the 0% override.
    const njSale = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId: njLocationId,
        lines: [{ variantId: coffeeVariantId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 500 }],
      });
    expect(njSale.status).toBe(201);
    expect(njSale.body.taxCents).toBe(0);
    expect(njSale.body.totalCents).toBe(500);
  });

  it('Phase 2.18: list rates + delete override reverts to fallback', async () => {
    // List shows the override we just made.
    const apparels = await request(app.getHttpServer())
      .get('/v1/business/tax-classes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const apparel = apparels.body.find((c: { name: string }) => c.name === 'Apparel');
    expect(apparel).toBeDefined();

    const rates = await request(app.getHttpServer())
      .get(`/v1/business/tax-classes/${apparel.id}/rates`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(rates.status).toBe(200);
    expect(rates.body.length).toBe(1);
    expect(rates.body[0].rateBps).toBe(0);

    const njLocationId = rates.body[0].locationId as string;

    // Delete the override → next sale at NJ goes back to the
    // class's 10% fallback.
    const del = await request(app.getHttpServer())
      .delete(`/v1/business/tax-classes/${apparel.id}/rates/${njLocationId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(del.status).toBe(200);

    const sale = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId: njLocationId,
        lines: [{ variantId: coffeeVariantId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 550 }],
      });
    expect(sale.status).toBe(201);
    expect(sale.body.taxCents).toBe(50); // back to fallback
  });

  it('Phase 2.18: invalid rateBps is 400; missing class is 404', async () => {
    const apparels = await request(app.getHttpServer())
      .get('/v1/business/tax-classes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const apparel = apparels.body.find((c: { name: string }) => c.name === 'Apparel');
    const locs = await request(app.getHttpServer())
      .get('/v1/pos/locations')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const someLocId = locs.body[0].id as string;

    const bad = await request(app.getHttpServer())
      .put(`/v1/business/tax-classes/${apparel.id}/rates/${someLocId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ rateBps: -1 });
    expect(bad.status).toBe(400);

    const missing = await request(app.getHttpServer())
      .put(`/v1/business/tax-classes/00000000-0000-0000-0000-000000000000/rates/${someLocId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ rateBps: 500 });
    expect(missing.status).toBe(404);
  });

  it('pos/locations reports the EFFECTIVE tax rate — a location with no rate of its own inherits the business default', async () => {
    // "Main" is seeded with no taxRateBps: the written order taxes at the
    // business default (10%), so the register must display that too —
    // the raw null rendered as 0.00% on New Sale while the server
    // charged 9.75% (owner bug report).
    const locs = await request(app.getHttpServer())
      .get('/v1/pos/locations')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(locs.status).toBe(200);
    const main = locs.body.find((l: { name: string }) => l.name === 'Main');
    expect(main.taxRateBps).toBe(1000);
  });
});
