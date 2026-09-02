/**
 * Operations dashboard acceptance (owner 2026-08-31).
 *
 * The role sees every store's selling, every dollar in and out, and
 * every hand-made change to money or stock — then signs off on what it
 * has read. What this proves:
 *
 * - The feed surfaces each signal class from real rows: negative
 *   on-hand, a take-with left open on a split ticket, an over-threshold
 *   refund, a manual stock adjustment, an unacknowledged exception.
 * - Thresholds are honoured, and are tri-state — raising one in
 *   `ops_settings_json` takes a row off the feed.
 * - Clearing is a sign-off, not an approval: it stamps `ops_reviews`
 *   (or `exception_events.acknowledged_at` for register rows), is
 *   idempotent, and drops the row from the next read.
 * - The permission boundary: a Cashier sees none of it, and an
 *   Operations member cannot approve anything.
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
import { SystemRoleSyncService } from '../src/admin/system-role-sync.service';

const TEST_DB_URL =
  process.env.OPS_TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/jetnine_ops';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'OpsPass!2026';

let app: INestApplication;
let businessId = '';
let storeAId = '';
let storeBId = '';
let variantId = '';
let customerId = '';
let opsUserId = '';
let cashierUserId = '';
let opsCookie = '';
let cashierCookie = '';
let managerCookie = '';

/** Ids of the fixture rows each signal should surface. */
const fixtures = {
  negativeLevelId: '',
  discountSaleId: '',
  splitTakeWithOrderId: '',
  refundId: '',
  adjustmentMovementId: '',
  exceptionId: '',
};

function withDb<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
  const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
  const db = drizzle(sql);
  return fn(db).finally(() => sql.end({ timeout: 5 }));
}

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
  await withDb(async (db) => {
    const passwordHash = await hashPassword(PASSWORD);
    const [biz] = await db
      .insert(schema.businesses)
      .values({ slug: 'ops-test', name: 'Ops Test Co', status: 'active' })
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

    async function makeUser(email: string, role: string): Promise<string> {
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
      return u!.id;
    }
    opsUserId = await makeUser('ops@ops-test.local', 'Operations');
    cashierUserId = await makeUser('cashier@ops-test.local', 'Cashier');
    await makeUser('manager@ops-test.local', 'Manager');

    const stores = await db
      .insert(schema.locations)
      .values([
        { businessId, name: 'Store A', timezone: 'America/Los_Angeles' },
        { businessId, name: 'Store B', timezone: 'America/Los_Angeles' },
      ])
      .returning();
    storeAId = stores[0]!.id;
    storeBId = stores[1]!.id;

    const [p] = await db
      .insert(schema.products)
      .values({ businessId, sku: 'OPS-BED', name: 'Ops Fixture Bed' })
      .returning();
    const [v] = await db
      .insert(schema.productVariants)
      .values({
        businessId,
        productId: p!.id,
        sku: 'OPS-BED-V1',
        priceCents: 90_000,
        costCents: 40_000,
      })
      .returning();
    variantId = v!.id;

    const [cust] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Olive', lastName: 'Ops' })
      .returning();
    customerId = cust!.id;
  });
}

/**
 * One row per signal class, written straight to the tables the feed
 * reads. Going through the API for each would test the other modules,
 * not this one.
 */
