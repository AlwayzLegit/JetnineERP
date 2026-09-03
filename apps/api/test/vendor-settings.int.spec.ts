/**
 * Advanced Vendor Settings (owner 2026-09-02, STORIS): the four tabs —
 * General (vendor master), Shipping (landed-cost lines), PO Cutting Date
 * (collection exceptions) and Auto PO Replen (the replenishment document
 * with the STORIS average-units periods and sort criteria) — and what
 * they do to purchase orders: active landed-cost lines default a new
 * PO's freight; a collection past its cutting date cannot be ordered or
 * placed.
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
import type { AdvancedVendorSettings } from '../src/purchasing/vendors.controller';

const TEST_DB_URL =
  process.env.VENDOR_SETTINGS_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_vendor_settings';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'VendorPass!2026x';

let app: INestApplication;
let businessId = '';
let locationId = '';
let vendorId = '';
let otherVendorId = '';
let cobaltCollectionId = '';
let smokeyCollectionId = '';
let cobaltVariantId = '';
let smokeyVariantId = '';
let plainVariantId = '';
let ownerCookie = '';
let cashierCookie = '';

const isoDay = (offsetDays: number) =>
  new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);

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
      .values({ slug: 'vendor-test', name: 'Vendor Test Co', status: 'active' })
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
    async function makeUser(email: string, role: string) {
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
    await makeUser('owner@vendor-test.local', 'Owner');
    await makeUser('cashier@vendor-test.local', 'Cashier');

    const [loc] = await db
      .insert(schema.locations)
      .values({
        businessId,
        name: 'Main Warehouse',
        timezone: 'America/Los_Angeles',
        locationType: 'warehouse',
      })
      .returning();
    locationId = loc!.id;

    const [vendor] = await db
      .insert(schema.vendors)
      .values({ businessId, name: 'Southerland Mattress', email: 'orders@southerland.test' })
      .returning();
    vendorId = vendor!.id;
    const [other] = await db
      .insert(schema.vendors)
      .values({ businessId, name: 'Other Vendor' })
      .returning();
    otherVendorId = other!.id;

    const cols = await db
      .insert(schema.collections)
      .values([
        { businessId, name: 'Cobalt', vendorId },
        { businessId, name: 'Smokey', vendorId },
      ])
      .returning();
    cobaltCollectionId = cols[0]!.id;
    smokeyCollectionId = cols[1]!.id;

    const mkVariant = async (sku: string, collectionId: string | null) => {
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku, name: `${sku} product`, collectionId })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({
          businessId,
          productId: p!.id,
          sku: `${sku}-Q`,
          priceCents: 100_000,
          costCents: 40_000,
          preferredVendorId: vendorId,
        })
        .returning();
      return v!.id;
    };
    cobaltVariantId = await mkVariant('COBALT', cobaltCollectionId);
    smokeyVariantId = await mkVariant('SMOKEY', smokeyCollectionId);
    plainVariantId = await mkVariant('PLAIN', null);
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

const agent = () => request(app.getHttpServer());
const asOwner = (r: request.Test) => r.set('Cookie', ownerCookie).set('x-business-id', businessId);
const asCashier = (r: request.Test) =>
  r.set('Cookie', cashierCookie).set('x-business-id', businessId);

beforeAll(async () => {
  await resetTestDb();
  await seed();

  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'vendor-test-secret-vendor-test-secret-x';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication();
  await app.init();

  ownerCookie = await captureCookie('owner@vendor-test.local');
  cashierCookie = await captureCookie('cashier@vendor-test.local');
}, 180_000);

afterAll(async () => {
  await app?.close();
});

describe('Advanced Vendor Settings', () => {
  it('reads the four tabs with defaults', async () => {
    const res = await asOwner(agent().get(`/v1/vendors/${vendorId}/advanced-settings`)).expect(200);
    const s = res.body as AdvancedVendorSettings;
    expect(s.vendor.name).toBe('Southerland Mattress');
    expect(s.shipping.freight).toEqual({
      active: false,
      type: 'percent',
      percent: null,
      cents: null,
      label: null,
    });
    expect(s.shipping.custom).toHaveLength(2);
    expect(s.poCuttingDates).toEqual([]);
    expect(s.replenishment).toBeNull();
    // The vendor's own collections come first in the picker.
    expect(s.collections.slice(0, 2).map((c) => c.name)).toEqual(['Cobalt', 'Smokey']);
    await asOwner(
      agent().get(`/v1/vendors/00000000-0000-0000-0000-000000000000/advanced-settings`),
    ).expect(404);
  });

  it('Shipping: validates and saves landed-cost lines; a cashier cannot', async () => {
    await asCashier(
      agent()
        .patch(`/v1/vendors/${vendorId}/shipping`)
        .send({ freight: { active: true } }),
    ).expect(403);
    // Freight is percent or dollar only.
    await asOwner(
      agent()
        .patch(`/v1/vendors/${vendorId}/shipping`)
        .send({ freight: { active: true, type: 'calculate' } }),
    ).expect(400);
    await asOwner(
      agent()
        .patch(`/v1/vendors/${vendorId}/shipping`)
        .send({ freight: { active: true, type: 'percent', percent: 150 } }),
    ).expect(400);
    await asOwner(
      agent()
        .patch(`/v1/vendors/${vendorId}/shipping`)
        .send({ custom: [{ active: true, type: 'dollar', cents: 500 }] }),
    ).expect(400); // active custom line needs a label

    const res = await asOwner(
      agent()
        .patch(`/v1/vendors/${vendorId}/shipping`)
        .send({
          freight: { active: true, type: 'percent', percent: 5.5 },
          importFee: { active: true, type: 'dollar', cents: 2_500 },
          miscFee: { active: true, type: 'calculate' },
          custom: [{ active: true, type: 'dollar', cents: 1_000, label: 'Pallet fee' }],
        }),
    ).expect(200);
    expect(res.body.shipping.freight).toMatchObject({
      active: true,
      type: 'percent',
      percent: 5.5,
    });
    expect(res.body.shipping.importFee).toMatchObject({
      active: true,
      type: 'dollar',
      cents: 2_500,
    });
    expect(res.body.shipping.custom[0]).toMatchObject({ label: 'Pallet fee', active: true });
    expect(res.body.shipping.custom[1].active).toBe(false);

    // A later partial patch keeps the other lines.
    const again = await asOwner(
      agent()
        .patch(`/v1/vendors/${vendorId}/shipping`)
        .send({ miscFee: { active: false, type: 'percent' } }),
    ).expect(200);
    expect(again.body.shipping.freight.percent).toBe(5.5);
    expect(again.body.shipping.miscFee.active).toBe(false);
  });

  it('active landed-cost lines default a new PO freight; an explicit freight wins', async () => {
    // 5.5% of $1,000 = $55, + $25 import fee + $10 pallet fee = $90.
    const po = await asOwner(
      agent()
        .post('/v1/purchase-orders')
        .send({
          vendorId,
          locationId,
          place: false,
          lines: [{ variantId: plainVariantId, quantity: 2, unitCostCents: 50_000 }],
        }),
    ).expect(201);
    expect(po.body.freightCents).toBe(5_500 + 2_500 + 1_000);

    const explicit = await asOwner(
      agent()
        .post('/v1/purchase-orders')
        .send({
          vendorId,
          locationId,
          place: false,
          freightCents: 0,
          lines: [{ variantId: plainVariantId, quantity: 1, unitCostCents: 50_000 }],
        }),
    ).expect(201);
    expect(explicit.body.freightCents).toBe(0);

    const none = await asOwner(
      agent()
        .post('/v1/purchase-orders')
        .send({
          vendorId: otherVendorId,
          locationId,
          place: false,
          lines: [{ variantId: plainVariantId, quantity: 1, unitCostCents: 50_000 }],
        }),
    ).expect(201);
    expect(none.body.freightCents).toBeNull();
  });

  it('PO Cutting Date: replaces the collection exceptions', async () => {
    await asOwner(
      agent()
        .put(`/v1/vendors/${vendorId}/po-cutting-dates`)
        .send({ rows: [{ collectionId: cobaltCollectionId, cuttingDate: 'nope' }] }),
    ).expect(400);
    await asOwner(
      agent()
        .put(`/v1/vendors/${vendorId}/po-cutting-dates`)
        .send({
          rows: [{ collectionId: '00000000-0000-0000-0000-000000000000', cuttingDate: isoDay(1) }],
        }),
    ).expect(404);
    await asOwner(
      agent()
        .put(`/v1/vendors/${vendorId}/po-cutting-dates`)
        .send({
          rows: [
            { collectionId: cobaltCollectionId, cuttingDate: isoDay(1) },
            { collectionId: cobaltCollectionId, cuttingDate: isoDay(2) },
          ],
        }),
    ).expect(400);

    const res = await asOwner(
      agent()
        .put(`/v1/vendors/${vendorId}/po-cutting-dates`)
        .send({
          rows: [
            { collectionId: smokeyCollectionId, cuttingDate: isoDay(-1), notes: 'Discontinued' },
            { collectionId: cobaltCollectionId, cuttingDate: isoDay(30) },
          ],
        }),
    ).expect(200);
    expect(
      res.body.poCuttingDates.map((r: { collectionName: string; cuttingDate: string }) => [
        r.collectionName,
        r.cuttingDate,
      ]),
    ).toEqual([
      ['Cobalt', isoDay(30)],
      ['Smokey', isoDay(-1)],
    ]);
    const read = await asOwner(agent().get(`/v1/vendors/${vendorId}/advanced-settings`)).expect(
      200,
    );
    expect(read.body.poCuttingDates).toHaveLength(2);
    expect(read.body.poCuttingDates[1].notes).toBe('Discontinued');
  });

  it('a collection past its cutting date cannot be ordered or placed', async () => {
    const blocked = await asOwner(
      agent()
        .post('/v1/purchase-orders')
        .send({
          vendorId,
          locationId,
          lines: [
            { variantId: smokeyVariantId, quantity: 1, unitCostCents: 40_000 },
            { variantId: cobaltVariantId, quantity: 1, unitCostCents: 40_000 },
          ],
        }),
    ).expect(400);
    expect(blocked.body.message).toContain('Smokey');
    expect(blocked.body.message).toContain(isoDay(-1));
    expect(blocked.body.message).not.toContain('Cobalt (cut');

    // Cobalt cuts in 30 days: fine today.
    const draft = await asOwner(
      agent()
        .post('/v1/purchase-orders')
        .send({
          vendorId,
          locationId,
          place: false,
          lines: [{ variantId: cobaltVariantId, quantity: 1, unitCostCents: 40_000 }],
        }),
    ).expect(201);

    // Move Cobalt's cutting date into the past: the draft can no longer be placed.
    await asOwner(
      agent()
        .put(`/v1/vendors/${vendorId}/po-cutting-dates`)
        .send({ rows: [{ collectionId: cobaltCollectionId, cuttingDate: isoDay(-2) }] }),
    ).expect(200);
    const place = await asOwner(agent().post(`/v1/purchase-orders/${draft.body.id}/place`)).expect(
      400,
    );
    expect(place.body.message).toContain('Cobalt');

    // Another vendor is not bound by this vendor's cutting dates.
    await asOwner(
      agent()
        .post('/v1/purchase-orders')
        .send({
          vendorId: otherVendorId,
          locationId,
          place: false,
          lines: [{ variantId: cobaltVariantId, quantity: 1, unitCostCents: 40_000 }],
        }),
    ).expect(201);

    // Clear the exceptions and the draft places.
    await asOwner(
      agent().put(`/v1/vendors/${vendorId}/po-cutting-dates`).send({ rows: [] }),
    ).expect(200);
    await asOwner(agent().post(`/v1/purchase-orders/${draft.body.id}/place`)).expect(201);
  });

  it('Auto PO Replen: stores the average-units periods and sort criteria', async () => {
    await asOwner(
      agent()
        .patch(`/v1/purchasing/replenishment/vendors/${vendorId}/settings`)
        .send({ firstAverageUnitsPeriodWeeks: 0 }),
    ).expect(400);
    const res = await asOwner(
      agent()
        .patch(`/v1/purchasing/replenishment/vendors/${vendorId}/settings`)
        .send({
          generateAutomaticPos: true,
          automaticallyHoldPos: true,
          weeklySalesRateWeeks: 4,
          daysForReplenishment: 10,
          firstAverageUnitsPeriodWeeks: 4,
          secondAverageUnitsPeriodWeeks: 12,
          sortCriteria: 'category',
          buildDays: [1, 3],
          minimumStockDays: 14,
          leadDays: 21,
        }),
    ).expect(200);
    expect(res.body.settings).toMatchObject({
      firstAverageUnitsPeriodWeeks: 4,
      secondAverageUnitsPeriodWeeks: 12,
      sortCriteria: 'category',
      buildDays: [1, 3],
    });
    const bogus = await asOwner(
      agent()
        .patch(`/v1/purchasing/replenishment/vendors/${vendorId}/settings`)
        .send({ sortCriteria: 'bogus' }),
    ).expect(200);
    // Unknown sort falls back to the STORIS default.
    expect(bogus.body.settings.sortCriteria).toBe('vendor_model');
    const read = await asOwner(agent().get(`/v1/vendors/${vendorId}/advanced-settings`)).expect(
      200,
    );
    expect(read.body.replenishment.firstAverageUnitsPeriodWeeks).toBe(4);
  });
});
