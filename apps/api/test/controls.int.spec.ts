/**
 * Gap sprint G1+G2 acceptance (PLAN-STORIS-GAP §0.1/§0.2):
 *
 * - Reason-code registry: manage permission, usage-class validation,
 *   duplicate refusal, deactivate-not-delete, class-filtered listing.
 * - Security Override primitive, proven through the order-unlock pilot:
 *   an actor without `orders.unlock` gets 403 OVERRIDE_REQUIRED; a
 *   retry under a manager's credentials succeeds and stamps the
 *   security_overrides register with both identities; wrong passwords,
 *   unauthorized authorizers, and self-authorization are refused.
 * - Coded reasons: once an `exception` code exists, free text is
 *   refused; the resolved code lands in the audit trail. Price
 *   adjustments enforce the same for class `adjustment`.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { desc, eq } from 'drizzle-orm';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';

const TEST_DB_URL =
  process.env.CONTROLS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_controls';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'CtrlPass!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let customerId = '';
let managerCookie = '';
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
      .values({ slug: 'ctrl-test', name: 'Controls Test Co', status: 'active' })
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
    await makeUser('manager@ctrl-test.local', 'Manager');
    await makeUser('cashier@ctrl-test.local', 'Cashier');
    await makeUser('cashier2@ctrl-test.local', 'Cashier');

    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Main Store', timezone: 'America/Los_Angeles' })
      .returning();
    locationId = loc!.id;

    const [cust] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Carl', lastName: 'Controls' })
      .returning();
    customerId = cust!.id;
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

/** Insert a locked order directly — the unlock pilot needs nothing else. */
async function makeLockedOrder(number: string): Promise<string> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    const [order] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId,
        number,
        status: 'open',
        customerId,
        lockedAt: new Date(),
      })
      .returning();
    return order!.id;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