async function seedSignals() {
  await withDb(async (db) => {
    // 1. Negative on-hand at Store B — a standing break in the ledger.
    const [level] = await db
      .insert(schema.inventoryLevels)
      .values({ businessId, variantId, locationId: storeBId, onHand: -3, reserved: 0 })
      .returning();
    fixtures.negativeLevelId = level!.id;

    // 2. A split ticket (base + '-A') whose take-with leg went out on an
    //    order that never completed. Created two days ago so it is well
    //    past the 24h default.
    const twoDaysAgo = new Date(Date.now() - 2 * 86_400_000);
    const [base] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId: storeAId,
        number: 'SO-2026-000900',
        status: 'open',
        customerId,
        totalCents: 150_000,
        subtotalCents: 150_000,
        fulfillmentType: 'delivery',
        createdAt: twoDaysAgo,
      })
      .returning();
    fixtures.splitTakeWithOrderId = base!.id;
    await db.insert(schema.orderLines).values([
      {
        businessId,
        orderId: base!.id,
        variantId,
        description: 'Mattress (take-with)',
        quantity: 1,
        qtyFulfilled: 1,
        unitPriceCents: 90_000,
        totalCents: 90_000,
        fulfillmentMethod: 'take_with',
      },
      {
        businessId,
        orderId: base!.id,
        variantId,
        description: 'Base (delivery)',
        quantity: 1,
        unitPriceCents: 60_000,
        totalCents: 60_000,
        fulfillmentMethod: 'delivery',
      },
    ]);
    // The sibling that makes it a split family.
    const [sibling] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId: storeAId,
        number: 'SO-2026-000900-A',
        status: 'open',
        customerId,
        totalCents: 20_000,
        subtotalCents: 20_000,
        createdAt: twoDaysAgo,
      })
      .returning();
    await db.insert(schema.orderLines).values({
      businessId,
      orderId: sibling!.id,
      variantId,
      description: 'Pillow',
      quantity: 1,
      unitPriceCents: 20_000,
      totalCents: 20_000,
    });

    // A completed take-with, as the control: it must NOT reach the feed.
    const [closed] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId: storeAId,
        number: 'SO-2026-000901',
        status: 'completed',
        customerId,
        totalCents: 90_000,
        subtotalCents: 90_000,
        createdAt: twoDaysAgo,
      })
      .returning();
    await db.insert(schema.orderLines).values([
      {
        businessId,
        orderId: closed!.id,
        variantId,
        description: 'Mattress (take-with)',
        quantity: 1,
        qtyFulfilled: 1,
        unitPriceCents: 90_000,
        totalCents: 90_000,
        fulfillmentMethod: 'take_with',
      },
      {
        businessId,
        orderId: closed!.id,
        variantId,
        description: 'Base (delivery)',
        quantity: 1,
        unitPriceCents: 0,
        totalCents: 0,
        fulfillmentMethod: 'delivery',
      },
    ]);

    // 3. A $400 refund on a completed register sale — over the $200 default.
    const [sale] = await db
      .insert(schema.sales)
      .values({
        businessId,
        locationId: storeAId,
        number: 'S-000900',
        status: 'completed',
        customerId,
        associateUserId: cashierUserId,
        subtotalCents: 100_000,
        discountCents: 0,
        taxCents: 0,
        totalCents: 100_000,
      })
      .returning();
    await db.insert(schema.payments).values({
      businessId,
      saleId: sale!.id,
      kind: 'sale',
      method: 'card',
      amountCents: 100_000,
      status: 'succeeded',
    });
    const [refund] = await db
      .insert(schema.refunds)
      .values({
        businessId,
        saleId: sale!.id,
        amountCents: 40_000,
        reason: 'Customer changed their mind',
        approvedByUserId: cashierUserId,
      })
      .returning();
    fixtures.refundId = refund!.id;

    // A $50 refund, under the threshold — the control for thresholds.
    await db.insert(schema.refunds).values({
      businessId,
      saleId: sale!.id,
      amountCents: 5_000,
      reason: 'Small goodwill credit',
      approvedByUserId: cashierUserId,
    });

    // 4. A hand-made stock adjustment of 8 units.
    const [movement] = await db
      .insert(schema.inventoryMovements)
      .values({
        businessId,
        variantId,
        locationId: storeAId,
        delta: -8,
        reason: 'damage',
        notes: 'Forklift',
        actorUserId: cashierUserId,
      })
      .returning();
    fixtures.adjustmentMovementId = movement!.id;

    // A 2-unit adjustment, under the 5-unit default — control.
    await db.insert(schema.inventoryMovements).values({
      businessId,
      variantId,
      locationId: storeAId,
      delta: -2,
      reason: 'damage',
      actorUserId: cashierUserId,
    });

    // Routine system movements must never reach the feed, at any size.
    await db.insert(schema.inventoryMovements).values({
      businessId,
      variantId,
      locationId: storeAId,
      delta: -40,
      reason: 'sale',
      actorUserId: cashierUserId,
    });

    // 5. An open exception-register row.
    const [exception] = await db
      .insert(schema.exceptionEvents)
      .values({
        businessId,
        type: 'delivery_cap_override',
        severity: 'warning',
        actorUserId: cashierUserId,
        summary: 'Booked a 16th stop over the daily cap',
      })
      .returning();
    fixtures.exceptionId = exception!.id;

    // An already-acknowledged one — control.
    await db.insert(schema.exceptionEvents).values({
      businessId,
      type: 'order_unlock',
      severity: 'warning',
      actorUserId: cashierUserId,
      summary: 'Unlocked a printed order',
      acknowledgedAt: new Date(),
      acknowledgedByUserId: opsUserId,
    });

    // 6. A 30%-off register sale — past the 20% default, so the
    //    discount signal must surface it.
    const [discounted] = await db
      .insert(schema.sales)
      .values({
        businessId,
        locationId: storeAId,
        number: 'S-000901',
        status: 'completed',
        customerId,
        associateUserId: cashierUserId,
        subtotalCents: 100_000,
        discountCents: 30_000,
        taxCents: 0,
        totalCents: 70_000,
      })
      .returning();
    fixtures.discountSaleId = discounted!.id;
    // A 10%-off control that must stay off the feed.
    await db.insert(schema.sales).values({
      businessId,
      locationId: storeAId,
      number: 'S-000902',
      status: 'completed',
      customerId,
      associateUserId: cashierUserId,
      subtotalCents: 100_000,
      discountCents: 10_000,
      taxCents: 0,
      totalCents: 90_000,
    });

    // 7. A refund-only associate: the sale predates the salespeople
    //    window, the refund is fresh. (Attribution follows who rang
    //    the sale — the manager here.)
    const manager = await db
      .select({ userId: schema.memberships.userId })
      .from(schema.memberships)
      .innerJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
      .where(eq(schema.users.email, 'manager@ops-test.local'))
      .limit(1);
    const [oldSale] = await db
      .insert(schema.sales)
      .values({
        businessId,
        locationId: storeBId,
        number: 'S-000800',
        status: 'completed',
        customerId,
        associateUserId: manager[0]!.userId,
        subtotalCents: 50_000,
        discountCents: 0,
        taxCents: 0,
        totalCents: 50_000,
        createdAt: new Date(Date.now() - 40 * 86_400_000),
      })
      .returning();
    await db.insert(schema.refunds).values({
      businessId,
      saleId: oldSale!.id,
      amountCents: 7_000,
      reason: 'Late warranty credit',
      approvedByUserId: manager[0]!.userId,
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

interface FeedRow {
  subjectType: string;
  subjectId: string;
  severity: string;
  kind: string;
  summary: string;
  amountCents: number | null;
  clearVia: string;
}

async function readFeed(cookie = opsCookie): Promise<FeedRow[]> {
  const res = await request(app.getHttpServer())
    .get('/v1/dashboard/operations/feed')
    .set('Cookie', cookie)
    .set('x-business-id', businessId)
    .expect(200);
  return (res.body as { rows: FeedRow[] }).rows;
}

const has = (rows: FeedRow[], type: string, id: string) =>
  rows.some((r) => r.subjectType === type && r.subjectId === id);

beforeAll(async () => {
  await resetTestDb();
  await seed();
  await seedSignals();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'ops-test-secret-ops-test-secret-xxx';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  opsCookie = await captureCookie('ops@ops-test.local');
  cashierCookie = await captureCookie('cashier@ops-test.local');
  managerCookie = await captureCookie('manager@ops-test.local');
}, 180_000);

afterAll(async () => {
  if (app) await app.close();
});

describe('the Operations role', () => {
  it('is seeded with the dashboard permissions and without the approval ones', () => {
    const ops = SYSTEM_ROLES.find((r) => r.name === 'Operations');
    expect(ops).toBeDefined();
    expect(ops!.permissions).toContain('ops.dashboard.view');
    expect(ops!.permissions).toContain('ops.review.clear');
    expect(ops!.permissions).toContain('audit.view');
    // Reading is the job; authorizing an exception stays with the Manager.
    for (const approval of [
      'pos.refund.approve',
      'pos.cash.approve',
      'orders.price_override',
      'exchanges.approve',
      'returns.override_window',
    ]) {
      expect(ops!.permissions).not.toContain(approval);
    }
    // No quota, no commission (owner: selling is occasional).
    expect(ops!.permissions).not.toContain('commissions.view_all');
    expect(ops!.permissions).not.toContain('commissions.view_own');
  });

  it('reports itself to the web app so /dashboard swaps to the Operations home', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/business/members/me')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(res.body.operationsDashboard).toBe(true);

    const cashier = await request(app.getHttpServer())
      .get('/v1/business/members/me')
      .set('Cookie', cashierCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(cashier.body.operationsDashboard).toBe(false);

    // The Manager holds every business permission, ops.dashboard.view
    // included — but keeps their own home and reaches the page at
    // /operations instead.
    const manager = await request(app.getHttpServer())
      .get('/v1/business/members/me')
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(manager.body.operationsDashboard).toBe(false);
  });

  it('refuses the dashboard and the clear verb to a Cashier', async () => {
    for (const path of [
      '/v1/dashboard/operations',
      '/v1/dashboard/operations/feed',
      '/v1/dashboard/operations/salespeople',
      '/v1/dashboard/operations/digest',
    ]) {
      await request(app.getHttpServer())
        .get(path)
        .set('Cookie', cashierCookie)
        .set('x-business-id', businessId)
        .expect(403);
    }
    await request(app.getHttpServer())
      .post('/v1/ops-reviews/bulk')
      .set('Cookie', cashierCookie)
      .set('x-business-id', businessId)
      .send({ subjects: [{ subjectType: 'refund', subjectId: fixtures.refundId }] })
      .expect(403);
  });
});

describe('the feed', () => {
  it('surfaces every signal class from real rows', async () => {
    const rows = await readFeed();

    expect(has(rows, 'negative_stock', fixtures.negativeLevelId)).toBe(true);
    expect(has(rows, 'take_with_open', fixtures.splitTakeWithOrderId)).toBe(true);
    expect(has(rows, 'refund', fixtures.refundId)).toBe(true);
    expect(has(rows, 'inventory_movement', fixtures.adjustmentMovementId)).toBe(true);
    expect(has(rows, 'exception', fixtures.exceptionId)).toBe(true);
    expect(has(rows, 'discount', fixtures.discountSaleId)).toBe(true);
  });

  it('reports a take-with ticket at its balance due, not its face value', async () => {
    const rows = await readFeed();
    const takeWith = rows.find((r) => r.subjectId === fixtures.splitTakeWithOrderId);
    // $1,500 order, nothing collected: exposure is the full balance.
    // (Derived money is computed from the payment ledger, never stored.)
    expect(takeWith!.amountCents).toBe(150_000);
  });

  it('ranks negative stock and the open take-with as critical, above the rest', async () => {
    const rows = await readFeed();
    const criticalTypes = rows.filter((r) => r.severity === 'critical').map((r) => r.subjectType);
    expect(criticalTypes).toContain('negative_stock');
    expect(criticalTypes).toContain('take_with_open');
    // Sorted loudest-first: no warning may precede a critical.
    const firstWarning = rows.findIndex((r) => r.severity !== 'critical');
    const lastCritical = rows.map((r) => r.severity).lastIndexOf('critical');
    if (firstWarning >= 0) expect(lastCritical).toBeLessThan(firstWarning);
  });

  it('signs money out as negative so a refund never reads like revenue', async () => {
    const rows = await readFeed();
    const refund = rows.find((r) => r.subjectId === fixtures.refundId);
    expect(refund!.amountCents).toBe(-40_000);
  });

  it('leaves sub-threshold and routine rows off it', async () => {
    const rows = await readFeed();
    // The $50 refund and the 2-unit adjustment are under the defaults.
    expect(rows.filter((r) => r.subjectType === 'refund')).toHaveLength(1);
    const movements = rows.filter((r) => r.subjectType === 'inventory_movement');
    expect(movements).toHaveLength(1);
    expect(movements[0]!.subjectId).toBe(fixtures.adjustmentMovementId);
    // The completed order's take-with is settled business.
    const takeWiths = rows.filter((r) => r.subjectType === 'take_with_open');
    expect(takeWiths).toHaveLength(1);
    // An acknowledged exception has already been read by someone.
    expect(rows.filter((r) => r.subjectType === 'exception')).toHaveLength(1);
    // The 10%-off sale sits under the 20% default.
    const discounts = rows.filter((r) => r.subjectType === 'discount');
    expect(discounts).toHaveLength(1);
    expect(discounts[0]!.subjectId).toBe(fixtures.discountSaleId);
  });

  it('groups the same rows by who did them', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/dashboard/operations/digest')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .expect(200);
    const cashier = (res.body as { actorUserId: string | null; total: number }[]).find(
      (d) => d.actorUserId === cashierUserId,
    );
    expect(cashier).toBeDefined();
    // Refund + adjustment + exception all trace back to the cashier.
    expect(cashier!.total).toBeGreaterThanOrEqual(3);
  });

  it('honours a raised threshold — tri-state settings are read, not ignored', async () => {
    await withDb((db) =>
      db
        .update(schema.businesses)
        .set({ opsSettingsJson: { opsReview: { refundCents: 100_000 } } })
        .where(eq(schema.businesses.id, businessId)),
    );
    const raised = await readFeed();
    expect(has(raised, 'refund', fixtures.refundId)).toBe(false);

    // Null means the default, not "off" — the row comes back.
    await withDb((db) =>
      db
        .update(schema.businesses)
        .set({ opsSettingsJson: { opsReview: { refundCents: null } } })
        .where(eq(schema.businesses.id, businessId)),
    );
    expect(has(await readFeed(), 'refund', fixtures.refundId)).toBe(true);
  });
});

describe('signing off', () => {
  it('stamps ops_reviews, drops the row, and is idempotent', async () => {
    const before = await readFeed();
    expect(has(before, 'refund', fixtures.refundId)).toBe(true);

    const res = await request(app.getHttpServer())
      .post('/v1/ops-reviews/bulk')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .send({
        subjects: [{ subjectType: 'refund', subjectId: fixtures.refundId }],
        note: 'Spoke to the customer',
      })
      .expect(201);
    expect(res.body.cleared).toBe(1);
    expect(res.body.alreadyCleared).toEqual([]);

    expect(has(await readFeed(), 'refund', fixtures.refundId)).toBe(false);

    const stored = await withDb((db) =>
      db
        .select()
        .from(schema.opsReviews)
        .where(
          and(
            eq(schema.opsReviews.businessId, businessId),
            eq(schema.opsReviews.subjectId, fixtures.refundId),
          ),
        ),
    );
    expect(stored).toHaveLength(1);
    expect(stored[0]!.reviewedByUserId).toBe(opsUserId);
    expect(stored[0]!.note).toBe('Spoke to the customer');

    // Two people pressing the button on one row is a race, not an error.
    const again = await request(app.getHttpServer())
      .post('/v1/ops-reviews/bulk')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .send({ subjects: [{ subjectType: 'refund', subjectId: fixtures.refundId }] })
      .expect(201);
    expect(again.body.cleared).toBe(0);
    expect(again.body.alreadyCleared).toEqual([
      { subjectType: 'refund', subjectId: fixtures.refundId },
    ]);
  });

  it('clears a register row through exception_events, not ops_reviews', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/ops-reviews/bulk')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .send({ subjects: [{ subjectType: 'exception', subjectId: fixtures.exceptionId }] })
      .expect(201);
    expect(res.body.cleared).toBe(1);

    const [event] = await withDb((db) =>
      db
        .select()
        .from(schema.exceptionEvents)
        .where(eq(schema.exceptionEvents.id, fixtures.exceptionId)),
    );
    expect(event!.acknowledgedAt).not.toBeNull();
    expect(event!.acknowledgedByUserId).toBe(opsUserId);

    // And nothing was double-recorded in the review ledger.
    const doubles = await withDb((db) =>
      db
        .select()
        .from(schema.opsReviews)
        .where(eq(schema.opsReviews.subjectId, fixtures.exceptionId)),
    );
    expect(doubles).toHaveLength(0);

    expect(has(await readFeed(), 'exception', fixtures.exceptionId)).toBe(false);
  });

  it('clears a batch in one call and de-duplicates inside the request', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/ops-reviews/bulk')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .send({
        subjects: [
          { subjectType: 'negative_stock', subjectId: fixtures.negativeLevelId },
          { subjectType: 'negative_stock', subjectId: fixtures.negativeLevelId },
          { subjectType: 'inventory_movement', subjectId: fixtures.adjustmentMovementId },
        ],
      })
      .expect(201);
    expect(res.body.cleared).toBe(2);

    const rows = await readFeed();
    expect(has(rows, 'negative_stock', fixtures.negativeLevelId)).toBe(false);
    expect(has(rows, 'inventory_movement', fixtures.adjustmentMovementId)).toBe(false);
  });

  it('resurfaces a standing condition that recurs after its sign-off — and lets it be cleared again', async () => {
    // The negative-stock row was cleared in the batch test above. A
    // count fixes it… and a month later the same variant goes negative
    // again: same inventory_levels id, newer updatedAt. A sign-off only
    // hides what it could have seen.
    await withDb((db) =>
      db
        .update(schema.inventoryLevels)
        .set({ onHand: -5, updatedAt: new Date() })
        .where(eq(schema.inventoryLevels.id, fixtures.negativeLevelId)),
    );
    const resurfaced = await readFeed();
    expect(has(resurfaced, 'negative_stock', fixtures.negativeLevelId)).toBe(true);

    // Clearing the recurrence refreshes the existing sign-off (upsert,
    // not do-nothing) so the row actually goes away again.
    const res = await request(app.getHttpServer())
      .post('/v1/ops-reviews/bulk')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .send({
        subjects: [{ subjectType: 'negative_stock', subjectId: fixtures.negativeLevelId }],
        note: 'Recounted after the second break',
      })
      .expect(201);
    expect(res.body.alreadyCleared).toEqual([
      { subjectType: 'negative_stock', subjectId: fixtures.negativeLevelId },
    ]);
    expect(has(await readFeed(), 'negative_stock', fixtures.negativeLevelId)).toBe(false);

    const [review] = await withDb((db) =>
      db
        .select()
        .from(schema.opsReviews)
        .where(eq(schema.opsReviews.subjectId, fixtures.negativeLevelId)),
    );
    expect(review!.note).toBe('Recounted after the second break');
  });

  it('clears a discount row like any other subject', async () => {
    expect(has(await readFeed(), 'discount', fixtures.discountSaleId)).toBe(true);
    await request(app.getHttpServer())
      .post('/v1/ops-reviews/bulk')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .send({ subjects: [{ subjectType: 'discount', subjectId: fixtures.discountSaleId }] })
      .expect(201);
    expect(has(await readFeed(), 'discount', fixtures.discountSaleId)).toBe(false);
  });

  it('refuses an unknown subject type and an empty batch', async () => {
    await request(app.getHttpServer())
      .post('/v1/ops-reviews/bulk')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .send({ subjects: [{ subjectType: 'wat', subjectId: fixtures.refundId }] })
      .expect(400);
    await request(app.getHttpServer())
      .post('/v1/ops-reviews/bulk')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .send({ subjects: [] })
      .expect(400);
  });

  it('records the sign-off in the audit log', async () => {
    const rows = await withDb((db) =>
      db
        .select()
        .from(schema.auditLogs)
        .where(
          and(
            eq(schema.auditLogs.businessId, businessId),
            eq(schema.auditLogs.action, 'ops_review.clear'),
          ),
        ),
    );
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]!.actorUserId).toBe(opsUserId);
  });
});

