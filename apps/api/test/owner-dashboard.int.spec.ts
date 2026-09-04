/**
 * Owner home API (Claude Design hand-off, 2026-09-04): the KPI strip +
 * written-business trend with period / store scope / compare-to, the
 * filterable orders table, and the sidebar nav counts.
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
import type { OwnerDashboard, OwnerOrderRow } from '../src/reports/owner-dashboard.controller';

const TEST_DB_URL =
  process.env.OWNER_DASHBOARD_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_owner_dashboard';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'OwnerPass!2026x';
const TZ = 'America/Los_Angeles';

let app: INestApplication;
let businessId = '';
let aStoreId = '';
let bStoreId = '';
let ownerCookie = '';
let cashierCookie = '';
let day = '';
let yesterday = '';
let weekAgo = '';
let tenDaysAgo = '';

const localDay = (minusDays = 0) =>
  new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(
    new Date(Date.now() - minusDays * 86_400_000),
  );

function atLocal(dayStr: string, hm: string): Date {
  const [y, m, d] = dayStr.split('-').map(Number) as [number, number, number];
  const [h, mi] = hm.split(':').map(Number) as [number, number];
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(guess));
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const localMs = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
  );
  return new Date(guess - (localMs - guess));
}

function withDb<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  return fn(db).finally(() => sql.end({ timeout: 5 }));
}

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
  day = localDay(0);
  yesterday = localDay(1);
  weekAgo = localDay(6);
  tenDaysAgo = localDay(10);
  await withDb(async (db) => {
    const passwordHash = await hashPassword(PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'owner-dash-test', name: 'Owner Dash Co', status: 'active' })
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
    async function makeUser(email: string, name: string, role: string) {
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
        })
        .returning();
      return { userId: u!.id, membershipId: m!.id };
    }
    await makeUser('owner@owner-dash.local', 'Olive Owner', 'Owner');
    const bf = await makeUser('bf@owner-dash.local', 'Ben Franklin', 'Cashier');

    const locs = await db
      .insert(schema.locations)
      .values([
        { businessId, name: '201 Western', timezone: TZ },
        { businessId, name: 'Hancock Park', timezone: TZ },
      ])
      .returning();
    aStoreId = locs[0]!.id;
    bStoreId = locs[1]!.id;

    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'BBAUR13F', name: 'E King Aurora' })
      .returning();
    const [king] = await db
      .insert(schema.productVariants)
      .values({ businessId, productId: p!.id, sku: 'BBAUR13F_FP-7680', priceCents: 170_000 })
      .returning();
    const [abe] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Abe', lastName: 'Clements', phone: '(213) 555-0100' })
      .returning();

    type OrderOver = Partial<typeof schema.orders.$inferInsert>;
    const mkOrder = async (over: OrderOver, totalCents: number) => {
      const [o] = await db
        .insert(schema.orders)
        .values({
          businessId,
          locationId: aStoreId,
          number: `SO-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          status: 'open',
          customerId: abe!.id,
          salespersonMembershipId: bf.membershipId,
          subtotalCents: totalCents,
          totalCents,
          ...over,
        })
        .returning();
      await db.insert(schema.orderLines).values({
        businessId,
        orderId: o!.id,
        variantId: king!.id,
        description: 'E KING AURO',
        quantity: 1,
        unitPriceCents: totalCents,
        totalCents,
        lineType: 'stock',
      });
      return o!;
    };
    const pay = (orderId: string, amountCents: number, at: Date) =>
      db.insert(schema.payments).values({
        businessId,
        orderId,
        kind: 'deposit',
        method: 'cash',
        amountCents,
        status: 'succeeded',
        createdAt: at,
      });

    // O1: today at 201 Western, open, $500 deposit, delivery booked today.
    const o1 = await mkOrder({ number: 'O1', createdAt: atLocal(day, '11:09') }, 170_000);
    await pay(o1.id, 50_000, atLocal(day, '11:10'));
    await db.insert(schema.deliveries).values({
      businessId,
      orderId: o1.id,
      locationId: aStoreId,
      scheduledDate: day,
      status: 'scheduled',
    });
    // O2: yesterday at Hancock Park, open, promised yesterday → past promise.
    await mkOrder(
      {
        number: 'O2',
        locationId: bStoreId,
        createdAt: atLocal(yesterday, '10:00'),
        requestedDate: yesterday,
      },
      80_000,
    );
    // O3: a draft written today — pending, never "written".
    await mkOrder({ number: 'O3', status: 'draft', createdAt: atLocal(day, '09:00') }, 30_000);
    // O4: imported history — never counted.
    await mkOrder(
      { number: 'LEGACY-1', importedAt: new Date(), createdAt: atLocal(day, '09:30') },
      888_888,
    );
    // O5: completed and paid ten days ago — lands in the prior 7-day window.
    const o5 = await mkOrder(
      { number: 'O5', status: 'completed', createdAt: atLocal(tenDaysAgo, '10:00') },
      100_000,
    );
    await pay(o5.id, 100_000, atLocal(tenDaysAgo, '10:05'));

    // A register sale today with a partial refund.
    const [sale] = await db
      .insert(schema.sales)
      .values({
        businessId,
        locationId: aStoreId,
        number: 'S-0001',
        status: 'completed',
        customerId: abe!.id,
        associateUserId: bf.userId,
        subtotalCents: 1_800,
        taxCents: 175,
        totalCents: 1_975,
        completedAt: atLocal(day, '13:05'),
        createdAt: atLocal(day, '13:05'),
      })
      .returning();
    await db.insert(schema.refunds).values({
      businessId,
      saleId: sale!.id,
      amountCents: 500,
      reason: 'test',
      createdAt: atLocal(day, '14:00'),
    });
    // One open exception for the nav count.
    await db.insert(schema.exceptionEvents).values({
      businessId,
      type: 'refund_over_threshold',
      severity: 'warning',
      summary: 'Refund over threshold on S-0001',
    });
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

function get(path: string, query: Record<string, string> = {}, cookie = ownerCookie) {
  return request(app.getHttpServer())
    .get(path)
    .query(query)
    .set('Cookie', cookie)
    .set('x-business-id', businessId);
}

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'owner-test-secret-owner-test-secret-xx';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  await app.init();

  ownerCookie = await captureCookie('owner@owner-dash.local');
  cashierCookie = await captureCookie('bf@owner-dash.local');
}, 180_000);

afterAll(async () => {
  await app?.close();
});

describe('GET /v1/dashboard/owner', () => {
  it('needs reports.sales.view', async () => {
    await get('/v1/dashboard/owner', {}, cashierCookie).expect(403);
  });

  it('today: written, register, refunds, open book, receivables, trucks, compare = yesterday', async () => {
    const res = await get('/v1/dashboard/owner', { start: day, end: day }).expect(200);
    const b = res.body as OwnerDashboard;
    expect(b.range).toEqual({ start: day, end: day });
    expect(b.compare).toBe('prior');
    expect(b.compareRange).toEqual({ start: yesterday, end: yesterday });
    expect(b.kpis.writtenCents).toBe(170_000);
    expect(b.kpis.writtenCount).toBe(1);
    expect(b.kpis.registerCents).toBe(1_975);
    expect(b.kpis.ticketCount).toBe(1);
    expect(b.kpis.refundsCents).toBe(500);
    expect(b.kpis.refundCount).toBe(1);
    expect(b.kpis.openOrders).toBe(2);
    expect(b.kpis.openBalanceCents).toBe(120_000 + 80_000);
    // Receivables match the AR report: every live order's unpaid balance,
    // drafts and imported STORIS history included (the balance is real money).
    expect(b.kpis.receivablesCents).toBe(120_000 + 80_000 + 30_000 + 888_888);
    expect(b.kpis.receivableAccounts).toBe(1);
    expect(b.kpis.trucksToday.booked).toBe(1);
    expect(b.kpis.trucksToday.byStatus).toEqual({ scheduled: 1 });
    expect(b.trend).toEqual([{ day, orderCents: 170_000, registerCents: 1_975 }]);
    expect(b.compareTrend).toEqual([{ day: yesterday, orderCents: 80_000, registerCents: 0 }]);
    expect(b.previous).toEqual({ writtenCents: 80_000, registerCents: 0, refundsCents: 0 });
  });

  it('store scope narrows every figure', async () => {
    const res = await get('/v1/dashboard/owner', {
      start: day,
      end: day,
      locationIds: bStoreId,
    }).expect(200);
    const b = res.body as OwnerDashboard;
    expect(b.kpis.writtenCents).toBe(0);
    expect(b.kpis.registerCents).toBe(0);
    expect(b.kpis.openOrders).toBe(1);
    expect(b.kpis.openBalanceCents).toBe(80_000);
    expect(b.kpis.trucksToday.booked).toBe(0);
    expect(b.trend[0]!.orderCents).toBe(0);
  });

  it('compare=none drops the comparison; a 7-day window compares to the prior 7 days', async () => {
    const none = (
      await get('/v1/dashboard/owner', { start: day, end: day, compare: 'none' }).expect(200)
    ).body as OwnerDashboard;
    expect(none.previous).toBeNull();
    expect(none.compareTrend).toEqual([]);

    const week = (await get('/v1/dashboard/owner', { start: weekAgo, end: day }).expect(200))
      .body as OwnerDashboard;
    expect(week.trend).toHaveLength(7);
    expect(week.kpis.writtenCents).toBe(170_000 + 80_000);
    expect(week.kpis.writtenCount).toBe(2);
    expect(week.compareTrend).toHaveLength(7);
    expect(week.previous?.writtenCents).toBe(100_000);
  });
});

describe('GET /v1/dashboard/owner/orders', () => {
  const window = () => ({ start: localDay(29), end: day });

  it('lists the window with counts, resolved names, balances and shortfalls', async () => {
    const res = await get('/v1/dashboard/owner/orders', window()).expect(200);
    const b = res.body as {
      rows: OwnerOrderRow[];
      total: number;
      counts: { all: number; open: number; pending: number; late: number };
    };
    expect(b.counts).toEqual({ all: 4, open: 2, pending: 1, late: 1 });
    expect(b.total).toBe(4);
    expect(b.rows.map((r) => r.number).sort()).toEqual(['O1', 'O2', 'O3', 'O5']);
    const o1 = b.rows.find((r) => r.number === 'O1')!;
    expect(o1.customerName).toBe('Abe Clements');
    expect(o1.customerPhone).toBe('(213) 555-0100');
    expect(o1.storeName).toBe('201 Western');
    expect(o1.rep).toBe('Ben Franklin');
    expect(o1.balanceCents).toBe(120_000);
    expect(o1.promisedLate).toBe(false);
    expect(o1.shortUnits).toBe(1);
    const o2 = b.rows.find((r) => r.number === 'O2')!;
    expect(o2.promisedLate).toBe(true);
    expect(o2.promised).toBe(yesterday);
    const o5 = b.rows.find((r) => r.number === 'O5')!;
    expect(o5.balanceCents).toBe(0);
  });

  it('filters, searches, sorts and pages', async () => {
    const late = (
      await get('/v1/dashboard/owner/orders', { ...window(), filter: 'late' }).expect(200)
    ).body as { rows: OwnerOrderRow[]; total: number };
    expect(late.rows.map((r) => r.number)).toEqual(['O2']);

    const q = (await get('/v1/dashboard/owner/orders', { ...window(), q: 'hancock' }).expect(200))
      .body as { rows: OwnerOrderRow[] };
    expect(q.rows.map((r) => r.number)).toEqual(['O2']);

    const sorted = (
      await get('/v1/dashboard/owner/orders', { ...window(), sort: 'balance', dir: 'desc' }).expect(
        200,
      )
    ).body as { rows: OwnerOrderRow[] };
    expect(sorted.rows[0]!.number).toBe('O1');

    const paged = (
      await get('/v1/dashboard/owner/orders', { ...window(), pageSize: '5', page: '2' }).expect(200)
    ).body as { rows: OwnerOrderRow[]; page: number; total: number };
    // Only one page of 4 rows exists — the page clamps to it.
    expect(paged.page).toBe(1);
    expect(paged.rows).toHaveLength(4);

    const scoped = (
      await get('/v1/dashboard/owner/orders', { ...window(), locationIds: bStoreId }).expect(200)
    ).body as { rows: OwnerOrderRow[]; counts: { all: number } };
    expect(scoped.counts.all).toBe(1);
  });
});

describe('GET /v1/dashboard/nav-counts', () => {
  it("counts open orders, past-promise orders, open exceptions and today's trucks", async () => {
    const res = await get('/v1/dashboard/nav-counts').expect(200);
    expect(res.body).toEqual({ openOrders: 2, atRisk: 1, exceptions: 1, deliveriesToday: 1 });
    // Anyone who can see orders gets the counts.
    await get('/v1/dashboard/nav-counts', {}, cashierCookie).expect(200);
  });
});
