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
let managerCookie = '';

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
    await makeUser('manager@trans-test.local', 'Manager');

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
      .values({ businessId, productId: pA!.id, sku: 'WIDGET-1', priceCents: 1000, costCents: 600 })
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
  managerCookie = await captureCookie('manager@trans-test.local');
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

describe('Transfer ticket data (PLAN-POS-OPERATIONS P7)', () => {
  it('detail carries the from/to store blocks and letterhead the printed ticket needs', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/stock-transfers')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: mainLocationId,
        lines: [{ variantId: variantAId, quantity: 1 }],
      });
    expect(created.status).toBe(201);
    expect(created.body.businessName).toBe('Transfer Test Co');
    expect(created.body.fromLocationName).toBe('Warehouse');
    expect(created.body.toLocationName).toBe('Main Store');
    // Address blocks round-trip (null when the location has none on file).
    expect(created.body).toHaveProperty('fromLocationAddressJson');
    expect(created.body).toHaveProperty('toLocationAddressJson');
  });
});

describe('Transfer variance + aging + types (PLAN-STORIS-GAP G8)', () => {
  function as(cookie: string) {
    return {
      post: (url: string) =>
        request(app.getHttpServer())
          .post(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
      get: (url: string) =>
        request(app.getHttpServer())
          .get(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
    };
  }

  it('a short transfer cannot be dismissed: close-short needs write-off authority + reason, values shrink at cost', async () => {
    // Ship 4 widgets, receive 3 — one walked off the truck.
    const created = await as(clerkCookie)
      .post('/v1/stock-transfers')
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: mainLocationId,
        transferType: 'floor_sample',
        lines: [{ variantId: variantAId, quantity: 4 }],
        ship: true,
      });
    expect(created.status).toBe(201);
    expect(created.body.transferType).toBe('floor_sample');
    const transferId = created.body.id as string;
    const lineId = created.body.lines[0].id as string;

    await as(clerkCookie)
      .post(`/v1/stock-transfers/${transferId}/receive`)
      .send({ lines: [{ lineId, quantity: 3 }] })
      .expect(201);

    // The clerk lacks inventory.write_off → override required.
    const blocked = await as(clerkCookie)
      .post(`/v1/stock-transfers/${transferId}/close-short`)
      .send({ reason: 'lost in transit' });
    expect(blocked.status).toBe(403);
    expect(blocked.body.code).toBe('OVERRIDE_REQUIRED');
    expect(blocked.body.permission).toBe('inventory.write_off');

    const closed = await as(clerkCookie)
      .post(`/v1/stock-transfers/${transferId}/close-short`)
      .send({
        override: {
          email: 'manager@trans-test.local',
          password: PASSWORD,
          reason: 'lost in transit',
        },
      });
    expect(closed.status).toBe(201);
    expect(closed.body.status).toBe('closed_short');

    // The missing unit is shrink: on the write-off register at cost.
    const register = await as(managerCookie).get('/v1/write-offs?days=7');
    const row = register.body.rows.find((r: { reason: string | null }) =>
      r.reason?.includes(closed.body.number),
    );
    expect(row).toBeTruthy();
    expect(row.quantity).toBe(1);
    expect(row.totalCostCents).toBe(600);

    const exceptions = await as(managerCookie).get('/v1/exceptions?type=transfer_variance');
    expect(
      exceptions.body.some((e: { entityId: string | null }) => e.entityId === transferId),
    ).toBe(true);

    // A fully-received transfer refuses a short close.
    const clean = await as(clerkCookie)
      .post('/v1/stock-transfers')
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: mainLocationId,
        lines: [{ variantId: variantBId, quantity: 1 }],
        ship: true,
      });
    const cleanLine = clean.body.lines[0].id as string;
    await as(clerkCookie)
      .post(`/v1/stock-transfers/${clean.body.id}/receive`)
      .send({ lines: [{ lineId: cleanLine, quantity: 1 }] })
      .expect(201);
    await as(clerkCookie)
      .post(`/v1/stock-transfers/${clean.body.id}/close-short`)
      .send({ reason: 'nope' })
      .expect(403); // received → ForbiddenException before anything else
  });

  it('aging surfaces transfers stuck in transit', async () => {
    const created = await as(clerkCookie)
      .post('/v1/stock-transfers')
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: mainLocationId,
        lines: [{ variantId: variantAId, quantity: 1 }],
        ship: true,
      });
    expect(created.status).toBe(201);

    // Backdate the shipment a week.
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      await db
        .update(schema.stockTransfers)
        .set({ shippedAt: new Date(Date.now() - 7 * 86_400_000) })
        .where(eq(schema.stockTransfers.id, created.body.id));
    } finally {
      await sql2.end({ timeout: 5 });
    }

    const aging = await as(clerkCookie).get('/v1/stock-transfers/aging?days=3');
    expect(aging.status).toBe(200);
    const hit = aging.body.find((t: { id: string }) => t.id === created.body.id);
    expect(hit).toBeTruthy();
    expect(hit.daysInTransit).toBeGreaterThanOrEqual(6);
  });
});

