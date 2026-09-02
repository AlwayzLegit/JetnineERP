/**
 * Order detail extras (owner 2026-09-02, orders page overhaul): each line
 * carries the PO it is on (ordered vs accepted/reserved), split-family
 * siblings carry their lines so the page can show the take-with piece under
 * the delivery lines, and exchange orders written against this order are
 * listed for the Exchanges card.
 */
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { hashPassword } from 'better-auth/crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import postgres from 'postgres';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { SYSTEM_ROLES } from '@jetnine/shared';
import { AppModule } from '../src/app.module';

const TEST_DB_URL =
  process.env.ORDER_DETAIL_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_order_detail';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'OrderDetailPass!2026';

let app: INestApplication;
let businessId = '';
let cookie = '';
const ids = { order: '', poLine: '', stockLine: '', po: '', split: '', exchange: '', alloc: '' };

function withDb<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  return fn(db).finally(() => sql.end({ timeout: 5 }));
}

async function resetTestDb() {
  const env = { ...process.env, DATABASE_URL: TEST_DB_URL };
  for (const script of ['src/reset.ts', 'src/migrate.ts']) {
    execFileSync('pnpm', ['exec', 'tsx', script], { cwd: dbPackageRoot, env, stdio: 'inherit' });
  }
}

async function seed() {
  await withDb(async (db) => {
    const passwordHash = await hashPassword(PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'od-test', name: 'Order Detail Test Co', status: 'active' })
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
      .values({ email: 'mgr@od-test.local', emailVerified: true, name: 'Manager' })
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
      roleId: roles.get('Manager')!,
      status: 'active',
      acceptedAt: new Date(),
    });
    const [store] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'OD Store', timezone: 'America/Los_Angeles' })
      .returning();
    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'OD-MAT', name: 'Queen Helix Midnight' })
      .returning();
    const [v] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: p!.id,
        sku: 'OD-MAT-Q',
        priceCents: 120_000,
        costCents: 50_000,
      })
      .returning();
    const [cust] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Odie', lastName: 'Detail' })
      .returning();

    // Delivery order: one special-order line (on a PO) + one stock line.
    const [order] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId: store!.id,
        number: 'SO-OD-100',
        status: 'open',
        customerId: cust!.id,
        fulfillmentType: 'delivery',
        subtotalCents: 240_000,
        totalCents: 240_000,
      })
      .returning();
    ids.order = order!.id;
    const lines = await db
      .insert(schema.orderLines)
      .values([
        {
          businessId,
          orderId: order!.id,
          variantId: v!.id,
          description: 'Queen Helix Midnight (special order)',
          quantity: 2,
          lineType: 'special_order',
          unitPriceCents: 120_000,
          totalCents: 240_000,
        },
        {
          businessId,
          orderId: order!.id,
          variantId: v!.id,
          description: 'Queen Helix Midnight (stock)',
          quantity: 1,
          qtyReserved: 1,
          unitPriceCents: 0,
          totalCents: 0,
        },
      ])
      .returning();
    ids.poLine = lines[0]!.id;
    ids.stockLine = lines[1]!.id;

    const [vendor] = await db
      .insert(schema.vendors)
      .values({ businessId, name: 'Helix' })
      .returning();
    const [po] = await db
      .insert(schema.purchaseOrders)
      .values({
        businessId,
        vendorId: vendor!.id,
        locationId: store!.id,
        number: 'PO-OD-7',
        status: 'ordered',
        expectedAt: new Date('2026-09-20T00:00:00Z'),
        subtotalCents: 100_000,
      })
      .returning();
    ids.po = po!.id;
    const [pol] = await db
      .insert(schema.purchaseOrderLines)
      .values({
        businessId,
        purchaseOrderId: po!.id,
        variantId: v!.id,
        quantityOrdered: 2,
        unitCostCents: 50_000,
        lineTotalCents: 100_000,
      })
      .returning();
    const [alloc] = await db
      .insert(schema.poLineAllocations)
      .values({
        businessId,
        poLineId: pol!.id,
        orderLineId: ids.poLine,
        quantity: 2,
        status: 'ordered',
      })
      .returning();
    ids.alloc = alloc!.id;

    // Split sibling: the take-with piece written as SO-OD-100-A.
    const [split] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId: store!.id,
        number: 'SO-OD-100-A',
        status: 'completed',
        customerId: cust!.id,
        fulfillmentType: 'pickup',
        subtotalCents: 30_000,
        totalCents: 30_000,
      })
      .returning();
    ids.split = split!.id;
    await db.insert(schema.orderLines).values({
      businessId,
      orderId: split!.id,
      variantId: v!.id,
      description: 'Queen pillow (take with)',
      quantity: 1,
      qtyReserved: 1,
      qtyFulfilled: 1,
      fulfillmentMethod: 'take_with',
      unitPriceCents: 30_000,
      totalCents: 30_000,
    });

    // Exchange order written against the delivery order.
    const [exchange] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId: store!.id,
        number: 'SO-OD-200',
        status: 'open',
        customerId: cust!.id,
        originalOrderId: order!.id,
        fulfillmentType: 'delivery',
        subtotalCents: 5_000,
        totalCents: 5_000,
      })
      .returning();
    ids.exchange = exchange!.id;
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

