import { and, eq, sql, type SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';

/**
 * "This vendor's products" (owner 2026-09-01/02): imported catalogs
 * rarely carry a preferred vendor on the variant, so a vendor matches a
 * variant when any of these hold — the variant's preferred vendor, the
 * product's brand named like the vendor, or the vendor's name as a
 * whole word in the product name ("Twin Helix Dusk …" is a Helix).
 * Callers must have `product_variants`, `products` and `brands` in
 * scope (brands via LEFT JOIN on products.brand_id).
 */
export function vendorMatchCond(vendorId: string, vendorName: string | null | undefined): SQL {
  const name = vendorName?.trim();
  if (!name) return eq(schema.productVariants.preferredVendorId, vendorId);
  const word = '\\m' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\M';
  return sql`(${schema.productVariants.preferredVendorId} = ${vendorId} OR lower(${schema.brands.name}) = lower(${name}) OR ${schema.products.name} ~* ${word})`;
}

/** Resolve the vendor's name (tenant-scoped) and build the match. */
export async function vendorMatchFor(
  db: PostgresJsDatabase,
  businessId: string,
  vendorId: string,
): Promise<SQL> {
  const [vendor] = await db
    .select({ name: schema.vendors.name })
    .from(schema.vendors)
    .where(and(eq(schema.vendors.businessId, businessId), eq(schema.vendors.id, vendorId)))
    .limit(1);
  return vendorMatchCond(vendorId, vendor?.name ?? null);
}
