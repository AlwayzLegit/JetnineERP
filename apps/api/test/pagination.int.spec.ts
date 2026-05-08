/**
 * Phase 2.10 acceptance: every list endpoint returns a
 * `{ data, nextCursor }` envelope. Walking the cursor visits every
 * row exactly once, even when sort-key collisions exist (the (id)
 * tiebreaker prevents duplicates / skips).
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
  process.env.PAGINATION_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_pagination';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'PageTest!2026';

let app: INestApplication;
let businessId = '';
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

async function seed() {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    const passwordHash = await hashPassword(PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'page-test', name: 'Page Test Co', status: 'active', defaultTaxRateBps: 0 })
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
    const [u] = await db
      .insert(schema.users)
      .values({ email: 'owner@page-test.local', emailVerified: true, name: 'Owner' })
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

    // Seed 25 customers. The `created_at` column is timestamptz default
    // now() — Drizzle's batch insert may or may not assign distinct
    // timestamps within the same statement, so several rows may share
    // a created_at. The cursor's id tiebreaker is what prevents dupes.
    const rows = Array.from({ length: 25 }, (_, i) => ({
      businessId,
      firstName: `Cust${String(i).padStart(2, '0')}`,
      lastName: `Test`,
      email: `c${i}@page-test.local`,
    }));
    await db.insert(schema.customers).values(rows);
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
  process.env.BETTER_AUTH_SECRET ??= 'page-test-secret-page-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  ownerCookie = await captureCookie('owner@page-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Phase 2.10 — cursor pagination', () => {
  it('list returns { data, nextCursor } envelope', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/customers?limit=10')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data).toHaveLength(10);
    expect(typeof res.body.nextCursor).toBe('string');
    expect(res.body.nextCursor!.length).toBeGreaterThan(0);
  });

  it('walking the cursor visits every row exactly once', async () => {
    const seen = new Set<string>();
    let cursor: string | null = null;
    let pages = 0;
    do {
      const params = new URLSearchParams({ limit: '7' });
      if (cursor) params.set('cursor', cursor);
      const res: { body: { data: { id: string }[]; nextCursor: string | null } } = await request(
        app.getHttpServer(),
      )
        .get(`/v1/customers?${params.toString()}`)
        .set('Cookie', ownerCookie)
        .set('X-Business-Id', businessId);
      for (const row of res.body.data) {
        expect(seen.has(row.id)).toBe(false); // no duplicates across pages
        seen.add(row.id);
      }
      cursor = res.body.nextCursor;
      pages += 1;
      if (pages > 10) throw new Error('too many pages — pagination loop');
    } while (cursor);
    expect(seen.size).toBe(25);
  });

  it('last page sets nextCursor to null', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/customers?limit=200')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(25);
    expect(res.body.nextCursor).toBeNull();
  });

  it('malformed cursor returns 400', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/customers?cursor=not-base64')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/cursor/i);
  });

  it('limit is clamped to 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/customers?limit=9999')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    // We seeded 25 — clamp at 200, so all 25 fit on a single page.
    expect(res.body.data.length).toBe(25);
    expect(res.body.nextCursor).toBeNull();
  });

  it('search path returns single page (nextCursor: null) by ts_rank', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/customers?q=Cust00')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    // Search bypasses cursoring — it always returns nextCursor: null.
    expect(res.body.nextCursor).toBeNull();
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('products and audit-logs both use the same envelope', async () => {
    const products = await request(app.getHttpServer())
      .get('/v1/products?limit=1')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(products.status).toBe(200);
    expect(products.body).toHaveProperty('data');
    expect(products.body).toHaveProperty('nextCursor');

    const audit = await request(app.getHttpServer())
      .get('/v1/audit-logs?limit=1')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(audit.status).toBe(200);
    expect(audit.body).toHaveProperty('data');
    expect(audit.body).toHaveProperty('nextCursor');
  });
});
