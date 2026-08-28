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