describe('rolling the role out to a business that predates it', () => {
  it('creates Operations where it is missing, and leaves a hand-built one alone', async () => {
    const { freshId, customId } = await withDb(async (db) => {
      const [fresh] = await db
        .insert(schema.businesses)
        .values({ slug: 'ops-legacy', name: 'Legacy Co', status: 'active' })
        .returning();
      // Only an Owner role — the shape of a tenant set up before this
      // sprint.
      const owner = SYSTEM_ROLES.find((r) => r.name === 'Owner')!;
      await db.insert(schema.roles).values({
        businessId: fresh!.id,
        name: owner.name,
        description: owner.description,
        isSystem: true,
      });

      // A business that already built its own "Operations" by hand.
      const [custom] = await db
        .insert(schema.businesses)
        .values({ slug: 'ops-custom', name: 'Custom Co', status: 'active' })
        .returning();
      await db.insert(schema.roles).values({
        businessId: custom!.id,
        name: 'Operations',
        description: 'Hand-built by the owner',
        isSystem: false,
      });
      return { freshId: fresh!.id, customId: custom!.id };
    });

    const previous = process.env.SYSTEM_ROLE_SYNC;
    process.env.SYSTEM_ROLE_SYNC = '1';
    try {
      await app.get(SystemRoleSyncService).onModuleInit();
    } finally {
      if (previous === undefined) delete process.env.SYSTEM_ROLE_SYNC;
      else process.env.SYSTEM_ROLE_SYNC = previous;
    }

    const rows = await withDb((db) =>
      db.select().from(schema.roles).where(eq(schema.roles.name, 'Operations')),
    );
    const fresh = rows.find((r) => r.businessId === freshId);
    expect(fresh).toBeDefined();
    expect(fresh!.isSystem).toBe(true);

    const granted = await withDb((db) =>
      db.select().from(schema.rolePermissions).where(eq(schema.rolePermissions.roleId, fresh!.id)),
    );
    expect(granted.map((g) => g.permission)).toContain('ops.dashboard.view');

    // The hand-built one keeps its own definition — one role of that
    // name per business, and it is theirs.
    const custom = rows.filter((r) => r.businessId === customId);
    expect(custom).toHaveLength(1);
    expect(custom[0]!.isSystem).toBe(false);
    expect(custom[0]!.description).toBe('Hand-built by the owner');
  });
});

