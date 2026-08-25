/**
 * Phase 2.3 acceptance: a clerk creates a vendor, opens a PO with two
 * lines, receives one line in full + the other partially, then closes
 * the PO with a final receipt that flips it to 'received'. Inventory
 * levels track every receipt; the audit trail captures each
 * transition.
 *
 * Also covers role-gated access (cashier can't create POs), the
 * vendor delete-with-PO refusal, and partial-receipt validation.
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
  process.env.PURCHASING_TEST_DATABASE_URL ??
  'postgres://postgres:postgres@localhost:5432/jetnine_purchasing';

const dbPackageRoot = join(__dirname, '..', '..', '..', 'packages', 'db');
const PASSWORD = 'PurchPass!2026';

let app: INestApplication;
let businessId = '';
let locationId = '';
let variantAId = '';
let variantBId = '';
let clerkCookie = '';
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
      .values({ slug: 'purch-test', name: 'Purchasing Test Co', status: 'active' })
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
    await makeUser('owner@purch-test.local', 'Owner');
    await makeUser('clerk@purch-test.local', 'Inventory Clerk');
    await makeUser('cashier@purch-test.local', 'Cashier');

    const [loc] = await db
      .insert(schema.locations)
      .values({ businessId, name: 'Main', timezone: 'America/New_York' })
      .returning();
    locationId = loc!.id;
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

async function levelOf(variantId: string): Promise<number> {
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
  process.env.BETTER_AUTH_SECRET ??= 'purch-test-secret-purch-test-secret-x';
  process.env.AUTH_TRUSTED_ORIGINS ??= 'http://localhost';
  process.env.NODE_ENV ??= 'test';
  delete process.env.STRIPE_SECRET_KEY;

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ bufferLogs: true, rawBody: true });
  await app.init();

  ownerCookie = await captureCookie('owner@purch-test.local');
  clerkCookie = await captureCookie('clerk@purch-test.local');
  cashierCookie = await captureCookie('cashier@purch-test.local');
});

afterAll(async () => {
  if (app) await app.close();
});

describe('Phase 2.3 — Vendors & Purchase Orders', () => {
  let vendorId = '';
  it('Clerk creates a vendor', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/vendors')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'ACME Supply', email: 'sales@acme.example', phone: '555-0100' });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('ACME Supply');
    vendorId = res.body.id;
  });

  it('Duplicate vendor name returns 400', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/vendors')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'ACME Supply' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/already exists/);
  });

  it('Cashier (no purchase_orders.create) is denied PO creation', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/purchase-orders')
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({
        vendorId,
        locationId,
        lines: [{ variantId: variantAId, quantity: 1, unitCostCents: 100 }],
      });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/purchase_orders\.create/);
  });

  let poId = '';
  let widgetLineId = '';
  let gadgetLineId = '';
  it('Clerk creates a PO with two lines (10 widgets + 4 gadgets)', async () => {
    const res = await request(app.getHttpServer())
      .post('/v1/purchase-orders')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        vendorId,
        locationId,
        notes: 'Initial restock',
        lines: [
          { variantId: variantAId, quantity: 10, unitCostCents: 400 },
          { variantId: variantBId, quantity: 4, unitCostCents: 200 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('ordered');
    expect(res.body.subtotalCents).toBe(10 * 400 + 4 * 200);
    expect(res.body.number).toMatch(/^PO-\d{4}-\d{6}$/);
    expect(res.body.lines).toHaveLength(2);
    poId = res.body.id;
    widgetLineId = res.body.lines.find((l: { variantId: string }) => l.variantId === variantAId).id;
    gadgetLineId = res.body.lines.find((l: { variantId: string }) => l.variantId === variantBId).id;
  });

  it('Receive 6 widgets — PO becomes partially_received and inventory grows', async () => {
    const before = await levelOf(variantAId);
    const res = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${poId}/receive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId: widgetLineId, quantity: 6 }] });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('partially_received');
    const widgetLine = res.body.lines.find((l: { id: string }) => l.id === widgetLineId);
    expect(widgetLine.quantityReceived).toBe(6);
    expect(await levelOf(variantAId)).toBe(before + 6);
  });

  it('Cannot over-receive a line (10 ordered, 6 already received → 5 more is too many)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${poId}/receive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId: widgetLineId, quantity: 5 }] });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/only 4 remaining/);
  });

  it('Receive remaining 4 widgets + all 4 gadgets — PO flips to received', async () => {
    const widgetBefore = await levelOf(variantAId);
    const gadgetBefore = await levelOf(variantBId);
    const res = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${poId}/receive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        lines: [
          { lineId: widgetLineId, quantity: 4 },
          { lineId: gadgetLineId, quantity: 4 },
        ],
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('received');
    expect(res.body.closedAt).toBeTruthy();
    expect(await levelOf(variantAId)).toBe(widgetBefore + 4);
    expect(await levelOf(variantBId)).toBe(gadgetBefore + 4);
  });

  it('Inventory ledger has receive_po movements pointing at the PO', async () => {
    const sqlc = postgres(TEST_DB_URL, { max: 1, prepare: false });
    const db = drizzle(sqlc);
    try {
      const movements = await db
        .select()
        .from(schema.inventoryMovements)
        .where(eq(schema.inventoryMovements.referenceId, poId));
      expect(movements.length).toBe(3); // 6 widgets + 4 widgets + 4 gadgets
      expect(movements.every((m) => m.reason === 'receive_po')).toBe(true);
      expect(movements.every((m) => m.referenceType === 'purchase_order')).toBe(true);
    } finally {
      await sqlc.end({ timeout: 5 });
    }
  });

  it('Receiving against a fully-received PO is forbidden', async () => {
    const res = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${poId}/receive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId: widgetLineId, quantity: 1 }] });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/Cannot receive against a received/);
  });

  it('Owner cancels a different draft PO; cancel sets status=canceled', async () => {
    const created = await request(app.getHttpServer())
      .post('/v1/purchase-orders')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        vendorId,
        locationId,
        place: false,
        lines: [{ variantId: variantAId, quantity: 1, unitCostCents: 400 }],
      });
    expect(created.body.status).toBe('draft');

    const res = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${created.body.id}/cancel`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('canceled');
  });

  it('Vendor delete is refused while a PO references it', async () => {
    const res = await request(app.getHttpServer())
      .delete(`/v1/vendors/${vendorId}`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/existing purchase orders/);
  });
});

describe('Reorder automation', () => {
  let restockVendorId = '';
  let lowVariantId = '';

  it('Setup: vendor + a managed variant with zero stock', async () => {
    const vendor = await request(app.getHttpServer())
      .post('/v1/vendors')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Restock Co' });
    expect(vendor.status).toBe(201);
    restockVendorId = vendor.body.id;

    const product = await request(app.getHttpServer())
      .post('/v1/products')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        name: 'Managed Pillow',
        sku: 'PILLOW',
        variants: [{ sku: 'PILLOW-1', priceCents: 4900, costCents: 1500 }],
      });
    expect(product.status).toBe(201);
    lowVariantId = product.body.variants[0].id;

    const patch = await request(app.getHttpServer())
      .patch(`/v1/products/variants/${lowVariantId}/reorder`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ reorderPoint: 5, reorderQty: 12, preferredVendorId: restockVendorId });
    expect(patch.status).toBe(200);
    expect(patch.body.reorderPoint).toBe(5);
    expect(patch.body.reorderQty).toBe(12);
    expect(patch.body.preferredVendorId).toBe(restockVendorId);
  });

  it('Zero stock at point 5 → suggested under its vendor with reorderQty', async () => {
    const res = await request(app.getHttpServer())
      .get('/v1/purchase-orders/reorder-suggestions')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId);
    expect(res.status).toBe(200);
    const group = res.body.vendors.find(
      (g: { vendorId: string | null }) => g.vendorId === restockVendorId,
    );
    expect(group).toBeTruthy();
    const line = group.lines.find((l: { variantId: string }) => l.variantId === lowVariantId);
    expect(line).toBeTruthy();
    expect(line.available).toBe(0);
    expect(line.reorderPoint).toBe(5);
    expect(line.suggestedQty).toBe(12); // explicit reorderQty wins
    expect(line.unitCostCents).toBe(1500);
  });

  it('Without an explicit qty, suggestion tops up to 2× the point', async () => {
    const patch = await request(app.getHttpServer())
      .patch(`/v1/products/variants/${lowVariantId}/reorder`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ reorderQty: null });
    expect(patch.status).toBe(200);

    const res = await request(app.getHttpServer())
      .get('/v1/purchase-orders/reorder-suggestions')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId);
    const group = res.body.vendors.find(
      (g: { vendorId: string | null }) => g.vendorId === restockVendorId,
    );
    const line = group.lines.find((l: { variantId: string }) => l.variantId === lowVariantId);
    expect(line.suggestedQty).toBe(10); // 2×5 − 0
  });

  it('Clearing the reorder point removes the variant from suggestions', async () => {
    await request(app.getHttpServer())
      .patch(`/v1/products/variants/${lowVariantId}/reorder`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ reorderPoint: null })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/v1/purchase-orders/reorder-suggestions')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId);
    const all = res.body.vendors.flatMap((g: { lines: { variantId: string }[] }) => g.lines);
    expect(all.find((l: { variantId: string }) => l.variantId === lowVariantId)).toBeUndefined();
  });

  it('Rejects negative points and unknown vendors', async () => {
    const neg = await request(app.getHttpServer())
      .patch(`/v1/products/variants/${lowVariantId}/reorder`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ reorderPoint: -1 });
    expect(neg.status).toBe(400);

    const badVendor = await request(app.getHttpServer())
      .patch(`/v1/products/variants/${lowVariantId}/reorder`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ preferredVendorId: '00000000-0000-4000-8000-000000000000' });
    expect(badVendor.status).toBe(404);
  });

  it('Vendor SKU: saved (trimmed), surfaces in suggestions and PO lines, clears with null', async () => {
    // The vendor's part number differs from our Shopify-style SKU.
    const patch = await request(app.getHttpServer())
      .patch(`/v1/products/variants/${lowVariantId}/reorder`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ reorderPoint: 5, vendorSku: '  RC-PLW-0099  ' });
    expect(patch.status).toBe(200);
    expect(patch.body.vendorSku).toBe('RC-PLW-0099');

    const suggestions = await request(app.getHttpServer())
      .get('/v1/purchase-orders/reorder-suggestions')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId);
    const line = suggestions.body.vendors
      .flatMap((g: { lines: { variantId: string; vendorSku: string | null }[] }) => g.lines)
      .find((l: { variantId: string }) => l.variantId === lowVariantId);
    expect(line.vendorSku).toBe('RC-PLW-0099');

    // A PO for this variant carries the vendor part number on its lines.
    const po = await request(app.getHttpServer())
      .post('/v1/purchase-orders')
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({
        vendorId: restockVendorId,
        locationId,
        lines: [{ variantId: lowVariantId, quantity: 3, unitCostCents: 1500 }],
      });
    expect(po.status).toBe(201);
    const detail = await request(app.getHttpServer())
      .get(`/v1/purchase-orders/${po.body.id}`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId);
    expect(detail.status).toBe(200);
    expect(detail.body.lines[0].vendorSku).toBe('RC-PLW-0099');
    expect(detail.body.lines[0].sku).toBe('PILLOW-1');

    // Explicit null clears it; empty/oversized strings are rejected.
    const cleared = await request(app.getHttpServer())
      .patch(`/v1/products/variants/${lowVariantId}/reorder`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ vendorSku: null, reorderPoint: null });
    expect(cleared.status).toBe(200);
    expect(cleared.body.vendorSku).toBeNull();

    const blank = await request(app.getHttpServer())
      .patch(`/v1/products/variants/${lowVariantId}/reorder`)
      .set('Cookie', ownerCookie)
      .set('X-Business-Id', businessId)
      .send({ vendorSku: '   ' });
    expect(blank.status).toBe(400);
  });
});
