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
let managerCookie = '';
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
    await makeUser('manager@purch-test.local', 'Manager');

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
  managerCookie = await captureCookie('manager@purch-test.local');
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
    // The printable vendor document's header block.
    expect(detail.body.vendorName).toBe('Restock Co');
    expect(detail.body.locationName).toBeTruthy();
    expect(detail.body).toHaveProperty('vendorEmail');
    expect(detail.body).toHaveProperty('vendorPhone');

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

describe('Receiving stages + PO email + invoice matching (PLAN-POS-OPERATIONS P6)', () => {
  let vendorId = '';
  let poId = '';
  let poNumber = '';
  let lineId = '';

  function owner() {
    return {
      post: (url: string) =>
        request(app.getHttpServer())
          .post(url)
          .set('Cookie', ownerCookie)
          .set('X-Business-Id', businessId),
      get: (url: string) =>
        request(app.getHttpServer())
          .get(url)
          .set('Cookie', ownerCookie)
          .set('X-Business-Id', businessId),
      patch: (url: string) =>
        request(app.getHttpServer())
          .patch(url)
          .set('Cookie', ownerCookie)
          .set('X-Business-Id', businessId),
    };
  }

  it('sets the stage: vendor with email, a placed 5-unit PO', async () => {
    const vendor = await owner()
      .post('/v1/vendors')
      .send({ name: 'Stage Vendor', email: 'orders@stagevendor.test' });
    expect(vendor.status).toBe(201);
    vendorId = vendor.body.id;

    const po = await owner()
      .post('/v1/purchase-orders')
      .send({
        vendorId,
        locationId,
        lines: [{ variantId: variantAId, quantity: 5, unitCostCents: 1000 }],
      });
    expect(po.status).toBe(201);
    poId = po.body.id;
    poNumber = po.body.number;
    lineId = po.body.lines[0].id;
    expect(po.body.lines[0].quantityInspected).toBe(0);
    expect(po.body.lines[0].quantityAccepted).toBe(0);
  });

  it('dock receipt and inspection move no stock; acceptance does', async () => {
    const before = await levelOf(variantAId);

    const dock = await owner()
      .post(`/v1/purchase-orders/${poId}/receiving`)
      .send({ lines: [{ lineId, received: 3 }] });
    expect(dock.status).toBe(201);
    expect(dock.body.status).toBe('partially_received');
    expect(dock.body.lines[0].quantityReceived).toBe(3);
    expect(await levelOf(variantAId)).toBe(before); // nothing sellable yet

    const inspected = await owner()
      .post(`/v1/purchase-orders/${poId}/receiving`)
      .send({ lines: [{ lineId, inspected: 3, accepted: 2 }] });
    expect(inspected.status).toBe(201);
    expect(inspected.body.lines[0].quantityInspected).toBe(3);
    expect(inspected.body.lines[0].quantityAccepted).toBe(2);
    expect(await levelOf(variantAId)).toBe(before + 2); // accepted units only
  });

  it('stage invariants hold: no accepting past inspected, no receiving past ordered', async () => {
    const overAccept = await owner()
      .post(`/v1/purchase-orders/${poId}/receiving`)
      .send({ lines: [{ lineId, accepted: 2 }] }); // accepted would be 4 > inspected 3
    expect(overAccept.status).toBe(400);
    expect(overAccept.body.message).toMatch(/more units than have been inspected/);

    const overReceive = await owner()
      .post(`/v1/purchase-orders/${poId}/receiving`)
      .send({ lines: [{ lineId, received: 3 }] }); // received would be 6 > ordered 5
    expect(overReceive.status).toBe(400);
    expect(overReceive.body.message).toMatch(/remaining/);
  });

  it('PO auto-completes only when every unit is accepted', async () => {
    const finish = await owner()
      .post(`/v1/purchase-orders/${poId}/receiving`)
      .send({ lines: [{ lineId, received: 2, inspected: 2, accepted: 3 }] });
    expect(finish.status).toBe(201);
    expect(finish.body.status).toBe('received');
    expect(finish.body.closedAt).toBeTruthy();
    expect(finish.body.lines[0].quantityAccepted).toBe(5);
  });

  it('emails the PO to the vendor with the admin reply-to', async () => {
    const ops = await owner()
      .patch('/v1/business/settings')
      .send({ ops: { poReplyTo: 'purchasing@lamattress.test' } });
    expect(ops.status).toBe(200);

    const sent = await owner().post(`/v1/purchase-orders/${poId}/email`).send({});
    expect(sent.status).toBe(201);
    expect(sent.body.to).toBe('orders@stagevendor.test');

    const captured = await request(app.getHttpServer())
      .get('/v1/dev/email/last?to=orders@stagevendor.test')
      .expect(200);
    expect(captured.body.subject).toContain(poNumber);
    expect(captured.body.replyTo).toBe('purchasing@lamattress.test');
    expect(captured.body.html).toContain(poNumber);
  });

  it('vendor invoice: auto-match by PO #, variance, approve; clerk 403', async () => {
    await request(app.getHttpServer())
      .post('/v1/vendor-invoices')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ vendorId, number: 'SV-100', totalCents: 5000 })
      .expect(403);

    const recorded = await owner()
      .post('/v1/vendor-invoices')
      .send({ vendorId, number: 'SV-100', totalCents: 5200, poNumber });
    expect(recorded.status).toBe(201);
    expect(recorded.body.status).toBe('matched');
    expect(recorded.body.poNumber).toBe(poNumber);
    expect(recorded.body.varianceCents).toBe(5200 - 5000);

    const dup = await owner()
      .post('/v1/vendor-invoices')
      .send({ vendorId, number: 'SV-100', totalCents: 5200, poNumber });
    expect(dup.status).toBe(409);

    const listed = await owner().get(`/v1/vendor-invoices?purchaseOrderId=${poId}`);
    expect(listed.status).toBe(200);
    expect(listed.body).toHaveLength(1);

    // G11 SoD: the recorder can't self-approve — the manager signs off.
    const approved = await request(app.getHttpServer())
      .post(`/v1/vendor-invoices/${recorded.body.id}/approve`)
      .set('Cookie', managerCookie)
      .set('X-Business-Id', businessId)
      .send({});
    expect(approved.status).toBe(201);
    expect(approved.body.status).toBe('approved');

    const again = await owner().post(`/v1/vendor-invoices/${recorded.body.id}/approve`).send({});
    expect(again.status).toBe(400);
  });

  it('an invoice with no matching PO stays unmatched and cannot be approved', async () => {
    const res = await owner()
      .post('/v1/vendor-invoices')
      .send({ vendorId, number: 'SV-999', totalCents: 123_45 });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('unmatched');
    expect(res.body.varianceCents).toBeNull();

    const approve = await owner().post(`/v1/vendor-invoices/${res.body.id}/approve`).send({});
    expect(approve.status).toBe(400);
    expect(approve.body.message).toMatch(/Match the invoice/);
  });
});