describe('Auto transfers (FAQ J4/J5 — XFR-051/052/053)', () => {
  let atVariantId = '';
  let customerId = '';

  function as(cookie: string) {
    return {
      post: (url: string) =>
        request(app.getHttpServer())
          .post(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
      patch: (url: string) =>
        request(app.getHttpServer())
          .patch(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
      get: (url: string) =>
        request(app.getHttpServer())
          .get(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
    };
  }

  async function autoTransfersFor(orderId: string) {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      return await db
        .select()
        .from(schema.stockTransfers)
        .where(eq(schema.stockTransfers.orderId, orderId));
    } finally {
      await sql2.end({ timeout: 5 });
    }
  }

  async function shortOrder(quantity: number): Promise<{ id: string }> {
    const res = await as(managerCookie)
      .post('/v1/orders')
      .send({
        locationId: mainLocationId,
        customerId,
        fulfillmentType: 'pickup',
        confirm: true,
        lines: [{ variantId: atVariantId, quantity }],
      });
    expect(res.status).toBe(201);
    return { id: res.body.id };
  }

  it('setup: fixture variant stocked only at the warehouse; schedule days = 2', async () => {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'AT-BED', name: 'Auto Transfer Bed' })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({ businessId, productId: p!.id, sku: 'AT-BED-V1', priceCents: 40000 })
        .returning();
      atVariantId = v!.id;
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: atVariantId,
        locationId: warehouseLocationId,
        onHand: 10,
        reserved: 0,
      });
    } finally {
      await sql2.end({ timeout: 5 });
    }

    const customer = await as(managerCookie)
      .post('/v1/customers')
      .send({ firstName: 'Auto', lastName: 'Transfer' });
    expect(customer.status).toBe(201);
    customerId = customer.body.id;

    const settings = await as(managerCookie)
      .patch('/v1/business/settings')
      .send({ ops: { autoScheduleDays: 2 } });
    expect(settings.status).toBe(200);
  });

  it('a confirmed short order writes ONE draft auto transfer from the stocked store', async () => {
    const order = await shortOrder(3);

    const transfers = await autoTransfersFor(order.id);
    expect(transfers).toHaveLength(1);
    const t = transfers[0]!;
    expect(t.transferType).toBe('auto');
    expect(t.status).toBe('draft');
    expect(t.fromLocationId).toBe(warehouseLocationId);
    expect(t.toLocationId).toBe(mainLocationId);

    // XFR-053: scheduled = today + 2 + 1, every weekday allowed.
    const expected = new Date();
    expected.setHours(12, 0, 0, 0);
    expected.setDate(expected.getDate() + 3);
    expect(t.scheduledFor).toBe(expected.toISOString().slice(0, 10));

    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sql2);
    try {
      const lines = await db
        .select()
        .from(schema.stockTransferLines)
        .where(eq(schema.stockTransferLines.transferId, t.id));
      expect(lines).toHaveLength(1);
      expect(lines[0]!.variantId).toBe(atVariantId);
      expect(lines[0]!.quantityShipped).toBe(3);
    } finally {
      await sql2.end({ timeout: 5 });
    }

    // Re-running the reservation must not double-generate (dedupe against
    // the open auto transfer).
    const again = await as(managerCookie).post(`/v1/orders/${order.id}/reserve`).send({});
    expect(again.status).toBe(201);
    expect(await autoTransfersFor(order.id)).toHaveLength(1);
  });

  it('blank Auto Schedule Days disables the feature entirely (XFR-052)', async () => {
    await as(managerCookie)
      .patch('/v1/business/settings')
      .send({ ops: { autoScheduleDays: null } })
      .expect(200);
    const order = await shortOrder(2);
    expect(await autoTransfersFor(order.id)).toHaveLength(0);
  });

  it('a destination with no replenishment days checked skips with a warning, never loops', async () => {
    await as(managerCookie)
      .patch('/v1/business/settings')
      .send({ ops: { autoScheduleDays: 1 } })
      .expect(200);
    await as(managerCookie)
      .patch(`/v1/business/locations/${mainLocationId}`)
      .send({ replenishmentDays: [] })
      .expect(200);

    const order = await shortOrder(1);
    expect(await autoTransfersFor(order.id)).toHaveLength(0);

    const exceptions = await as(managerCookie).get('/v1/exceptions?type=auto_transfer_skipped');
    expect(exceptions.status).toBe(200);
    expect(exceptions.body.length).toBeGreaterThan(0);

    // Restore: all days again.
    await as(managerCookie)
      .patch(`/v1/business/locations/${mainLocationId}`)
      .send({ replenishmentDays: null })
      .expect(200);
  });
});

