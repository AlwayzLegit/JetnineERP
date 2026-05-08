/**
 * Epic 1.6 acceptance: a business owner invites a cashier, the cashier
 * accepts the invitation, and lands logged in with cashier permissions
 * only — i.e. they CAN view products (cashier holds products.view) but
 * CAN'T edit prices (no products.update) and CAN'T see audit logs (no
 * audit.view).
 *
 * Also exercises the rest of the Epic 1.6 surface: settings GET/PATCH,
 * locations CRUD, custom roles + permission editing.
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
  process.env.BUSINESS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_business';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const OWNER_PASSWORD = 'OwnerPass!2026Test';
const CASHIER_PASSWORD = 'CashierPass!2026Test';
const CASHIER_EMAIL = `cashier+${Date.now()}@business-test.local`;

let app: INestApplication;
let businessId: string;
let ownerUserId: string;
let ownerCookie = '';
let cashierUserId = '';
let cashierMembershipId = '';
let inviteToken = '';
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
    const passwordHash = await hashPassword(OWNER_PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'biz-test', name: 'Biz Test Co', status: 'active' })
      .returning();
    if (!biz) throw new Error('biz insert failed');
    businessId = biz.id;

    const roleIds = new Map<string, string>();
    for (const role of SYSTEM_ROLES) {
      const [r] = await db
        .insert(schema.roles)
        .values({
          businessId: biz.id,
          name: role.name,
          description: role.description,
          isSystem: true,
        })
        .returning();
      if (!r) throw new Error(`role ${role.name} insert failed`);
      roleIds.set(role.name, r.id);
      if (role.permissions.length > 0) {
        await db
          .insert(schema.rolePermissions)
          .values(role.permissions.map((permission) => ({ roleId: r.id, permission })));
      }
    }

    const [owner] = await db
      .insert(schema.users)
      .values({ email: 'owner@business-test.local', emailVerified: true, name: 'Owner' })
      .returning();
    if (!owner) throw new Error('owner insert failed');
    ownerUserId = owner.id;
    await db.insert(schema.accounts).values({
      accountId: owner.id,
      providerId: 'credential',
      userId: owner.id,
      password: passwordHash,
    });
    await db.insert(schema.memberships).values({
      businessId: biz.id,
      userId: owner.id,
      roleId: roleIds.get('Owner')!,
      status: 'active',
      acceptedAt: new Date(),
    });
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function captureCookie(email: string, password: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/sign-in/email')
    .send({ email, password })
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
  process.env.BETTER_AUTH_SECRET ??= 'business-test-secret-business-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.WEB_BASE_URL ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true });
  await app.init();

  ownerCookie = await captureCookie('owner@business-test.local', OWNER_PASSWORD);
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Epic 1.6 — Business admin console', () => {
  it('Owner can read business settings (defaults)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/business/settings')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.currencyCode).toBe('USD');
    expect(res.body.defaultTaxRateBps).toBe(0);
    expect(res.body.receiptHeader).toBeNull();
  });

  it('Owner can update business settings; audit captures the diff', async () => {
    const res = await request(app.getHttpServer())
      .patch('/v1/business/settings')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ defaultTaxRateBps: 825, receiptHeader: 'Biz Test Co — Main Receipt' });
    expect(res.status).toBe(200);
    expect(res.body.defaultTaxRateBps).toBe(825);
    expect(res.body.receiptHeader).toBe('Biz Test Co — Main Receipt');

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const rows = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, 'business.settings.update'));
      expect(rows.length).toBeGreaterThanOrEqual(1);
      expect(rows.at(-1)!.changesJson).toMatchObject({
        before: { defaultTaxRateBps: 0 },
        after: { defaultTaxRateBps: 825 },
      });
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('Owner creates a location; tax override is recorded', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/business/locations')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Main Store', timezone: 'America/New_York', taxRateBps: 1000 });
    expect(res.status).toBe(201);
    expect(res.body.taxRateBps).toBe(1000);
  });

  it('Owner invites a cashier — invite captured by memory transport', async () => {
    const inviteRes = await request(app.getHttpServer())
      .post('/v1/business/members/invite')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ email: CASHIER_EMAIL, name: 'Cashier', roleName: 'Cashier' });
    expect(inviteRes.status).toBe(201);
    cashierUserId = inviteRes.body.userId as string;
    cashierMembershipId = inviteRes.body.membershipId as string;
    expect(inviteRes.body.alreadyMember).toBe(false);

    const emailRes = await request(app.getHttpServer())
      .get(`/v1/dev/email/last?to=${encodeURIComponent(CASHIER_EMAIL)}`)
      .expect(200);
    expect(emailRes.body.subject).toContain('invited');
    const html = emailRes.body.html as string;
    const match = html.match(/accept-invite\?token=([^"&]+)/);
    expect(match, 'invite token in email').toBeTruthy();
    inviteToken = decodeURIComponent(match![1]!);
  });

  it('Cashier accepts the invite and signs in; membership flips active', async () => {
    const acceptRes = await request(app.getHttpServer())
      .post('/v1/auth/accept-invite')
      .send({ token: inviteToken, password: CASHIER_PASSWORD });
    expect(acceptRes.status).toBe(201);
    expect(acceptRes.body.userId).toBe(cashierUserId);

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const memberships = await db
        .select()
        .from(schema.memberships)
        .where(
          and(
            eq(schema.memberships.businessId, businessId),
            eq(schema.memberships.userId, cashierUserId),
          ),
        );
      expect(memberships).toHaveLength(1);
      expect(memberships[0]!.status).toBe('active');
    } finally {
      await sql.end({ timeout: 5 });
    }

    cashierCookie = await captureCookie(CASHIER_EMAIL, CASHIER_PASSWORD);
  });

  it('Cashier has cashier permissions only', async () => {
    // products.view → 200
    const list = await request(app.getHttpServer())
      .get('/v1/products')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(list.status).toBe(200);

    // products.update missing → 403 trying to PATCH variant price.
    // Seed a variant first (as owner).
    let variantId: string;
    {
      const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
      const db = drizzle(sql);
      try {
        const [p] = await db
          .insert(schema.products)
          .values({ businessId, sku: 'VARIANT-1', name: 'Test Product' })
          .returning();
        const [v] = await db
          .insert(schema.productVariants)
          .values({ businessId, productId: p!.id, sku: 'VARIANT-1-V1', priceCents: 1234 })
          .returning();
        variantId = v!.id;
      } finally {
        await sql.end({ timeout: 5 });
      }
    }
    const patch = await request(app.getHttpServer())
      .patch(`/v1/products/variants/${variantId}/price`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ priceCents: 9999 });
    expect(patch.status).toBe(403);
    expect(patch.body.message).toMatch(/products\.update/);

    // audit.view missing → 403 on the audit log endpoint.
    const audit = await request(app.getHttpServer())
      .get('/v1/audit-logs')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(audit.status).toBe(403);

    // Super-admin endpoints rejected entirely.
    const adminMetrics = await request(app.getHttpServer())
      .get('/v1/admin/metrics')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(adminMetrics.status).toBe(403);
  });

  it('Owner clones the Cashier role and adds products.update', async () => {
    const list = await request(app.getHttpServer())
      .get('/v1/business/roles')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(list.status).toBe(200);
    const cashierRole = (
      list.body as Array<{ name: string; id: string; permissions: string[] }>
    ).find((r) => r.name === 'Cashier');
    expect(cashierRole).toBeDefined();

    const create = await request(app.getHttpServer())
      .post('/v1/business/roles')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Senior Cashier', basedOnRoleId: cashierRole!.id });
    expect(create.status).toBe(201);
    expect(create.body.permissions).toEqual(expect.arrayContaining(cashierRole!.permissions));
    expect(create.body.isSystem).toBe(false);

    // Add products.update to the cloned role.
    const update = await request(app.getHttpServer())
      .patch(`/v1/business/roles/${create.body.id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ permissions: [...cashierRole!.permissions, 'products.update'] });
    expect(update.status).toBe(200);
    expect(update.body.permissions).toContain('products.update');
  });

  it('System roles cannot be edited or deleted', async () => {
    const list = await request(app.getHttpServer())
      .get('/v1/business/roles')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    const ownerRole = (list.body as Array<{ name: string; id: string; isSystem: boolean }>).find(
      (r) => r.name === 'Owner',
    );
    expect(ownerRole?.isSystem).toBe(true);

    const editAttempt = await request(app.getHttpServer())
      .patch(`/v1/business/roles/${ownerRole!.id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Big Boss' });
    expect(editAttempt.status).toBe(403);

    const deleteAttempt = await request(app.getHttpServer())
      .delete(`/v1/business/roles/${ownerRole!.id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(deleteAttempt.status).toBe(403);
  });

  it('Disabling a member sets status=disabled; audit captures it', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/business/members/${cashierMembershipId}/disable`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(201);

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const [m] = await db
        .select()
        .from(schema.memberships)
        .where(eq(schema.memberships.id, cashierMembershipId));
      expect(m!.status).toBe('disabled');
      const rows = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, 'membership.disable'));
      expect(rows.length).toBeGreaterThanOrEqual(1);
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('Permission catalog is publicly listable', async () => {
    const res = await request(app.getHttpServer()).get('/v1/permissions');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(20);
    const sample = (res.body as Array<{ key: string; description: string }>).find(
      (p) => p.key === 'products.view',
    );
    expect(sample).toBeDefined();
    void ownerUserId; // referenced for completeness.
  });

  it('Phase 2.19: owner can switch currency to a supported code', async () => {
    const res = await request(app.getHttpServer())
      .patch('/v1/business/settings')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ currencyCode: 'EUR' });
    expect(res.status).toBe(200);
    expect(res.body.currencyCode).toBe('EUR');
  });

  it('Phase 2.19: lowercase + JPY both accepted; round-trip persists', async () => {
    const res = await request(app.getHttpServer())
      .patch('/v1/business/settings')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ currencyCode: 'jpy' });
    expect(res.status).toBe(200);
    expect(res.body.currencyCode).toBe('JPY');

    const reread = await request(app.getHttpServer())
      .get('/v1/business/settings')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(reread.body.currencyCode).toBe('JPY');
  });

  it('Phase 2.19: unsupported currency is rejected 400', async () => {
    const res = await request(app.getHttpServer())
      .patch('/v1/business/settings')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ currencyCode: 'XYZ' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/currencyCode must be one of/);
  });

  it('Phase 2.19: restore USD so other tests in the file see the default', async () => {
    const res = await request(app.getHttpServer())
      .patch('/v1/business/settings')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ currencyCode: 'USD' });
    expect(res.status).toBe(200);
    expect(res.body.currencyCode).toBe('USD');
  });
});
