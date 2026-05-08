/**
 * Phase 2.4 acceptance: a clerk creates a stock transfer between two
 * locations, ships it (origin loses inventory), receives it partially
 * then in full at the destination (destination gains inventory), and
 * the audit trail reflects every step.
 *
 * Also covers ship-time stock validation, the same-location refusal,
 * cancel from draft only, and the role gate.
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
  process.env.TRANSFERS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_transfers';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'TransPass!2026';

let app: INestApplication;
let businessId = '';
let mainLocationId = '';
let warehouseLocationId = '';
let variantAId = '';
let variantBId = '';
let clerkCookie = '';
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
      .values({ slug: 'trans-test', name: 'Transfer Test Co', status: 'active' })
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
    await makeUser('clerk@trans-test.local', 'Inventory Clerk');
    await makeUser('cashier@trans-test.local', 'Cashier');

    const [main] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Main Store', timezone: 'America/New_York' })
      .returning();
    mainLocationId = main!.id;
    const [warehouse] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Warehouse', timezone: 'America/New_York' })
      .returning();
    warehouseLocationId = warehouse!.id;

    const [pA] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'WIDGET', name: 'Widget' })
      .returning();
    const [vA] = await db
      .insert(schema.productVariants)
      .values({ businessId, productId: pA!.id, sku: 'WIDGET-1', priceCents: 1000 })
      .returning();
    variantAId = vA!.id;
    const [pB] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'GADGET', name: 'Gadget' })
      .returning();
    const [vB] = await db
      .insert(schema.productVariants)
      .values({ businessId, productId: pB!.id, sku: 'GADGET-1', priceCents: 500 })
      .returning();
    variantBId = vB!.id;

    // Stock starts at the warehouse: 20 widgets + 10 gadgets. Main is empty.
    await db.insert(schema.inventoryLevels).values([
      { businessId, variantId: variantAId, locationId: warehouseLocationId, onHand: 20 },
      { businessId, variantId: variantBId, locationId: warehouseLocationId, onHand: 10 },
    ]);
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

async function levelAt(variantId: string, locationId: string): Promise<number> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    const [row] = await db
      .select()
      .from(schema.inventoryLevels)
      .where(
        and(
          eq(schema.inventoryLevels.variantId, variantId),
          eq(schema.inventoryLevels.locationId, locationId),
        ),
      );
    return row?.onHand ?? 0;
  } finally {
    await sql.end({ timeout: 5 });
  }
}

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'trans-test-secret-trans-test-secret-x';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  clerkCookie = await captureCookie('clerk@trans-test.local');
  cashierCookie = await captureCookie('cashier@trans-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Phase 2.4 — Stock transfers', () => {
  it('Cashier (no inventory.transfer) is denied transfer creation', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/stock-transfers')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: mainLocationId,
        lines: [{ variantId: variantAId, quantity: 1 }],
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/inventory\.transfer/);
  });

  it('Same-location transfer is rejected', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/stock-transfers')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: warehouseLocationId,
        lines: [{ variantId: variantAId, quantity: 1 }],
      });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/must differ/);
  });

  let transferId = '';
  let widgetLineId = '';
  let gadgetLineId = '';
  it('Clerk creates a draft transfer (8 widgets + 4 gadgets warehouse → main)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/stock-transfers')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: mainLocationId,
        notes: 'Restock Main Store',
        lines: [
          { variantId: variantAId, quantity: 8 },
          { variantId: variantBId, quantity: 4 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.number).toMatch(/^ST-\d{4}-\d{6}$/);
    expect(res.body.fromLocationName).toBe('Warehouse');
    expect(res.body.toLocationName).toBe('Main Store');
    transferId = res.body.id;
    widgetLineId = res.body.lines.find((l: { variantId: string }) => l.variantId === variantAId).id;
    gadgetLineId = res.body.lines.find((l: { variantId: string }) => l.variantId === variantBId).id;
  });

  it('Cannot ship a quantity exceeding origin on-hand', async () => {
    // Try to make a second transfer for 100 widgets from the warehouse —
    // origin only has 20.
    const created = await request(app.getHttpServer())
      .post('/v1/stock-transfers')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: mainLocationId,
        lines: [{ variantId: variantAId, quantity: 100 }],
      });
    expect(created.status).toBe(201);

    const ship = await request(app.getHttpServer())
      .post(`/v1/stock-transfers/${created.body.id}/ship`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({});
    expect(ship.status).toBe(400);
    expect(ship.body.message).toMatch(/Insufficient stock/);

    // Cancel that bad draft so it doesn't pollute later tests.
    await request(app.getHttpServer())
      .post(`/v1/stock-transfers/${created.body.id}/cancel`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId);
  });

  it('Ship: warehouse drops by 8 widgets + 4 gadgets, status flips to in_transit', async () => {
    const wh1 = await levelAt(variantAId, warehouseLocationId);
    const wg1 = await levelAt(variantBId, warehouseLocationId);
    const main1 = await levelAt(variantAId, mainLocationId);

    const res = await request(app.getHttpServer())
      .post(`/v1/stock-transfers/${transferId}/ship`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('in_transit');
    expect(res.body.shippedAt).toBeTruthy();

    expect(await levelAt(variantAId, warehouseLocationId)).toBe(wh1 - 8);
    expect(await levelAt(variantBId, warehouseLocationId)).toBe(wg1 - 4);
    // Destination not yet credited.
    expect(await levelAt(variantAId, mainLocationId)).toBe(main1);
  });

  it('Cannot cancel an in-transit transfer', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/stock-transfers/${transferId}/cancel`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Only draft/);
  });

  it('Receive 5 widgets first — main gets +5, transfer stays in_transit', async () => {
    const before = await levelAt(variantAId, mainLocationId);
    const res = await request(app.getHttpServer())
      .post(`/v1/stock-transfers/${transferId}/receive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId: widgetLineId, quantity: 5 }] });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('in_transit');
    expect(await levelAt(variantAId, mainLocationId)).toBe(before + 5);
  });

  it('Cannot over-receive (3 widgets remaining, 5 too many)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/stock-transfers/${transferId}/receive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId: widgetLineId, quantity: 5 }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/only 3 remaining/);
  });

  it('Receive remaining 3 widgets + all 4 gadgets — flips to received, levels even out', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/stock-transfers/${transferId}/receive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        lines: [
          { lineId: widgetLineId, quantity: 3 },
          { lineId: gadgetLineId, quantity: 4 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('received');
    expect(res.body.receivedAt).toBeTruthy();

    // Net effect: warehouse -8 widgets / -4 gadgets, main +8 widgets / +4 gadgets.
    expect(await levelAt(variantAId, warehouseLocationId)).toBe(20 - 8);
    expect(await levelAt(variantBId, warehouseLocationId)).toBe(10 - 4);
    expect(await levelAt(variantAId, mainLocationId)).toBe(8);
    expect(await levelAt(variantBId, mainLocationId)).toBe(4);
  });

  it('Receiving a received transfer is forbidden', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/stock-transfers/${transferId}/receive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId: widgetLineId, quantity: 1 }] });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Cannot receive a received/);
  });

  it('Inventory ledger has matched transfer_out + transfer_in pairs', async () => {
    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      const movements = await db
        .select()
        .from(schema.inventoryMovements)
        .where(eq(schema.inventoryMovements.referenceId, transferId));
      const outs = movements.filter((m) => m.reason === 'transfer_out');
      const ins = movements.filter((m) => m.reason === 'transfer_in');
      expect(outs.length).toBe(2); // one per line at ship-time
      expect(ins.length).toBe(3); // 5 widgets + 3 widgets + 4 gadgets across two receipts
      const outSum = outs.reduce((s, m) => s + m.delta, 0);
      const inSum = ins.reduce((s, m) => s + m.delta, 0);
      expect(outSum).toBe(-12); // -8 widgets - 4 gadgets
      expect(inSum).toBe(12);
    } finally {
      await sqlc.end({ timeout: 5 });
    }
  });

  it('Create-and-ship in one shot via {ship: true} writes both ledger sides immediately', async () => {
    const before = await levelAt(variantAId, warehouseLocationId);
    const res = await request(app.getHttpServer())
      .post('/v1/stock-transfers')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: mainLocationId,
        ship: true,
        lines: [{ variantId: variantAId, quantity: 2 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('in_transit');
    expect(await levelAt(variantAId, warehouseLocationId)).toBe(before - 2);
  });
});