describe('Purchasing controls: reject bucket, SoD, auto-clear, remit-to alert (PLAN-STORIS-GAP G11)', () => {
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
      patch: (url: string) =>
        request(app.getHttpServer())
          .patch(url)
          .set('Cookie', cookie)
          .set('X-Business-Id', businessId),
    };
  }

  let g11VendorId = '';

  it('rejected units go to As-Is review as pieces; the PO still completes', async () => {
    const vendor = await as(ownerCookie)
      .post('/v1/vendors')
      .send({ name: 'G11 Vendor', email: 'ap@g11vendor.test' });
    expect(vendor.status).toBe(201);
    g11VendorId = vendor.body.id;

    const po = await as(ownerCookie)
      .post('/v1/purchase-orders')
      .send({
        vendorId: g11VendorId,
        locationId,
        lines: [{ variantId: variantAId, quantity: 5, unitCostCents: 1000 }],
      });
    expect(po.status).toBe(201);
    const lineId = po.body.lines[0].id as string;
    const stockBefore = await levelOf(variantAId);

    // Received 5, inspected 5 — 3 good, 2 damaged.
    const staged = await as(clerkCookie)
      .post(`/v1/purchase-orders/${po.body.id}/receiving`)
      .send({ lines: [{ lineId, received: 5, inspected: 5, accepted: 3, rejected: 2 }] });
    expect(staged.status).toBe(201);
    expect(staged.body.status).toBe('received'); // fully dispositioned
    expect(staged.body.lines[0].quantityAccepted).toBe(3);
    expect(staged.body.lines[0].quantityRejected).toBe(2);

    // Only accepted units became stock; the rejects are As-Is pieces.
    expect(await levelOf(variantAId)).toBe(stockBefore + 3);
    const queue = await as(ownerCookie).get('/v1/as-is?status=pending_review');
    const pieces = queue.body.filter(
      (r: { referenceId: string | null; referenceType: string | null }) =>
        r.referenceType === 'purchase_order' && r.referenceId === po.body.id,
    );
    expect(pieces).toHaveLength(2);
    expect(pieces[0].quantity).toBe(1);
    const exceptions = await as(ownerCookie).get('/v1/exceptions?type=po_reject');
    expect(
      exceptions.body.some((e: { entityId: string | null }) => e.entityId === po.body.id),
    ).toBe(true);

    // Over-disposition is refused: nothing remains to accept.
    await as(clerkCookie)
      .post(`/v1/purchase-orders/${po.body.id}/receiving`)
      .send({ lines: [{ lineId, accepted: 1 }] })
      .expect(403); // status is 'received' — receiving is closed
  });

  it('a matched invoice inside the tolerance auto-clears; outside it needs a second signer', async () => {
    await as(ownerCookie)
      .patch('/v1/business/settings')
      .send({ ops: { invoiceVarianceToleranceCents: 500 } })
      .expect(200);
    try {
      const po = await as(ownerCookie)
        .post('/v1/purchase-orders')
        .send({
          vendorId: g11VendorId,
          locationId,
          lines: [{ variantId: variantAId, quantity: 2, unitCostCents: 10_000 }],
        });
      expect(po.status).toBe(201); // subtotal 20_000

      // $3 variance ≤ $5 tolerance → auto-approved on record.
      const auto = await as(ownerCookie).post('/v1/vendor-invoices').send({
        vendorId: g11VendorId,
        number: 'G11-AUTO-1',
        totalCents: 20_300,
        poNumber: po.body.number,
      });
      expect(auto.status).toBe(201);
      expect(auto.body.status).toBe('approved');

      // $50 variance → stays matched; the recorder cannot self-approve.
      const po2 = await as(ownerCookie)
        .post('/v1/purchase-orders')
        .send({
          vendorId: g11VendorId,
          locationId,
          lines: [{ variantId: variantAId, quantity: 1, unitCostCents: 10_000 }],
        });
      const manual = await as(ownerCookie).post('/v1/vendor-invoices').send({
        vendorId: g11VendorId,
        number: 'G11-MAN-1',
        totalCents: 15_000,
        poNumber: po2.body.number,
      });
      expect(manual.status).toBe(201);
      expect(manual.body.status).toBe('matched');

      const selfApprove = await as(ownerCookie)
        .post(`/v1/vendor-invoices/${manual.body.id}/approve`)
        .send({});
      expect(selfApprove.status).toBe(403);
      expect(selfApprove.body.code).toBe('OVERRIDE_REQUIRED');

      // A different authorized user signs off through the override.
      const signed = await as(ownerCookie)
        .post(`/v1/vendor-invoices/${manual.body.id}/approve`)
        .send({
          override: {
            email: 'manager@purch-test.local',
            password: PASSWORD,
            reason: 'checked against packing slip',
          },
        });
      expect(signed.status).toBe(201);
      expect(signed.body.status).toBe('approved');
    } finally {
      await as(ownerCookie)
        .patch('/v1/business/settings')
        .send({ ops: { invoiceVarianceToleranceCents: null } })
        .expect(200);
    }
  });

  it('changing a vendor remit-to raises a critical owner alert', async () => {
    const changed = await as(ownerCookie)
      .patch(`/v1/vendors/${g11VendorId}`)
      .send({ remitTo: 'PO Box 999, Reno NV — Acct 12345' });
    expect(changed.status).toBe(200);
    expect(changed.body.remitTo).toMatch(/Reno/);
    const exceptions = await as(ownerCookie).get(
      '/v1/exceptions?type=vendor_remit_change&severity=critical',
    );
    expect(
      exceptions.body.some((e: { entityId: string | null }) => e.entityId === g11VendorId),
    ).toBe(true);
  });
});