describe('the summary', () => {
  it("reports today's money in, out and net across every store", async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/dashboard/operations')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .expect(200);
    const body = res.body as {
      stores: { name: string }[];
      money: { inCents: number; outCents: number; netCents: number; out: { refundsCents: number } };
      byStore: { locationName: string }[];
      ritual: { locationName: string }[];
      salesByDay: unknown[];
    };
    expect(body.stores.map((s) => s.name).sort()).toEqual(['Store A', 'Store B']);
    // The fixture sale collected $1,000; refunds today total $520 —
    // $400 + $50 on the fresh sale, $70 on the 40-day-old one (the
    // refund's own date is what counts, not its sale's).
    expect(body.money.inCents).toBe(100_000);
    expect(body.money.out.refundsCents).toBe(52_000);
    expect(body.money.netCents).toBe(body.money.inCents - body.money.outCents);
    expect(body.byStore).toHaveLength(2);
    expect(body.ritual).toHaveLength(2);
    expect(body.salesByDay).toHaveLength(14);
    // No window → today → today, echoed back for the picker.
    expect((body as { range: unknown }).range).toEqual({
      start: (body as { date: string }).date,
      end: (body as { date: string }).date,
    });

    // Owner 2026-09-02: each store carries the documents behind its
    // Written number with cost and profit; the pieces add up to the row.
    const stores = body.byStore as {
      writtenCents: number;
      writtenCount: number;
      costCents: number;
      profitCents: number;
      documents: {
        kind: string;
        number: string;
        writtenCents: number;
        merchandiseCents: number;
        costCents: number;
        profitCents: number;
      }[];
    }[];
    for (const st of stores) {
      expect(st.documents).toHaveLength(st.writtenCount);
      expect(st.documents.reduce((a, d) => a + d.writtenCents, 0)).toBe(st.writtenCents);
      expect(st.documents.reduce((a, d) => a + d.costCents, 0)).toBe(st.costCents);
      expect(st.documents.reduce((a, d) => a + d.profitCents, 0)).toBe(st.profitCents);
      for (const d of st.documents) {
        expect(['order', 'sale']).toContain(d.kind);
        expect(d.number).toMatch(/\S/);
        expect(d.profitCents).toBe(d.merchandiseCents - d.costCents);
      }
    }
    expect(stores.some((st) => st.documents.length > 0)).toBe(true);
  });

  it('scopes money and by-store to a picker window (owner 2026-09-02)', async () => {
    const wide = await request(app.getHttpServer())
      .get('/v1/dashboard/operations?start=2000-01-01&end=2099-12-31')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(wide.body.range).toEqual({ start: '2000-01-01', end: '2099-12-31' });
    // Everything the fixture ever collected is inside the wide window.
    expect(wide.body.money.out.refundsCents).toBe(52_000);
    const past = await request(app.getHttpServer())
      .get('/v1/dashboard/operations?start=2000-01-01&end=2000-01-02')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(past.body.money.inCents).toBe(0);
    expect(past.body.byStore.every((s: { writtenCount: number }) => s.writtenCount === 0)).toBe(
      true,
    );
    // A malformed window falls back to today rather than failing.
    const bad = await request(app.getHttpServer())
      .get('/v1/dashboard/operations?start=nope&end=2000-01-02')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(bad.body.range).toEqual({ start: bad.body.date, end: bad.body.date });
    // The salesperson table takes the same window.
    const none = await request(app.getHttpServer())
      .get('/v1/dashboard/operations/salespeople?start=2000-01-01&end=2000-01-02')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(none.body.every((r: { writtenCents: number }) => r.writtenCents === 0)).toBe(true);
  });

  it('attributes written business and refunds to each salesperson', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/dashboard/operations/salespeople?days=30')
      .set('Cookie', opsCookie)
      .set('x-business-id', businessId)
      .expect(200);
    const rows = res.body as { name: string; writtenCents: number; refundedCents: number }[];
    const cashier = rows.find((r) => r.name === 'Cashier');
    expect(cashier).toBeDefined();
    // $1,000 + the $700 and $900 discounted fixtures.
    expect(cashier!.writtenCents).toBe(260_000);
    expect(cashier!.refundedCents).toBe(45_000);

    // Review finding: an associate with NO written business in the
    // window but a fresh refund must still get a row — that outlier is
    // what the table exists to expose.
    const manager = rows.find((r) => r.name === 'Manager');
    expect(manager).toBeDefined();
    expect(manager!.writtenCents).toBe(0);
    expect(manager!.refundedCents).toBe(7_000);
  });

  it('is open to a Manager too — Operations is a lens, not a lock', async () => {
    await request(app.getHttpServer())
      .get('/v1/dashboard/operations')
      .set('Cookie', managerCookie)
      .set('x-business-id', businessId)
      .expect(200);
  });
});
