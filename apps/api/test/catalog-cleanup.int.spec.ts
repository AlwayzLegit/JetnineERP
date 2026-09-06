/**
 * Shopify listings cleanup (owner ask 2026-09-06, A18): the report lists
 * the Shopify-shaped products with what references them and a proposed
 * STORIS listing per line; the sheets round-trip; apply re-points lines
 * (moving reservations and, when asked, stock) and retires listings,
 * with every step audited and a dry run that writes nothing.
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
  process.env.CATALOG_CLEANUP_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_catalog_cleanup';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'CleanupPass!2026x';

let app: INestApplication;
let businessId = '';
let locationId = '';
let ownerCookie = '';
let cashierCookie = '';
const variantBySku = new Map<string, string>();
const productBySku = new Map<string, string>();
const ids = {
  registerSale: '',
  registerLine: '',
  importedSale: '',
  importedLine: '',
  order: '',
  orderLine: '',
};

const SHOPIFY_CK = 'HELIX-SLEEP-CORE-COLLECTION-TWILIGHT-FIRM-2E42E3C9';
const SHOPIFY_Q_MID = 'HELIX-SLEEP-CORE-COLLECTION-MIDNIGHT-MEDIUM-77A1B2C3';
const SHOPIFY_PILLOW = 'HELIX-PILLOW-STD';
const STORIS_CK = 'HEXELITETW-FP-7284';
const STORIS_Q_TW = 'HEXELITETW-FP-5060';
const STORIS_Q_MID = 'HEXMID-Q';
const STORIS_Q_DUSK = 'HEXELITEDU-FP-5060';

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
      .values({ slug: 'cleanup-test', name: 'Cleanup Test Co', status: 'active' })
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
    for (const [email, role] of [
      ['owner@cleanup-test.local', 'Owner'],
      ['cashier@cleanup-test.local', 'Cashier'],
    ] as const) {
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
    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Koreatown', timezone: 'America/Los_Angeles' })
      .returning();
    locationId = loc!.id;
    const [helix] = await db
      .insert(schema.brands)
      .values({ businessId, name: 'HELIX' })
      .returning();

    const [storisBatch] = await db
      .insert(schema.importBatches)
      .values({ businessId, entity: 'product', source: 'storis', status: 'committed' })
      .returning();
    const [shopifyBatch] = await db
      .insert(schema.importBatches)
      .values({ businessId, entity: 'product', source: 'shopify', status: 'committed' })
      .returning();

    const catalog: {
      sku: string;
      name: string;
      group?: string;
      source: 'storis' | 'shopify';
      onHand?: number;
      price: number;
    }[] = [
      {
        sku: STORIS_CK,
        name: 'CAKING TWILIGHT-ELITE FIRM',
        group: 'CAKING',
        source: 'storis',
        onHand: 2,
        price: 0,
      },
      {
        sku: STORIS_Q_TW,
        name: 'QUEEN TWILIGHT-ELITE FIRM',
        group: 'QUEEN',
        source: 'storis',
        price: 0,
      },
      {
        sku: STORIS_Q_MID,
        name: 'QUEEN MIDNIGHT MED',
        group: 'QUEEN',
        source: 'storis',
        onHand: 3,
        price: 0,
      },
      {
        sku: STORIS_Q_DUSK,
        name: 'QUEEN DUSK-ELITE MED FIRM',
        group: 'QUEEN',
        source: 'storis',
        price: 0,
      },
      {
        sku: SHOPIFY_CK,
        name: 'California King Helix Twilight 11.5" Firm Hybrid Mattress',
        source: 'shopify',
        price: 148_900,
      },
      {
        sku: SHOPIFY_Q_MID,
        name: 'Queen Helix Midnight 12" Medium Hybrid Mattress',
        source: 'shopify',
        price: 119_900,
      },
      { sku: SHOPIFY_PILLOW, name: 'Helix Pillow', source: 'shopify', price: 9_900 },
    ];
    let row = 0;
    for (const item of catalog) {
      const [p] = await db
        .insert(schema.products)
        .values({ businessId, sku: item.sku, name: item.name, brandId: helix!.id })
        .returning();
      const [v] = await db
        .insert(schema.productVariants)
        .values({
          businessId,
          productId: p!.id,
          sku: item.sku,
          attributesJson: (item.group ? { group: item.group } : null) as never,
          priceCents: item.price,
        })
        .returning();
      productBySku.set(item.sku, p!.id);
      variantBySku.set(item.sku, v!.id);
      const batch = item.source === 'storis' ? storisBatch! : shopifyBatch!;
      await db.insert(schema.importRows).values({
        businessId,
        batchId: batch.id,
        rowNumber: ++row,
        legacyId: item.sku,
        rawJson: { SKU: item.sku } as never,
        status: 'committed',
        jetnineId: p!.id,
      });
      await db.insert(schema.legacyRefs).values({
        businessId,
        entity: 'product',
        legacyId: item.sku,
        jetnineId: p!.id,
        source: 'storis',
        importBatchId: batch.id,
      });
      if (item.onHand) {
        await db.insert(schema.inventoryLevels).values({
          businessId,
          variantId: v!.id,
          locationId,
          onHand: item.onHand,
        });
      }
    }

    const [cust] = await db
      .insert(schema.customers)
      .values({ businessId, firstName: 'Dana', lastName: 'Buyer' })
      .returning();

    // A register sale rung on the Shopify Cal King (stock clamped at 0 by the POS).
    const [sale] = await db
      .insert(schema.sales)
      .values({
        businessId,
        locationId,
        number: 'INV-CL-001',
        status: 'completed',
        customerId: cust!.id,
        subtotalCents: 148_900,
        totalCents: 148_900,
        completedAt: new Date('2026-09-04T18:00:00Z'),
      })
      .returning();
    ids.registerSale = sale!.id;
    const [sl] = await db
      .insert(schema.saleLines)
      .values({
        businessId,
        saleId: sale!.id,
        variantId: variantBySku.get(SHOPIFY_CK)!,
        description: 'California King Helix Twilight 11.5" Firm Hybrid Mattress',
        quantity: 1,
        unitPriceCents: 148_900,
        totalCents: 148_900,
      })
      .returning();
    ids.registerLine = sl!.id;
    await db.insert(schema.inventoryLevels).values({
      businessId,
      variantId: variantBySku.get(SHOPIFY_CK)!,
      locationId,
      onHand: 0,
    });
    await db.insert(schema.inventoryMovements).values({
      businessId,
      variantId: variantBySku.get(SHOPIFY_CK)!,
      locationId,
      delta: -1,
      reason: 'sale',
      referenceType: 'sale',
      referenceId: sale!.id,
    });

    // A STORIS-imported sale that happens to sit on the Shopify listing (history only).
    const [imp] = await db
      .insert(schema.sales)
      .values({
        businessId,
        locationId,
        number: 'INV-CL-LEGACY',
        status: 'completed',
        subtotalCents: 100_000,
        totalCents: 100_000,
        completedAt: new Date('2026-06-01T18:00:00Z'),
        importedAt: new Date('2026-08-25T00:00:00Z'),
      })
      .returning();
    ids.importedSale = imp!.id;
    const [il] = await db
      .insert(schema.saleLines)
      .values({
        businessId,
        saleId: imp!.id,
        variantId: variantBySku.get(SHOPIFY_CK)!,
        description: 'CAKING TWILIGHT-ELITE FIRM',
        quantity: 1,
        unitPriceCents: 100_000,
        totalCents: 100_000,
      })
      .returning();
    ids.importedLine = il!.id;

    // An open order reserving the Shopify Queen Midnight.
    const [order] = await db
      .insert(schema.orders)
      .values({
        businessId,
        locationId,
        number: 'SO-CL-001',
        status: 'open',
        customerId: cust!.id,
        subtotalCents: 119_900,
        totalCents: 119_900,
        createdAt: new Date('2026-09-03T18:00:00Z'),
      })
      .returning();
    ids.order = order!.id;
    const [ol] = await db
      .insert(schema.orderLines)
      .values({
        businessId,
        orderId: order!.id,
        variantId: variantBySku.get(SHOPIFY_Q_MID)!,
        description: 'Queen Helix Midnight 12" Medium Hybrid Mattress',
        quantity: 1,
        qtyReserved: 1,
        unitPriceCents: 119_900,
        totalCents: 119_900,
      })
      .returning();
    ids.orderLine = ol!.id;
    await db.insert(schema.inventoryLevels).values({
      businessId,
      variantId: variantBySku.get(SHOPIFY_Q_MID)!,
      locationId,
      onHand: 0,
      reserved: 1,
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

interface Proposal {
  productId: string;
  variantId: string;
  sku: string | null;
  name: string;
  score: number;
}
interface Report {
  products: {
    id: string;
    sku: string | null;
    name: string;
    isActive: boolean;
    source: string | null;
    reasons: string[];
    onHand: number;
    reserved: number;
    saleLines: number;
    orderLines: number;
    otherRefs: number;
    proposed: Proposal | null;
    alternates: Proposal[];
    action: string;
  }[];
  lines: {
    doc: string;
    lineId: string;
    number: string;
    imported: boolean;
    customer: string | null;
    sku: string | null;
    proposed: Proposal | null;
    stockAdjustSuggested: boolean;
    qtyReserved: number;
  }[];
  counts: Record<string, number | boolean>;
  lastInventoryImportAt: string | null;
}

async function getReport(cookie = ownerCookie): Promise<Report> {
  const res = await request(app.getHttpServer())
    .get('/v1/products/cleanup/shopify')
    .set('Cookie', cookie)
    .set('x-business-id', businessId)
    .expect(200);
  return res.body as Report;
}

async function level(sku: string) {
  return withDb(async (db) => {
    const [row] = await db
      .select({ onHand: schema.inventoryLevels.onHand, reserved: schema.inventoryLevels.reserved })
      .from(schema.inventoryLevels)
      .where(
        and(
          eq(schema.inventoryLevels.variantId, variantBySku.get(sku)!),
          eq(schema.inventoryLevels.locationId, locationId),
        ),
      );
    return row ?? { onHand: 0, reserved: 0 };
  });
}

beforeAll(async () => {
  await resetTestDb();
  await seed();
  process.env.DATABASE_URL = TEST_DB_URL;
  process.env.BETTER_AUTH_URL ??= 'http://localhost';
  process.env.BETTER_AUTH_SECRET ??= 'cleanup-test-secret-cleanup-test-secret';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();
  ownerCookie = await captureCookie('owner@cleanup-test.local');
  cashierCookie = await captureCookie('cashier@cleanup-test.local');
}, 180_000);

afterAll(async () => {
  if (app) await app.close();
});

describe('Shopify listings cleanup — report', () => {
  it('lists the Shopify-shaped products with their references and a proposed STORIS listing', async () => {
    const r = await getReport();
    expect(r.products.map((p) => p.sku).sort()).toEqual(
      [SHOPIFY_CK, SHOPIFY_PILLOW, SHOPIFY_Q_MID].sort(),
    );
    const ck = r.products.find((p) => p.sku === SHOPIFY_CK)!;
    expect(ck.source).toBe('shopify');
    expect(ck.reasons).toEqual(['lowercase_name', 'connector_import']);
    expect(ck.saleLines).toBe(2);
    expect(ck.orderLines).toBe(0);
    expect(ck.proposed).toMatchObject({ sku: STORIS_CK, name: 'CAKING TWILIGHT-ELITE FIRM' });
    expect(ck.proposed!.score).toBeGreaterThanOrEqual(0.7);
    // Never a Queen for a Cal King, never the Dusk for a Twilight.
    expect(ck.alternates.map((a) => a.sku)).not.toContain(STORIS_Q_TW);
    expect(ck.action).toBe('relink');

    const mid = r.products.find((p) => p.sku === SHOPIFY_Q_MID)!;
    expect(mid.proposed).toMatchObject({ sku: STORIS_Q_MID });
    expect(mid.reserved).toBe(1);
    expect(mid.action).toBe('relink');

    const pillow = r.products.find((p) => p.sku === SHOPIFY_PILLOW)!;
    expect(pillow.proposed).toBeNull();
    expect(pillow.action).toBe('delete');

    expect(r.counts).toMatchObject({ products: 3, withProposal: 2, saleLines: 2, orderLines: 1 });
  });

  it('lists every sale and order line on those listings, register sales first', async () => {
    const r = await getReport();
    expect(r.lines.map((l) => [l.doc, l.number])).toEqual([
      ['sale', 'INV-CL-001'],
      ['order', 'SO-CL-001'],
      ['sale', 'INV-CL-LEGACY'],
    ]);
    const reg = r.lines.find((l) => l.number === 'INV-CL-001')!;
    expect(reg).toMatchObject({
      imported: false,
      customer: 'Dana Buyer',
      sku: SHOPIFY_CK,
      stockAdjustSuggested: true,
    });
    expect(reg.proposed!.sku).toBe(STORIS_CK);
    const legacy = r.lines.find((l) => l.number === 'INV-CL-LEGACY')!;
    expect(legacy).toMatchObject({ imported: true, stockAdjustSuggested: false });
    const ord = r.lines.find((l) => l.doc === 'order')!;
    expect(ord).toMatchObject({ qtyReserved: 1, stockAdjustSuggested: false });
    expect(ord.proposed!.sku).toBe(STORIS_Q_MID);
  });

  it('serves both review sheets as CSV', async () => {
    const lines = await request(app.getHttpServer())
      .get('/v1/products/cleanup/shopify.csv?sheet=lines')
      .set('Cookie', ownerCookie)
      .set('x-business-id', businessId)
      .expect(200);
    expect(lines.headers['content-type']).toContain('text/csv');
    expect(lines.headers['content-disposition']).toContain('shopify-cleanup-lines-');
    const rows = lines.text.split('\r\n');
    expect(rows[0]).toBe(
      'line_id,doc,number,date,status,imported,customer,qty,unit_price,current_sku,current_name,proposed_sku,proposed_name,confidence,alternates,adjust_stock,confirm,override_sku',
    );
    expect(rows).toHaveLength(4);
    expect(rows[1]).toContain('INV-CL-001');
    expect(rows[1]).toContain(STORIS_CK);
    expect(rows[1]).toContain('1489.00');

    const products = await request(app.getHttpServer())
      .get('/v1/products/cleanup/shopify.csv?sheet=products')
      .set('Cookie', ownerCookie)
      .set('x-business-id', businessId)
      .expect(200);
    const prows = products.text.split('\r\n');
    expect(prows[0]).toBe(
      'product_id,sku,name,source,active,on_hand,reserved,sale_lines,order_lines,other_refs,proposed_sku,proposed_name,confidence,action,confirm',
    );
    expect(prows).toHaveLength(4);
    expect(prows.some((r) => r.includes(SHOPIFY_PILLOW) && r.endsWith(',delete,'))).toBe(true);
  });

  it('a cashier can read the report but not apply', async () => {
    await getReport(cashierCookie);
    await request(app.getHttpServer())
      .post('/v1/products/cleanup/shopify/apply')
      .set('Cookie', cashierCookie)
      .set('x-business-id', businessId)
      .send({ lines: [{ doc: 'sale', lineId: ids.registerLine, toSku: STORIS_CK }] })
      .expect(403);
  });
});

describe('Shopify listings cleanup — apply', () => {
  it('a dry run reports what would change and writes nothing', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/products/cleanup/shopify/apply')
      .set('Cookie', ownerCookie)
      .set('x-business-id', businessId)
      .send({
        dryRun: true,
        lines: [{ doc: 'sale', lineId: ids.registerLine, toSku: STORIS_CK, adjustStock: true }],
        products: [{ productId: productBySku.get(SHOPIFY_PILLOW), action: 'delete' }],
      })
      .expect(201);
    expect(res.body.dryRun).toBe(true);
    expect(res.body.lines[0]).toMatchObject({
      ok: true,
      message: 'would relink',
      from: { sku: SHOPIFY_CK },
      to: { sku: STORIS_CK, description: 'CAKING TWILIGHT-ELITE FIRM' },
      stockMoved: 1,
    });
    expect(res.body.products[0]).toMatchObject({
      ok: true,
      message: `would delete ${SHOPIFY_PILLOW}`,
    });
    const [line] = await withDb((db) =>
      db.select().from(schema.saleLines).where(eq(schema.saleLines.id, ids.registerLine)),
    );
    expect(line!.variantId).toBe(variantBySku.get(SHOPIFY_CK));
    expect(await level(STORIS_CK)).toEqual({ onHand: 2, reserved: 0 });
  });

  it('refuses to delete a listing that is still referenced, and a target that is itself Shopify-shaped', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/products/cleanup/shopify/apply')
      .set('Cookie', ownerCookie)
      .set('x-business-id', businessId)
      .send({
        products: [{ productId: productBySku.get(SHOPIFY_CK), action: 'delete' }],
        lines: [{ doc: 'order', lineId: ids.orderLine, toSku: SHOPIFY_CK }],
      })
      .expect(201);
    expect(res.body.products[0].ok).toBe(false);
    expect(res.body.products[0].message).toContain('2 sale lines');
    expect(res.body.lines[0].ok).toBe(false);
    expect(res.body.lines[0].message).toContain('Shopify-shaped');
    expect(res.body.summary).toMatchObject({ linesFailed: 1, productsFailed: 1 });
  });

  it('relinks a register sale line, moving its stock to the right listing', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/products/cleanup/shopify/apply')
      .set('Cookie', ownerCookie)
      .set('x-business-id', businessId)
      .send({
        lines: [
          {
            doc: 'sale',
            lineId: ids.registerLine,
            toSku: STORIS_CK.toLowerCase(),
            adjustStock: true,
          },
          {
            doc: 'sale',
            lineId: ids.importedLine,
            toVariantId: variantBySku.get(STORIS_CK),
            adjustStock: true,
          },
        ],
      })
      .expect(201);
    expect(res.body.summary).toMatchObject({ linesRelinked: 2, linesFailed: 0 });
    // Imported history never moves stock, whatever the flag says.
    expect(res.body.lines[1]).toMatchObject({ ok: true, stockMoved: 0 });

    const [line] = await withDb((db) =>
      db.select().from(schema.saleLines).where(eq(schema.saleLines.id, ids.registerLine)),
    );
    expect(line!.variantId).toBe(variantBySku.get(STORIS_CK));
    expect(line!.description).toBe('CAKING TWILIGHT-ELITE FIRM');
    expect(line!.unitPriceCents).toBe(148_900);
    expect(await level(STORIS_CK)).toEqual({ onHand: 1, reserved: 0 });
    expect(await level(SHOPIFY_CK)).toEqual({ onHand: 1, reserved: 0 });

    const moves = await withDb((db) =>
      db
        .select()
        .from(schema.inventoryMovements)
        .where(eq(schema.inventoryMovements.referenceType, 'listing_relink')),
    );
    expect(
      moves
        .map((m) => [m.variantId === variantBySku.get(STORIS_CK) ? 'storis' : 'shopify', m.delta])
        .sort(),
    ).toEqual([
      ['shopify', 1],
      ['storis', -1],
    ]);
    const audits = await withDb((db) =>
      db.select().from(schema.auditLogs).where(eq(schema.auditLogs.action, 'sale_line.relink')),
    );
    expect(audits).toHaveLength(2);
    const changes = audits.find((a) => a.targetId === ids.registerSale)!.changesJson as {
      before: { sku: string };
      after: { sku: string; stockMoved: number };
    };
    expect(changes.before.sku).toBe(SHOPIFY_CK);
    expect(changes.after).toMatchObject({ sku: STORIS_CK, stockMoved: 1 });

    // The lines have left the listing: the report now shows it unreferenced by documents.
    const r = await getReport();
    expect(r.products.find((p) => p.sku === SHOPIFY_CK)).toMatchObject({ saleLines: 0, onHand: 1 });
    expect(r.lines.map((l) => l.number)).toEqual(['SO-CL-001']);
  });

  it('relinks an open order line and carries its reservation across', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/products/cleanup/shopify/apply')
      .set('Cookie', ownerCookie)
      .set('x-business-id', businessId)
      .send({ lines: [{ doc: 'order', lineId: ids.orderLine, toSku: STORIS_Q_MID }] })
      .expect(201);
    expect(res.body.lines[0]).toMatchObject({ ok: true, reservationMoved: 1, stockMoved: 0 });
    const [line] = await withDb((db) =>
      db.select().from(schema.orderLines).where(eq(schema.orderLines.id, ids.orderLine)),
    );
    expect(line!.variantId).toBe(variantBySku.get(STORIS_Q_MID));
    expect(line!.description).toBe('QUEEN MIDNIGHT MED');
    expect(line!.qtyReserved).toBe(1);
    expect(await level(STORIS_Q_MID)).toEqual({ onHand: 3, reserved: 1 });
    expect(await level(SHOPIFY_Q_MID)).toEqual({ onHand: 0, reserved: 0 });
    const moves = await withDb((db) =>
      db
        .select({
          reason: schema.inventoryMovements.reason,
          delta: schema.inventoryMovements.delta,
        })
        .from(schema.inventoryMovements)
        .where(eq(schema.inventoryMovements.referenceId, ids.order)),
    );
    expect(moves.map((m) => `${m.reason}:${m.delta}`).sort()).toEqual([
      'order_release:0',
      'order_reserve:0',
    ]);
    const audits = await withDb((db) =>
      db.select().from(schema.auditLogs).where(eq(schema.auditLogs.action, 'order_line.relink')),
    );
    expect(audits).toHaveLength(1);
  });

  it('retires the listings: deletes the unreferenced one (legacy ref included), deactivates the rest', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/products/cleanup/shopify/apply')
      .set('Cookie', ownerCookie)
      .set('x-business-id', businessId)
      .send({
        products: [
          { productId: productBySku.get(SHOPIFY_PILLOW), action: 'delete' },
          { productId: productBySku.get(SHOPIFY_CK), action: 'delete' },
          { productId: productBySku.get(SHOPIFY_CK), action: 'deactivate' },
          { productId: productBySku.get(SHOPIFY_Q_MID), action: 'deactivate' },
        ],
      })
      .expect(201);
    expect(res.body.products.map((p: { ok: boolean }) => p.ok)).toEqual([true, false, true, true]);
    // The Cal King still holds the unit the relink handed back — deactivate, never delete.
    expect(res.body.products[1].message).toContain('1 on hand');

    const gone = await withDb((db) =>
      db
        .select()
        .from(schema.products)
        .where(eq(schema.products.id, productBySku.get(SHOPIFY_PILLOW)!)),
    );
    expect(gone).toHaveLength(0);
    const refs = await withDb((db) =>
      db
        .select()
        .from(schema.legacyRefs)
        .where(eq(schema.legacyRefs.jetnineId, productBySku.get(SHOPIFY_PILLOW)!)),
    );
    expect(refs).toHaveLength(0);
    const r = await getReport();
    expect(r.products.map((p) => [p.sku, p.isActive]).sort()).toEqual([
      [SHOPIFY_Q_MID, false],
      [SHOPIFY_CK, false],
    ]);
    const deactivations = await withDb((db) =>
      db.select().from(schema.auditLogs).where(eq(schema.auditLogs.action, 'product.deactivate')),
    );
    expect(deactivations).toHaveLength(2);
  });

  it('validates the body', async () => {
    await request(app.getHttpServer())
      .post('/v1/products/cleanup/shopify/apply')
      .set('Cookie', ownerCookie)
      .set('x-business-id', businessId)
      .send({})
      .expect(400);
    await request(app.getHttpServer())
      .post('/v1/products/cleanup/shopify/apply')
      .set('Cookie', ownerCookie)
      .set('x-business-id', businessId)
      .send({ lines: [{ doc: 'sale', lineId: ids.registerLine }] })
      .expect(400);
  });
});
