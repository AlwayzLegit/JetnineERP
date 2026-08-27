import { and, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';

export interface ReorderSuggestionLine {
  variantId: string;
  productName: string;
  variantName: string | null;
  sku: string | null;
  vendorSku: string | null;
  available: number;
  reorderPoint: number;
  suggestedQty: number;
  unitCostCents: number | null;
}

export interface ReorderVendorGroup {
  vendorId: string | null;
  vendorName: string | null;
  lines: ReorderSuggestionLine[];
}

/**
 * Reorder suggestions (REPL-040 basis): every managed variant (non-null
 * reorder point) whose available stock — on-hand minus reserved, summed
 * across locations — sits at or below its point, grouped by preferred
 * vendor. Suggested quantity is the variant's reorder qty when set, else
 * a top-up to 2× the point.
 *
 * Shared by the interactive endpoint (request-scoped db, RLS supplies
 * the tenant) and the nightly auto-replenishment job (root db — pass
 * `businessId` explicitly, it also scopes the levels join).
 */
export async function computeReorderSuggestions(
  db: PostgresJsDatabase,
  businessId?: string,
): Promise<ReorderVendorGroup[]> {
  const rows = await db
    .select({
      variantId: schema.productVariants.id,
      productName: schema.products.name,
      variantName: schema.productVariants.name,
      sku: schema.productVariants.sku,
      vendorSku: schema.productVariants.vendorSku,
      reorderPoint: schema.productVariants.reorderPoint,
      reorderQty: schema.productVariants.reorderQty,
      costCents: schema.productVariants.costCents,
      vendorId: schema.productVariants.preferredVendorId,
      vendorName: schema.vendors.name,
      available: sql<number>`COALESCE(SUM(${schema.inventoryLevels.onHand} - ${schema.inventoryLevels.reserved}), 0)::int`,
    })
    .from(schema.productVariants)
    .innerJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
    .leftJoin(
      schema.inventoryLevels,
      businessId
        ? and(
            eq(schema.inventoryLevels.variantId, schema.productVariants.id),
            eq(schema.inventoryLevels.businessId, businessId),
          )
        : eq(schema.inventoryLevels.variantId, schema.productVariants.id),
    )
    .leftJoin(schema.vendors, eq(schema.vendors.id, schema.productVariants.preferredVendorId))
    .where(
      and(
        sql`${schema.productVariants.reorderPoint} IS NOT NULL`,
        eq(schema.productVariants.isActive, true),
        eq(schema.products.isActive, true),
        businessId ? eq(schema.productVariants.businessId, businessId) : undefined,
      ),
    )
    .groupBy(
      schema.productVariants.id,
      schema.products.name,
      schema.productVariants.name,
      schema.productVariants.sku,
      schema.productVariants.vendorSku,
      schema.productVariants.reorderPoint,
      schema.productVariants.reorderQty,
      schema.productVariants.costCents,
      schema.productVariants.preferredVendorId,
      schema.vendors.name,
    )
    .having(
      sql`COALESCE(SUM(${schema.inventoryLevels.onHand} - ${schema.inventoryLevels.reserved}), 0) <= ${schema.productVariants.reorderPoint}`,
    );

  const byVendor = new Map<string, ReorderVendorGroup>();
  for (const r of rows) {
    const point = r.reorderPoint!;
    const suggestedQty = r.reorderQty ?? Math.max(1, point * 2 - r.available);
    const key = r.vendorId ?? 'unassigned';
    const group = byVendor.get(key) ?? {
      vendorId: r.vendorId ?? null,
      vendorName: r.vendorName ?? null,
      lines: [],
    };
    group.lines.push({
      variantId: r.variantId,
      productName: r.productName,
      variantName: r.variantName,
      sku: r.sku,
      vendorSku: r.vendorSku,
      available: r.available,
      reorderPoint: point,
      suggestedQty,
      unitCostCents: r.costCents ?? null,
    });
    byVendor.set(key, group);
  }
  return [...byVendor.values()].sort((a, b) =>
    (a.vendorName ?? 'zzz').localeCompare(b.vendorName ?? 'zzz'),
  );
}
