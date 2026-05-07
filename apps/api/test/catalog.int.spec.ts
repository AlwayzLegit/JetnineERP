/**
 * Epic 1.7 acceptance: a user creates a product with 3 variants, uploads
 * (registers) an image, and finds the product by partial SKU and by barcode.
 *
 * Also exercises the rest of the catalog: categories tree depth limit,
 * cost redaction without products.cost.view, image cap of 4, and CSV
 * import preview + commit.
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
  process.env.CATALOG_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_catalog';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'CatalogPass!2026';

let app: INestApplication;
let businessId: string;
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

async function seed(): Promise<void> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    const passwordHash = await hashPassword(PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'catalog-test', name: 'Catalog Test Co', status: 'active' })
      .returning();
    businessId = biz!.id;

    const roles = new Map<string, string>();
    for (const role of SYSTEM_ROLES) {
      const [r] = await db
        .insert(schema.roles)
        .values({
          businessId: biz!.id,
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
        businessId: biz!.id,
        userId: u!.id,
        roleId: roles.get(role)!,
        status: 'active',
        acceptedAt: new Date(),
      });
    }
    await makeUser('owner@catalog-test.local', 'Owner');
    await makeUser('cashier@catalog-test.local', 'Cashier');
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
  process.env.BETTER_AUTH_SECRET ??= 'catalog-test-secret-catalog-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.WEB_BASE_URL ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true });
  await app.init();

  ownerCookie = await captureCookie('owner@catalog-test.local');
  cashierCookie = await captureCookie('cashier@catalog-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Epic 1.7 — Product catalog', () => {
  let categoryId = '';
  let productId = '';

  it('Owner creates a category', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/categories')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Furniture' });
    expect(res.status).toBe(201);
    categoryId = res.body.id as string;
  });

  it('Categories enforce a 3-level depth limit', async () => {
    const child = await request(app.getHttpServer())
      .post('/v1/categories')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Sofas', parentId: categoryId });
    expect(child.status).toBe(201);
    const grand = await request(app.getHttpServer())
      .post('/v1/categories')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Sectionals', parentId: child.body.id });
    expect(grand.status).toBe(201);
    const tooDeep = await request(app.getHttpServer())
      .post('/v1/categories')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'L-Shaped', parentId: grand.body.id });
    expect(tooDeep.status).toBe(400);
    expect(tooDeep.body.message).toMatch(/3 levels/i);
  });

  it('Owner creates a product with 3 variants', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/products')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        sku: 'WIDGET-001',
        name: 'Premium Widget',
        description: 'A widget that searches well',
        categoryId,
        variants: [
          {
            sku: 'WIDGET-001-SM',
            name: 'Small',
            priceCents: 1999,
            costCents: 800,
            barcode: '0123456789012',
          },
          {
            sku: 'WIDGET-001-MD',
            name: 'Medium',
            priceCents: 2999,
            costCents: 1100,
            barcode: '0123456789013',
          },
          {
            sku: 'WIDGET-001-LG',
            name: 'Large',
            priceCents: 3999,
            costCents: 1400,
            barcode: '0123456789014',
          },
        ],
      });
    expect(res.status).toBe(201);
    productId = res.body.id as string;
    expect(res.body.variants).toHaveLength(3);
    // Owner has products.cost.view (Owner role has all permissions),
    // so costCents survives the response shaping.
    expect(res.body.variants[0].costCents).toBe(800);
  });

  it('Find by partial SKU returns the product', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/products?q=WIDGET-001-MD')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    const ids = (res.body as { id: string; name: string }[]).map((p) => p.id);
    expect(ids).toContain(productId);
  });

  it('Find by barcode returns the product', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/products?q=0123456789013')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    const ids = (res.body as { id: string }[]).map((p) => p.id);
    expect(ids).toContain(productId);
  });

  it('Find by free-text name matches', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/products?q=Premium')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    const ids = (res.body as { id: string }[]).map((p) => p.id);
    expect(ids).toContain(productId);
  });

  it('Cashier (products.view but not products.cost.view) sees prices but not costs', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/products/${productId}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.variants[0].priceCents).toBe(1999);
    expect(res.body.variants[0].costCents).toBeNull();
  });

  it('Owner registers up to 4 product images; the 5th is rejected', async () => {
    for (let i = 0; i < 4; i++) {
      const url = await request(app.getHttpServer())
        .post(`/v1/products/${productId}/images/upload-url`)
        .set('Cookie', ownerCookie)
        .set('X-Business-Id', businessId)
        .send({ contentType: 'image/png', filename: `img${i}.png` });
      expect(url.status).toBe(201);
      const reg = await request(app.getHttpServer())
        .post(`/v1/products/${productId}/images`)
        .set('Cookie', ownerCookie)
        .set('X-Business-Id', businessId)
        .send({ storageKey: url.body.storageKey, position: i });
      expect(reg.status).toBe(201);
    }
    const fifth = await request(app.getHttpServer())
      .post(`/v1/products/${productId}/images/upload-url`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ contentType: 'image/png' });
    expect(fifth.status).toBe(409);
  });

  it('Product detail includes the 4 registered images', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/products/${productId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.images).toHaveLength(4);
    expect(res.body.images[0].storageKey).toContain(`businesses/${businessId}/products/`);
  });

  it('CSV import preview parses rows, then commit creates products', async () => {
    const csv = [
      'name,sku,price,barcode',
      'Widget A,WGT-A,12.50,A0001',
      'Widget B,WGT-B,5.00,A0002',
      'Widget C,WGT-C,99,', // no barcode
    ].join('\n');

    const preview = await request(app.getHttpServer())
      .post('/v1/products/import/preview')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ csv });
    expect(preview.status).toBe(201);
    expect(preview.body.rows).toHaveLength(3);
    expect(preview.body.errors).toHaveLength(0);
    expect(preview.body.conflicts).toHaveLength(0);
    expect(preview.body.rows[0].priceCents).toBe(1250);

    const commit = await request(app.getHttpServer())
      .post('/v1/products/import/commit')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ csv });
    expect(commit.status).toBe(201);
    expect(commit.body.inserted).toBe(3);
    expect(commit.body.productIds).toHaveLength(3);

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const variants = await db
        .select()
        .from(schema.productVariants)
        .where(eq(schema.productVariants.sku, 'WGT-A'));
      expect(variants).toHaveLength(1);
      expect(variants[0]!.priceCents).toBe(1250);
      expect(variants[0]!.barcode).toBe('A0001');
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});
