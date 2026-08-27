/**
 * Epic 1.4 acceptance: updating a product price creates an audit_logs
 * row with the old and new prices, and the audit log is viewable by a
 * user with audit.view (Bookkeeper) but not by one without it (Cashier).
 *
 * Boots the full Nest app with its own database, seeds one business with
 * Owner / Bookkeeper / Cashier users, exercises PATCH
 * /v1/products/variants/:id/price, then asserts audit_logs contents and
 * /v1/audit-logs visibility.
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
  process.env.AUDIT_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_audit';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'TestPassword!2026';

interface TestUser {
  id: string;
  email: string;
  cookie: string;
}

let app: INestApplication;
let businessId: string;
let variantId: string;
let initialPrice: number;
let owner: TestUser;
let bookkeeper: TestUser;
let cashier: TestUser;

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

async function seedFixtures() {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    const passwordHash = await hashPassword(PASSWORD);

    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'audit-test', name: 'Audit Test Co', status: 'active' })
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

    async function makeUser(email: string, name: string, roleName: string): Promise<TestUser> {
      const [u] = await db
        .insert(schema.users)
        .values({ email, emailVerified: true, name })
        .returning();
      if (!u) throw new Error(`user ${email} insert failed`);
      await db.insert(schema.accounts).values({
        accountId: u.id,
        providerId: 'credential',
        userId: u.id,
        password: passwordHash,
      });
      const roleId = roleIds.get(roleName);
      if (!roleId) throw new Error(`unknown role ${roleName}`);
      await db.insert(schema.memberships).values({
        businessId: biz.id,
        userId: u.id,
        roleId,
        status: 'active',
        acceptedAt: new Date(),
      });
      return { id: u.id, email, cookie: '' };
    }

    owner = await makeUser('owner@audit-test.local', 'Owner', 'Owner');
    bookkeeper = await makeUser('bookkeeper@audit-test.local', 'Bookkeeper', 'Bookkeeper');
    cashier = await makeUser('cashier@audit-test.local', 'Cashier', 'Cashier');

    // One product + variant for the PATCH test.
    initialPrice = 9999;
    const [product] = await db
      .insert(schema.products)
      .values({ businessId: biz.id, sku: 'WIDGET-1', name: 'Widget' })
      .returning();
    const [variant] = await db
      .insert(schema.productVariants)
      .values({
        businessId: biz.id,
        productId: product!.id,
        sku: 'WIDGET-1-V1',
        name: 'Default',
        priceCents: initialPrice,
      })
      .returning();
    variantId = variant!.id;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function captureCookie(user: TestUser): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/sign-in/email')
    .send({ email: user.email, password: PASSWORD })
    .expect(200);
  const cookies = res.get('Set-Cookie') ?? [];
  const sessionCookie = cookies
    .map((c) => c.split(';')[0])
    .filter((c): c is string => Boolean(c?.startsWith('jetnine.session_token=')))
    .find((c) => !c.endsWith('='));
  if (!sessionCookie) throw new Error(`no session cookie returned for ${user.email}`);
  return sessionCookie;
}

beforeAll(async () => {
  await resetTestDb();
  await seedFixtures();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'audit-test-secret-audit-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true });
  await app.init();

  owner.cookie = await captureCookie(owner);
  bookkeeper.cookie = await captureCookie(bookkeeper);
  cashier.cookie = await captureCookie(cashier);
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Epic 1.4 — Audit log', () => {
  it('PATCH variant price as Owner records before/after in audit_logs', async () => {
    const newPrice = 14999;
    const res = await request(app.getHttpServer())
      .patch(`/v1/products/variants/${variantId}/price`)
      .set('Cookie', owner.cookie)
      .set('X-Business-Id', businessId)
      .send({ priceCents: newPrice });
    expect(res.status).toBe(200);
    expect(res.body.priceCents).toBe(newPrice);

    // Verify the audit row was written. Use a fresh privileged connection
    // since the test app's Drizzle DB doesn't share the test transaction.
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const rows = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, 'product.variant.price.update'));
      expect(rows).toHaveLength(1);
      const row = rows[0]!;
      expect(row.actorUserId).toBe(owner.id);
      expect(row.businessId).toBe(businessId);
      expect(row.targetType).toBe('product_variant');
      expect(row.targetId).toBe(variantId);
      expect(row.changesJson).toEqual({
        before: { priceCents: initialPrice },
        after: { priceCents: newPrice },
      });
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('Bookkeeper (audit.view) can list audit logs', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/audit-logs')
      .set('Cookie', bookkeeper.cookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const update = (res.body.data as Array<{ action: string; actorEmail: string | null }>).find(
      (r) => r.action === 'product.variant.price.update',
    );
    expect(update).toBeDefined();
    expect(update!.actorEmail).toBe(owner.email);
  });

  it('Cashier (no audit.view) is forbidden from listing audit logs', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/audit-logs')
      .set('Cookie', cashier.cookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/audit\.view/);
  });

  it('audit log filter by action narrows results', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/audit-logs?action=product.variant.price.update')
      .set('Cookie', bookkeeper.cookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });
});

describe('Sysadmin pack — RPT-AUDIT substrate (AUD-003/004/006, SET-007)', () => {
  it('AUD-004: a denied permission attempt is itself an audit event', async () => {
    // The cashier 403 above (no audit.view) must have left a trace.
    const res = await request(app.getHttpServer())
      .get('/v1/audit-logs?action=permission.denied')
      .set('Cookie', owner.cookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    const denial = (
      res.body.data as Array<{
        action: string;
        actorUserId: string | null;
        targetType: string | null;
        changesJson: { missing?: string[] } | null;
      }>
    ).find((r) => r.actorUserId === cashier.id);
    expect(denial).toBeDefined();
    expect(denial!.targetType).toBe('route');
    expect(denial!.changesJson?.missing).toContain('audit.view');
  });

  it('AUD-006: the stream exports as CSV, and the export is audited (AUD-003)', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/audit-logs/export.csv?action=product.variant.price.update')
      .set('Cookie', owner.cookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/csv/);
    const lines = (res.text as string).split('\n');
    expect(lines[0]).toBe(
      'created_at,action,actor_email,actor_type,target_type,target_id,changes,ip',
    );
    expect(lines.length).toBe(2); // header + the one price update

    const trace = await request(app.getHttpServer())
      .get('/v1/audit-logs?action=audit.export')
      .set('Cookie', owner.cookie)
      .set('X-Business-Id', businessId);
    expect(trace.status).toBe(200);
    expect(trace.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('CSV export neutralizes spreadsheet formula injection', async () => {
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      await drizzle(sql)
        .insert(schema.auditLogs)
        .values({
          businessId,
          actorUserId: owner.id,
          actorType: 'user',
          action: 'formula.test',
          targetType: 'order',
          targetId: '=HYPERLINK("http://evil","x")',
          changesJson: { note: '=cmd' },
        });
    } finally {
      await sql.end({ timeout: 5 });
    }
    const res = await request(app.getHttpServer())
      .get('/v1/audit-logs/export.csv?action=formula.test')
      .set('Cookie', owner.cookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    const dataLine = (res.text as string).split('\n')[1]!;
    // The leading = is prefixed with an apostrophe so Excel treats it as text.
    expect(dataLine).toContain(`"'=HYPERLINK`);
    expect(dataLine).not.toMatch(/,=HYPERLINK/);
  });

  it('SET-007: the settings registry serves every ops key with an explicit blank-meaning', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/business/settings/registry')
      .set('Cookie', owner.cookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    const rows = res.body as Array<{ key: string; nullMeans: string; classTags: string[] }>;
    expect(rows.length).toBeGreaterThanOrEqual(15);
    for (const row of rows) {
      expect(typeof row.nullMeans).toBe('string');
      expect(row.nullMeans.length).toBeGreaterThan(0); // SET-002: no implicit tri-state
    }
    const autoSched = rows.find((r) => r.key === 'autoScheduleDays');
    expect(autoSched?.classTags).toContain('TRISTATE');
    expect(rows.some((r) => r.key === 'restockingFeePercent')).toBe(true);
  });
});
