/**
 * Split-order money integrity (handoff 2026-08-30, the SO-2026-000018 case):
 * splitting an order must never change what the customer owes in total,
 * must keep each line's tax treatment, and must carry already-collected
 * money to whichever piece it covers. This spec first reproduces the live
 * scenario (foundation + recycling fee, paid in full, then split), then
 * pins the fixed behavior.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
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
  process.env.SPLITPAY_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_splitpay';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'SplitPay!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let customerId = '';
/** Queen foundation, $249.00 — the delivered piece in the live case. */
let foundationVariantId = '';
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
      .values({
        slug: 'splitpay-test',
        name: 'Split Pay Test Co',
        status: 'active',
        defaultTaxRateBps: 975,
      })
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
      .values({ email: 'owner@splitpay.local', emailVerified: true, name: 'Owner' })
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
      .values({ businessId, name: 'Store', timezone: 'America/Los_Angeles', taxRateBps: 975 })
      .returning();
    locationId = loc!.id;

    const [cust] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Vlad', lastName: 'Bee', email: 'vlad@example.test' })
      .returning();
    customerId = cust!.id;

    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'FND-Q', name: 'Queen BB Universal Grey Fnd 2in' })
      .returning();
    const [v] = await db
      .insert(schema.productVariants)
      .values({ businessId, productId: p!.id, sku: 'FND-Q-1', priceCents: 24_900 })
      .returning();
    foundationVariantId = v!.id;
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

beforeAll(async () => {
  await resetTestDb();
  await seed();
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_SECRET ??= 'splitpay-test-secret-splitpay-test';
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  await app.init();
  ownerCookie = await captureCookie('owner@splitpay.local');
}, 180_000);

afterAll(async () => {
  await app?.close();
});

function authed(method: 'get' | 'post' | 'patch', path: string) {
  return request(app.getHttpServer())
    [method](path)
    .set('Cookie', ownerCookie)
    .set('X-Business-Id', businessId);
}

/** The live fixture: $249 foundation + $18 recycling fee, 9.75% on merchandise only. */
async function writePaidTwoLineOrder(): Promise<{
  orderId: string;
  number: string;
  foundationLineId: string;
  totalCents: number;
}> {
  const create = await authed('post', '/v1/orders').send({
    locationId,
    customerId,
    fulfillmentType: 'delivery',
    requestedDate: '2026-09-05',
    address: { line1: '1 Main St', city: 'Los Angeles', region: 'CA', postalCode: '90001' },
    lines: [
      { variantId: foundationVariantId, quantity: 1 },
      {
        description: 'CA Mattress Recycling Fee (Add-On)',
        quantity: 1,
        unitPriceCents: 1_800,
        lineType: 'custom',
      },
    ],
    confirm: true,
  });
  expect(create.status).toBe(201);
  const orderId = create.body.id as string;

  // 249.00 + 18.00 + 24.28 tax (9.75% of the $249 only) = 291.28.
  expect(create.body.subtotalCents).toBe(26_700);
  expect(create.body.taxCents).toBe(2_428);
  expect(create.body.totalCents).toBe(29_128);

  const foundationLine = create.body.lines.find(
    (l: { variantId: string | null }) => l.variantId === foundationVariantId,
  );
  expect(foundationLine).toBeTruthy();

  const pay = await authed('post', `/v1/orders/${orderId}/payments`).send({
    method: 'card',
    amountCents: 29_128,
    kind: 'deposit',
    processorRef: '0781',
  });
  expect(pay.status).toBe(201);
  expect(pay.body.balanceDueCents).toBe(0);

  return {
    orderId,
    number: create.body.number,
    foundationLineId: foundationLine.id,
    totalCents: create.body.totalCents,
  };
}

