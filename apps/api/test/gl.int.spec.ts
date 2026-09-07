/**
 * In-house GL slice 1 (owner 2026-08-28; run-01 batch 1 is the spec):
 * chart of accounts with system keys, fiscal periods with cascade
 * close/reopen and the period-13 year latch (F4/F5/F6), balanced
 * journal batches with the open-period posting gate, posted batches
 * append-only, and the trial balance. STORIS's silent default account
 * (F1) is deliberately absent — bad input is refused, never defaulted.
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
  process.env.GL_TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/jetnine_gl';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'GlPass!2026';

let app: INestApplication;
let businessId = '';
let bookkeeperCookie = '';
let cashierCookie = '';
let ownerCookie = '';
let ownerUserId = '';

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
      .values({ slug: 'gl-test', name: 'GL Test Co', status: 'active' })
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
    for (const [email, role] of [
      ['books@gl-test.local', 'Bookkeeper'],
      ['cashier@gl-test.local', 'Cashier'],
      ['owner@gl-test.local', 'Owner'],
    ] as const) {
      const [u] = await db
        .insert(schema.users)
        .values({ email, emailVerified: true, name: email })
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
      if (role === 'Owner') ownerUserId = u!.id;
    }
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
  process.env.BETTER_AUTH_SECRET ??= 'gl-test-secret-gl-test-secret-abcdef';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.WEB_BASE_URL ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true });
  await app.init();
  bookkeeperCookie = await captureCookie('books@gl-test.local');
  cashierCookie = await captureCookie('cashier@gl-test.local');
  ownerCookie = await captureCookie('owner@gl-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

function asBooks() {
  const wrap = (m: 'get' | 'post' | 'patch') => (url: string) =>
    request(app.getHttpServer())
      [m](url)
      .set('Cookie', bookkeeperCookie)
      .set('X-Business-Id', businessId);
  return { get: wrap('get'), post: wrap('post'), patch: wrap('patch') };
}

const accountIdByCode = new Map<string, string>();

describe('GL slice 1 — chart, periods, journal batches (run-01 batch 1)', () => {
  it('Bookkeeper seeds the default chart once; a second seed is refused', async () => {
    const res = await asBooks().post('/v1/gl/accounts/seed-defaults').send({});
    expect(res.status).toBe(201);
    expect(res.body).toHaveLength(20);
    for (const a of res.body as { id: string; code: string }[]) {
      accountIdByCode.set(a.code, a.id);
    }
    const again = await asBooks().post('/v1/gl/accounts/seed-defaults').send({});
    expect(again.status).toBe(409);
  });

  it('accounts: duplicate code refused, type validated, code immutable, deactivate works', async () => {
    const dup = await asBooks()
      .post('/v1/gl/accounts')
      .send({ code: '1000', name: 'Dup', accountType: 'asset' });
    expect(dup.status).toBe(409);

    const badType = await asBooks()
      .post('/v1/gl/accounts')
      .send({ code: '6000', name: 'Weird', accountType: 'contra' });
    expect(badType.status).toBe(400);

    const created = await asBooks()
      .post('/v1/gl/accounts')
      .send({ code: '6000', name: 'Marketing Expense', accountType: 'expense' });
    expect(created.status).toBe(201);

    const codeChange = await asBooks()
      .patch(`/v1/gl/accounts/${created.body.id}`)
      .send({ code: '6001' });
    expect(codeChange.status).toBe(400);
    expect(codeChange.body.message).toContain('immutable');

    const off = await asBooks()
      .patch(`/v1/gl/accounts/${created.body.id}`)
      .send({ isActive: false });
    expect(off.status).toBe(200);
    expect(off.body.isActive).toBe(false);

    // Inactive accounts are refused on journal lines (no silent default).
    const useInactive = await asBooks()
      .post('/v1/gl/journal-batches')
      .send({
        businessDate: '2026-08-01',
        lines: [
          { accountId: created.body.id, debitCents: 100 },
          { accountId: accountIdByCode.get('1000'), creditCents: 100 },
        ],
        post: true,
      });
    expect(useInactive.status).toBe(400);
    expect(useInactive.body.message).toContain('inactive');
  });

  it('journal: drafts may be lopsided, posting demands balance and an open period', async () => {
    const cash = accountIdByCode.get('1000')!;
    const sales = accountIdByCode.get('4000')!;

    const draft = await asBooks()
      .post('/v1/gl/journal-batches')
      .send({
        businessDate: '2026-08-15',
        memo: 'August cash sale summary',
        lines: [{ accountId: cash, debitCents: 50000 }],
      });
    expect(draft.status).toBe(201);
    expect(draft.body.status).toBe('draft');
    expect(draft.body.number).toMatch(/^GL-2026-\d{6}$/);
    expect(draft.body.balanced).toBe(false);

    const failPost = await asBooks().post(`/v1/gl/journal-batches/${draft.body.id}/post`).send({});
    expect(failPost.status).toBe(400);
    expect(failPost.body.message).toContain('out of balance');

    const fixed = await asBooks()
      .patch(`/v1/gl/journal-batches/${draft.body.id}`)
      .send({
        lines: [
          { accountId: cash, debitCents: 50000 },
          { accountId: sales, creditCents: 50000 },
        ],
      });
    expect(fixed.status).toBe(200);
    expect(fixed.body.balanced).toBe(true);

    const posted = await asBooks().post(`/v1/gl/journal-batches/${draft.body.id}/post`).send({});
    expect(posted.status).toBe(201);
    expect(posted.body.status).toBe('posted');

    // F-append-only: a posted batch refuses edits.
    const editPosted = await asBooks()
      .patch(`/v1/gl/journal-batches/${draft.body.id}`)
      .send({ memo: 'rewrite history' });
    expect(editPosted.status).toBe(403);

    // One-sided validation: a line with both sides is refused.
    const twoSided = await asBooks()
      .post('/v1/gl/journal-batches')
      .send({
        businessDate: '2026-08-15',
        lines: [{ accountId: cash, debitCents: 100, creditCents: 100 }],
      });
    expect(twoSided.status).toBe(400);
    expect(twoSided.body.message).toContain('debit XOR a credit');
  });

  it('periods: cascade close (F4), draft guard (F9 hardened), 13-latch (F6), cascade reopen (F5)', async () => {
    const first = await asBooks().get('/v1/gl/periods?year=2026');
    expect(first.status).toBe(200);
    expect(first.body.periods).toHaveLength(13);
    expect(first.body.yearClosed).toBe(false);

    // A stranded draft in period 3 blocks closing periods 1-3.
    const cash = accountIdByCode.get('1000')!;
    const sales = accountIdByCode.get('4000')!;
    const strandedDraft = await asBooks()
      .post('/v1/gl/journal-batches')
      .send({
        businessDate: '2026-03-10',
        lines: [{ accountId: cash, debitCents: 100 }],
      });
    expect(strandedDraft.status).toBe(201);
    const blocked = await asBooks()
      .post('/v1/gl/periods/close')
      .send({ fiscalYear: 2026, period: 3 });
    expect(blocked.status).toBe(400);
    expect(blocked.body.message).toContain('draft batch');

    // Post it, then close period 3 — periods 1-3 close in cascade.
    await asBooks()
      .patch(`/v1/gl/journal-batches/${strandedDraft.body.id}`)
      .send({
        lines: [
          { accountId: cash, debitCents: 100 },
          { accountId: sales, creditCents: 100 },
        ],
      });
    await asBooks()
      .post(`/v1/gl/journal-batches/${strandedDraft.body.id}/post`)
      .send({})
      .expect(201);
    const closed3 = await asBooks()
      .post('/v1/gl/periods/close')
      .send({ fiscalYear: 2026, period: 3 });
    expect(closed3.status).toBe(201);
    const statuses = (closed3.body.periods as { period: number; status: string }[]).map(
      (p) => p.status,
    );
    expect(statuses.slice(0, 3)).toEqual(['closed', 'closed', 'closed']);
    expect(statuses[3]).toBe('open');

    // Posting into the closed period 2 is refused (F4 hard gate).
    const intoClosed = await asBooks()
      .post('/v1/gl/journal-batches')
      .send({
        businessDate: '2026-02-10',
        lines: [
          { accountId: cash, debitCents: 100 },
          { accountId: sales, creditCents: 100 },
        ],
        post: true,
      });
    expect(intoClosed.status).toBe(400);
    expect(intoClosed.body.message).toContain('closed');

    // Period 13 cannot close while 4-12 are open (year latch).
    const early13 = await asBooks()
      .post('/v1/gl/periods/close')
      .send({ fiscalYear: 2026, period: 13 });
    expect(early13.status).toBe(400);
    expect(early13.body.message).toContain('All 12 periods');

    // Close 12 (cascades 4-12), then 13 closes the year.
    await asBooks().post('/v1/gl/periods/close').send({ fiscalYear: 2026, period: 12 }).expect(201);
    const closed13 = await asBooks()
      .post('/v1/gl/periods/close')
      .send({ fiscalYear: 2026, period: 13 });
    expect(closed13.status).toBe(201);
    expect(closed13.body.yearClosed).toBe(true);

    // Reopen 2 — every later closed period reopens with it (F5).
    const reopened = await asBooks()
      .post('/v1/gl/periods/reopen')
      .send({ fiscalYear: 2026, period: 2 });
    expect(reopened.status).toBe(201);
    expect(reopened.body.yearClosed).toBe(false);
    const after = (reopened.body.periods as { period: number; status: string }[]).map(
      (p) => p.status,
    );
    expect(after[0]).toBe('closed'); // period 1 stays closed
    expect(new Set(after.slice(1))).toEqual(new Set(['open']));
  });

  it('trial balance sums posted activity per account and balances in total', async () => {
    const res = await asBooks().get('/v1/gl/trial-balance?year=2026');
    expect(res.status).toBe(200);
    expect(res.body.totals.debitCents).toBe(res.body.totals.creditCents);
    const cashRow = (res.body.rows as { code: string; debitCents: number }[]).find(
      (r) => r.code === '1000',
    );
    expect(cashRow?.debitCents).toBe(50100);
  });

  it('a cashier holds no gl.view — the ledger is invisible to the counter', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/gl/accounts')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(403);
  });
});

describe('GL slice 2 — journal-event derivation (DERIVATION-SPEC families)', () => {
  const D = '2026-08-20';
  const ts = new Date(`${D}T12:00:00Z`);

  function asOwner() {
    const wrap = (m: 'get' | 'post' | 'patch') => (url: string) =>
      request(app.getHttpServer())
        [m](url)
        .set('Cookie', ownerCookie)
        .set('X-Business-Id', businessId);
    return { get: wrap('get'), post: wrap('post'), patch: wrap('patch') };
  }
  async function withDb<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      return await fn(drizzle(sql));
    } finally {
      await sql.end({ timeout: 5 });
    }
  }

  let layerId = '';

  beforeAll(async () => {
    await withDb(async (db) => {
      const [loc] = await db
        .insert(schema.locations)
        .values({ businessId, name: 'GL Main', timezone: 'America/Los_Angeles' })
        .returning();
      const [customer] = await db
        .insert(schema.customers)
        .values({ businessId, firstName: 'Gina', lastName: 'Ledger' })
        .returning();
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'GL-P', name: 'GL Fixture Mattress' })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({
          businessId,
          productId: p!.id,
          sku: 'GL-P-V',
          priceCents: 100000,
          costCents: 3000,
        })
        .returning();

      // Family 1: a completed POS sale, cash 500 + card 545 tender.
      const [sale] = await db
        .insert(schema.sales)
        .values({
          businessId,
          locationId: loc!.id,
          number: 'INV-GL-1',
          status: 'completed',
          subtotalCents: 100000,
          discountCents: 5000,
          taxCents: 9500,
          totalCents: 104500,
          completedAt: ts,
        })
        .returning();
      await db.insert(schema.payments).values([
        {
          businessId,
          saleId: sale!.id,
          kind: 'sale',
          method: 'cash',
          amountCents: 50000,
          status: 'succeeded',
          createdAt: ts,
        },
        {
          businessId,
          saleId: sale!.id,
          kind: 'sale',
          method: 'card',
          amountCents: 54500,
          status: 'succeeded',
          createdAt: ts,
        },
      ]);

      // Family 2: a $200 cash deposit on an open order.
      const [openOrder] = await db
        .insert(schema.orders)
        .values({
          businessId,
          locationId: loc!.id,
          number: 'SO-GL-1',
          status: 'open',
          customerId: customer!.id,
          subtotalCents: 50000,
          taxCents: 4750,
          totalCents: 54750,
        })
        .returning();
      await db.insert(schema.payments).values({
        businessId,
        orderId: openOrder!.id,
        kind: 'deposit',
        method: 'cash',
        amountCents: 20000,
        status: 'succeeded',
        createdAt: ts,
      });

      // Family 3: an order fully completed on D (charges ride untaxed).
      await db.insert(schema.orders).values({
        businessId,
        locationId: loc!.id,
        number: 'SO-GL-2',
        status: 'completed',
        customerId: customer!.id,
        subtotalCents: 80000,
        taxCents: 7600,
        deliveryFeeCents: 5000,
        otherFeeCents: 1000,
        totalCents: 93600,
        completedAt: ts,
      });

      // Families 4/5/8: a receipt layer, a COGS consumption, a shrink.
      const [layer] = await db
        .insert(schema.costLayers)
        .values({
          businessId,
          variantId: v!.id,
          locationId: loc!.id,
          sourceType: 'po_receive',
          unitCostCents: 3000,
          quantityReceived: 10,
          quantityRemaining: 5,
          receivedAt: ts,
        })
        .returning();
      layerId = layer!.id;
      await db.insert(schema.costConsumptions).values([
        {
          businessId,
          layerId,
          quantity: 4,
          unitCostCents: 3000,
          referenceType: 'sale',
          consumedAt: ts,
        },
        {
          businessId,
          layerId,
          quantity: 1,
          unitCostCents: 3000,
          referenceType: 'inventory_adjust',
          consumedAt: ts,
        },
      ]);

      // Family 6: an approved vendor bill.
      const [vendor] = await db
        .insert(schema.vendors)
        .values({ businessId, name: 'GL Vendor Co' })
        .returning();
      await db.insert(schema.vendorInvoices).values({
        businessId,
        vendorId: vendor!.id,
        number: 'VI-GL-1',
        totalCents: 25000,
        status: 'approved',
        approvedAt: ts,
      });

      // Family 7: a shift closed $3.00 short on D.
      await db.insert(schema.cashShifts).values({
        businessId,
        locationId: loc!.id,
        openedByUserId: ownerUserId,
        openedAt: new Date(ts.getTime() - 8 * 3600 * 1000),
        openingFloatCents: 10000,
        closedByUserId: ownerUserId,
        closedAt: ts,
        expectedCashCents: 60000,
        countedCashCents: 59700,
        varianceCents: -300,
      });
    });
  });

  it('the EOD run derives eight balanced posted batches for the fixture day', async () => {
    const run = await asOwner().post('/v1/jobs/run').send({ businessDate: D });
    expect(run.status).toBe(201);
    const step = (
      run.body.results as { jobId: string; status: string; detail?: Record<string, unknown> }[]
    ).find((r) => r.jobId === 'gl_derivation');
    expect(step?.status).toBe('succeeded');

    const batches = await asBooks().get('/v1/gl/journal-batches?year=2026');
    const derived = (
      batches.body.rows as { batchType: string; sourceType: string | null; status: string }[]
    ).filter((b) => b.batchType === 'derived');
    expect(derived).toHaveLength(8);
    expect(new Set(derived.map((b) => b.sourceType))).toEqual(
      new Set([
        'eod_pos_sales',
        'eod_order_money_in',
        'eod_order_revenue',
        'eod_cogs',
        'eod_inventory_receipts',
        'eod_vendor_bills',
        'eod_cash_over_short',
        'eod_inventory_adjustments',
      ]),
    );
    for (const b of derived) expect(b.status).toBe('posted');

    // Spot-check the POS batch: tender split debits vs revenue + tax.
    const rows = batches.body.rows as { id: string; sourceType: string | null }[];
    const posId = rows.find((b) => b.sourceType === 'eod_pos_sales')!.id;
    const pos = await asBooks().get(`/v1/gl/journal-batches/${posId}`);
    expect(pos.body.balanced).toBe(true);
    expect(pos.body.debitCents).toBe(104500);
    const byCode = new Map(
      (pos.body.lines as { accountCode: string; debitCents: number; creditCents: number }[]).map(
        (l) => [l.accountCode, l],
      ),
    );
    expect(byCode.get('1050')?.debitCents).toBe(50000); // cash drawer
    expect(byCode.get('1000')?.debitCents).toBe(54500); // bank (card)
    expect(byCode.get('4000')?.creditCents).toBe(95000); // revenue net of discount
    expect(byCode.get('2200')?.creditCents).toBe(9500); // sales tax payable

    // A derived batch is posted and append-only.
    const patch = await asBooks().patch(`/v1/gl/journal-batches/${posId}`).send({ memo: 'tamper' });
    expect(patch.status).toBe(403);

    // Trial balance still balances; inventory nets receipt − COGS − shrink.
    const tb = await asBooks().get('/v1/gl/trial-balance?year=2026');
    expect(tb.body.totals.debitCents).toBe(tb.body.totals.creditCents);
    const inv = (tb.body.rows as { code: string; debitCents: number; creditCents: number }[]).find(
      (r) => r.code === '1200',
    );
    expect(inv?.debitCents).toBe(30000);
    expect(inv?.creditCents).toBe(15000);
  });

  it('re-running the same date derives nothing new (idempotent)', async () => {
    await asOwner().post('/v1/jobs/run').send({ businessDate: D }).expect(201);
    const batches = await asBooks().get('/v1/gl/journal-batches?year=2026');
    const derived = (batches.body.rows as { batchType: string }[]).filter(
      (b) => b.batchType === 'derived',
    );
    expect(derived).toHaveLength(8);
  });

  it('anti-F1: an unmapped system key blocks the job with the reason reported', async () => {
    // New activity on a later date, then unmap cogs.
    const D2 = '2026-08-22';
    const ts2 = new Date(`${D2}T12:00:00Z`);
    await withDb((db) =>
      db.insert(schema.costConsumptions).values({
        businessId,
        layerId,
        quantity: 2,
        unitCostCents: 3000,
        referenceType: 'sale',
        consumedAt: ts2,
      }),
    );
    const accounts = await asBooks().get('/v1/gl/accounts');
    const cogs = (accounts.body as { id: string; systemKey: string | null }[]).find(
      (a) => a.systemKey === 'cogs',
    )!;
    await asBooks().patch(`/v1/gl/accounts/${cogs.id}`).send({ systemKey: null }).expect(200);

    const run = await asOwner().post('/v1/jobs/run').send({ businessDate: D2 });
    expect(run.status).toBe(201);
    const step = (run.body.results as { jobId: string; status: string }[]).find(
      (r) => r.jobId === 'gl_derivation',
    );
    expect(step?.status).toBe('blocked');
    // The skip reason lands in the job_runs morning report.
    const detail = await withDb(async (db) => {
      const [row] = await db
        .select({ detailJson: schema.jobRuns.detailJson })
        .from(schema.jobRuns)
        .where(
          and(
            eq(schema.jobRuns.businessId, businessId),
            eq(schema.jobRuns.jobId, 'gl_derivation'),
            eq(schema.jobRuns.businessDate, D2),
          ),
        );
      return JSON.parse((row?.detailJson as string) ?? '{}') as {
        skipped?: { family: string; reason: string }[];
      };
    });
    const cogsSkip = (detail.skipped ?? []).find((x) => x.family === 'cogs');
    expect(cogsSkip?.reason).toContain('unmapped');

    // Nothing posted to a fallback: no derived cogs batch exists for D2.
    const batches = await asBooks().get('/v1/gl/journal-batches?year=2026');
    const d2cogs = (
      batches.body.rows as { sourceType: string | null; businessDate: string }[]
    ).filter((b) => b.sourceType === 'eod_cogs' && b.businessDate === D2);
    expect(d2cogs).toHaveLength(0);

    // Restore the mapping for cleanliness.
    await asBooks().patch(`/v1/gl/accounts/${cogs.id}`).send({ systemKey: 'cogs' }).expect(200);
  });
});

describe('GL slice 3 — year-end roll, refunds derivation, account activity', () => {
  function asOwner() {
    const wrap = (m: 'get' | 'post' | 'patch') => (url: string) =>
      request(app.getHttpServer())
        [m](url)
        .set('Cookie', ownerCookie)
        .set('X-Business-Id', businessId);
    return { get: wrap('get'), post: wrap('post'), patch: wrap('patch') };
  }
  async function withDb<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      return await fn(drizzle(sql));
    } finally {
      await sql.end({ timeout: 5 });
    }
  }

  it('F7: the period-13 close rolled P&L into retained earnings (from the earlier close)', async () => {
    const batches = await asBooks().get('/v1/gl/journal-batches?year=2026');
    const roll = (
      batches.body.rows as { id: string; batchType: string; sourceType: string | null }[]
    ).find((b) => b.batchType === 'year_end');
    expect(roll).toBeTruthy();
    const detail = await asBooks().get(`/v1/gl/journal-batches/${roll!.id}`);
    expect(detail.body.balanced).toBe(true);
    // At roll time the year's P&L was the two posted sales (50100¢).
    const re = (detail.body.lines as { accountCode: string; creditCents: number }[]).find(
      (l) => l.accountCode === '3900',
    );
    expect(re?.creditCents).toBe(50100);
  });

  it('family 9: refunds derive with a proportional tax split', async () => {
    const D3 = '2026-08-23';
    const ts3 = new Date(`${D3}T12:00:00Z`);
    await withDb(async (db) => {
      const [sale] = await db
        .select({ id: schema.sales.id })
        .from(schema.sales)
        .where(eq(schema.sales.number, 'INV-GL-1'));
      await db.insert(schema.refunds).values({
        businessId,
        saleId: sale!.id,
        amountCents: 10450, // 10% of the 104500 sale → tax share 950
        reason: 'partial return',
        createdAt: ts3,
      });
    });
    const run = await asOwner().post('/v1/jobs/run').send({ businessDate: D3 });
    expect(run.status).toBe(201);

    const batches = await asBooks().get('/v1/gl/journal-batches?year=2026');
    const refundBatch = (
      batches.body.rows as { id: string; sourceType: string | null; businessDate: string }[]
    ).find((b) => b.sourceType === 'eod_refunds' && b.businessDate === D3);
    expect(refundBatch).toBeTruthy();
    const detail = await asBooks().get(`/v1/gl/journal-batches/${refundBatch!.id}`);
    expect(detail.body.balanced).toBe(true);
    const byCode = new Map(
      (detail.body.lines as { accountCode: string; debitCents: number; creditCents: number }[]).map(
        (l) => [l.accountCode, l],
      ),
    );
    expect(byCode.get('4000')?.debitCents).toBe(9500); // revenue net of tax share
    expect(byCode.get('2200')?.debitCents).toBe(950); // tax share
    expect(byCode.get('1050')?.creditCents).toBe(10450); // drawer out
  });

  it('F277-lean: account activity shows per-period totals and drillable lines', async () => {
    const accounts = await asBooks().get('/v1/gl/accounts');
    const cash = (accounts.body as { id: string; code: string }[]).find((a) => a.code === '1050')!;
    const res = await asBooks().get(`/v1/gl/accounts/${cash.id}/activity?year=2026`);
    expect(res.status).toBe(200);
    expect(res.body.account.code).toBe('1050');
    const p8 = (
      res.body.byPeriod as { period: number; debitCents: number; creditCents: number }[]
    ).find((p) => p.period === 8);
    // Aug: +50000 POS cash +20000 deposit; −300 short −10450 refund.
    expect(p8?.debitCents).toBe(70000);
    expect(p8?.creditCents).toBe(10750);
    const lines = res.body.lines as { batchNumber: string }[];
    expect(lines.length).toBeGreaterThanOrEqual(4);
    expect(lines.every((l) => l.batchNumber.startsWith('GL-'))).toBe(true);
  });
});