describe('J2/J3 — floor samples + serial pieces on transfers', () => {
  let serVariantId = '';
  let serial1 = '';
  let serial2 = '';

  function asManager() {
    return {
      get: (url: string) =>
        request(app.getHttpServer())
          .get(url)
          .set('Cookie', managerCookie)
          .set('X-Business-Id', businessId),
      post: (url: string) =>
        request(app.getHttpServer())
          .post(url)
          .set('Cookie', managerCookie)
          .set('X-Business-Id', businessId),
    };
  }

  async function withDb<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
    const sql2 = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      return await fn(drizzle(sql2));
    } finally {
      await sql2.end({ timeout: 5 });
    }
  }

  it('setup: serial-tracked fixture with two pieces at the warehouse', async () => {
    await withDb(async (db) => {
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: 'SER-BED', name: 'Serial Fixture Bed' })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({ businessId, productId: p!.id, sku: 'SER-BED-V1', priceCents: 60000 })
        .returning();
      serVariantId = v!.id;
      await db.insert(schema.inventoryLevels).values({
        businessId,
        variantId: serVariantId,
        locationId: warehouseLocationId,
        onHand: 3,
        reserved: 0,
      });
      const rows = await db
        .insert(schema.serialUnits)
        .values([
          {
            businessId,
            variantId: serVariantId,
            locationId: warehouseLocationId,
            serial: 'SN-001',
          },
          {
            businessId,
            variantId: serVariantId,
            locationId: warehouseLocationId,
            serial: 'SN-002',
          },
        ])
        .returning({ id: schema.serialUnits.id });
      serial1 = rows[0]!.id;
      serial2 = rows[1]!.id;
    });
  });

  it('a named piece rides the transfer: ship flags in_transit, receive re-homes it', async () => {
    const created = await asManager()
      .post('/v1/stock-transfers')
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: mainLocationId,
        ship: true,
        lines: [{ variantId: serVariantId, quantity: 1, serialIds: [serial1] }],
      });
    expect(created.status).toBe(201);

    await withDb(async (db) => {
      const [su] = await db
        .select()
        .from(schema.serialUnits)
        .where(eq(schema.serialUnits.id, serial1));
      expect(su!.status).toBe('in_transit');
    });

    const lineId = created.body.lines[0].id;
    const received = await asManager()
      .post(`/v1/stock-transfers/${created.body.id}/receive`)
      .send({ lines: [{ lineId, quantity: 1 }] });
    expect(received.status).toBe(201);

    await withDb(async (db) => {
      const [su] = await db
        .select()
        .from(schema.serialUnits)
        .where(eq(schema.serialUnits.id, serial1));
      expect(su!.status).toBe('in_stock');
      expect(su!.locationId).toBe(mainLocationId);
    });
  });

  it('serial validation refuses wrong-location and over-quantity picks', async () => {
    // serial1 now lives at main — naming it on a warehouse-origin line fails.
    const wrongLoc = await asManager()
      .post('/v1/stock-transfers')
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: mainLocationId,
        lines: [{ variantId: serVariantId, quantity: 1, serialIds: [serial1] }],
      });
    expect(wrongLoc.status).toBe(400);
    expect(wrongLoc.body.message).toMatch(/not at the origin/);

    const tooMany = await asManager()
      .post('/v1/stock-transfers')
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: mainLocationId,
        lines: [{ variantId: serVariantId, quantity: 1, serialIds: [serial2, serial2] }],
      });
    expect(tooMany.status).toBe(400);
  });

  it('a floor_sample transfer nails the piece down and removes it from available', async () => {
    const created = await asManager()
      .post('/v1/stock-transfers')
      .send({
        fromLocationId: warehouseLocationId,
        toLocationId: mainLocationId,
        transferType: 'floor_sample',
        ship: true,
        lines: [{ variantId: serVariantId, quantity: 1, serialIds: [serial2] }],
      });
    expect(created.status).toBe(201);
    await asManager()
      .post(`/v1/stock-transfers/${created.body.id}/receive`)
      .send({ lines: [{ lineId: created.body.lines[0].id, quantity: 1 }] })
      .expect(201);

    await withDb(async (db) => {
      const [su] = await db
        .select()
        .from(schema.serialUnits)
        .where(eq(schema.serialUnits.id, serial2));
      expect(su!.status).toBe('floor_sample');
      expect(su!.locationId).toBe(mainLocationId);
    });

    const levels = await asManager().get(`/v1/inventory/levels?locationId=${mainLocationId}`);
    const row = (
      levels.body as {
        variantId: string;
        onHand: number;
        floorSample: number;
        available: number;
      }[]
    ).find((l) => l.variantId === serVariantId);
    expect(row).toBeTruthy();
    expect(row!.onHand).toBe(2); // both pieces arrived at main
    expect(row!.floorSample).toBe(1); // the nailed-down one
    expect(row!.available).toBe(1); // only the sellable piece
  });

  it('the manual floor-sample hold clamps to on-hand and is reversible', async () => {
    const set = await asManager()
      .post('/v1/inventory/levels/floor-sample')
      .send({ variantId: serVariantId, locationId: mainLocationId, quantity: 999 });
    expect(set.status).toBe(201);
    expect(set.body.floorSample).toBe(2); // clamped to on-hand

    const back = await asManager()
      .post('/v1/inventory/levels/floor-sample')
      .send({ variantId: serVariantId, locationId: mainLocationId, quantity: 1 });
    expect(back.status).toBe(201);
    expect(back.body.floorSample).toBe(1);
  });
});
