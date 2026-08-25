/**
 * Marketing slice acceptance: an owner tags customers, builds a
 * segment over the tags, previews membership (email-holders only),
 * drafts a campaign, and sends it — every send captured by the memory
 * email transport. Sent campaigns refuse a second send; referenced
 * segments refuse deletion; roles without crm.campaigns.manage are
 * locked out.
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
  process.env.MARKETING_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_marketing';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'MarketingPass!2026';

let app: INestApplication;
let businessId = '';
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
      .values({ slug: 'marketing-test', name: 'Marketing Test Co', status: 'active' })
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
      ['owner@marketing-test.local', 'Owner'],
      ['cashier@marketing-test.local', 'Cashier'],
    ] as const) {
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

function ownerReq() {
  const agent = request(app.getHttpServer());
  return {
    get: (url: string) =>
      agent.get(url).set('Cookie', ownerCookie).set('X-Business-Id', businessId),
    post: (url: string) =>
      agent.post(url).set('Cookie', ownerCookie).set('X-Business-Id', businessId),
    delete: (url: string) =>
      agent.delete(url).set('Cookie', ownerCookie).set('X-Business-Id', businessId),
  };
}

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'marketing-test-secret-marketing-test-x';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true });
  await app.init();

  ownerCookie = await captureCookie('owner@marketing-test.local');
  cashierCookie = await captureCookie('cashier@marketing-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

let vipTagId = '';
let segmentId = '';
let allSegmentId = '';
let campaignId = '';

describe('Marketing — segments + campaigns', () => {
  it('Owner tags two of three customers; third has no email', async () => {
    const tag = await ownerReq().post('/v1/customer-tags').send({ name: 'VIP' });
    expect(tag.status).toBe(201);
    vipTagId = tag.body.id;

    const mk = async (body: Record<string, unknown>) => {
      const res = await ownerReq().post('/v1/customers').send(body);
      expect(res.status).toBe(201);
      return res.body.id as string;
    };
    const a = await mk({ firstName: 'Amy', email: 'amy@example.test' });
    const b = await mk({ firstName: 'Ben', email: 'ben@example.test' });
    // VIP but no email — must never become a recipient.
    const c = await mk({ firstName: 'Cal', phone: '+15550000000' });
    // Emailable but NOT VIP — outside the segment.
    await mk({ firstName: 'Dee', email: 'dee@example.test' });

    for (const id of [a, b, c]) {
      const link = await ownerReq().post(`/v1/customers/${id}/tags/${vipTagId}`);
      expect([200, 201]).toContain(link.status);
    }
  });

  it('Segment over the VIP tag previews only emailable members', async () => {
    const res = await ownerReq()
      .post('/v1/marketing/segments')
      .send({ name: 'VIPs', filter: { tagIds: [vipTagId] } });
    expect(res.status).toBe(201);
    segmentId = res.body.id;

    const preview = await ownerReq().get(`/v1/marketing/segments/${segmentId}/preview`);
    expect(preview.status).toBe(200);
    // Amy + Ben; Cal is VIP but has no email.
    expect(preview.body.count).toBe(2);
    const emails = preview.body.sample.map((s: { email: string }) => s.email).sort();
    expect(emails).toEqual(['amy@example.test', 'ben@example.test']);
  });

  it('A tagless segment means "all emailable customers"', async () => {
    const res = await ownerReq()
      .post('/v1/marketing/segments')
      .send({ name: 'Everyone', filter: {} });
    expect(res.status).toBe(201);
    allSegmentId = res.body.id;
    const preview = await ownerReq().get(`/v1/marketing/segments/${allSegmentId}/preview`);
    expect(preview.body.count).toBe(3); // Amy, Ben, Dee
  });

  it('Unknown tag ids are rejected 400', async () => {
    const res = await ownerReq()
      .post('/v1/marketing/segments')
      .send({
        name: 'Broken',
        filter: { tagIds: ['00000000-0000-4000-8000-000000000000'] },
      });
    expect(res.status).toBe(400);
  });

  it('Campaign draft → send hits both VIP recipients through the mail transport', async () => {
    const draft = await ownerReq().post('/v1/marketing/campaigns').send({
      name: 'VIP sale',
      segmentId,
      subject: 'A private sale for our VIPs',
      bodyText: 'Hi!\nCome see the new floor models this weekend.',
    });
    expect(draft.status).toBe(201);
    expect(draft.body.status).toBe('draft');
    campaignId = draft.body.id;

    const send = await ownerReq().post(`/v1/marketing/campaigns/${campaignId}/send`);
    expect(send.status).toBe(201);
    expect(send.body.recipientCount).toBe(2);
    expect(send.body.sent).toBe(2);

    const mail = await request(app.getHttpServer())
      .get('/v1/dev/email/last')
      .query({ to: 'amy@example.test' });
    expect(mail.status).toBe(200);
    expect(mail.body.subject).toBe('A private sale for our VIPs');
    expect(mail.body.text).toContain('floor models');

    const list = await ownerReq().get('/v1/marketing/campaigns');
    const row = list.body.find((c: { id: string }) => c.id === campaignId);
    expect(row.status).toBe('sent');
    expect(row.recipientCount).toBe(2);
  });

  it('A sent campaign cannot be re-sent', async () => {
    const res = await ownerReq().post(`/v1/marketing/campaigns/${campaignId}/send`);
    expect(res.status).toBe(409);
  });

  it('A segment referenced by a campaign cannot be deleted; a fresh one can', async () => {
    const blocked = await ownerReq().delete(`/v1/marketing/segments/${segmentId}`);
    expect(blocked.status).toBe(409);

    const ok = await ownerReq().delete(`/v1/marketing/segments/${allSegmentId}`);
    expect(ok.status).toBe(200);
  });

  it('Cashier (no crm.campaigns.manage) is locked out', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/marketing/segments')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(403);
  });
});
