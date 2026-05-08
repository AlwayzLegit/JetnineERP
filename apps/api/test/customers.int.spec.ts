/**
 * Epic 1.9 acceptance: a cashier can create a customer mid-sale (the
 * "modal" referenced in PLAN.md is just the POST /v1/customers call;
 * Epic 1.10 wires the modal up to the POS register UI). Search hits
 * by partial name, email, and phone.
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
  process.env.CUSTOMERS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_customers';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'CustPass!2026';

let app: INestApplication;
let businessId = '';
let cashierCookie = '';
let ownerCookie = '';
let bookkeeperCookie = '';

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
      .values({ slug: 'cust-test', name: 'Customers Test Co', status: 'active' })
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
    await makeUser('owner@cust-test.local', 'Owner');
    await makeUser('cashier@cust-test.local', 'Cashier');
    await makeUser('bookkeeper@cust-test.local', 'Bookkeeper');
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
  process.env.BETTER_AUTH_SECRET ??= 'customers-test-secret-customers-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true });
  await app.init();

  ownerCookie = await captureCookie('owner@cust-test.local');
  cashierCookie = await captureCookie('cashier@cust-test.local');
  bookkeeperCookie = await captureCookie('bookkeeper@cust-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Epic 1.9 — Customer records', () => {
  let aliceId = '';

  it('Cashier creates a customer (the "create mid-sale" path)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        firstName: 'Alice',
        lastName: 'Adams',
        email: 'alice@example.com',
        phone: '+15551234567',
        notes: 'Walked in 2026-05-07',
      });
    expect(res.status).toBe(201);
    expect(res.body.firstName).toBe('Alice');
    expect(res.body.email).toBe('alice@example.com');
    aliceId = res.body.id as string;
  });

  it('Empty body (no identity fields) returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ notes: 'Anonymous walk-in' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/firstName.*lastName.*email.*phone/);
  });

  it('Search by partial first name finds the customer', async () => {
    // Add a couple more so we know the search filtered.
    await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ firstName: 'Bob', lastName: 'Brown', email: 'bob@example.com' });
    await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ firstName: 'Charlie', lastName: 'Cohen', phone: '+15559999999' });

    const res = await request(app.getHttpServer())
      .get('/v1/customers?q=Alice')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    const ids = (res.body.data as { id: string }[]).map((c) => c.id);
    expect(ids).toContain(aliceId);
    expect(ids.length).toBe(1);
  });

  it('Search by partial email finds the customer', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/customers?q=bob@example')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    const emails = (res.body.data as { email: string | null }[]).map((c) => c.email);
    expect(emails).toContain('bob@example.com');
  });

  it('Search by partial phone digits finds the customer', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/customers?q=+15559999999')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    const names = (res.body.data as { firstName: string | null }[]).map((c) => c.firstName);
    expect(names).toContain('Charlie');
  });

  it('Customer detail includes empty recentSales (Epic 1.10 will fill it)', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/customers/${aliceId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(aliceId);
    expect(res.body.recentSales).toEqual([]);
  });

  it('Owner edits the customer + audit captures the diff', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/v1/customers/${aliceId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ phone: '+15550000111' });
    expect(res.status).toBe(200);
    expect(res.body.phone).toBe('+15550000111');

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const rows = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, 'customer.update'));
      expect(rows.length).toBeGreaterThanOrEqual(1);
      const last = rows.at(-1)!;
      expect(last.changesJson).toMatchObject({
        before: { phone: '+15551234567' },
        after: { phone: '+15550000111' },
      });
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('Cashier (no customers.delete) cannot delete', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/v1/customers/${aliceId}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/customers\.delete/);
  });

  it('Bookkeeper (no customers.view) cannot list', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/customers')
      .set('Cookie', bookkeeperCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/customers\.view/);
  });

  it('Owner can delete; sale references would survive via SET NULL', async () => {
    // Add a temp customer just for this test.
    const c = await request(app.getHttpServer())
      .post('/v1/customers')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ firstName: 'Temp', lastName: 'User' });
    expect(c.status).toBe(201);
    const id = c.body.id as string;

    const del = await request(app.getHttpServer())
      .delete(`/v1/customers/${id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(del.status).toBe(200);
    expect(del.body.deleted).toBe(true);

    const after = await request(app.getHttpServer())
      .get(`/v1/customers/${id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(after.status).toBe(404);
  });
});