describe('PO lifecycle corrections — place / edit / un-receive', () => {
  let vendorId = '';
  let poId = '';
  let lineAId = '';
  let lineBId = '';

  async function withDb<T>(fn: (db: ReturnType<typeof drizzle>) => Promise<T>): Promise<T> {
    const sql = postgres(TEST_DB_URL, { max: 1, prepare: false });
    try {
      return await fn(drizzle(sql));
    } finally {
      await sql.end({ timeout: 5 });
    }
  }

  it('setup: vendor + a draft PO (place:false)', async () => {
    const vendor = await request(app.getHttpServer())
      .post('/v1/vendors')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ name: 'Corrections Vendor Co' });
    expect(vendor.status).toBe(201);
    vendorId = vendor.body.id;

    const res = await request(app.getHttpServer())
      .post('/v1/purchase-orders')
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        vendorId,
        locationId,
        place: false,
        lines: [{ variantId: variantAId, quantity: 2, unitCostCents: 300 }],
      });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('draft');
    expect(res.body.placedAt).toBeNull();
    poId = res.body.id;
    lineAId = res.body.lines[0].id;
  });

  it('a draft cannot be received against; Place flips it to ordered exactly once', async () => {
    const recv = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${poId}/receive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId: lineAId, quantity: 1 }] });
    expect(recv.status).toBe(403);

    const placed = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${poId}/place`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({});
    expect(placed.status).toBe(201);
    expect(placed.body.status).toBe('ordered');
    expect(placed.body.placedAt).not.toBeNull();

    const again = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${poId}/place`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({});
    expect(again.status).toBe(403);
  });

  it('edit: quantity, cost, expected date, added line — subtotal recomputes', async () => {
    const res = await request(app.getHttpServer())
      .patch(`/v1/purchase-orders/${poId}`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        expectedAt: '2026-09-15',
        notes: 'rev 2',
        lines: [
          { lineId: lineAId, quantity: 5, unitCostCents: 350 },
          { variantId: variantBId, quantity: 2, unitCostCents: 100 },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.lines).toHaveLength(2);
    expect(res.body.subtotalCents).toBe(5 * 350 + 2 * 100);
    expect(res.body.notes).toBe('rev 2');
    expect(res.body.expectedAt).not.toBeNull();
    lineBId = res.body.lines.find((l: { variantId: string }) => l.variantId === variantBId).id;
  });

  it('edit guards: cashier 403, no shrinking below received, no removing a received line', async () => {
    const forbidden = await request(app.getHttpServer())
      .patch(`/v1/purchase-orders/${poId}`)
      .set('Cookie', cashierCookie)
      .set('X-Business-Id', businessId)
      .send({ notes: 'nope' });
    expect(forbidden.status).toBe(403);

    const recv = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${poId}/receive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId: lineAId, quantity: 3 }] });
    expect(recv.status).toBe(201);
    expect(recv.body.status).toBe('partially_received');

    const shrink = await request(app.getHttpServer())
      .patch(`/v1/purchase-orders/${poId}`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId: lineAId, quantity: 2 }] });
    expect(shrink.status).toBe(400);
    expect(shrink.body.message).toMatch(/already received/);

    const remove = await request(app.getHttpServer())
      .patch(`/v1/purchase-orders/${poId}`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId: lineAId, remove: true }] });
    expect(remove.status).toBe(400);
    expect(remove.body.message).toMatch(/un-receive/);
  });

  it('a received PO is immutable via PATCH', async () => {
    const finish = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${poId}/receive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({
        lines: [
          { lineId: lineAId, quantity: 2 },
          { lineId: lineBId, quantity: 2 },
        ],
      });
    expect(finish.status).toBe(201);
    expect(finish.body.status).toBe('received');
    expect(finish.body.closedAt).not.toBeNull();

    const patch = await request(app.getHttpServer())
      .patch(`/v1/purchase-orders/${poId}`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ notes: 'too late' });
    expect(patch.status).toBe(403);
    expect(patch.body.message).toMatch(/received/);
  });

  it('un-receive backs units out of stock, writes an unreceive_po movement, reopens the PO', async () => {
    const before = await levelOf(variantAId);
    const res = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${poId}/unreceive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ notes: 'keyed 5, only 3 arrived', lines: [{ lineId: lineAId, quantity: 2 }] });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('partially_received');
    expect(res.body.closedAt).toBeNull();
    const lineA = res.body.lines.find((l: { id: string }) => l.id === lineAId);
    expect(lineA.quantityAccepted).toBe(3);
    expect(lineA.quantityReceived).toBe(3);

    expect(await levelOf(variantAId)).toBe(before - 2);

    await withDb(async (db) => {
      const movements = await db
        .select()
        .from(schema.inventoryMovements)
        .where(eq(schema.inventoryMovements.reason, 'unreceive_po'));
      expect(movements).toHaveLength(1);
      expect(movements[0]!.delta).toBe(-2);
      expect(movements[0]!.referenceId).toBe(poId);
    });
  });

  it('un-receive guards: over-accepted refused; reserved stock never cut into', async () => {
    const over = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${poId}/unreceive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId: lineAId, quantity: 4 }] });
    expect(over.status).toBe(400);
    expect(over.body.message).toMatch(/only 3 accepted/);

    const onHand = await levelOf(variantAId);
    await withDb(async (db) => {
      await db
        .update(schema.inventoryLevels)
        .set({ reserved: onHand })
        .where(
          and(
            eq(schema.inventoryLevels.variantId, variantAId),
            eq(schema.inventoryLevels.locationId, locationId),
          ),
        );
    });
    const blocked = await request(app.getHttpServer())
      .post(`/v1/purchase-orders/${poId}/unreceive`)
      .set('Cookie', clerkCookie)
      .set('X-Business-Id', businessId)
      .send({ lines: [{ lineId: lineAId, quantity: 1 }] });
    expect(blocked.status).toBe(400);
    expect(blocked.body.message).toMatch(/free \(unreserved\)/);
    await withDb(async (db) => {
      await db
        .update(schema.inventoryLevels)
        .set({ reserved: 0 })
        .where(
          and(
            eq(schema.inventoryLevels.variantId, variantAId),
            eq(schema.inventoryLevels.locationId, locationId),
          ),
        );
    });
  });
});
