/**
 * Phase 2.8 acceptance: a merchant mints a scoped API key, and a
 * machine client uses it (Authorization: Bearer jet_*) to call the
 * existing tenant-scoped endpoints. The key's scopes are enforced —
 * a `sales.view`-only key can read sales but cannot create them.
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
  process.env.API_KEYS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_api_keys';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'KeyPass!2026';

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
      .values({
        slug: 'apikeys-test',
        name: 'API Keys Test Co',
        status: 'active',
        defaultTaxRateBps: 0,
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
    await makeUser('owner@apikeys-test.local', 'Owner');
    await makeUser('cashier@apikeys-test.local', 'Cashier');

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
      onHand: 100,
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
  process.env.BETTER_AUTH_SECRET ??= 'apikeys-test-secret-apikeys-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  ownerCookie = await captureCookie('owner@apikeys-test.local');
  cashierCookie = await captureCookie('cashier@apikeys-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Phase 2.8 — API keys', () => {
  let readOnlyKey = '';
  let readOnlyKeyId = '';
  let writeKey = '';

  it('Cashier (no api_keys.manage) cannot create keys', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/api-keys')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Hacker', scopes: ['sales.view'] });
    expect(res.status).toBe(403);
  });

  it('Owner mints a sales.view test key — full key returned exactly once', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/api-keys')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        name: 'Read-only integration',
        scopes: ['sales.view'],
        livemode: 'test',
      });
    expect(res.status).toBe(201);
    expect(res.body.key).toMatch(/^jet_test_[0-9a-f]{48}$/);
    expect(res.body.keyPrefix).toMatch(/^jet_test_/);
    readOnlyKey = res.body.key;
    readOnlyKeyId = res.body.id;

    // List view never echoes the secret.
    const list = await request(app.getHttpServer())
      .get('/v1/business/api-keys')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(list.status).toBe(200);
    expect(list.body[0]).not.toHaveProperty('key');
    expect(list.body[0]).not.toHaveProperty('keyHash');
  });

  it('Owner mints a write-scoped key for sales creation', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/api-keys')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        name: 'POS bridge',
        scopes: ['sales.view', 'pos.transaction.create'],
        livemode: 'test',
      });
    expect(res.status).toBe(201);
    writeKey = res.body.key;
  });

  it('Unknown scope is rejected at create time', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/api-keys')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Bad', scopes: ['nope.scope'] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Unknown scope/);
  });

  it('API key authenticates on /v1/sales without X-Business-Id', async () => {
    // sales.view scope; the key implies the business.
    const res = await request(app.getHttpServer())
      .get('/v1/sales')
      .set('Authorization', `Bearer ${readOnlyKey}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('Read-only key is denied on a write endpoint (scope enforcement)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Authorization', `Bearer ${readOnlyKey}`)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 1000 }],
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/pos\.transaction\.create/);
  });

  it('Write-scoped key creates a sale; audit row records api_key actor', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/sales')
      .set('Authorization', `Bearer ${writeKey}`)
      .send({
        locationId,
        lines: [{ variantId, quantity: 1 }],
        payments: [{ method: 'cash', amountCents: 1000 }],
      });
    expect(res.status).toBe(201);

    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      const audits = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, 'sale.complete'));
      const lastAudit = audits[audits.length - 1]!;
      expect(lastAudit.actorType).toBe('api_key');
      expect(lastAudit.actorUserId).toBeNull();
      // The api_key id lands in changes_json.metadata so audit-log
      // filters can distinguish per-integration activity.
      expect(lastAudit.changesJson).toMatchObject({
        metadata: expect.objectContaining({ apiKeyId: expect.any(String) }) as never,
      });
    } finally {
      await sqlc.end({ timeout: 5 });
    }
  });

  it('Garbage Bearer token is rejected', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/sales')
      .set('Authorization', 'Bearer jet_test_notarealkey');
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/Invalid or revoked/);
  });

  it('Non-jet Bearer falls through to session auth (and 401s without a cookie)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/sales')
      .set('Authorization', 'Bearer something_else');
    expect(res.status).toBe(401);
  });

  it('Revoked key stops working immediately', async () => {
    const revoke = await request(app.getHttpServer())
      .delete(`/v1/business/api-keys/${readOnlyKeyId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(revoke.status).toBe(200);

    const res = await request(app.getHttpServer())
      .get('/v1/sales')
      .set('Authorization', `Bearer ${readOnlyKey}`);
    expect(res.status).toBe(401);
  });

  it('Re-revoking a revoked key returns 400', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/v1/business/api-keys/${readOnlyKeyId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already revoked/);
  });

  it('lastUsedAt is updated by the auth path', async () => {
    // Make a call with the write key, then read the row.
    await request(app.getHttpServer()).get('/v1/sales').set('Authorization', `Bearer ${writeKey}`);

    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      const rows = await db.select().from(schema.apiKeys);
      const writeRow = rows.find((r) => r.scopes?.includes('pos.transaction.create'));
      // Best-effort update — wait briefly if it hasn't landed yet.
      for (let i = 0; i < 30 && !writeRow!.lastUsedAt; i++) {
        await new Promise((r) => setTimeout(r, 50));
      }
      expect(writeRow!.lastUsedAt).not.toBeNull();
    } finally {
      await sqlc.end({ timeout: 5 });
    }
  });

  it('Scopes endpoint exposes the platform permission catalog', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/business/api-keys/scopes')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.all).toContain('sales.view');
    expect(res.body.all).toContain('pos.transaction.create');
  });
});
