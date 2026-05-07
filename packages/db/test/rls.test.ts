/**
 * Cross-tenant isolation: the central guarantee of the platform.
 *
 * These tests connect as the application role (app_user, NOLOGIN superuser
 * bypass disabled), set the per-request RLS context, and assert that:
 *   1. A query scoped to Business A cannot see Business B rows.
 *   2. An INSERT into a different tenant's table is rejected.
 *   3. A super-admin context bypasses isolation.
 *   4. With no business_id context, no tenant rows are returned.
 *
 * If any of these fail the platform leaks data across tenants. Treat as P0.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { businesses, categories, products, productVariants } from '../src/schema';
import { withTenantContext } from '../src/with-context';

const url =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/jetnine_test';

// Privileged connection for fixtures (postgres = superuser, bypasses RLS).
const root = postgres(url, { max: 2, prepare: false });
const rootDb = drizzle(root);

// Same connection used in app code paths — we drop to app_user via SET LOCAL
// inside `withTenantContext`.
const app = postgres(url, { max: 2, prepare: false });

let businessAId: string;
let businessBId: string;
let productAId: string;
let productBId: string;

beforeAll(async () => {
  // Truncate any leftover state and seed deterministic fixtures.
  await root.unsafe(`
    TRUNCATE businesses, products, product_variants, categories,
             memberships, roles, role_permissions, locations, audit_logs,
             customers, sales, sale_lines, payments, refunds,
             inventory_levels, inventory_movements, membership_location_scopes
    RESTART IDENTITY CASCADE
  `);

  const [a] = await rootDb
    .insert(businesses)
    .values({ slug: 'tenant-a', name: 'Tenant A', status: 'active' })
    .returning();
  const [b] = await rootDb
    .insert(businesses)
    .values({ slug: 'tenant-b', name: 'Tenant B', status: 'active' })
    .returning();
  if (!a || !b) throw new Error('fixture insert failed');
  businessAId = a.id;
  businessBId = b.id;

  const [catA] = await rootDb
    .insert(categories)
    .values({ businessId: businessAId, name: 'Cat A' })
    .returning();
  const [catB] = await rootDb
    .insert(categories)
    .values({ businessId: businessBId, name: 'Cat B' })
    .returning();

  const [pa] = await rootDb
    .insert(products)
    .values({ businessId: businessAId, sku: 'A-001', name: 'A Widget', categoryId: catA!.id })
    .returning();
  const [pb] = await rootDb
    .insert(products)
    .values({ businessId: businessBId, sku: 'B-001', name: 'B Widget', categoryId: catB!.id })
    .returning();
  if (!pa || !pb) throw new Error('product insert failed');
  productAId = pa.id;
  productBId = pb.id;

  await rootDb.insert(productVariants).values([
    {
      businessId: businessAId,
      productId: productAId,
      sku: 'A-001-V1',
      name: 'Default',
      priceCents: 1000,
    },
    {
      businessId: businessBId,
      productId: productBId,
      sku: 'B-001-V1',
      name: 'Default',
      priceCents: 2000,
    },
  ]);
});

afterAll(async () => {
  await root.end({ timeout: 5 });
  await app.end({ timeout: 5 });
});

describe('cross-tenant isolation (RLS)', () => {
  it('Business A context only sees Business A products', async () => {
    const rows = await withTenantContext(
      app,
      { businessId: businessAId, isSuperAdmin: false },
      async (tx) =>
        tx<
          { id: string; business_id: string; sku: string }[]
        >`SELECT id, business_id, sku FROM products`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.sku).toBe('A-001');
    expect(rows[0]!.business_id).toBe(businessAId);
  });

  it('Business B context only sees Business B products', async () => {
    const rows = await withTenantContext(
      app,
      { businessId: businessBId, isSuperAdmin: false },
      async (tx) =>
        tx<
          { id: string; business_id: string; sku: string }[]
        >`SELECT id, business_id, sku FROM products`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.sku).toBe('B-001');
    expect(rows[0]!.business_id).toBe(businessBId);
  });

  it('targeting another tenant by id returns zero rows', async () => {
    const rows = await withTenantContext(
      app,
      { businessId: businessAId, isSuperAdmin: false },
      async (tx) =>
        tx<{ id: string }[]>`SELECT id FROM products WHERE business_id = ${businessBId}::uuid`,
    );
    expect(rows).toHaveLength(0);
  });

  it('inserting into another tenant fails (WITH CHECK)', async () => {
    await expect(
      withTenantContext(app, { businessId: businessAId, isSuperAdmin: false }, async (tx) => {
        await tx`INSERT INTO products (business_id, sku, name)
                 VALUES (${businessBId}::uuid, 'CROSS-001', 'Cross-tenant attempt')`;
      }),
    ).rejects.toThrow(/row-level security|policy/i);
  });

  it('super-admin context sees both tenants', async () => {
    const rows = await withTenantContext(
      app,
      { isSuperAdmin: true },
      async (tx) => tx<{ sku: string }[]>`SELECT sku FROM products ORDER BY sku`,
    );
    expect(rows.map((r) => r.sku)).toEqual(['A-001', 'B-001']);
  });

  it('no context (empty business_id) sees nothing', async () => {
    const rows = await withTenantContext(
      app,
      {},
      async (tx) => tx<{ id: string }[]>`SELECT id FROM products`,
    );
    expect(rows).toHaveLength(0);
  });

  it('isolation extends to product_variants and other tenant tables', async () => {
    const rows = await withTenantContext(
      app,
      { businessId: businessAId, isSuperAdmin: false },
      async (tx) => tx<{ price_cents: number }[]>`SELECT price_cents FROM product_variants`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.price_cents).toBe(1000);
  });

  it('businesses table is also RLS-scoped', async () => {
    const rows = await withTenantContext(
      app,
      { businessId: businessAId, isSuperAdmin: false },
      async (tx) => tx<{ slug: string }[]>`SELECT slug FROM businesses`,
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]!.slug).toBe('tenant-a');
  });

  it('RLS context is per-transaction (next connection use is clean)', async () => {
    // First call with tenant A
    await withTenantContext(
      app,
      { businessId: businessAId, isSuperAdmin: false },
      async (tx) => tx`SELECT 1`,
    );
    // A query without context should not "remember" tenant A.
    const rows = await withTenantContext(
      app,
      {},
      async (tx) => tx<{ id: string }[]>`SELECT id FROM products`,
    );
    expect(rows).toHaveLength(0);
  });
});

describe('schema sanity', () => {
  it('all 19 tables have RLS enabled and forced', async () => {
    const rows = await root<
      { relname: string; relrowsecurity: boolean; relforcerowsecurity: boolean }[]
    >`
      SELECT c.relname, c.relrowsecurity, c.relforcerowsecurity
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname
    `;
    expect(rows).toHaveLength(19);
    const missing = rows.filter((r) => !r.relrowsecurity || !r.relforcerowsecurity);
    expect(missing).toEqual([]);
  });

  it('citext extension is installed', async () => {
    const rows = await root<
      { extname: string }[]
    >`SELECT extname FROM pg_extension WHERE extname = 'citext'`;
    expect(rows).toHaveLength(1);
  });

  it('app_user role exists and is NOLOGIN', async () => {
    const rows = await root<{ rolname: string; rolcanlogin: boolean }[]>`
      SELECT rolname, rolcanlogin FROM pg_roles WHERE rolname = 'app_user'
    `;
    expect(rows).toHaveLength(1);
    expect(rows[0]!.rolcanlogin).toBe(false);
  });
});
