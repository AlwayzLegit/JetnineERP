import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { and, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';
import {
  defaultMapping,
  entitySpec,
  legacyIdFor,
  normalizeRow,
  parseCsv,
  type RowError,
} from './import-spec';

interface StageInput {
  entity: string;
  filename?: string;
  csv: string;
}

interface RowErrorReport {
  row: number;
  legacyId: string | null;
  errors: RowError[];
}

/** Preloaded lookup tables shared by validate and commit. */
interface Lookups {
  customerRefs: Map<string, string>;
  orderRefs: Map<string, string>;
  locations: Map<string, string>;
  variants: Map<string, { variantId: string; productId: string; costCents: number | null }>;
}

const MAX_ROWS = 100_000;

/** STORIS tender words → our payment methods; anything else is 'legacy'. */
function mapTender(raw: string | undefined): string {
  const w = (raw ?? '').trim().toUpperCase();
  if (w === 'CASH') return 'cash';
  if (['CARD', 'CREDIT', 'CREDIT_CARD', 'VISA', 'MC', 'MASTERCARD', 'AMEX', 'DISCOVER'].includes(w))
    return 'card';
  if (['CHECK', 'CHEQUE'].includes(w)) return 'check';
  if (['FINANCING', 'FINANCE', 'FINANCED'].includes(w)) return 'financing';
  return 'legacy';
}

/**
 * The STORIS import pipeline (§7): stage a CSV → map columns → validate
 * → commit as idempotent upserts through `legacy_refs` (D7) → reconcile.
 * Everything committed here carries `imported_at` where the schema has
 * it, so drawer, commissions, webhooks, and emails ignore it (D8).
 */
@Injectable()
export class ImportService {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  // --- Staging ---

  async stage(businessId: string, userId: string | undefined, input: StageInput) {
    const spec = entitySpec(input.entity);
    if (!spec) throw new BadRequestException(`Unknown entity "${input.entity}"`);
    const { headers, rows } = parseCsv(input.csv);
    if (headers.length === 0 || rows.length === 0) {
      throw new BadRequestException('The file has no data rows');
    }
    if (rows.length > MAX_ROWS) {
      throw new BadRequestException(`Too many rows (${rows.length}); split the file`);
    }
    const mapping = defaultMapping(input.entity, headers);
    const [batch] = await this.db
      .insert(schema.importBatches)
      .values({
        businessId,
        entity: input.entity,
        filename: input.filename ?? null,
        status: 'mapped',
        mappingJson: { columns: mapping, headers },
        rowCount: rows.length,
        uploadedByUserId: userId ?? null,
      })
      .returning();
    for (let i = 0; i < rows.length; i += 500) {
      await this.db.insert(schema.importRows).values(
        rows.slice(i, i + 500).map((raw, j) => ({
          businessId,
          batchId: batch!.id,
          rowNumber: i + j + 1,
          rawJson: raw,
        })),
      );
    }
    const unmappedRequired = spec.fields
      .filter((f) => f.required && mapping[f.name] === undefined)
      .map((f) => f.name);
    return { ...batch, unmappedRequired };
  }

  /**
   * Stage rows a platform connector already fetched and normalized —
   * same batch/row layout as a CSV upload, but the "headers" are the
   * entity's own field names, so the identity mapping applies and
   * validate/commit run unchanged. `source` (e.g. 'shopify') is stamped
   * on the batch and flows into `legacy_refs.source`, keeping each
   * platform's identity space separate from the STORIS one.
   */
  async stageStructured(
    businessId: string,
    userId: string | undefined,
    input: { entity: string; source: string; filename?: string; rows: Record<string, string>[] },
  ) {
    const spec = entitySpec(input.entity);
    if (!spec) throw new BadRequestException(`Unknown entity "${input.entity}"`);
    if (input.rows.length === 0) throw new BadRequestException('No rows to stage');
    if (input.rows.length > MAX_ROWS) {
      throw new BadRequestException(`Too many rows (${input.rows.length})`);
    }
    const headers = [...new Set(input.rows.flatMap((r) => Object.keys(r)))];
    const mapping = defaultMapping(input.entity, headers);
    const [batch] = await this.db
      .insert(schema.importBatches)
      .values({
        businessId,
        entity: input.entity,
        source: input.source,
        filename: input.filename ?? null,
        status: 'mapped',
        mappingJson: { columns: mapping, headers },
        rowCount: input.rows.length,
        uploadedByUserId: userId ?? null,
      })
      .returning();
    for (let i = 0; i < input.rows.length; i += 500) {
      await this.db.insert(schema.importRows).values(
        input.rows.slice(i, i + 500).map((raw, j) => ({
          businessId,
          batchId: batch!.id,
          rowNumber: i + j + 1,
          rawJson: raw,
        })),
      );
    }
    return batch!;
  }

  async setMapping(batchId: string, columns: Record<string, string>) {
    const batch = await this.getBatch(batchId);
    if (batch.status === 'committed') {
      throw new BadRequestException('Batch is already committed');
    }
    const prior = (batch.mappingJson ?? {}) as { headers?: string[] };
    const [updated] = await this.db
      .update(schema.importBatches)
      .set({
        mappingJson: { columns, headers: prior.headers ?? [] },
        status: 'mapped',
        updatedAt: new Date(),
      })
      .where(eq(schema.importBatches.id, batchId))
      .returning();
    return updated;
  }

  // --- Validation ---

  async validate(businessId: string, batchId: string) {
    const batch = await this.getBatch(batchId);
    const spec = entitySpec(batch.entity);
    if (!spec) throw new BadRequestException(`Unknown entity "${batch.entity}"`);
    const mapping =
      ((batch.mappingJson ?? {}) as { columns?: Record<string, string> }).columns ?? {};
    const rows = await this.db
      .select()
      .from(schema.importRows)
      .where(eq(schema.importRows.batchId, batchId))
      .orderBy(schema.importRows.rowNumber);
    const lookups = await this.loadLookups(businessId, batch.entity);

    const seen = new Map<string, number>();
    let valid = 0;
    let invalid = 0;
    const reports: RowErrorReport[] = [];
    const byMessage = new Map<string, number>();

    for (const row of rows) {
      const { normalized, errors } = normalizeRow(
        batch.entity,
        row.rawJson as Record<string, string>,
        mapping,
      );
      const legacyId = legacyIdFor(batch.entity, normalized);
      if (legacyId === null && errors.length === 0) {
        errors.push({ field: spec.legacyIdField, message: 'could not derive a legacy id' });
      }
      if (legacyId !== null) {
        const first = seen.get(legacyId);
        if (first !== undefined) {
          errors.push({
            field: spec.legacyIdField,
            message: `duplicate legacy id "${legacyId}" (first at row ${first})`,
          });
        } else {
          seen.set(legacyId, row.rowNumber);
        }
      }
      errors.push(...this.checkReferences(batch.entity, normalized, lookups));

      const ok = errors.length === 0;
      if (ok) valid++;
      else {
        invalid++;
        if (reports.length < 200) reports.push({ row: row.rowNumber, legacyId, errors });
        for (const e of errors) {
          byMessage.set(e.message, (byMessage.get(e.message) ?? 0) + 1);
        }
      }
      await this.db
        .update(schema.importRows)
        .set({
          legacyId,
          normalizedJson: normalized,
          status: ok ? 'valid' : 'invalid',
          errorsJson: ok ? null : errors,
        })
        .where(eq(schema.importRows.id, row.id));
    }

    const validationJson = {
      checkedAt: new Date().toISOString(),
      rowCount: rows.length,
      valid,
      invalid,
      errors: reports,
      byMessage: Object.fromEntries(
        [...byMessage.entries()].sort((a, b) => b[1] - a[1]).slice(0, 50),
      ),
    };
    const [updated] = await this.db
      .update(schema.importBatches)
      .set({
        status: 'validated',
        validationJson,
        validRowCount: valid,
        invalidRowCount: invalid,
        validatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.importBatches.id, batchId))
      .returning();
    return updated;
  }

  private checkReferences(
    entity: string,
    n: Record<string, unknown>,
    lookups: Lookups,
  ): RowError[] {
    const errors: RowError[] = [];
    const locKey = typeof n.location === 'string' ? n.location.toLowerCase() : null;
    if (
      ['inventory', 'order', 'sale'].includes(entity) &&
      locKey &&
      !lookups.locations.has(locKey)
    ) {
      errors.push({ field: 'location', message: `unknown location "${String(n.location)}"` });
    }
    if (['inventory', 'order_line'].includes(entity) && typeof n.sku === 'string') {
      if (!lookups.variants.has(n.sku.toLowerCase())) {
        errors.push({ field: 'sku', message: `unknown SKU "${n.sku}" — import products first` });
      }
    }
    if (entity === 'order' && typeof n.customerAccountNo === 'string') {
      if (!lookups.customerRefs.has(n.customerAccountNo)) {
        errors.push({
          field: 'customerAccountNo',
          message: `unknown customer "${n.customerAccountNo}" — import customers first`,
        });
      }
    }
    if (entity === 'sale' && typeof n.customerAccountNo === 'string') {
      if (!lookups.customerRefs.has(n.customerAccountNo)) {
        errors.push({
          field: 'customerAccountNo',
          message: `unknown customer "${n.customerAccountNo}" — import customers first`,
        });
      }
    }
    if (entity === 'order_line' && typeof n.orderNo === 'string') {
      if (!lookups.orderRefs.has(n.orderNo)) {
        errors.push({
          field: 'orderNo',
          message: `unknown order "${n.orderNo}" — commit order headers first`,
        });
      }
    }
    return errors;
  }

  private async loadLookups(businessId: string, entity: string): Promise<Lookups> {
    const lookups: Lookups = {
      customerRefs: new Map(),
      orderRefs: new Map(),
      locations: new Map(),
      variants: new Map(),
    };
    const wantCustomers = ['order', 'sale'].includes(entity);
    const wantOrders = entity === 'order_line';
    const wantLocations = ['inventory', 'order', 'sale'].includes(entity);
    const wantVariants = ['inventory', 'order_line'].includes(entity);

    if (wantCustomers || wantOrders) {
      const refs = await this.db
        .select({
          entity: schema.legacyRefs.entity,
          legacyId: schema.legacyRefs.legacyId,
          jetnineId: schema.legacyRefs.jetnineId,
        })
        .from(schema.legacyRefs)
        .where(
          and(
            eq(schema.legacyRefs.businessId, businessId),
            inArray(schema.legacyRefs.entity, ['customer', 'order']),
          ),
        );
      for (const r of refs) {
        if (r.entity === 'customer') lookups.customerRefs.set(r.legacyId, r.jetnineId);
        else lookups.orderRefs.set(r.legacyId, r.jetnineId);
      }
    }
    if (wantLocations) {
      const locs = await this.db
        .select({ id: schema.locations.id, name: schema.locations.name })
        .from(schema.locations)
        .where(eq(schema.locations.businessId, businessId));
      for (const l of locs) lookups.locations.set(l.name.toLowerCase(), l.id);
    }
    if (wantVariants) {
      const variants = await this.db
        .select({
          variantId: schema.productVariants.id,
          productId: schema.productVariants.productId,
          sku: schema.productVariants.sku,
          costCents: schema.productVariants.costCents,
        })
        .from(schema.productVariants)
        .where(eq(schema.productVariants.businessId, businessId));
      for (const v of variants) {
        if (v.sku) {
          lookups.variants.set(v.sku.toLowerCase(), {
            variantId: v.variantId,
            productId: v.productId,
            costCents: v.costCents,
          });
        }
      }
    }
    return lookups;
  }

  // --- Commit ---

  async commit(businessId: string, batchId: string) {
    const batch = await this.getBatch(batchId);
    if (!['validated', 'committed'].includes(batch.status)) {
      throw new BadRequestException('Validate the batch before committing');
    }
    const rows = await this.db
      .select()
      .from(schema.importRows)
      .where(
        and(
          eq(schema.importRows.batchId, batchId),
          inArray(schema.importRows.status, ['valid', 'committed']),
        ),
      )
      .orderBy(schema.importRows.rowNumber);
    const lookups = await this.loadLookups(businessId, batch.entity);
    const categoryCache = new Map<string, string>();

    let committed = 0;
    let failed = 0;
    for (const row of rows) {
      const n = (row.normalizedJson ?? {}) as Record<string, unknown>;
      try {
        const jetnineId = await this.commitRow(businessId, batch, row.legacyId!, n, {
          lookups,
          categoryCache,
        });
        await this.db
          .update(schema.importRows)
          .set({ status: 'committed', jetnineId, errorsJson: null })
          .where(eq(schema.importRows.id, row.id));
        committed++;
      } catch (e) {
        failed++;
        await this.db
          .update(schema.importRows)
          .set({
            status: 'invalid',
            errorsJson: [{ field: '*', message: e instanceof Error ? e.message : String(e) }],
          })
          .where(eq(schema.importRows.id, row.id));
      }
    }
    const [updated] = await this.db
      .update(schema.importBatches)
      .set({
        status: 'committed',
        committedRowCount: committed,
        invalidRowCount: batch.invalidRowCount + failed,
        validRowCount: batch.validRowCount - failed,
        committedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.importBatches.id, batchId))
      .returning();
    return { batch: updated, committed, failed };
  }

  private async commitRow(
    businessId: string,
    batch: { id: string; entity: string },
    legacyId: string,
    n: Record<string, unknown>,
    ctx: { lookups: Lookups; categoryCache: Map<string, string> },
  ): Promise<string> {
    switch (batch.entity) {
      case 'customer':
        return this.commitCustomer(businessId, batch.id, legacyId, n);
      case 'vendor':
        return this.commitVendor(businessId, batch.id, legacyId, n);
      case 'product':
        return this.commitProduct(businessId, batch.id, legacyId, n, ctx.categoryCache);
      case 'inventory':
        return this.commitInventory(businessId, batch.id, legacyId, n, ctx.lookups);
      case 'order':
        return this.commitOrder(businessId, batch.id, legacyId, n, ctx.lookups);
      case 'order_line':
        return this.commitOrderLine(businessId, batch.id, legacyId, n, ctx.lookups);
      case 'sale':
        return this.commitSale(businessId, batch.id, legacyId, n, ctx.lookups);
      default:
        throw new BadRequestException(`Unknown entity "${batch.entity}"`);
    }
  }

  private async refFor(businessId: string, entity: string, legacyId: string) {
    const [ref] = await this.db
      .select({ jetnineId: schema.legacyRefs.jetnineId })
      .from(schema.legacyRefs)
      .where(
        and(
          eq(schema.legacyRefs.businessId, businessId),
          eq(schema.legacyRefs.entity, entity),
          eq(schema.legacyRefs.legacyId, legacyId),
        ),
      )
      .limit(1);
    return ref?.jetnineId ?? null;
  }

  private async upsertRef(
    businessId: string,
    entity: string,
    legacyId: string,
    jetnineId: string,
    batchId: string,
  ) {
    await this.db
      .insert(schema.legacyRefs)
      .values({ businessId, entity, legacyId, jetnineId, importBatchId: batchId })
      .onConflictDoUpdate({
        target: [
          schema.legacyRefs.businessId,
          schema.legacyRefs.entity,
          schema.legacyRefs.legacyId,
        ],
        set: { jetnineId, importBatchId: batchId, updatedAt: new Date() },
      });
  }

  private async commitCustomer(
    businessId: string,
    batchId: string,
    legacyId: string,
    n: Record<string, unknown>,
  ): Promise<string> {
    const address =
      n.addressLine1 || n.city || n.postalCode
        ? [
            {
              line1: (n.addressLine1 as string) ?? null,
              line2: (n.addressLine2 as string) ?? null,
              city: (n.city as string) ?? null,
              region: (n.region as string) ?? null,
              postalCode: (n.postalCode as string) ?? null,
            },
          ]
        : null;
    const values = {
      firstName: (n.firstName as string) ?? null,
      lastName: (n.lastName as string) ?? null,
      email: (n.email as string) ?? null,
      phone: (n.phone as string) ?? null,
      notes: (n.notes as string) ?? null,
      addressesJson: address,
      updatedAt: new Date(),
    };
    const existing = await this.refFor(businessId, 'customer', legacyId);
    let id: string;
    if (existing) {
      await this.db.update(schema.customers).set(values).where(eq(schema.customers.id, existing));
      id = existing;
    } else {
      const [created] = await this.db
        .insert(schema.customers)
        .values({ businessId, ...values })
        .returning({ id: schema.customers.id });
      id = created!.id;
    }
    await this.upsertRef(businessId, 'customer', legacyId, id, batchId);
    return id;
  }

  private async commitVendor(
    businessId: string,
    batchId: string,
    legacyId: string,
    n: Record<string, unknown>,
  ): Promise<string> {
    const values = {
      name: n.name as string,
      contactName: (n.contactName as string) ?? null,
      email: (n.email as string) ?? null,
      phone: (n.phone as string) ?? null,
      updatedAt: new Date(),
    };
    let id = await this.refFor(businessId, 'vendor', legacyId);
    if (!id) {
      // Adopt an existing vendor with the same (unique) name rather than
      // colliding with it.
      const [byName] = await this.db
        .select({ id: schema.vendors.id })
        .from(schema.vendors)
        .where(and(eq(schema.vendors.businessId, businessId), eq(schema.vendors.name, values.name)))
        .limit(1);
      id = byName?.id ?? null;
    }
    if (id) {
      await this.db.update(schema.vendors).set(values).where(eq(schema.vendors.id, id));
    } else {
      const [created] = await this.db
        .insert(schema.vendors)
        .values({ businessId, ...values })
        .returning({ id: schema.vendors.id });
      id = created!.id;
    }
    await this.upsertRef(businessId, 'vendor', legacyId, id, batchId);
    return id;
  }

  private async commitProduct(
    businessId: string,
    batchId: string,
    legacyId: string,
    n: Record<string, unknown>,
    categoryCache: Map<string, string>,
  ): Promise<string> {
    const sku = n.sku as string;
    let categoryId: string | null = null;
    if (typeof n.category === 'string' && n.category !== '') {
      const key = n.category.toLowerCase();
      if (!categoryCache.has(key)) {
        const [existing] = await this.db
          .select({ id: schema.categories.id })
          .from(schema.categories)
          .where(
            and(
              eq(schema.categories.businessId, businessId),
              sql`lower(${schema.categories.name}) = ${key}`,
            ),
          )
          .limit(1);
        if (existing) categoryCache.set(key, existing.id);
        else {
          const [created] = await this.db
            .insert(schema.categories)
            .values({ businessId, name: n.category })
            .returning({ id: schema.categories.id });
          categoryCache.set(key, created!.id);
        }
      }
      categoryId = categoryCache.get(key)!;
    }

    let productId = await this.refFor(businessId, 'product', legacyId);
    if (!productId) {
      // Adopt a catalog row that already carries this SKU (unique per business).
      const [bySku] = await this.db
        .select({ id: schema.products.id })
        .from(schema.products)
        .where(and(eq(schema.products.businessId, businessId), eq(schema.products.sku, sku)))
        .limit(1);
      productId = bySku?.id ?? null;
    }
    const productValues = {
      sku,
      name: n.name as string,
      description: (n.description as string) ?? null,
      categoryId,
      serialTracked: n.serialTracked === true,
      updatedAt: new Date(),
    };
    if (productId) {
      await this.db
        .update(schema.products)
        .set(productValues)
        .where(eq(schema.products.id, productId));
    } else {
      const [created] = await this.db
        .insert(schema.products)
        .values({ businessId, ...productValues })
        .returning({ id: schema.products.id });
      productId = created!.id;
    }

    const variantValues = {
      priceCents: n.priceCents as number,
      costCents: (n.costCents as number) ?? null,
      barcode: (n.barcode as string) ?? null,
    };
    const [variant] = await this.db
      .select({ id: schema.productVariants.id })
      .from(schema.productVariants)
      .where(
        and(eq(schema.productVariants.productId, productId), eq(schema.productVariants.sku, sku)),
      )
      .limit(1);
    if (variant) {
      await this.db
        .update(schema.productVariants)
        .set(variantValues)
        .where(eq(schema.productVariants.id, variant.id));
    } else {
      await this.db
        .insert(schema.productVariants)
        .values({ businessId, productId, sku, ...variantValues });
    }
    await this.upsertRef(businessId, 'product', legacyId, productId, batchId);
    return productId;
  }

  private async commitInventory(
    businessId: string,
    batchId: string,
    legacyId: string,
    n: Record<string, unknown>,
    lookups: Lookups,
  ): Promise<string> {
    const variant = lookups.variants.get((n.sku as string).toLowerCase());
    if (!variant) throw new BadRequestException(`unknown SKU "${String(n.sku)}"`);
    const locationId = lookups.locations.get((n.location as string).toLowerCase());
    if (!locationId) throw new BadRequestException(`unknown location "${String(n.location)}"`);
    const onHand = n.onHand as number;

    // STORIS quoted average cost; keep it unless the product import
    // already set one.
    if (typeof n.unitCostCents === 'number' && variant.costCents == null) {
      await this.db
        .update(schema.productVariants)
        .set({ costCents: n.unitCostCents })
        .where(eq(schema.productVariants.id, variant.variantId));
      variant.costCents = n.unitCostCents;
    }

    const [level] = await this.db
      .select({ id: schema.inventoryLevels.id, onHand: schema.inventoryLevels.onHand })
      .from(schema.inventoryLevels)
      .where(
        and(
          eq(schema.inventoryLevels.variantId, variant.variantId),
          eq(schema.inventoryLevels.locationId, locationId),
        ),
      )
      .limit(1);
    let levelId: string;
    let delta: number;
    if (level) {
      delta = onHand - level.onHand;
      levelId = level.id;
      if (delta !== 0) {
        await this.db
          .update(schema.inventoryLevels)
          .set({ onHand, updatedAt: new Date() })
          .where(eq(schema.inventoryLevels.id, level.id));
      }
    } else {
      delta = onHand;
      const [created] = await this.db
        .insert(schema.inventoryLevels)
        .values({ businessId, variantId: variant.variantId, locationId, onHand, reserved: 0 })
        .returning({ id: schema.inventoryLevels.id });
      levelId = created!.id;
    }
    // The movement keeps the on-hand ledger honest (D3): the snapshot
    // change is visible as an explicit legacy-import correction.
    if (delta !== 0) {
      await this.db.insert(schema.inventoryMovements).values({
        businessId,
        variantId: variant.variantId,
        locationId,
        delta,
        reason: 'import',
        referenceType: 'import_batch',
        referenceId: batchId,
        notes: `STORIS import set on-hand to ${onHand}`,
      });
    }
    await this.upsertRef(businessId, 'inventory', legacyId, levelId, batchId);
    return levelId;
  }

  private async commitOrder(
    businessId: string,
    batchId: string,
    legacyId: string,
    n: Record<string, unknown>,
    lookups: Lookups,
  ): Promise<string> {
    const customerId = lookups.customerRefs.get(n.customerAccountNo as string);
    if (!customerId)
      throw new BadRequestException(`unknown customer "${String(n.customerAccountNo)}"`);
    const locationId = lookups.locations.get((n.location as string).toLowerCase());
    if (!locationId) throw new BadRequestException(`unknown location "${String(n.location)}"`);

    const totalCents = n.totalCents as number;
    const taxCents = (n.taxCents as number) ?? 0;
    const statusWord = typeof n.status === 'string' ? n.status.toLowerCase() : '';
    const status = statusWord.includes('quote') ? 'quote' : 'open';
    const orderDate = typeof n.orderDate === 'string' ? new Date(n.orderDate) : null;
    const promised = typeof n.promisedDate === 'string' ? n.promisedDate.slice(0, 10) : null;

    const values = {
      locationId,
      customerId,
      status,
      subtotalCents: totalCents - taxCents,
      taxCents,
      totalCents,
      requestedDate: promised,
      notes: (n.notes as string) ?? null,
      legacyNumber: legacyId,
      updatedAt: new Date(),
      ...(orderDate ? { createdAt: orderDate } : {}),
    };
    let orderId = await this.refFor(businessId, 'order', legacyId);
    if (orderId) {
      await this.db.update(schema.orders).set(values).where(eq(schema.orders.id, orderId));
    } else {
      const [created] = await this.db
        .insert(schema.orders)
        .values({
          businessId,
          number: legacyId,
          importedAt: new Date(),
          ...values,
        })
        .returning({ id: schema.orders.id });
      orderId = created!.id;
      lookups.orderRefs.set(legacyId, orderId);
    }
    await this.upsertRef(businessId, 'order', legacyId, orderId, batchId);

    // Deposits held: one payment row keeps the balance math identical to
    // native orders (D2). Idempotent through its own ref entity.
    const depositCents = (n.depositCents as number) ?? 0;
    const depositRef = await this.refFor(businessId, 'order_deposit', legacyId);
    if (depositRef) {
      await this.db
        .update(schema.payments)
        .set({ amountCents: depositCents })
        .where(eq(schema.payments.id, depositRef));
    } else if (depositCents > 0) {
      const [payment] = await this.db
        .insert(schema.payments)
        .values({
          businessId,
          orderId,
          kind: 'deposit',
          method: 'legacy',
          amountCents: depositCents,
          status: 'succeeded',
          ...(orderDate ? { createdAt: orderDate } : {}),
        })
        .returning({ id: schema.payments.id });
      await this.upsertRef(businessId, 'order_deposit', legacyId, payment!.id, batchId);
    }
    return orderId;
  }

  private async commitOrderLine(
    businessId: string,
    batchId: string,
    legacyId: string,
    n: Record<string, unknown>,
    lookups: Lookups,
  ): Promise<string> {
    const orderId = lookups.orderRefs.get(n.orderNo as string);
    if (!orderId) throw new BadRequestException(`unknown order "${String(n.orderNo)}"`);
    const variant = lookups.variants.get((n.sku as string).toLowerCase());
    if (!variant) throw new BadRequestException(`unknown SKU "${String(n.sku)}"`);

    const quantity = n.quantity as number;
    const unitPriceCents = n.unitPriceCents as number;
    const values = {
      variantId: variant.variantId,
      description: (n.description as string) ?? (n.sku as string),
      quantity,
      unitPriceCents,
      totalCents: (n.totalCents as number) ?? quantity * unitPriceCents,
      lineType: 'stock' as const,
    };
    const existing = await this.refFor(businessId, 'order_line', legacyId);
    let id: string;
    if (existing) {
      await this.db.update(schema.orderLines).set(values).where(eq(schema.orderLines.id, existing));
      id = existing;
    } else {
      const [created] = await this.db
        .insert(schema.orderLines)
        .values({ businessId, orderId, ...values })
        .returning({ id: schema.orderLines.id });
      id = created!.id;
    }
    await this.upsertRef(businessId, 'order_line', legacyId, id, batchId);
    return id;
  }

  private async commitSale(
    businessId: string,
    batchId: string,
    legacyId: string,
    n: Record<string, unknown>,
    lookups: Lookups,
  ): Promise<string> {
    const locationId = lookups.locations.get((n.location as string).toLowerCase());
    if (!locationId) throw new BadRequestException(`unknown location "${String(n.location)}"`);
    const customerId =
      typeof n.customerAccountNo === 'string'
        ? (lookups.customerRefs.get(n.customerAccountNo) ?? null)
        : null;
    const totalCents = n.totalCents as number;
    const taxCents = (n.taxCents as number) ?? 0;
    const saleDate = new Date(n.saleDate as string);

    const values = {
      locationId,
      customerId,
      status: 'completed',
      subtotalCents: totalCents - taxCents,
      taxCents,
      totalCents,
      completedAt: saleDate,
      createdAt: saleDate,
    };
    let saleId = await this.refFor(businessId, 'sale', legacyId);
    if (saleId) {
      await this.db.update(schema.sales).set(values).where(eq(schema.sales.id, saleId));
    } else {
      const [created] = await this.db
        .insert(schema.sales)
        .values({ businessId, number: legacyId, importedAt: new Date(), ...values })
        .returning({ id: schema.sales.id });
      saleId = created!.id;
    }
    await this.upsertRef(businessId, 'sale', legacyId, saleId, batchId);

    const paymentRef = await this.refFor(businessId, 'sale_payment', legacyId);
    const method = mapTender(n.method as string | undefined);
    if (paymentRef) {
      await this.db
        .update(schema.payments)
        .set({ amountCents: totalCents, method })
        .where(eq(schema.payments.id, paymentRef));
    } else if (totalCents !== 0) {
      const [payment] = await this.db
        .insert(schema.payments)
        .values({
          businessId,
          saleId,
          kind: 'sale',
          method,
          amountCents: totalCents,
          status: 'succeeded',
          createdAt: saleDate,
        })
        .returning({ id: schema.payments.id });
      await this.upsertRef(businessId, 'sale_payment', legacyId, payment!.id, batchId);
    }
    return saleId;
  }

  // --- Reads ---

  async getBatch(batchId: string) {
    const [batch] = await this.db
      .select()
      .from(schema.importBatches)
      .where(eq(schema.importBatches.id, batchId))
      .limit(1);
    if (!batch) throw new NotFoundException('Batch not found');
    return batch;
  }

  async listBatches(entity?: string) {
    return this.db
      .select()
      .from(schema.importBatches)
      .where(entity ? eq(schema.importBatches.entity, entity) : undefined)
      .orderBy(desc(schema.importBatches.createdAt))
      .limit(100);
  }

  async batchRows(batchId: string, onlyInvalid: boolean) {
    return this.db
      .select()
      .from(schema.importRows)
      .where(
        and(
          eq(schema.importRows.batchId, batchId),
          onlyInvalid ? eq(schema.importRows.status, 'invalid') : undefined,
        ),
      )
      .orderBy(schema.importRows.rowNumber)
      .limit(200);
  }

  // --- Reconciliation (§7 gates 1–4; gate 5 is the human spot-check) ---

  async recon(businessId: string) {
    // Latest committed source row per legacy id, per entity.
    const committedRows = await this.db
      .select({
        entity: schema.importBatches.entity,
        legacyId: schema.importRows.legacyId,
        normalizedJson: schema.importRows.normalizedJson,
        committedAt: schema.importBatches.committedAt,
      })
      .from(schema.importRows)
      .innerJoin(schema.importBatches, eq(schema.importRows.batchId, schema.importBatches.id))
      .where(eq(schema.importRows.status, 'committed'));
    const latest = new Map<string, Map<string, Record<string, unknown>>>();
    const at = new Map<string, number>();
    for (const r of committedRows) {
      if (!r.legacyId) continue;
      const key = `${r.entity}:${r.legacyId}`;
      const t = r.committedAt ? new Date(r.committedAt).getTime() : 0;
      if ((at.get(key) ?? -1) <= t) {
        at.set(key, t);
        if (!latest.has(r.entity)) latest.set(r.entity, new Map());
        latest.get(r.entity)!.set(r.legacyId, (r.normalizedJson ?? {}) as Record<string, unknown>);
      }
    }
    const sourceCount = (entity: string) => latest.get(entity)?.size ?? 0;

    // Gate 1 — row counts per entity vs identity-map rows.
    const refCounts = await this.db
      .select({ entity: schema.legacyRefs.entity, count: sql<number>`count(*)::int` })
      .from(schema.legacyRefs)
      .where(eq(schema.legacyRefs.businessId, businessId))
      .groupBy(schema.legacyRefs.entity);
    const refCount = new Map(refCounts.map((r) => [r.entity, r.count]));
    const entities = [
      'customer',
      'vendor',
      'product',
      'inventory',
      'order',
      'order_line',
      'sale',
    ].map((entity) => ({
      entity,
      source: sourceCount(entity),
      db: refCount.get(entity) ?? 0,
      match: sourceCount(entity) === (refCount.get(entity) ?? 0),
    }));

    // Gate 2 — units on hand + valuation at cost.
    const invSource = latest.get('inventory') ?? new Map();
    let srcUnits = 0;
    let srcValuation = 0;
    for (const n of invSource.values()) {
      const qty = (n.onHand as number) ?? 0;
      srcUnits += qty;
      srcValuation += qty * ((n.unitCostCents as number) ?? 0);
    }
    const [dbInv] = await this.db
      .select({
        units: sql<number>`coalesce(sum(${schema.inventoryLevels.onHand}), 0)::int`,
        valuation: sql<number>`coalesce(sum(${schema.inventoryLevels.onHand} * coalesce(${schema.productVariants.costCents}, 0)), 0)::bigint`,
      })
      .from(schema.inventoryLevels)
      .innerJoin(
        schema.productVariants,
        eq(schema.inventoryLevels.variantId, schema.productVariants.id),
      )
      .innerJoin(
        schema.legacyRefs,
        and(
          eq(schema.legacyRefs.jetnineId, schema.inventoryLevels.id),
          eq(schema.legacyRefs.entity, 'inventory'),
          eq(schema.legacyRefs.businessId, businessId),
        ),
      );

    // Gate 3 — Σ deposits held on imported open orders.
    let srcDeposits = 0;
    let srcAr = 0;
    for (const n of (latest.get('order') ?? new Map()).values()) {
      const dep = (n.depositCents as number) ?? 0;
      srcDeposits += dep;
      srcAr += ((n.totalCents as number) ?? 0) - dep;
    }
    const [dbDeposits] = await this.db
      .select({
        total: sql<number>`coalesce(sum(${schema.payments.amountCents}), 0)::bigint`,
      })
      .from(schema.payments)
      .innerJoin(schema.orders, eq(schema.payments.orderId, schema.orders.id))
      .where(
        and(
          isNotNull(schema.orders.importedAt),
          eq(schema.payments.kind, 'deposit'),
          eq(schema.payments.status, 'succeeded'),
        ),
      );

    // Gate 4 — Σ open AR (imported order totals minus everything paid).
    const [dbAr] = await this.db
      .select({
        total: sql<number>`coalesce(sum(${schema.orders.totalCents}), 0)::bigint - coalesce((
          select sum(p.amount_cents) from payments p
          join orders o2 on o2.id = p.order_id
          where o2.imported_at is not null and p.status = 'succeeded'
            and o2.status not in ('quote', 'cancelled', 'completed')
        ), 0)::bigint`,
      })
      .from(schema.orders)
      .where(
        and(
          isNotNull(schema.orders.importedAt),
          sql`${schema.orders.status} not in ('quote', 'cancelled', 'completed')`,
        ),
      );

    const gate = (source: number, db: number) => ({
      source,
      db: Number(db),
      match: source === Number(db),
    });
    return {
      generatedAt: new Date().toISOString(),
      gate1_rowCounts: entities,
      gate2_inventory: {
        units: gate(srcUnits, dbInv?.units ?? 0),
        valuationCents: gate(srcValuation, dbInv?.valuation ?? 0),
      },
      gate3_depositsHeldCents: gate(srcDeposits, dbDeposits?.total ?? 0),
      gate4_openArCents: gate(srcAr, dbAr?.total ?? 0),
      gate5: 'human spot-check — compare 20 random customers side-by-side with STORIS',
    };
  }
}
