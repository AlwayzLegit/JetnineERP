/**
 * Order notes (owner ask 2026-09-01): anyone who can see an order can
 * leave a note on it; every note keeps its author and time; notes are
 * append-only and land in the order's audit trail. Store-scoped members
 * cannot read or write notes on another store's order.
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
  process.env.ORDER_NOTES_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_order_notes';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'NotesPass!2026x';

let app: INestApplication;
let businessId = '';
let storeA = '';
let storeB = '';
let orderA = '';
let orderB = '';
let cashierCookie = '';
let warehouseCookie = '';
let scopedCookie = '';

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
      .values({ slug: 'notes-test', name: 'Notes Test Co', status: 'active' })
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
    const locs = await db
      .insert(schema.locations)
      .values([
        { businessId, name: 'A Store', timezone: 'America/Los_Angeles' },
        { businessId, name: 'B Store', timezone: 'America/Los_Angeles' },
      ])
      .returning();
    storeA = locs[0]!.id;
    storeB = locs[1]!.id;

    async function makeUser(email: string, name: string, role: string, scopeTo?: string) {
      const [u] = await db
        .insert(schema.users)
        .values({ email, emailVerified: true, name })
        .returning();
      await db.insert(schema.accounts).values({
        accountId: u!.id,
        providerId: 'credential',
        userId: u!.id,
        password: passwordHash,
      });
      const [m] = await db
        .insert(schema.memberships)
        .values({
          businessId,
          userId: u!.id,
          roleId: roles.get(role)!,
          status: 'active',
          acceptedAt: new Date(),
          dataScope: scopeTo ? 'store' : 'all',
        })
        .returning();
      if (scopeTo) {
        await db
          .insert(schema.membershipLocationScopes)
          .values({ businessId, membershipId: m!.id, locationId: scopeTo });
      }
    }
    await makeUser('cashier@notes-test.local', 'Casey Register', 'Cashier');
    await makeUser('wh@notes-test.local', 'Wendy Dock', 'Warehouse');
    await makeUser('scoped@notes-test.local', 'Sam Scoped', 'Cashier', storeB);

    const [cust] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Nora', lastName: 'Notes' })
      .returning();
    const mk = async (locationId: string, number: string) => {
      const [o] = await db
        .insert(schema.orders)
        .values({
          businessId,
          locationId,
          number,
          status: 'open',
          customerId: cust!.id,
          subtotalCents: 10_000,
          totalCents: 10_000,
        })
        .returning();
      return o!.id;
    };
    orderA = await mk(storeA, 'SO-N-A');
    orderB = await mk(storeB, 'SO-N-B');
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

const as = (cookie: string) => ({
  get: (path: string) =>
    request(app.getHttpServer()).get(path).set('Cookie', cookie).set('x-business-id', businessId),
  post: (path: string) =>
    request(app.getHttpServer()).post(path).set('Cookie', cookie).set('x-business-id', businessId),
});

beforeAll(async () => {
  await resetTestDb();
  await seed();
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'notes-test-secret-notes-test-secret-xx';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();
  cashierCookie = await captureCookie('cashier@notes-test.local');
  warehouseCookie = await captureCookie('wh@notes-test.local');
  scopedCookie = await captureCookie('scoped@notes-test.local');
}, 180_000);

afterAll(async () => {
  if (app) await app.close();
});

describe('order notes', () => {
  it('starts empty', async () => {
    const res = await as(cashierCookie).get(`/v1/orders/${orderA}/notes`).expect(200);
    expect(res.body).toEqual([]);
  });

  it('a cashier and a warehouse member both leave notes, each signed', async () => {
    const first = await as(cashierCookie)
      .post(`/v1/orders/${orderA}/notes`)
      .send({ body: '  Customer wants the base delivered first.  ' })
      .expect(201);
    expect(first.body.body).toBe('Customer wants the base delivered first.');
    expect(first.body.authorName).toBe('Casey Register');
    expect(first.body.mine).toBe(true);

    await as(warehouseCookie)
      .post(`/v1/orders/${orderA}/notes`)
      .send({ body: 'Base is on the truck for Thursday.' })
      .expect(201);

    const list = await as(cashierCookie).get(`/v1/orders/${orderA}/notes`).expect(200);
    expect(list.body.map((n: { authorName: string }) => n.authorName)).toEqual([
      'Wendy Dock',
      'Casey Register',
    ]);
    // "mine" follows the reader, not the writer.
    expect(list.body.map((n: { mine: boolean }) => n.mine)).toEqual([false, true]);
  });

  it('refuses an empty note and an oversized one', async () => {
    await as(cashierCookie).post(`/v1/orders/${orderA}/notes`).send({ body: '   ' }).expect(400);
    await as(cashierCookie)
      .post(`/v1/orders/${orderA}/notes`)
      .send({ body: 'x'.repeat(4001) })
      .expect(400);
  });

  it('writes each note into the order’s change history', async () => {
    await withDb(async (db) => {
      const rows = await db
        .select({ action: schema.auditLogs.action })
        .from(schema.auditLogs)
        .where(
          and(
            eq(schema.auditLogs.businessId, businessId),
            eq(schema.auditLogs.targetType, 'order'),
            eq(schema.auditLogs.targetId, orderA),
            eq(schema.auditLogs.action, 'order.note.add'),
          ),
        );
      expect(rows).toHaveLength(2);
    });
  });

  it('keeps a store-scoped member out of another store’s order', async () => {
    await as(scopedCookie).get(`/v1/orders/${orderA}/notes`).expect(404);
    await as(scopedCookie).post(`/v1/orders/${orderA}/notes`).send({ body: 'hi' }).expect(404);
    await as(scopedCookie).post(`/v1/orders/${orderB}/notes`).send({ body: 'hi' }).expect(201);
  });

  it('404s on an unknown order', async () => {
    await as(cashierCookie)
      .get('/v1/orders/00000000-0000-0000-0000-000000000000/notes')
      .expect(404);
  });

  it('persists rows with the author membership', async () => {
    await withDb(async (db) => {
      const rows = await db
        .select({ author: schema.orderNotes.authorMembershipId })
        .from(schema.orderNotes)
        .where(
          and(eq(schema.orderNotes.businessId, businessId), eq(schema.orderNotes.orderId, orderA)),
        );
      expect(rows).toHaveLength(2);
      expect(rows.every((r) => r.author != null)).toBe(true);
    });
  });
});
