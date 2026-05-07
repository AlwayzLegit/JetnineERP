/**
 * Phase 2.9 acceptance: any mutating endpoint, when called twice with
 * the same `Idempotency-Key`, runs once and replays the cached response.
 * Reusing a key for a different body fails 409.
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
  process.env.IDEMPOTENCY_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_idempotency';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'IdemPass!2026';

let app: INestApplication;
let businessId = '';
let otherBusinessId = '';
let locationId = '';
let variantId = '';
let ownerCookie = '';
let otherOwnerCookie = '';

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

    async function makeBusiness(slug: string, name: string): Promise<string> {
      const [biz] = await db
        .insert(schema.businesses)
        .values({ slug, name, status: 'active', defaultTaxRateBps: 0 })
        .returning();
      const bid = biz!.id;
      const roles = new Map<string, string>();
      for (const role of SYSTEM_ROLES) {
        const [r] = await db
          .insert(schema.roles)
          .values({
            businessId: bid,
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
        .values({ email: `owner@${slug}.local`, emailVerified: true, name: 'Owner' })
        .returning();
      await db.insert(schema.accounts).values({
        accountId: u!.id,
        providerId: 'credential',
        userId: u!.id,
        password: passwordHash,
      });
      await db.insert(schema.memberships).values({
        businessId: bid,
        userId: u!.id,
        roleId: roles.get('Owner')!,
        status: 'active',
        acceptedAt: new Date(),
      });
      return bid;
    }

    businessId = await makeBusiness('idem-test', 'Idem Test Co');
    otherBusinessId = await makeBusiness('idem-other', 'Idem Other Co');

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
  process.env.BETTER_AUTH_SECRET ??= 'idem-test-secret-idem-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  ownerCookie = await captureCookie('owner@idem-test.local');
  otherOwnerCookie = await captureCookie('owner@idem-other.local');
});

afterAll(async () => {
  if (app) await app.close();
});

function customerBody(suffix: string) {
  return {
    firstName: 'Idem',
    lastName: `Customer-${suffix}`,
    email: `idem.${suffix}@x.local`,
  };
}

describe('Phase 2.9 — Idempotency-Key', () => {
  it('mutation without Idempotency-Key behaves normally (no row written)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send(customerBody('plain'));
    expect(res.status).toBe(201);

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      const rows =
        await sql`SELECT count(*)::int AS n FROM idempotency_keys WHERE business_id = ${businessId}`;
      expect(rows[0]!.n).toBe(0);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('two POSTs with the same key run once and replay the cached response', async () => {
    const key = 'create-customer-v1-001';
    const body = customerBody('one');

    const first = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', key)
      .send(body);
    expect(first.status).toBe(201);
    expect(first.headers['idempotent-replayed']).toBeUndefined();
    const id = first.body.id;

    const second = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', key)
      .send(body);
    expect(second.status).toBe(201);
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect(second.body.id).toBe(id);

    // Only one row was actually inserted.
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      const rows =
        await sql`SELECT count(*)::int AS n FROM customers WHERE business_id = ${businessId} AND email = 'idem.one@x.local'`;
      expect(rows[0]!.n).toBe(1);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('reusing a key with a different body returns 409', async () => {
    const key = 'create-customer-v1-002';
    const first = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', key)
      .send(customerBody('two'));
    expect(first.status).toBe(201);

    const second = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', key)
      .send(customerBody('two-different'));
    expect(second.status).toBe(409);
  });

  it('keys are scoped per business — same key can be used by another tenant', async () => {
    const key = 'cross-tenant-shared-key';
    const a = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', key)
      .send(customerBody('three-a'));
    expect(a.status).toBe(201);

    const b = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', otherOwnerCookie)
      .set('X-Business-Id', otherBusinessId)
      .set('Idempotency-Key', key)
      .send(customerBody('three-b'));
    expect(b.status).toBe(201);
    expect(b.body.id).not.toBe(a.body.id);
  });

  it('idempotent sale creation: cents-exact replay of the cached body', async () => {
    const key = 'create-sale-v1-001';
    const body = {
      locationId,
      lines: [{ variantId, quantity: 2 }],
      payments: [{ method: 'cash', amountCents: 2000 }],
    };

    const first = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', key)
      .send(body);
    expect(first.status).toBe(201);
    const saleId = first.body.id;

    const second = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', key)
      .send(body);
    expect(second.status).toBe(201);
    expect(second.headers['idempotent-replayed']).toBe('true');
    expect(second.body.id).toBe(saleId);

    // Inventory only decremented once (1000 -> 998, not 996).
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      const rows =
        await sql`SELECT on_hand FROM inventory_levels WHERE business_id = ${businessId} AND variant_id = ${variantId} AND location_id = ${locationId}`;
      expect(rows[0]!.on_hand).toBe(998);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('GET requests ignore Idempotency-Key (no row written)', async () => {
    await request(app.getHttpServer())
      .get('/v1/customers')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', 'should-be-ignored-on-get');

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      const rows =
        await sql`SELECT count(*)::int AS n FROM idempotency_keys WHERE business_id = ${businessId} AND key = 'should-be-ignored-on-get'`;
      expect(rows[0]!.n).toBe(0);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('rejects malformed keys (whitespace, too long)', async () => {
    const tooLong = 'x'.repeat(256);
    const res = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', tooLong)
      .send(customerBody('bad'));
    expect(res.status).toBe(400);
  });

  it('handler error releases the lock so a retry can proceed fresh', async () => {
    const key = 'create-sale-error-then-retry';
    // Empty cart triggers a 400 before any side effects.
    const bad = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', key)
      .send({ locationId, lines: [], payments: [] });
    expect(bad.status).toBe(400);

    // Lock should have been released — the row is gone.
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      const rows =
        await sql`SELECT count(*)::int AS n FROM idempotency_keys WHERE business_id = ${businessId} AND key = ${key}`;
      expect(rows[0]!.n).toBe(0);
    } finally {
      await sql.end({ timeout: 5 });
    }

    // Retry with a valid body using the same key now succeeds.
    const good = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', key)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 1000 }],
      });
    expect(good.status).toBe(201);
  });

  it('key body must match across retries even when lines re-order', async () => {
    // Stable stringify means {a:1,b:2} and {b:2,a:1} hash identically,
    // so an http client's accidental key reordering still replays.
    const key = 'create-sale-key-order';
    const a = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', key)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 1000 }],
      });
    expect(a.status).toBe(201);
    const b = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', key)
      .send({
        // Different declaration order, equivalent payload.
        payments: [{ amountCents: 1000, method: 'cash' }],
        lines: [{ quantity: 1, variantId }],
        locationId,
      });
    expect(b.status).toBe(201);
    expect(b.headers['idempotent-replayed']).toBe('true');
    expect(b.body.id).toBe(a.body.id);
  });

  it('completed row carries response status + body', async () => {
    const key = 'create-customer-cached-shape';
    const r = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .set('Idempotency-Key', key)
      .send(customerBody('cached'));
    expect(r.status).toBe(201);

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      const rows = await sql<
        {
          status: string;
          response_status: number | null;
          response_body: unknown;
          completed_at: Date | null;
        }[]
      >`SELECT status, response_status, response_body, completed_at FROM idempotency_keys
         WHERE business_id = ${businessId} AND key = ${key}`;
      expect(rows).toHaveLength(1);
      expect(rows[0]!.status).toBe('completed');
      expect(rows[0]!.completed_at).not.toBeNull();
      expect(rows[0]!.response_status).toBe(201);
      const body = rows[0]!.response_body as { id?: string };
      expect(body?.id).toBe(r.body.id);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });
});
