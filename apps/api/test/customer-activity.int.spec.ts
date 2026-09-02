/**
 * View Customer Activity (owner 2026-09-02): one read feeds the eight
 * STORIS-style views. Seeds a customer with an open delivery order (deposit
 * taken, one special-order line on a PO, one stock line), a delivered order
 * with a return, a register sale, a layaway installment plan, and an open
 * service order — then checks every section against the documents.
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
  process.env.CUSTOMER_ACTIVITY_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_customer_activity';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'ActivityPass!2026xx';

let app: INestApplication;
let businessId = '';
let cookie = '';
const ids = {
  customer: '',
  other: '',
  openOrder: '',
  deliveredOrder: '',
  layaway: '',
  sale: '',
  po: '',
  soLine: '',
  service: '',
};

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

const LAST_YEAR = new Date(Date.UTC(new Date().getUTCFullYear() - 1, 5, 15));

async function seed() {
  await withDb(async (db) => {
    const passwordHash = await hashPassword(PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'act-test', name: 'Activity Test Co', status: 'active' })
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
      .values({ email: 'wt@act-test.local', emailVerified: true, name: 'Walter Tan' })
      .returning();
    await db.insert(schema.accounts).values({
      accountId: u!.id,
      providerId: 'credential',
      userId: u!.id,
      password: passwordHash,
    });
    const [mem] = await db
      .insert(schema.memberships)
      .values({
        businessId,
        userId: u!.id,
        roleId: roles.get('Manager')!,
        status: 'active',
        acceptedAt: new Date(),
      })
      .returning();
    const [store] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Sherman Oaks', timezone: 'America/Los_Angeles' })
      .returning();
    const [wh] = await db
      .insert(schema.locations)
      .values({
        businessId,
        name: 'LA Mattress Warehouse',
        timezone: 'America/Los_Angeles',
        locationType: 'warehouse',
      })
      .returning();
    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'HEXMIC', name: 'E King Midnight-Luxe Medium' })
      .returning();
    const [v] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: p!.id,
        sku: 'HEXMIC_FP-7680',
        priceCents: 200_000,
        costCents: 90_000,
      })
      .returning();
    const [p2] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'HEXTWC', name: 'E King Twilight-Luxe Firm' })
      .returning();
    const [v2] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: p2!.id,
        sku: 'HEXTWC_FP-7680',
        priceCents: 335_000,
        costCents: 150_000,
      })
      .returning();
    const [cust] = await db
      .insert(schema.customers)
      .values({
        businessId,
        firstName: 'Jason',
        lastName: 'Borenstein',
        phone: '8186488438',
        email: 'no@gmail.com',
        notes: 'Prefers morning delivery',
        addressesJson: [
          {
            label: 'delivery',
            line1: '4650 Sepulveda Blvd',
            line2: 'Unit 103',
            city: 'Sherman Oaks',
            region: 'CA',
            postalCode: '91403',
          },
        ],
      })
      .returning();
    ids.customer = cust!.id;
    const [other] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Someone', lastName: 'Else' })
      .returning();
    ids.other = other!.id;

    // 1. Open delivery order: stock line reserved, special-order line on a PO, deposit taken.
    const [open] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId: store!.id,
        stockLocationId: wh!.id,
        number: 'SO-ACT-100',
        status: 'open',
        customerId: cust!.id,
        salespersonMembershipId: mem!.id,
        fulfillmentType: 'delivery',
        subtotalCents: 535_000,
        taxCents: 51_812,
        deliveryFeeCents: 0,
        totalCents: 586_812,
      })
      .returning();
    ids.openOrder = open!.id;
    const openLines = await db
      .insert(schema.orderLines)
      .values([
        {
          businessId,
          orderId: open!.id,
          variantId: v!.id,
          description: 'E King Midnight-Luxe Medium',
          quantity: 1,
          qtyReserved: 1,
          unitPriceCents: 200_000,
          totalCents: 200_000,
        },
        {
          businessId,
          orderId: open!.id,
          variantId: v2!.id,
          description: 'E King Twilight-Luxe Firm',
          quantity: 1,
          lineType: 'special_order',
          unitPriceCents: 335_000,
          totalCents: 335_000,
        },
      ])
      .returning();
    ids.soLine = openLines[1]!.id;
    await db.insert(schema.payments).values({
      businessId,
      orderId: open!.id,
      kind: 'deposit',
      method: 'card',
      amountCents: 100_000,
      status: 'succeeded',
    });
    const [vendor] = await db
      .insert(schema.vendors)
      .values({ businessId, name: 'Helix' })
      .returning();
    const [po] = await db
      .insert(schema.purchaseOrders)
      .values({
        businessId,
        vendorId: vendor!.id,
        locationId: wh!.id,
        number: 'PO-ACT-9',
        status: 'ordered',
        expectedAt: new Date('2026-09-20T00:00:00Z'),
        subtotalCents: 150_000,
      })
      .returning();
    ids.po = po!.id;
    const [pol] = await db
      .insert(schema.purchaseOrderLines)
      .values({
        businessId,
        purchaseOrderId: po!.id,
        variantId: v2!.id,
        quantityOrdered: 1,
        unitCostCents: 150_000,
        lineTotalCents: 150_000,
      })
      .returning();
    await db.insert(schema.poLineAllocations).values({
      businessId,
      poLineId: pol!.id,
      orderLineId: ids.soLine,
      quantity: 1,
      status: 'ordered',
    });

    // 2. Delivered order last year, paid in full, one unit returned this year.
    const [done] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId: store!.id,
        number: 'SO-ACT-050',
        status: 'completed',
        customerId: cust!.id,
        salespersonMembershipId: mem!.id,
        fulfillmentType: 'delivery',
        subtotalCents: 200_000,
        totalCents: 200_000,
        completedAt: LAST_YEAR,
        createdAt: LAST_YEAR,
      })
      .returning();
    ids.deliveredOrder = done!.id;
    const [doneLine] = await db
      .insert(schema.orderLines)
      .values({
        businessId,
        orderId: done!.id,
        variantId: v!.id,
        description: 'E King Midnight-Luxe Medium',
        quantity: 1,
        qtyReserved: 1,
        qtyFulfilled: 1,
        qtyReturned: 1,
        unitPriceCents: 200_000,
        totalCents: 200_000,
      })
      .returning();
    await db.insert(schema.payments).values({
      businessId,
      orderId: done!.id,
      kind: 'deposit',
      method: 'cash',
      amountCents: 200_000,
      status: 'succeeded',
      createdAt: LAST_YEAR,
    });
    const [ret] = await db
      .insert(schema.orderReturns)
      .values({
        businessId,
        orderId: done!.id,
        customerId: cust!.id,
        rmaNumber: 'RMA-ACT-1',
        status: 'completed',
        refundMethod: 'store_credit',
        amountCents: 200_000,
        reason: 'comfort',
        completedAt: new Date(),
      })
      .returning();
    await db.insert(schema.orderReturnLines).values({
      businessId,
      returnId: ret!.id,
      orderLineId: doneLine!.id,
      variantId: v!.id,
      description: 'E King Midnight-Luxe Medium',
      quantity: 1,
      perUnitCents: 200_000,
    });
    await db.insert(schema.storeCreditEntries).values({
      businessId,
      customerId: cust!.id,
      deltaCents: 200_000,
      reason: 'return',
      referenceType: 'order_return',
      referenceId: ret!.id,
    });

    // 3. Layaway with an active plan: one installment paid, two open.
    const [lay] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId: store!.id,
        number: 'SO-ACT-120',
        status: 'open',
        customerId: cust!.id,
        orderKind: 'layaway',
        fulfillmentType: 'pickup',
        subtotalCents: 90_000,
        totalCents: 90_000,
      })
      .returning();
    ids.layaway = lay!.id;
    await db.insert(schema.orderLines).values({
      businessId,
      orderId: lay!.id,
      variantId: v!.id,
      description: 'Pillow set',
      quantity: 1,
      qtyReserved: 1,
      fulfillmentMethod: 'take_with',
      unitPriceCents: 90_000,
      totalCents: 90_000,
    });
    const [pay1] = await db
      .insert(schema.payments)
      .values({
        businessId,
        orderId: lay!.id,
        kind: 'installment',
        method: 'cash',
        amountCents: 30_000,
        status: 'succeeded',
      })
      .returning();
    const [plan] = await db
      .insert(schema.paymentPlans)
      .values({
        businessId,
        orderId: lay!.id,
        type: 'layaway',
        status: 'active',
        installmentAmountCents: 30_000,
        frequency: 'monthly',
        startDate: '2026-09-01',
      })
      .returning();
    await db.insert(schema.paymentPlanInstallments).values([
      {
        businessId,
        planId: plan!.id,
        seq: 1,
        dueDate: '2026-09-01',
        amountCents: 30_000,
        status: 'paid',
        paidPaymentId: pay1!.id,
      },
      {
        businessId,
        planId: plan!.id,
        seq: 2,
        dueDate: '2026-10-01',
        amountCents: 30_000,
        status: 'due',
      },
      {
        businessId,
        planId: plan!.id,
        seq: 3,
        dueDate: '2026-11-01',
        amountCents: 30_000,
        status: 'due',
      },
    ]);

    // 4. Register sale this year.
    const [sale] = await db
      .insert(schema.sales)
      .values({
        businessId,
        locationId: store!.id,
        number: 'S-ACT-7',
        status: 'completed',
        customerId: cust!.id,
        subtotalCents: 12_000,
        totalCents: 12_000,
        completedAt: new Date(),
      })
      .returning();
    ids.sale = sale!.id;
    await db.insert(schema.saleLines).values({
      businessId,
      saleId: sale!.id,
      variantId: v!.id,
      description: 'Mattress protector',
      quantity: 2,
      unitPriceCents: 6_000,
      totalCents: 12_000,
    });

    // 5. Open service order + one completed one for the totals.
    const [svc] = await db
      .insert(schema.serviceOrders)
      .values({
        businessId,
        locationId: store!.id,
        number: 'SV-ACT-3',
        customerId: cust!.id,
        itemDescription: 'Adjustable base',
        issue: 'Remote will not pair',
        status: 'in_service',
        technicianMembershipId: mem!.id,
        warranty: true,
        totalCents: 0,
      })
      .returning();
    ids.service = svc!.id;
    await db.insert(schema.serviceOrders).values({
      businessId,
      locationId: store!.id,
      number: 'SV-ACT-1',
      customerId: cust!.id,
      itemDescription: 'Headboard',
      issue: 'Loose bolt',
      status: 'completed',
      warranty: false,
      subtotalCents: 4_500,
      totalCents: 4_500,
      completedAt: new Date(),
    });

    // Noise: another customer's order must not leak in.
    await db.insert(schema.orders).values({
      businessId,
      locationId: store!.id,
      number: 'SO-ACT-999',
      status: 'open',
      customerId: other!.id,
      fulfillmentType: 'delivery',
      subtotalCents: 1_000,
      totalCents: 1_000,
    });
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

function getActivity(customerId = ids.customer) {
  return request(app.getHttpServer())
    .get(`/v1/customers/${customerId}/activity`)
    .set('Cookie', cookie)
    .set('x-business-id', businessId);
}

beforeAll(async () => {
  await resetTestDb();
  await seed();
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'act-test-secret-act-test-secret-xxxx';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();
  cookie = await captureCookie('wt@act-test.local');
}, 180_000);

afterAll(async () => {
  if (app) await app.close();
});

describe('View Customer Activity', () => {
  it('general information: identity, address, ship-from and yearly totals', async () => {
    const res = await getActivity().expect(200);
    expect(res.body.customer).toMatchObject({
      name: 'Jason Borenstein',
      phone: '8186488438',
      email: 'no@gmail.com',
      storeCreditCents: 200_000,
      address: {
        line1: '4650 Sepulveda Blvd',
        line2: 'Unit 103',
        city: 'Sherman Oaks',
        region: 'CA',
        postalCode: '91403',
      },
    });
    expect(res.body.customer.code).toHaveLength(8);
    expect(res.body.general.shipFromLocation).toBe('LA Mattress Warehouse');
    const t = res.body.general.totals;
    // This year: open order + layaway + register sale; return; both service orders.
    expect(t.thisYear.sales).toEqual({ cents: 586_812 + 90_000 + 12_000, count: 3 });
    expect(t.thisYear.returns).toEqual({ cents: 200_000, count: 1 });
    expect(t.thisYear.service).toEqual({ cents: 4_500, count: 2 });
    expect(t.lastYear.sales).toEqual({ cents: 200_000, count: 1 });
    expect(t.lifetime.sales).toEqual({ cents: 586_812 + 90_000 + 12_000 + 200_000, count: 4 });
  });

  it('open orders: rows with salesperson, money split and derived status; summary money', async () => {
    const res = await getActivity().expect(200);
    const rows = res.body.openOrders.rows;
    expect(rows.map((r: { number: string }) => r.number).sort()).toEqual([
      'SO-ACT-100',
      'SO-ACT-120',
    ]);
    const so = rows.find((r: { number: string }) => r.number === 'SO-ACT-100');
    expect(so).toMatchObject({
      orderType: 'Sales Order',
      fulfillmentType: 'delivery',
      salespersonName: 'Walter Tan',
      merchandiseCents: 535_000,
      otherCents: 51_812,
      totalCents: 586_812,
      amountPaidCents: 100_000,
      balanceCents: 486_812,
      displayStatus: 'On PO',
    });
    const lay = rows.find((r: { number: string }) => r.number === 'SO-ACT-120');
    expect(lay).toMatchObject({
      orderType: 'Layaway',
      amountPaidCents: 30_000,
      balanceCents: 60_000,
      displayStatus: 'Layaway',
    });
    expect(res.body.openOrders).toMatchObject({
      totalOrdersCents: 586_812 + 90_000,
      depositsCents: 130_000,
      unpaidBalanceCents: 486_812 + 60_000,
      arCents: 60_000,
    });
    // The other customer's order never shows.
    expect(JSON.stringify(res.body)).not.toContain('SO-ACT-999');
  });

  it('order line details: reserved vs special-order line on its PO', async () => {
    const res = await getActivity().expect(200);
    const so = res.body.orderLines.find((o: { number: string }) => o.number === 'SO-ACT-100');
    expect(so.lines).toHaveLength(2);
    expect(so.lines[0]).toMatchObject({
      sku: 'HEXMIC_FP-7680',
      qtyReserved: 1,
      qtyOrdered: 1,
      backorderQty: 0,
      poNumber: null,
      fulfillmentMethod: 'Delivery',
      fulfillmentStatus: 'Reserved',
    });
    expect(so.lines[1]).toMatchObject({
      sku: 'HEXTWC_FP-7680',
      qtyReserved: 0,
      qtyOrdered: 1,
      backorderQty: 1,
      qtyReceived: 0,
      poNumber: 'PO-ACT-9',
      poId: ids.po,
      poDeliveryDate: '2026-09-20',
      poQuantity: 1,
      fulfillmentStatus: 'On PO',
    });
    const lay = res.body.orderLines.find((o: { number: string }) => o.number === 'SO-ACT-120');
    expect(lay.lines[0].fulfillmentMethod).toBe('Take-With');
  });

  it('historical purchases: delivered order lines, register sale lines and returns', async () => {
    const res = await getActivity().expect(200);
    const h = res.body.historicalPurchases;
    expect(h).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          docType: 'order',
          number: 'SO-ACT-050',
          orderType: 'Sales Order',
          quantity: 1,
          priceCents: 200_000,
        }),
        expect.objectContaining({
          docType: 'sale',
          number: 'S-ACT-7',
          orderType: 'Register sale',
          quantity: 2,
          priceCents: 6_000,
          description: 'Mattress protector',
        }),
        expect.objectContaining({
          docType: 'return',
          number: 'RMA-ACT-1',
          orderType: 'Return',
          quantity: -1,
        }),
      ]),
    );
    expect(h).toHaveLength(3);
  });

  it('deposits: current per open order, history with refunds, liability total', async () => {
    const res = await getActivity().expect(200);
    const cur = res.body.currentDeposits;
    expect(cur).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          number: 'SO-ACT-100',
          depositCents: 100_000,
          orderCents: 586_812,
          depositType: 'card',
          arCreditCents: 0,
        }),
        expect.objectContaining({ number: 'SO-ACT-120', depositCents: 30_000, orderCents: 90_000 }),
      ]),
    );
    const hist = res.body.historicalDeposits;
    expect(hist.totalLiabilityCents).toBe(130_000);
    expect(hist.rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          number: 'SO-ACT-100',
          type: 'Deposit',
          depositCents: 100_000,
          activityCents: 100_000,
        }),
        expect.objectContaining({ number: 'SO-ACT-050', type: 'Deposit', depositCents: 200_000 }),
        expect.objectContaining({ number: 'SO-ACT-050', type: 'Refund', activityCents: -200_000 }),
        expect.objectContaining({
          number: 'SO-ACT-120',
          type: 'Installment',
          depositCents: 30_000,
        }),
      ]),
    );
  });

  it('open A/R items: the unpaid layaway installments, dated and typed', async () => {
    const res = await getActivity().expect(200);
    const ar = res.body.openArItems;
    expect(ar).toHaveLength(2);
    expect(ar[0]).toMatchObject({
      reference: 'SO-ACT-120 #2',
      dueDate: '2026-10-01',
      transactionType: 'Layaway installment',
      inDispute: false,
      amountCents: 30_000,
      orderId: ids.layaway,
    });
    expect(ar[1].reference).toBe('SO-ACT-120 #3');
  });

  it('open service orders: only the unfinished ticket, with its coordinator', async () => {
    const res = await getActivity().expect(200);
    expect(res.body.openServiceOrders).toEqual([
      expect.objectContaining({
        id: ids.service,
        number: 'SV-ACT-3',
        type: 'Warranty',
        coordinator: 'Walter Tan',
        status: 'in_service',
        product: 'Adjustable base',
        description: 'Remote will not pair',
      }),
    ]);
  });

  it('a customer with nothing yet returns empty sections; unknown id is 404', async () => {
    const res = await getActivity(ids.other).expect(200);
    expect(res.body.openOrders.rows).toHaveLength(1); // their own SO-ACT-999
    expect(res.body.historicalPurchases).toEqual([]);
    expect(res.body.openArItems).toEqual([]);
    expect(res.body.openServiceOrders).toEqual([]);
    expect(res.body.customer.storeCreditCents).toBe(0);
    await getActivity('00000000-0000-0000-0000-000000000000').expect(404);
  });
});
