/**
 * Report-builder acceptance tests, stack subset — ported from
 * docs/handoffs/storis-report-builder/11-acceptance-tests.md (numbers
 * reference that file). Pure-logic scenarios live in
 * src/report-builder/report-builder.spec.ts.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq as drizzleEq } from 'drizzle-orm';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';

const TEST_DB_URL =
  process.env.REPORT_BUILDER_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_report_builder';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'ReportPass!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let ownerCookie = '';
let bookkeeperCookie = '';
let clerkCookie = '';

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
  const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sqlc);
  try {
    const passwordHash = await hashPassword(PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'report-test', name: 'Report Test Co', status: 'active' })
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
    await makeUser('owner@report-test.local', 'Owner');
    await makeUser('books@report-test.local', 'Bookkeeper');
    await makeUser('clerk@report-test.local', 'Inventory Clerk');

    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Main', timezone: 'America/New_York' })
      .returning();
    locationId = loc!.id;

    // Fixture customers + orders for the runner scenarios.
    const [withEmail] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Emma', lastName: 'Mail', email: 'emma@example.com' })
      .returning();
    const [noEmail] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Ned', lastName: 'Blank' })
      .returning();
    const mk = (
      number: string,
      customerId: string,
      status: string,
      totalCents: number,
      daysAgo: number,
    ) => ({
      businessId,
      locationId,
      number,
      status,
      customerId,
      totalCents,
      subtotalCents: totalCents,
      createdAt: new Date(Date.now() - daysAgo * 86_400_000),
    });
    await db
      .insert(schema.orders)
      .values([
        mk('RB-1', withEmail!.id, 'open', 100_00, 1),
        mk('RB-2', withEmail!.id, 'completed', 250_00, 2),
        mk('RB-3', noEmail!.id, 'open', 50_00, 40),
        mk('RB-4', noEmail!.id, 'cancelled', 75_00, 3),
      ]);

    // A product with cost for the masking scenarios (#56/57/62).
    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'MASK', name: 'Masked Mattress' })
      .returning();
    await db.insert(schema.productVariants).values({
      businessId,
      productId: p!.id,
      sku: 'MASK-1',
      priceCents: 99900,
      costCents: 31337,
    });
  } finally {
    await sqlc.end({ timeout: 5 });
  }
}

async function captureCookie(email: string): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/api/auth/sign-in/email')
    .send({ email, password: PASSWORD })
    .expect(200);
  const cookies = res.get('Set-Cookie') ?? [];
  const c = cookies
    .map((x) => x.split(';')[0])
    .filter((x): x is string => Boolean(x?.startsWith('jetnine.session_token=')))
    .find((x) => !x.endsWith('='));
  if (!c) throw new Error(`no session cookie for ${email}`);
  return c;
}

function as(cookie: string) {
  return {
    get: (url: string) =>
      request(app.getHttpServer()).get(url).set('Cookie', cookie).set('X-Business-Id', businessId),
    post: (url: string) =>
      request(app.getHttpServer()).post(url).set('Cookie', cookie).set('X-Business-Id', businessId),
    patch: (url: string) =>
      request(app.getHttpServer())
        .patch(url)
        .set('Cookie', cookie)
        .set('X-Business-Id', businessId),
    delete: (url: string) =>
      request(app.getHttpServer())
        .delete(url)
        .set('Cookie', cookie)
        .set('X-Business-Id', businessId),
  };
}

beforeAll(async () => {
  await resetTestDb();
  await seed();
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'report-test-secret-report-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();
  ownerCookie = await captureCookie('owner@report-test.local');
  bookkeeperCookie = await captureCookie('books@report-test.local');
  clerkCookie = await captureCookie('clerk@report-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('dictionaries and joins (acceptance 1–3, 7, 9)', () => {
  it('#1/#2 the formula/joined discriminated union is enforced', async () => {
    const noFormula = await as(ownerCookie)
      .post('/v1/report-builder/dictionaries')
      .send({ sourceId: 'orders', name: 'BROKEN1', kind: 'formula' });
    expect(noFormula.status).toBe(400);
    const both = await as(ownerCookie).post('/v1/report-builder/dictionaries').send({
      sourceId: 'orders',
      name: 'BROKEN2',
      kind: 'joined',
      formula: '{TOTAL} + 1',
      joinSourceId: 'customers',
      joinFieldName: 'PHONE',
    });
    expect(both.status).toBe(400);
  });

  it('#3 a 16-character dictionary name is rejected (limit 15)', async () => {
    const res = await as(ownerCookie)
      .post('/v1/report-builder/dictionaries')
      .send({ sourceId: 'orders', name: 'ABCDEFGHIJKLMNOP', kind: 'formula', formula: '1' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/15/);
  });

  it('#7 colliding with a system dictionary name errors before anything opens', async () => {
    const res = await as(ownerCookie).post('/v1/report-builder/dictionaries').send({
      sourceId: 'orders',
      name: 'TOTAL',
      kind: 'joined',
      joinSourceId: 'customers',
      joinFieldName: 'PHONE',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/system dictionary/);
  });

  it('a join outside the relation graph is rejected', async () => {
    const res = await as(ownerCookie).post('/v1/report-builder/dictionaries').send({
      sourceId: 'sales',
      name: 'CUST_PHONE',
      kind: 'joined',
      joinSourceId: 'customers',
      joinFieldName: 'PHONE',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/relation/);
  });

  it('#9 a joined dictionary works in a brand-new report with no extra setup', async () => {
    const dict = await as(ownerCookie).post('/v1/report-builder/dictionaries').send({
      sourceId: 'orders',
      name: 'CUST_PHONE',
      kind: 'joined',
      joinSourceId: 'customers',
      joinFieldName: 'PHONE',
    });
    expect(dict.status).toBe(201);
    const report = await as(ownerCookie)
      .post('/v1/report-builder/reports')
      .send({
        name: 'Joined phone check',
        sourceId: 'orders',
        columns: [{ dictionary: 'ORDER_NUMBER' }, { dictionary: 'CUST_PHONE' }],
      });
    expect(report.status).toBe(201);
    const run = await as(ownerCookie)
      .post(`/v1/report-builder/reports/${report.body.id}/run`)
      .send({});
    expect(run.status).toBe(201);
    expect(run.body.columns.map((c: { name: string }) => c.name)).toContain('CUST_PHONE');
  });
});

describe('runner (acceptance 22, 24–28)', () => {
  let summaryReportId = '';

  it('#25 the blank idiom: EMAIL_ADDR NE "" keeps records with an email', async () => {
    const report = await as(ownerCookie)
      .post('/v1/report-builder/reports')
      .send({
        name: 'Orders with email',
        sourceId: 'orders',
        columns: [{ dictionary: 'ORDER_NUMBER' }, { dictionary: 'CUSTOMER_EMAIL' }],
        filters: [{ dictionary: 'CUSTOMER_EMAIL', operator: 'NE', value: '""' }],
        sorts: [{ dictionary: 'ORDER_NUMBER' }],
      });
    expect(report.status).toBe(201);
    const run = await as(ownerCookie)
      .post(`/v1/report-builder/reports/${report.body.id}/run`)
      .send({});
    const numbers = run.body.rows.map((r: { ORDER_NUMBER: string }) => r.ORDER_NUMBER);
    expect(numbers).toEqual(['RB-1', 'RB-2']);
  });

  it('#24/#26 a required multi-select prompt blocks unanswered, and Exclude removes values', async () => {
    const report = await as(ownerCookie)
      .post('/v1/report-builder/reports')
      .send({
        name: 'Orders by status',
        sourceId: 'orders',
        columns: [{ dictionary: 'ORDER_NUMBER' }, { dictionary: 'STATUS' }],
        prompts: [
          {
            dictionary: 'STATUS',
            label: 'Statuses',
            promptType: 'multi_select',
            includeExclude: 'exclude',
            required: true,
          },
        ],
        sorts: [{ dictionary: 'ORDER_NUMBER' }],
      });
    expect(report.status).toBe(201);
    const blocked = await as(ownerCookie)
      .post(`/v1/report-builder/reports/${report.body.id}/run`)
      .send({});
    expect(blocked.status).toBe(400);
    const run = await as(ownerCookie)
      .post(`/v1/report-builder/reports/${report.body.id}/run`)
      .send({ answers: { STATUS: ['cancelled'] } });
    const statuses = run.body.rows.map((r: { STATUS: string }) => r.STATUS);
    expect(statuses).not.toContain('cancelled');
    expect(statuses.length).toBe(3);
  });

  it('#27 a date-code prompt resolves at execution and echoes the window (#28 provenance)', async () => {
    const report = await as(ownerCookie)
      .post('/v1/report-builder/reports')
      .send({
        name: 'Recent orders',
        sourceId: 'orders',
        title: 'Orders {WRITTEN_DATE}',
        columns: [{ dictionary: 'ORDER_NUMBER' }, { dictionary: 'WRITTEN_DATE' }],
        prompts: [
          { dictionary: 'WRITTEN_DATE', label: 'Window', promptType: 'range', dateCode: true },
        ],
        sorts: [{ dictionary: 'ORDER_NUMBER' }],
      });
    const run = await as(ownerCookie)
      .post(`/v1/report-builder/reports/${report.body.id}/run`)
      .send({ answers: { WRITTEN_DATE: 'CPTD' } });
    expect(run.status).toBe(201);
    // #28: the answers echo (with the resolved window) is in the output.
    expect(String(run.body.provenance.answers.WRITTEN_DATE)).toMatch(/CPTD → \d{4}-/);
    // Token substitution used the echoed answer.
    expect(run.body.title).toMatch(/^Orders CPTD/);
    // RB-3 was written 40 days ago — outside the current period.
    const numbers = run.body.rows.map((r: { ORDER_NUMBER: string }) => r.ORDER_NUMBER);
    expect(numbers).not.toContain('RB-3');
  });

  it('#22 Summary Only emits break totals and zero detail rows', async () => {
    const report = await as(ownerCookie)
      .post('/v1/report-builder/reports')
      .send({
        name: 'Totals by status',
        sourceId: 'orders',
        columns: [
          { dictionary: 'STATUS', break: true },
          { dictionary: 'TOTAL', total: true },
        ],
        sorts: [{ dictionary: 'STATUS' }],
      });
    expect(report.status).toBe(201);
    summaryReportId = report.body.id;
    const full = await as(ownerCookie)
      .post(`/v1/report-builder/reports/${summaryReportId}/run`)
      .send({});
    expect(full.body.summaryOnly).toBe(false);
    expect(full.body.rows.length).toBe(4);
    expect(full.body.grandTotals.TOTAL).toBe(100_00 + 250_00 + 50_00 + 75_00);

    const summary = await as(ownerCookie)
      .post(`/v1/report-builder/reports/${summaryReportId}/run`)
      .send({ summaryOnly: true });
    expect(summary.body.summaryOnly).toBe(true);
    expect(summary.body.rows).toEqual([]);
    const open = summary.body.groups.find((g: { key: string }) => g.key === 'open');
    expect(open.totals.TOTAL).toBe(100_00 + 50_00);
  });

  it('CSV export carries provenance headers and totals', async () => {
    const res = await as(ownerCookie)
      .post(`/v1/report-builder/reports/${summaryReportId}/run?format=csv`)
      .send({});
    expect(res.status).toBe(201);
    const text = res.text;
    expect(text).toContain('# report=Totals by status');
    expect(text).toContain('GRAND TOTAL');
  });
});

describe('clone and system reports (acceptance 30, 31)', () => {
  let baseId = '';
  it('#30 a clone is independent of the original', async () => {
    const base = await as(ownerCookie)
      .post('/v1/report-builder/reports')
      .send({
        name: 'Clone base',
        sourceId: 'orders',
        columns: [{ dictionary: 'ORDER_NUMBER' }],
      });
    baseId = base.body.id;
    const clone = await as(ownerCookie)
      .post(`/v1/report-builder/reports/${baseId}/clone`)
      .send({ name: 'Clone copy' });
    expect(clone.status).toBe(201);
    await as(ownerCookie)
      .patch(`/v1/report-builder/reports/${clone.body.id}`)
      .send({ columns: [{ dictionary: 'ORDER_NUMBER' }, { dictionary: 'STATUS' }] })
      .expect(200);
    const original = await as(ownerCookie).get(`/v1/report-builder/reports/${baseId}`);
    expect((original.body.definitionJson.columns as unknown[]).length).toBe(1);
  });

  it('#31 a system-owned report cannot be edited but can be run and cloned', async () => {
    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    let sysId = '';
    try {
      const [row] = await db
        .insert(schema.reportDefinitions)
        .values({
          businessId,
          name: 'S$STANDARD',
          sourceId: 'orders',
          systemOwned: true,
          access: 'anyone',
          definitionJson: {
            columns: [{ dictionary: 'ORDER_NUMBER' }],
            prompts: [],
            filters: [],
            sorts: [],
          },
        })
        .returning();
      sysId = row!.id;
    } finally {
      await sqlc.end({ timeout: 5 });
    }
    await as(ownerCookie)
      .patch(`/v1/report-builder/reports/${sysId}`)
      .send({ description: 'nope' })
      .expect(403);
    const run = await as(ownerCookie).post(`/v1/report-builder/reports/${sysId}/run`).send({});
    expect(run.status).toBe(201);
    const clone = await as(ownerCookie)
      .post(`/v1/report-builder/reports/${sysId}/clone`)
      .send({ name: 'My standard' });
    expect(clone.status).toBe(201);
    // #17: the clone cannot take the reserved prefix either.
    await as(ownerCookie)
      .post(`/v1/report-builder/reports/${sysId}/clone`)
      .send({ name: 'S$MINE' })
      .expect(400);
  });
});

describe('security (acceptance 54–58, 62)', () => {
  let costReportId = '';

  it('#54 a user without reports.builder.run cannot reach the runner at all', async () => {
    // Inventory Clerk holds no builder permissions.
    await as(clerkCookie).get('/v1/report-builder/reports').expect(403);
  });

  it('#62/#56 cost is masked by default: header present, cells empty, rows unchanged', async () => {
    const report = await as(ownerCookie)
      .post('/v1/report-builder/reports')
      .send({
        name: 'Catalog with cost',
        sourceId: 'products',
        columns: [{ dictionary: 'SKU' }, { dictionary: 'PRICE' }, { dictionary: 'COST' }],
        sorts: [{ dictionary: 'SKU' }],
      });
    expect(report.status).toBe(201);
    costReportId = report.body.id;

    // Take reports.cost.view away from the bookkeeper via an override.
    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      const [m] = await db
        .select({ id: schema.memberships.id })
        .from(schema.memberships)
        .innerJoin(schema.users, drizzleEq(schema.users.id, schema.memberships.userId))
        .where(drizzleEq(schema.users.email, 'books@report-test.local'))
        .limit(1);
      await db.insert(schema.membershipPermissionOverrides).values([
        { businessId, membershipId: m!.id, permission: 'reports.cost.view', allowed: false },
        // The Bookkeeper role has no products.view — grant it so the
        // masking scenario reaches the source (revoked again in #55).
        { businessId, membershipId: m!.id, permission: 'products.view', allowed: true },
      ]);
    } finally {
      await sqlc.end({ timeout: 5 });
    }

    const masked = await as(bookkeeperCookie)
      .post(`/v1/report-builder/reports/${costReportId}/run`)
      .send({});
    expect(masked.status).toBe(201);
    const costCol = masked.body.columns.find((c: { name: string }) => c.name === 'COST');
    expect(costCol.masked).toBe(true);
    expect(masked.body.rows.length).toBeGreaterThan(0); // row count unchanged
    for (const r of masked.body.rows) {
      expect(r.COST).toBeNull(); // data gone
      expect(r.PRICE).not.toBeNull(); // sibling column intact
    }
  });

  it('#57 the same run shows the data to a user holding the code', async () => {
    const res = await as(ownerCookie)
      .post(`/v1/report-builder/reports/${costReportId}/run`)
      .send({});
    const row = res.body.rows.find((r: { SKU: string }) => r.SKU === 'MASK-1');
    expect(row.COST).toBe(31337);
    const costCol = res.body.columns.find((c: { name: string }) => c.name === 'COST');
    expect(costCol.masked).toBe(false);
  });

  it('#58 owner_only hides the report from everyone else', async () => {
    const priv = await as(ownerCookie)
      .post('/v1/report-builder/reports')
      .send({
        name: 'Private report',
        sourceId: 'orders',
        access: 'owner_only',
        columns: [{ dictionary: 'ORDER_NUMBER' }],
      });
    expect(priv.status).toBe(201);
    const mine = await as(ownerCookie).get('/v1/report-builder/reports');
    expect((mine.body.reports as { name: string }[]).some((r) => r.name === 'Private report')).toBe(
      true,
    );
    const theirs = await as(bookkeeperCookie).get('/v1/report-builder/reports');
    expect(
      (theirs.body.reports as { name: string }[]).some((r) => r.name === 'Private report'),
    ).toBe(false);
    await as(bookkeeperCookie)
      .post(`/v1/report-builder/reports/${priv.body.id}/run`)
      .send({})
      .expect(403);
  });

  it('#55 a source the user lacks permission for denies the whole report', async () => {
    // Bookkeeper has purchase_orders.view; clerk-style denial is covered
    // by #54. Here: deny the bookkeeper the products source's permission
    // and watch the catalog report disappear.
    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      await db
        .update(schema.membershipPermissionOverrides)
        .set({ allowed: false })
        .where(drizzleEq(schema.membershipPermissionOverrides.permission, 'products.view'));
    } finally {
      await sqlc.end({ timeout: 5 });
    }
    await as(bookkeeperCookie)
      .post(`/v1/report-builder/reports/${costReportId}/run`)
      .send({})
      .expect(403);
  });
});

describe('archives and scheduling (acceptance 36–38, 42, 61, 63–64)', () => {
  let archiveReportId = '';
  let archiveId = '';

  it('#36 archive destination produces no render and one archive record', async () => {
    const report = await as(ownerCookie)
      .post('/v1/report-builder/reports')
      .send({
        name: 'Archived orders',
        sourceId: 'orders',
        addToSchedule: true,
        columns: [{ dictionary: 'ORDER_NUMBER' }, { dictionary: 'TOTAL' }],
        sorts: [{ dictionary: 'ORDER_NUMBER' }],
      });
    expect(report.status).toBe(201);
    archiveReportId = report.body.id;
    const run = await as(ownerCookie)
      .post(`/v1/report-builder/reports/${archiveReportId}/run`)
      .send({ format: 'archive' });
    expect(run.status).toBe(201);
    expect(run.body.archiveId).toBeTruthy();
    expect(run.body.rows).toBeUndefined(); // no immediate render
    archiveId = run.body.archiveId;
  });

  it('#37 the archive stores structured data and re-renders later (JSON + CSV)', async () => {
    const view = await as(ownerCookie).get(`/v1/report-builder/archives/${archiveId}`);
    expect(view.status).toBe(200);
    expect(view.body.rows.length).toBeGreaterThan(0);
    expect(view.body.runSource).toBe('regular'); // #38 on-demand source
    const csv = await as(ownerCookie).get(`/v1/report-builder/archives/${archiveId}?format=csv`);
    expect(csv.status).toBe(200);
    expect(csv.text).toContain('# report=Archived orders');
  });

  it('#63/#64/#38 the EOD job archives scheduled reports with runSource eod', async () => {
    const businessDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const run = await as(ownerCookie).post('/v1/jobs/run').send({ businessDate });
    expect(run.status).toBe(201);
    const step = (run.body.results as { jobId: string; status: string }[]).find(
      (r) => r.jobId === 'report_builder_schedule',
    );
    expect(step?.status).toBe('succeeded');

    const list = await as(ownerCookie).get('/v1/report-builder/archives');
    const eod = (
      list.body.archives as { reportName: string; runSource: string; id: string }[]
    ).filter((a) => a.runSource === 'eod');
    // Only 'Archived orders' carries addToSchedule (#63): every other
    // report in this suite must NOT have been run by the scheduler.
    expect(eod.length).toBe(1);
    expect(eod[0]!.reportName).toBe('Archived orders');
    const view = await as(ownerCookie).get(`/v1/report-builder/archives/${eod[0]!.id}`);
    expect(view.body.runSource).toBe('eod');
    expect(view.body.provenance.runBy).toBe('scheduler');
  });

  it('#61 archives re-check entitlements at view time', async () => {
    // The bookkeeper lost products.view in #55 but keeps order access;
    // deny the sales-report permission and the orders archive vanishes.
    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      const [m] = await db
        .select({ id: schema.memberships.id })
        .from(schema.memberships)
        .innerJoin(schema.users, drizzleEq(schema.users.id, schema.memberships.userId))
        .where(drizzleEq(schema.users.email, 'books@report-test.local'))
        .limit(1);
      await db.insert(schema.membershipPermissionOverrides).values({
        businessId,
        membershipId: m!.id,
        permission: 'reports.sales.view',
        allowed: false,
      });
    } finally {
      await sqlc.end({ timeout: 5 });
    }
    await as(bookkeeperCookie).get(`/v1/report-builder/archives/${archiveId}`).expect(403);
    const list = await as(bookkeeperCookie).get('/v1/report-builder/archives');
    expect((list.body.archives as { id: string }[]).some((a) => a.id === archiveId)).toBe(false);
  });

  it('#42 deleting an archive removes exactly that archive', async () => {
    const before = await as(ownerCookie).get('/v1/report-builder/archives');
    const count = (before.body.archives as unknown[]).length;
    await as(ownerCookie).delete(`/v1/report-builder/archives/${archiveId}`).expect(200);
    const after = await as(ownerCookie).get('/v1/report-builder/archives');
    expect((after.body.archives as unknown[]).length).toBe(count - 1);
    await as(ownerCookie).get(`/v1/report-builder/archives/${archiveId}`).expect(404);
  });
});