async function overrideRows() {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    return await db
      .select()
      .from(schema.securityOverrides)
      .orderBy(desc(schema.securityOverrides.createdAt));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'ctrl-test-secret-ctrl-test-secret-xx';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  managerCookie = await captureCookie('manager@ctrl-test.local');
  cashierCookie = await captureCookie('cashier@ctrl-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('G2 — reason-code registry', () => {
  it('Cashier (no reason_codes.manage) cannot create codes', async () => {
    await request(app.getHttpServer())
      .post('/v1/reason-codes')
      .set('Cookie', cashierCookie)
      .set('x-business-id', businessId)
      .send({ code: 'NOPE', description: 'nope', usageClass: 'exception' })
      .expect(403);
  });

  it('refuses an unknown usage class', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/reason-codes')
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ code: 'BAD', description: 'bad class', usageClass: 'nonsense' })
      .expect(400);
    expect(res.body.message).toMatch(/usageClass/);
  });

  it('creates, uppercases, and lists by class; duplicates 409', async () => {
    await request(app.getHttpServer())
      .post('/v1/reason-codes')
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ code: 'dmg', description: 'Damaged in transit', usageClass: 'as_is' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/v1/reason-codes')
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ code: 'DMG', description: 'dup', usageClass: 'as_is' })
      .expect(409);

    // Any member can read the registry — prompts everywhere need it.
    const list = await request(app.getHttpServer())
      .get('/v1/reason-codes?usageClass=as_is')
      .set('Cookie', cashierCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].code).toBe('DMG');
  });

  it('deactivates instead of deleting; inactive codes drop from the default list', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/reason-codes')
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ code: 'TMP', description: 'Temporary', usageClass: 'return' })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/v1/reason-codes/${created.body.id}`)
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ active: false })
      .expect(200);
    const active = await request(app.getHttpServer())
      .get('/v1/reason-codes?usageClass=return')
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(active.body).toHaveLength(0);
    const all = await request(app.getHttpServer())
      .get('/v1/reason-codes?usageClass=return&includeInactive=1')
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(all.body).toHaveLength(1);
  });
});

describe('G1 — security override via the order-unlock pilot', () => {
  it('a permitted user unlocks directly (free text while no exception codes exist)', async () => {
    const orderId = await makeLockedOrder('CTRL-1001');
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/unlock`)
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ reason: 'customer added a pillow' })
      .expect(201);
    expect(res.body.lockedAt).toBeNull();
    expect(await overrideRows()).toHaveLength(0);
  });

  it('an unpermitted user gets 403 OVERRIDE_REQUIRED naming the action', async () => {
    const orderId = await makeLockedOrder('CTRL-1002');
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/unlock`)
      .set('Cookie', cashierCookie)
      .set('x-business-id', businessId)
      .send({ reason: 'trying' })
      .expect(403);
    expect(res.body.code).toBe('OVERRIDE_REQUIRED');
    expect(res.body.permission).toBe('orders.unlock');
    expect(res.body.action).toMatch(/CTRL-1002/);
  });

  it('wrong authorizer password → OVERRIDE_DENIED, order stays locked', async () => {
    const orderId = await makeLockedOrder('CTRL-1003');
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/unlock`)
      .set('Cookie', cashierCookie)
      .set('x-business-id', businessId)
      .send({
        reason: 'trying',
        override: { email: 'manager@ctrl-test.local', password: 'wrong-password' },
      })
      .expect(403);
    expect(res.body.code).toBe('OVERRIDE_DENIED');
  });

  it('an authorizer without the permission is refused', async () => {
    const orderId = await makeLockedOrder('CTRL-1004');
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/unlock`)
      .set('Cookie', cashierCookie)
      .set('x-business-id', businessId)
      .send({
        reason: 'trying',
        override: { email: 'cashier2@ctrl-test.local', password: PASSWORD },
      })
      .expect(403);
    expect(res.body.message).toMatch(/does not hold/);
  });

  it('self-authorization is refused', async () => {
    const orderId = await makeLockedOrder('CTRL-1005');
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/unlock`)
      .set('Cookie', cashierCookie)
      .set('x-business-id', businessId)
      .send({
        reason: 'trying',
        override: { email: 'cashier@ctrl-test.local', password: PASSWORD },
      })
      .expect(403);
    expect(res.body.message).toMatch(/different user/);
  });

  it('manager credentials authorize the unlock and stamp the register with both identities', async () => {
    const orderId = await makeLockedOrder('CTRL-1006');
    const res = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/unlock`)
      .set('Cookie', cashierCookie)
      .set('x-business-id', businessId)
      .send({
        override: {
          email: 'manager@ctrl-test.local',
          password: PASSWORD,
          reason: 'approved at the counter',
        },
      })
      .expect(201);
    expect(res.body.lockedAt).toBeNull();

    const rows = await overrideRows();
    expect(rows).toHaveLength(1);
    expect(rows[0]!.permission).toBe('orders.unlock');
    expect(rows[0]!.entityId).toBe(orderId);
    expect(rows[0]!.actorUserId).not.toBe(rows[0]!.authorizingUserId);
    expect(rows[0]!.reason).toBe('approved at the counter');

    // The register endpoint shows it (manager holds security_overrides.view).
    const register = await request(app.getHttpServer())
      .get('/v1/security-overrides')
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(register.body).toHaveLength(1);
    expect(register.body[0].actorEmail).toBe('cashier@ctrl-test.local');
    expect(register.body[0].authorizingEmail).toBe('manager@ctrl-test.local');
    // The cashier cannot read the register.
    await request(app.getHttpServer())
      .get('/v1/security-overrides')
      .set('Cookie', cashierCookie)
      .set('x-business-id', businessId)
      .expect(403);
  });

  it('once exception codes exist, free text is refused and the coded reason lands in the audit', async () => {
    const code = await request(app.getHttpServer())
      .post('/v1/reason-codes')
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ code: 'CUSTREQ', description: 'Customer request', usageClass: 'exception' })
      .expect(201);

    const orderId = await makeLockedOrder('CTRL-1007');
    const freeText = await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/unlock`)
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ reason: 'free text no longer allowed' })
      .expect(400);
    expect(freeText.body.message).toMatch(/coded reason/i);

    await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/unlock`)
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ reasonCodeId: code.body.id })
      .expect(201);

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql);
    try {
      const [entry] = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.targetId, orderId))
        .orderBy(desc(schema.auditLogs.createdAt))
        .limit(1);
      const meta = (entry!.changesJson as { metadata?: { reasonCode?: string } }).metadata;
      expect(meta?.reasonCode).toBe('CUSTREQ');
    } finally {
      await sql.end({ timeout: 5 });
    }
  });

  it('a reason code of the wrong class is refused at unlock', async () => {
    // DMG is class as_is — not legal for an exception prompt.
    const list = await request(app.getHttpServer())
      .get('/v1/reason-codes?usageClass=as_is')
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .expect(200);
    const orderId = await makeLockedOrder('CTRL-1008');
    await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/unlock`)
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ reasonCodeId: list.body[0].id })
      .expect(400);
  });
});

describe('G2 — coded reasons on price adjustments', () => {
  it('adjustment prompts take class `adjustment` codes once they exist', async () => {
    const code = await request(app.getHttpServer())
      .post('/v1/reason-codes')
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ code: 'GOODWILL', description: 'Goodwill credit', usageClass: 'adjustment' })
      .expect(201);

    const orderId = await makeLockedOrder('CTRL-2001');
    // Free text refused now that a code exists…
    await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/price-adjustment`)
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ amountCents: 500, reason: 'free text', refundMethod: 'store_credit' })
      .expect(400);
    // …the coded reason goes through (store credit avoids needing payments).
    await request(app.getHttpServer())
      .post(`/v1/orders/${orderId}/price-adjustment`)
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .send({ amountCents: 500, reasonCodeId: code.body.id, refundMethod: 'store_credit' })
      .expect(201);
  });
});
