/**
 * Epic 1.8 acceptance: receiving 10 units of variant X at location Y
 * increases inventory_levels.on_hand by 10 and writes a single
 * inventory_movements row.
 *
 * Also exercises manual adjust with reason validation, levels view,
 * permissions (cashier inventory.view only), and the audit log.
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
  process.env.INVENTORY_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_inventory';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'InvPass!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let variantId = '';
let inventoryClerkCookie = '';
let cashierCookie = '';
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
      .values({ slug: 'inv-test', name: 'Inventory Test Co', status: 'active' })
      .returning();
    businessId = biz!.id;

    const roles = new Map<string, string>();
    for (const role of SYSTEM_ROLES) {
      const [r] = await db
        .insert(schema.roles)
        .values({
          businessId,
          name: role.name,
          description: role.description,
          isSystem: true,
        })
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
    await makeUser('owner@inv-test.local', 'Owner');
    await makeUser('clerk@inv-test.local', 'Inventory Clerk');
    await makeUser('cashier@inv-test.local', 'Cashier');

    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Main Store', timezone: 'America/New_York' })
      .returning();
    locationId = loc!.id;

    const [product] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'X-001', name: 'Variant X' })
      .returning();
    const [variant] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: product!.id,
        sku: 'X-001-V1',
        priceCents: 1000,
      })
      .returning();
    variantId = variant!.id;
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
  process.env.BETTER_AUTH_SECRET ??= 'inventory-test-secret-inventory-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true });
  await app.init();

  ownerCookie = await captureCookie('owner@inv-test.local');
  inventoryClerkCookie = await captureCookie('clerk@inv-test.local');
  cashierCookie = await captureCookie('cashier@inv-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

async function lookupLevel(): Promise<{
  onHand: number;
  reserved: number;
  movementCount: number;
}> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  try {
    const [level] = await db
      .select()
      .from(schema.inventoryLevels)
      .where(
        and(
          eq(schema.inventoryLevels.variantId, variantId),
          eq(schema.inventoryLevels.locationId, locationId),
        ),
      );
    const movements = await db
      .select()
      .from(schema.inventoryMovements)
      .where(eq(schema.inventoryMovements.variantId, variantId));
    return {
      onHand: level?.onHand ?? 0,
      reserved: level?.reserved ?? 0,
      movementCount: movements.length,
    };
  } finally {
    await sql.end({ timeout: 5 });
  }
}

describe('Epic 1.8 — Inventory', () => {
  it('Initial level is empty', async () => {
    const before = await lookupLevel();
    expect(before.onHand).toBe(0);
    expect(before.movementCount).toBe(0);
  });

  it('Receiving 10 units increases on_hand by 10 + writes one movement row', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/inventory/receive')
      .set('Cookie', inventoryClerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        locationId,
        notes: 'Initial PO',
        lines: [{ variantId, quantity: 10 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.lines).toHaveLength(1);
    expect(res.body.lines[0].onHand).toBe(10);

    const after = await lookupLevel();
    expect(after.onHand).toBe(10);
    expect(after.movementCount).toBe(1);

    // Movement row carries reason='receive' and the actor.
    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      const [m] = await db
        .select()
        .from(schema.inventoryMovements)
        .where(eq(schema.inventoryMovements.variantId, variantId));
      expect(m!.reason).toBe('receive');
      expect(m!.delta).toBe(10);
      expect(m!.notes).toBe('Initial PO');
      expect(m!.actorUserId).toBeTruthy();
    } finally {
      await sqlc.end({ timeout: 5 });
    }
  });

  it('Receiving another 5 stacks on top + writes a second movement', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/inventory/receive')
      .set('Cookie', inventoryClerkCookie)
      .set('X-Business-Id', businessId)
      .send({ locationId, lines: [{ variantId, quantity: 5 }] });
    expect(res.status).toBe(201);
    const after = await lookupLevel();
    expect(after.onHand).toBe(15);
    expect(after.movementCount).toBe(2);
  });

  it('Manual adjust with reason "damage" subtracts and audit-logs', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/inventory/adjust')
      .set('Cookie', inventoryClerkCookie)
      .set('X-Business-Id', businessId)
      .send({ variantId, locationId, delta: -3, reason: 'damage', notes: '3 units broken' });
    expect(res.status).toBe(201);
    expect(res.body.onHand).toBe(12);

    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      const audits = await db
        .select()
        .from(schema.auditLogs)
        .where(eq(schema.auditLogs.action, 'inventory.adjust'));
      expect(audits.length).toBeGreaterThanOrEqual(1);
      const last = audits.at(-1)!;
      expect(last.changesJson).toMatchObject({
        metadata: { delta: -3, reason: 'damage', locationId },
      });
    } finally {
      await sqlc.end({ timeout: 5 });
    }
  });

  it('Adjust with an invalid reason returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/inventory/adjust')
      .set('Cookie', inventoryClerkCookie)
      .set('X-Business-Id', businessId)
      .send({ variantId, locationId, delta: 1, reason: 'lol' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/count_correction/);
  });

  it('Adjust below zero clamps on_hand to 0 (sanity / count correction)', async () => {
    // Current on_hand is 12; subtract 1000 to test the GREATEST(0, …) floor.
    const res = await request(app.getHttpServer())
      .post('/v1/inventory/adjust')
      .set('Cookie', inventoryClerkCookie)
      .set('X-Business-Id', businessId)
      .send({ variantId, locationId, delta: -1000, reason: 'count_correction' });
    expect(res.status).toBe(201);
    expect(res.body.onHand).toBe(0);
  });

  it('Levels endpoint returns joined product + variant info', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/inventory/levels?locationId=${locationId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    const row = res.body[0];
    expect(row.variantId).toBe(variantId);
    expect(row.locationId).toBe(locationId);
    expect(row.productName).toBe('Variant X');
    expect(row.variantSku).toBe('X-001-V1');
    expect(row.onHand).toBe(0);
    expect(row.available).toBe(0);
  });

  it('Cashier (inventory.view only) can list but cannot adjust or receive', async () => {
    const list = await request(app.getHttpServer())
      .get('/v1/inventory/levels')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId);
    expect(list.status).toBe(200);

    const adjust = await request(app.getHttpServer())
      .post('/v1/inventory/adjust')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ variantId, locationId, delta: 1, reason: 'count_correction' });
    expect(adjust.status).toBe(403);
    expect(adjust.body.message).toMatch(/inventory\.adjust/);

    const receive = await request(app.getHttpServer())
      .post('/v1/inventory/receive')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ locationId, lines: [{ variantId, quantity: 1 }] });
    expect(receive.status).toBe(403);
    expect(receive.body.message).toMatch(/inventory\.receive/);
  });

  it('Movements endpoint returns the ledger newest-first with the actor email', async () => {
    const res = await request(app.getHttpServer())
      .get(`/v1/inventory/movements?variantId=${variantId}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(4); // 2 receives + 2 adjusts
    const reasons = (res.body as Array<{ reason: string }>).map((m) => m.reason);
    expect(reasons).toContain('receive');
    expect(reasons).toContain('damage');
    expect(reasons).toContain('count_correction');
    const first = res.body[0];
    expect(first.actorEmail).toBe('clerk@inv-test.local');
  });
});