describe('Split money integrity — the SO-2026-000018 case', () => {
  it('splitting a fully-paid order leaves both pieces paid and the combined total unchanged', async () => {
    const { orderId, foundationLineId } = await writePaidTwoLineOrder();

    const split = await authed('post', `/v1/orders/${orderId}/split`).send({
      lines: [{ lineId: foundationLineId }],
      requestedDate: '2026-09-20',
    });
    expect(split.status).toBe(201);

    const parent = (await authed('get', `/v1/orders/${orderId}`).expect(200)).body;
    const child = (await authed('get', `/v1/orders/${split.body.newOrder.id}`).expect(200)).body;

    // The recycling fee stays untaxed wherever it lands.
    expect(parent.taxCents).toBe(0);
    expect(parent.totalCents).toBe(1_800);
    expect(child.taxCents).toBe(2_428);
    expect(child.totalCents).toBe(27_328);
    // Splitting never changes what the customer owes in total.
    expect(parent.totalCents + child.totalCents).toBe(29_128);
    // The collected money follows the goods: both pieces read paid-in-full.
    expect(parent.balanceDueCents).toBe(0);
    expect(child.balanceDueCents).toBe(0);
    expect(parent.paidCents).toBe(1_800);
    expect(child.paidCents).toBe(27_328);
    // The one card charge is traceable from both halves of the split row.
    expect(parent.payments).toHaveLength(1);
    expect(child.payments).toHaveLength(1);
    expect(parent.payments[0].processorRef).toBe('0781');
    expect(child.payments[0].processorRef).toBe('0781');
    // Deposit-required is each piece's own policy figure, not the
    // combined order's ($73.26 on an $18 fee order, per the handoff).
    expect(parent.depositRequiredCents).toBe(450);
    expect(child.depositRequiredCents).toBe(6_832);
    // The pieces know about each other.
    expect(parent.family.map((f: { number: string }) => f.number)).toContain(child.number);
    expect(child.family.map((f: { number: string }) => f.number)).toContain(parent.number);
  });

  it('a deposit smaller than the parent-piece total stays on the parent', async () => {
    const { orderId, foundationLineId } = await (async () => {
      const create = await authed('post', '/v1/orders').send({
        locationId,
        customerId,
        fulfillmentType: 'delivery',
        requestedDate: '2026-09-05',
        lines: [
          { variantId: foundationVariantId, quantity: 2 },
          {
            description: 'CA Mattress Recycling Fee (Add-On)',
            quantity: 1,
            unitPriceCents: 1_800,
            lineType: 'custom',
          },
        ],
        confirm: true,
      });
      expect(create.status).toBe(201);
      const line = create.body.lines.find(
        (l: { variantId: string | null }) => l.variantId === foundationVariantId,
      );
      return { orderId: create.body.id as string, foundationLineId: line.id as string };
    })();
    // Total: 2×249 + 18 + tax(9.75% of 498) = 498 + 18 + 48.56 = 564.56.
    // Deposit only: $100.
    await authed('post', `/v1/orders/${orderId}/payments`)
      .send({ method: 'cash', amountCents: 10_000 })
      .expect(201);

    // Move ONE foundation to the child (partial-quantity split). Parent
    // keeps 1×249 + fee + tax = 291.28 > the $100 paid, so nothing moves.
    const split = await authed('post', `/v1/orders/${orderId}/split`).send({
      lines: [{ lineId: foundationLineId, quantity: 1 }],
      requestedDate: '2026-09-25',
    });
    expect(split.status).toBe(201);
    const parent = (await authed('get', `/v1/orders/${orderId}`).expect(200)).body;
    const child = (await authed('get', `/v1/orders/${split.body.newOrder.id}`).expect(200)).body;

    expect(parent.totalCents + child.totalCents).toBe(56_456);
    expect(parent.paidCents).toBe(10_000);
    expect(child.paidCents).toBe(0);
    expect(child.balanceDueCents).toBe(child.totalCents);
  });

  it('an excess that only partly covers the child moves exactly that much', async () => {
    // Paid 150.00 up front (over the fee, under fee + foundation). After
    // the foundation splits off, the parent keeps its own 18.00 and the
    // 132.00 excess covers part of the child.
    const create = await authed('post', '/v1/orders').send({
      locationId,
      customerId,
      fulfillmentType: 'delivery',
      requestedDate: '2026-09-05',
      lines: [
        { variantId: foundationVariantId, quantity: 1 },
        {
          description: 'CA Mattress Recycling Fee (Add-On)',
          quantity: 1,
          unitPriceCents: 1_800,
          lineType: 'custom',
        },
      ],
      confirm: true,
    });
    expect(create.status).toBe(201);
    const oid = create.body.id as string;
    const line = create.body.lines.find(
      (l: { variantId: string | null }) => l.variantId === foundationVariantId,
    );
    await authed('post', `/v1/orders/${oid}/payments`)
      .send({ method: 'cash', amountCents: 15_000 })
      .expect(201);

    const split = await authed('post', `/v1/orders/${oid}/split`).send({
      lines: [{ lineId: line.id }],
      requestedDate: '2026-09-25',
    });
    expect(split.status).toBe(201);
    const parent = (await authed('get', `/v1/orders/${oid}`).expect(200)).body;
    const child = (await authed('get', `/v1/orders/${split.body.newOrder.id}`).expect(200)).body;

    // Parent keeps its own total (18.00); the 132.00 excess covers part
    // of the child, which owes exactly the remainder.
    expect(parent.paidCents).toBe(1_800);
    expect(parent.balanceDueCents).toBe(0);
    expect(parent.creditDueCents).toBe(0);
    expect(child.paidCents).toBe(13_200);
    expect(child.balanceDueCents).toBe(27_328 - 13_200);
  });

  it('one register tender covers a whole split-at-sale family, and past it is refused', async () => {
    // Split-at-sale: two foundations promised on different dates.
    const create = await authed('post', '/v1/orders').send({
      locationId,
      customerId,
      fulfillmentType: 'delivery',
      requestedDate: '2026-09-05',
      lines: [
        { variantId: foundationVariantId, quantity: 1 },
        { variantId: foundationVariantId, quantity: 1, deliveryDate: '2026-10-01' },
      ],
      confirm: true,
      splitByDeliveryDate: true,
    });
    expect(create.status).toBe(201);
    expect(create.body.splitOrders).toHaveLength(1);
    const parentId = create.body.id as string;
    const sibId = create.body.splitOrders[0].id as string;

    const parentBefore = (await authed('get', `/v1/orders/${parentId}`).expect(200)).body;
    const sibBefore = (await authed('get', `/v1/orders/${sibId}`).expect(200)).body;
    const familyTotal = parentBefore.totalCents + sibBefore.totalCents;
    expect(familyTotal).toBe(2 * 27_328);

    // A dollar past the family's combined balance is still refused.
    const over = await authed('post', `/v1/orders/${parentId}/payments`).send({
      method: 'card',
      amountCents: familyTotal + 100,
      processorRef: '4242',
    });
    expect(over.status).toBe(400);
    expect(over.body.message).toMatch(/exceeds the balance due/);

    // The register's one payment for the whole family lands on each piece.
    const pay = await authed('post', `/v1/orders/${parentId}/payments`).send({
      method: 'card',
      amountCents: familyTotal,
      processorRef: '4242',
    });
    expect(pay.status).toBe(201);
    expect(pay.body.balanceDueCents).toBe(0);

    const sibAfter = (await authed('get', `/v1/orders/${sibId}`).expect(200)).body;
    expect(sibAfter.paidCents).toBe(27_328);
    expect(sibAfter.balanceDueCents).toBe(0);
    expect(sibAfter.payments).toHaveLength(1);
    expect(sibAfter.payments[0].processorRef).toBe('4242');
    expect(sibAfter.payments[0].kind).toBe('deposit');
  });

  it('an overpaid order shows a credit, and move-credit sends it to another order', async () => {
    // Overpay by shrinking a paid order: pay 291.28 in full, then remove
    // the fee line — the order now owes 273.28 with 18.00 of credit.
    const { orderId } = await writePaidTwoLineOrder();
    const detail = (await authed('get', `/v1/orders/${orderId}`).expect(200)).body;
    const feeLine = detail.lines.find((l: { variantId: string | null }) => !l.variantId);
    const del = await request(app.getHttpServer())
      .delete(`/v1/orders/${orderId}/lines/${feeLine.id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect([200, 201]).toContain(del.status);

    const overpaid = (await authed('get', `/v1/orders/${orderId}`).expect(200)).body;
    expect(overpaid.creditDueCents).toBe(1_800);
    expect(overpaid.balanceDueCents).toBe(0);

    // A second order for the same customer with a balance due.
    const other = await authed('post', '/v1/orders').send({
      locationId,
      customerId,
      fulfillmentType: 'delivery',
      requestedDate: '2026-09-10',
      lines: [{ variantId: foundationVariantId, quantity: 1 }],
      confirm: true,
    });
    expect(other.status).toBe(201);

    const moved = await authed('post', `/v1/orders/${orderId}/move-credit`).send({
      toOrderId: other.body.id,
    });
    expect(moved.status).toBe(201);
    expect(moved.body.creditDueCents).toBe(0);

    const target = (await authed('get', `/v1/orders/${other.body.id}`).expect(200)).body;
    expect(target.paidCents).toBe(1_800);
    expect(target.balanceDueCents).toBe(27_328 - 1_800);

    // No credit left → a second move is refused.
    const again = await authed('post', `/v1/orders/${orderId}/move-credit`).send({
      toOrderId: other.body.id,
    });
    expect(again.status).toBe(400);
    expect(again.body.message).toMatch(/no credit/);
  });

  it("credit cannot move to another customer's order", async () => {
    const { orderId } = await writePaidTwoLineOrder();
    const detail = (await authed('get', `/v1/orders/${orderId}`).expect(200)).body;
    const feeLine = detail.lines.find((l: { variantId: string | null }) => !l.variantId);
    await request(app.getHttpServer())
      .delete(`/v1/orders/${orderId}/lines/${feeLine.id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .expect(200);

    const cust = await authed('post', '/v1/customers').send({
      firstName: 'Other',
      lastName: 'Person',
      email: 'other@example.test',
    });
    expect(cust.status).toBe(201);
    const other = await authed('post', '/v1/orders').send({
      locationId,
      customerId: cust.body.id,
      fulfillmentType: 'delivery',
      requestedDate: '2026-09-10',
      lines: [{ variantId: foundationVariantId, quantity: 1 }],
      confirm: true,
    });
    expect(other.status).toBe(201);

    const res = await authed('post', `/v1/orders/${orderId}/move-credit`).send({
      toOrderId: other.body.id,
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/own orders/);
  });

  it('the 0076 data repair fixes an already-broken split pair, idempotently', async () => {
    // Build a correct split, then regress it into the exact production
    // breakage (SO-2026-000018): all money back on the parent, the fee
    // line taxed at 9.75%, the parent's header and deposit carrying the
    // combined-order figures.
    const { orderId, foundationLineId } = await writePaidTwoLineOrder();
    const split = await authed('post', `/v1/orders/${orderId}/split`).send({
      lines: [{ lineId: foundationLineId }],
      requestedDate: '2026-09-20',
    });
    expect(split.status).toBe(201);
    const childId = split.body.newOrder.id as string;

    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      await sql`UPDATE payments SET order_id = ${orderId} WHERE order_id = ${childId}`;
      await sql`UPDATE order_lines SET tax_rate_bps = 975, tax_cents = 176
                WHERE order_id = ${orderId} AND variant_id IS NULL`;
      await sql`UPDATE orders SET tax_cents = 176, total_cents = 1976, deposit_required_cents = 7326
                WHERE id = ${orderId}`;

      const repair = readFileSync(
        join(dbPackageRoot, 'drizzle', '0076_split_money_repair.sql'),
        'utf-8',
      );
      // Run the repair twice — the second pass must find nothing to change.
      await sql.unsafe(repair);
      await sql.unsafe(repair);
    } finally {
      await sql.end({ timeout: 5 });
    }

    const parent = (await authed('get', `/v1/orders/${orderId}`).expect(200)).body;
    const child = (await authed('get', `/v1/orders/${childId}`).expect(200)).body;
    expect(parent.taxCents).toBe(0);
    expect(parent.totalCents).toBe(1_800);
    expect(parent.paidCents).toBe(1_800);
    expect(parent.balanceDueCents).toBe(0);
    expect(parent.creditDueCents).toBe(0);
    expect(parent.depositRequiredCents).toBe(450);
    expect(child.paidCents).toBe(27_328);
    expect(child.balanceDueCents).toBe(0);
    expect(child.depositRequiredCents).toBe(6_832);
  });
});
