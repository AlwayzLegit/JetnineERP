/**
 * G6 + P1 + G8-lite acceptance (STORIS cutover): a service ticket walks
 * intake → in service → ready (customer emailed) → charges collected →
 * completed; warranty work prices at zero. CRM: notes and tags stick to
 * a customer, and the timeline merges their whole history. AR: an
 * order's outstanding balance shows in the aging report and clears when
 * paid.
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
  process.env.SERVICE_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_service';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'ServicePass!26';

let app: INestApplication;
let businessId = '';
let locationId = '';
let customerId = '';
let variantId = '';
let ownerCookie = '';

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
      .values({ slug: 'service-test', name: 'Service Test Co', status: 'active' })
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
    const [u] = await db
      .insert(schema.users)
      .values({ email: 'owner@service-test.local', emailVerified: true, name: 'Owner' })
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
      roleId: roles.get('Owner')!,
      status: 'active',
      acceptedAt: new Date(),
    });
    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Shop', timezone: 'America/Los_Angeles', taxRateBps: 0 })
      .returning();
    locationId = loc!.id;
    const [cust] = await db
      .insert(schema.customers)
      .values({
        businessId,
        firstName: 'Vic',
        lastName: 'Repairs',
        email: 'vic.repairs@example.test',
      })
      .returning();
    customerId = cust!.id;
    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'FRAME', name: 'Bed Frame' })
      .returning();
    const [v] = await db
      .insert(schema.productVariants)
      .values({ businessId, productId: p!.id, sku: 'FRAME-1', priceCents: 50_000 })
      .returning();
    variantId = v!.id;
    await db.insert(schema.inventoryLevels).values({
      businessId,
      variantId: v!.id,
      locationId,
      onHand: 5,
      reserved: 0,
    });
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
  return {
    post: (url: string) =>
      request(app.getHttpServer())
        .post(url)
        .set('Cookie', ownerCookie)
        .set('X-Business-Id', businessId),
    get: (url: string) =>
      request(app.getHttpServer())
        .get(url)
        .set('Cookie', ownerCookie)
        .set('X-Business-Id', businessId),
    delete: (url: string) =>
      request(app.getHttpServer())
        .delete(url)
        .set('Cookie', ownerCookie)
        .set('X-Business-Id', businessId),
  };
}

beforeAll(async () => {
  await resetTestDb();
  await seed();
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'service-test-secret-service-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.RESEND_API_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();
  ownerCookie = await captureCookie('owner@service-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('G6 — service orders', () => {
  let ticketId = '';

  it('intake creates an SV ticket', async () => {
    const res = await ownerReq().post('/v1/service-orders').send({
      locationId,
      customerId,
      itemDescription: 'Queen adjustable base, remote dead',
      issue: 'Remote not pairing; motor clicks',
    });
    expect(res.status).toBe(201);
    ticketId = res.body.id;
    expect(res.body.number).toMatch(/^SV-\d{4}-\d{6}$/);
    expect(res.body.status).toBe('intake');
  });

  it('charges: a part from stock and free-text labor', async () => {
    const part = await ownerReq()
      .post(`/v1/service-orders/${ticketId}/lines`)
      .send({ variantId, kind: 'part' });
    expect(part.status).toBe(201);
    expect(part.body.lines[0].unitPriceCents).toBe(50_000);

    const labor = await ownerReq()
      .post(`/v1/service-orders/${ticketId}/lines`)
      .send({ description: 'Diagnostic + pairing', unitPriceCents: 7_500 });
    expect(labor.status).toBe(201);
    expect(labor.body.totalCents).toBe(57_500);
    expect(labor.body.balanceDueCents).toBe(57_500);
  });

  it('walks the board and emails the customer at ready', async () => {
    await ownerReq()
      .post(`/v1/service-orders/${ticketId}/status`)
      .send({ status: 'in_service', note: 'On the bench' })
      .expect(201);
    const ready = await ownerReq()
      .post(`/v1/service-orders/${ticketId}/status`)
      .send({ status: 'ready' });
    expect(ready.status).toBe(201);

    const mail = await request(app.getHttpServer())
      .get('/v1/dev/email/last')
      .query({ to: 'vic.repairs@example.test' });
    expect(mail.status).toBe(200);
    expect(mail.body.subject).toMatch(/ready/i);

    // Notes carry the narrative.
    const detail = await ownerReq().get(`/v1/service-orders/${ticketId}`);
    const bodies = detail.body.notes.map((n: { body: string }) => n.body);
    expect(bodies.some((b: string) => b.includes('On the bench'))).toBe(true);
    expect(bodies.some((b: string) => b.includes('intake → in_service'))).toBe(true);
  });

  it("can't complete with a balance; collect then complete", async () => {
    const early = await ownerReq().post(`/v1/service-orders/${ticketId}/complete`).send({});
    expect(early.status).toBe(400);

    const over = await ownerReq()
      .post(`/v1/service-orders/${ticketId}/payments`)
      .send({ method: 'cash', amountCents: 60_000 });
    expect(over.status).toBe(400); // over-collect guard

    await ownerReq()
      .post(`/v1/service-orders/${ticketId}/payments`)
      .send({ method: 'cash', amountCents: 57_500 })
      .expect(201);
    const done = await ownerReq().post(`/v1/service-orders/${ticketId}/complete`).send({});
    expect(done.status).toBe(201);
    expect(done.body.status).toBe('completed');
    expect(done.body.balanceDueCents).toBe(0);
  });

  it('warranty tickets price their lines at zero', async () => {
    const res = await ownerReq().post('/v1/service-orders').send({
      locationId,
      customerId,
      itemDescription: 'Same base, warranty motor swap',
      issue: 'Motor failed within warranty',
      warranty: true,
    });
    const wid = res.body.id;
    const line = await ownerReq()
      .post(`/v1/service-orders/${wid}/lines`)
      .send({ variantId, kind: 'part' });
    expect(line.body.totalCents).toBe(0);
  });
});

describe('P1 — CRM notes, tags, timeline', () => {
  it('notes and tags stick to the customer', async () => {
    const note = await ownerReq()
      .post(`/v1/customers/${customerId}/notes`)
      .send({ body: 'Prefers afternoon deliveries' });
    expect(note.status).toBe(201);

    const tag = await ownerReq().post('/v1/customer-tags').send({ name: 'VIP', color: '#c9a' });
    expect(tag.status).toBe(201);
    await ownerReq().post(`/v1/customers/${customerId}/tags/${tag.body.id}`).expect(201);
    const tags = await ownerReq().get(`/v1/customers/${customerId}/tags`);
    expect(tags.body.map((t: { name: string }) => t.name)).toContain('VIP');
  });

  it('the timeline merges service, payments, and notes newest-first', async () => {
    const res = await ownerReq().get(`/v1/customers/${customerId}/timeline`);
    expect(res.status).toBe(200);
    const types = new Set(res.body.map((e: { type: string }) => e.type));
    expect(types.has('service')).toBe(true);
    expect(types.has('note')).toBe(true);
    // Newest first.
    const times = res.body.map((e: { at: string }) => new Date(e.at).getTime());
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });
});

describe('G8-lite — AR aging', () => {
  it('an unpaid confirmed order shows in AR and clears when paid', async () => {
    const order = await ownerReq()
      .post('/v1/orders')
      .send({
        locationId,
        customerId,
        lines: [{ variantId, quantity: 1 }],
        confirm: true,
      });
    expect(order.status).toBe(201);

    const ar = await ownerReq().get('/v1/reports/ar');
    expect(ar.status).toBe(200);
    const row = ar.body.rows.find((r: { customerId: string }) => r.customerId === customerId);
    expect(row).toBeTruthy();
    expect(row.balanceCents).toBe(50_000);
    expect(row.bucket0_30).toBe(50_000);

    await ownerReq()
      .post(`/v1/orders/${order.body.id}/payments`)
      .send({ method: 'cash', amountCents: 50_000 })
      .expect(201);
    const after = await ownerReq().get('/v1/reports/ar');
    const rowAfter = after.body.rows.find(
      (r: { customerId: string }) => r.customerId === customerId,
    );
    expect(rowAfter).toBeUndefined();
  });
});