function getOrder() {
  return request(app.getHttpServer())
    .get(`/v1/orders/${ids.order}`)
    .set('Cookie', cookie)
    .set('x-business-id', businessId)
    .expect(200);
}

beforeAll(async () => {
  await resetTestDb();
  await seed();
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'od-test-secret-od-test-secret-xxxxxx';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();
  cookie = await captureCookie('mgr@od-test.local');
}, 180_000);

afterAll(async () => {
  if (app) await app.close();
});

describe('Order detail extras', () => {
  it('shows the PO each unreserved line is on, and nothing for stock lines', async () => {
    const res = await getOrder();
    const byId = new Map(res.body.lines.map((l: { id: string }) => [l.id, l]));
    expect((byId.get(ids.poLine) as { po: unknown }).po).toMatchObject({
      poId: ids.po,
      poNumber: 'PO-OD-7',
      poStatus: 'ordered',
      ordered: 2,
      received: 0,
    });
    expect((byId.get(ids.stockLine) as { po: unknown }).po).toBeNull();
  });

  it('flips to accepted + reserved once the PO line is received', async () => {
    await withDb(async (db) => {
      await db
        .update(schema.poLineAllocations)
        .set({ status: 'received' })
        .where(eq(schema.poLineAllocations.id, ids.alloc));
      await db
        .update(schema.orderLines)
        .set({ qtyReserved: 2 })
        .where(eq(schema.orderLines.id, ids.poLine));
      await db
        .update(schema.purchaseOrders)
        .set({ status: 'received' })
        .where(eq(schema.purchaseOrders.id, ids.po));
    });
    const res = await getOrder();
    const line = res.body.lines.find((l: { id: string }) => l.id === ids.poLine);
    expect(line.qtyReserved).toBe(2);
    expect(line.po).toMatchObject({
      poNumber: 'PO-OD-7',
      poStatus: 'received',
      ordered: 0,
      received: 2,
    });
  });

  it('carries the split take-with sibling with its lines', async () => {
    const res = await getOrder();
    expect(res.body.family).toHaveLength(1);
    expect(res.body.family[0]).toMatchObject({
      id: ids.split,
      number: 'SO-OD-100-A',
      fulfillmentType: 'pickup',
      balanceDueCents: 30_000,
    });
    expect(res.body.family[0].lines).toEqual([
      expect.objectContaining({
        description: 'Queen pillow (take with)',
        fulfillmentMethod: 'take_with',
      }),
    ]);
  });

  it('lists exchange orders written against this order', async () => {
    const res = await getOrder();
    expect(res.body.exchangeOrders).toEqual([
      expect.objectContaining({
        id: ids.exchange,
        number: 'SO-OD-200',
        status: 'open',
        totalCents: 5_000,
      }),
    ]);
    // The exchange order itself is not a split sibling.
    expect(res.body.family.map((f: { number: string }) => f.number)).toEqual(['SO-OD-100-A']);
  });
});
