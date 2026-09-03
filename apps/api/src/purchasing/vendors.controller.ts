import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { ExceptionsService } from '../controls/exceptions.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { parseVendorReplenishment, type VendorReplenishmentSettings } from './replenishment-data';
import {
  mergeLandedCost,
  parseLandedCost,
  validateLandedCost,
  type LandedCostSettings,
} from './vendor-settings';

/**
 * What we carry from a vendor (owner 2026-09-02): products in the
 * catalog, units and products sitting in inventory, units still to come
 * on open POs. Each number is a door: the products, inventory and
 * purchase-orders pages all take `vendorId`.
 */
export interface VendorStats {
  productsCarried: number;
  inStockProducts: number;
  inStockUnits: number;
  onPoUnits: number;
  openPos: number;
}

interface VendorRow {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  addressJson: unknown;
  remitTo: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBody {
  name?: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  addressJson?: unknown;
  remitTo?: string | null;
  notes?: string | null;
}

type UpdateBody = CreateBody & { isActive?: boolean };

/**
 * Advanced Vendor Settings (owner 2026-09-02, STORIS): the four tabs in
 * one read — General (the vendor master + replenishment lead/stock days),
 * Shipping (landed-cost lines), PO Cutting Date (collection exceptions)
 * and Auto PO Replen (the replenishment document).
 */
export interface PoCuttingDateRow {
  id: string;
  collectionId: string;
  collectionName: string;
  cuttingDate: string;
  notes: string | null;
}

export interface AdvancedVendorSettings {
  vendor: VendorRow;
  shipping: LandedCostSettings;
  poCuttingDates: PoCuttingDateRow[];
  replenishment: VendorReplenishmentSettings | null;
  /** Every active collection, for the cutting-date picker (vendor's own first). */
  collections: { id: string; name: string; vendorId: string | null }[];
}

interface PoCuttingDatesBody {
  rows?: { collectionId?: string; cuttingDate?: string; notes?: string | null }[];
}

@TenantScoped()
@Controller('v1/vendors')
export class VendorsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ExceptionsService) private readonly exceptions: ExceptionsService,
  ) {}

  @Get()
  @RequirePermission('vendors.view')
  async list(
    @CurrentTenant() tenant: RequestTenantContext,
  ): Promise<(VendorRow & { stats: VendorStats })[]> {
    const rows = await this.db
      .select(SELECT_COLS)
      .from(schema.vendors)
      .orderBy(asc(schema.vendors.name));
    const stats = await this.stats(tenant.businessId!);
    const empty: VendorStats = {
      productsCarried: 0,
      inStockProducts: 0,
      inStockUnits: 0,
      onPoUnits: 0,
      openPos: 0,
    };
    return rows.map((r) => ({ ...r, stats: stats.get(r.id) ?? empty }));
  }

  /**
   * One pass over the catalog per vendor, in SQL: a variant belongs to a
   * vendor by preferred vendor, brand name, or the vendor's name as a
   * whole word in the product name (see common/vendor-match — this is
   * the same rule the Add Product popup filters by, in set form).
   */
  private async stats(businessId: string): Promise<Map<string, VendorStats>> {
    const rows = (await this.db.execute(sql`
      WITH v AS (
        SELECT id, name,
               '\\m' || regexp_replace(name, '([.*+?^$\{}()|[\\]\\\\])', '\\\\\\1', 'g') || '\\M' AS word
          FROM vendors WHERE business_id = ${businessId}
      ),
      owned AS (
        SELECT v.id AS vendor_id, pv.id AS variant_id
          FROM v
          JOIN product_variants pv ON pv.business_id = ${businessId} AND pv.is_active
          JOIN products p ON p.id = pv.product_id AND p.is_active
          LEFT JOIN brands b ON b.id = p.brand_id
         WHERE pv.preferred_vendor_id = v.id
            OR lower(b.name) = lower(v.name)
            OR p.name ~* v.word
      ),
      stock AS (
        SELECT o.vendor_id,
               count(DISTINCT o.variant_id) FILTER (WHERE il.on_hand > 0) AS in_stock_products,
               coalesce(sum(il.on_hand), 0) AS in_stock_units
          FROM owned o
          JOIN inventory_levels il ON il.variant_id = o.variant_id
         GROUP BY o.vendor_id
      ),
      po AS (
        SELECT po.vendor_id,
               count(DISTINCT po.id) AS open_pos,
               coalesce(sum(pl.quantity_ordered - pl.quantity_received), 0) AS on_po_units
          FROM purchase_orders po
          JOIN purchase_order_lines pl ON pl.purchase_order_id = po.id
         WHERE po.business_id = ${businessId}
           AND po.deleted_at IS NULL
           AND po.status IN ('draft', 'ordered', 'partially_received')
           AND pl.quantity_ordered > pl.quantity_received
         GROUP BY po.vendor_id
      )
      SELECT v.id,
             (SELECT count(*) FROM owned o WHERE o.vendor_id = v.id)::int AS products_carried,
             coalesce(s.in_stock_products, 0)::int AS in_stock_products,
             coalesce(s.in_stock_units, 0)::int AS in_stock_units,
             coalesce(po.on_po_units, 0)::int AS on_po_units,
             coalesce(po.open_pos, 0)::int AS open_pos
        FROM v
        LEFT JOIN stock s ON s.vendor_id = v.id
        LEFT JOIN po ON po.vendor_id = v.id`)) as unknown as {
      id: string;
      products_carried: number;
      in_stock_products: number;
      in_stock_units: number;
      on_po_units: number;
      open_pos: number;
    }[];
    return new Map(
      rows.map((r) => [
        r.id,
        {
          productsCarried: r.products_carried,
          inStockProducts: r.in_stock_products,
          inStockUnits: r.in_stock_units,
          onPoUnits: r.on_po_units,
          openPos: r.open_pos,
        },
      ]),
    );
  }

  @Get(':id')
  @RequirePermission('vendors.view')
  async get(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<VendorRow> {
    const [row] = await this.db
      .select(SELECT_COLS)
      .from(schema.vendors)
      .where(eq(schema.vendors.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Vendor not found');
    return row;
  }

  @Get(':id/advanced-settings')
  @RequirePermission('vendors.view')
  async advancedSettings(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<AdvancedVendorSettings> {
    const [row] = await this.db
      .select({
        ...SELECT_COLS,
        landedCostJson: schema.vendors.landedCostJson,
        replenishmentJson: schema.vendors.replenishmentJson,
      })
      .from(schema.vendors)
      .where(eq(schema.vendors.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Vendor not found');
    const { landedCostJson, replenishmentJson, ...vendor } = row;
    const [poCuttingDates, collections] = await Promise.all([
      this.cuttingDates(id),
      this.db
        .select({
          id: schema.collections.id,
          name: schema.collections.name,
          vendorId: schema.collections.vendorId,
        })
        .from(schema.collections)
        .where(eq(schema.collections.isActive, true))
        .orderBy(
          sql`CASE WHEN ${schema.collections.vendorId} = ${id} THEN 0 ELSE 1 END`,
          asc(schema.collections.name),
        ),
    ]);
    return {
      vendor,
      shipping: parseLandedCost(landedCostJson),
      poCuttingDates,
      replenishment: parseVendorReplenishment(replenishmentJson),
      collections,
    };
  }

  private async cuttingDates(vendorId: string): Promise<PoCuttingDateRow[]> {
    return this.db
      .select({
        id: schema.vendorPoCuttingDates.id,
        collectionId: schema.vendorPoCuttingDates.collectionId,
        collectionName: schema.collections.name,
        cuttingDate: schema.vendorPoCuttingDates.cuttingDate,
        notes: schema.vendorPoCuttingDates.notes,
      })
      .from(schema.vendorPoCuttingDates)
      .innerJoin(
        schema.collections,
        eq(schema.collections.id, schema.vendorPoCuttingDates.collectionId),
      )
      .where(eq(schema.vendorPoCuttingDates.vendorId, vendorId))
      .orderBy(asc(schema.collections.name));
  }

  /** Shipping tab: merge the landed-cost lines over the stored document. */
  @Patch(':id/shipping')
  @RequirePermission('vendors.manage')
  async patchShipping(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: Partial<Record<keyof LandedCostSettings, unknown>>,
  ): Promise<{ shipping: LandedCostSettings }> {
    const [existing] = await this.db
      .select({ name: schema.vendors.name, landedCostJson: schema.vendors.landedCostJson })
      .from(schema.vendors)
      .where(eq(schema.vendors.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Vendor not found');
    const before = parseLandedCost(existing.landedCostJson);
    const next = mergeLandedCost(before, body ?? {});
    validateLandedCost(next);
    await this.db
      .update(schema.vendors)
      .set({ landedCostJson: next as never, updatedAt: new Date() })
      .where(eq(schema.vendors.id, id));
    await this.audit.log({
      action: 'vendor.update',
      targetType: 'vendor',
      targetId: id,
      before: { landedCost: before },
      after: { landedCost: next },
    });
    return { shipping: next };
  }

  /** PO Cutting Date tab: replace the vendor's collection exceptions. */
  @Put(':id/po-cutting-dates')
  @RequirePermission('vendors.manage')
  async putCuttingDates(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: PoCuttingDatesBody,
  ): Promise<{ poCuttingDates: PoCuttingDateRow[] }> {
    const [existing] = await this.db
      .select({ id: schema.vendors.id, name: schema.vendors.name })
      .from(schema.vendors)
      .where(eq(schema.vendors.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Vendor not found');
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    const seen = new Set<string>();
    for (const r of rows) {
      if (!r.collectionId) throw new BadRequestException('rows[].collectionId is required');
      if (seen.has(r.collectionId)) {
        throw new BadRequestException('Each collection may carry one PO cutting date');
      }
      seen.add(r.collectionId);
      if (
        !r.cuttingDate ||
        !/^\d{4}-\d{2}-\d{2}$/.test(r.cuttingDate) ||
        Number.isNaN(Date.parse(`${r.cuttingDate}T00:00:00Z`))
      ) {
        throw new BadRequestException('rows[].cuttingDate must be YYYY-MM-DD');
      }
    }
    if (seen.size > 0) {
      const found = await this.db
        .select({ id: schema.collections.id })
        .from(schema.collections)
        .where(inArray(schema.collections.id, [...seen]));
      if (found.length !== seen.size) throw new NotFoundException('Collection not found');
    }
    const before = await this.cuttingDates(id);
    await this.db
      .delete(schema.vendorPoCuttingDates)
      .where(and(eq(schema.vendorPoCuttingDates.vendorId, id)));
    if (rows.length > 0) {
      await this.db.insert(schema.vendorPoCuttingDates).values(
        rows.map((r) => ({
          businessId: tenant.businessId!,
          vendorId: id,
          collectionId: r.collectionId!,
          cuttingDate: r.cuttingDate!,
          notes: r.notes?.trim() || null,
        })),
      );
    }
    const after = await this.cuttingDates(id);
    await this.audit.log({
      action: 'vendor.update',
      targetType: 'vendor',
      targetId: id,
      before: {
        poCuttingDates: before.map((r) => ({ collection: r.collectionName, date: r.cuttingDate })),
      },
      after: {
        poCuttingDates: after.map((r) => ({ collection: r.collectionName, date: r.cuttingDate })),
      },
    });
    return { poCuttingDates: after };
  }

  @Post()
  @RequirePermission('vendors.manage')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: CreateBody,
  ): Promise<VendorRow> {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('name is required');
    let row: VendorRow | undefined;
    try {
      [row] = await this.db
        .insert(schema.vendors)
        .values({
          businessId: tenant.businessId!,
          name,
          contactName: body.contactName?.trim() || null,
          email: body.email?.trim() || null,
          phone: body.phone?.trim() || null,
          addressJson: (body.addressJson ?? null) as never,
          remitTo: body.remitTo?.trim() || null,
          notes: body.notes?.trim() || null,
        })
        .returning(SELECT_COLS);
    } catch (err) {
      // Drizzle wraps postgres errors; unwrap to look at the underlying
      // constraint name. We treat unique-violation on the business+name
      // index as a soft 400 rather than a 500.
      const root = unwrap(err);
      if (
        (root as { constraint_name?: string }).constraint_name === 'vendors_business_name_uniq' ||
        (root as { code?: string; message?: string }).message?.includes(
          'vendors_business_name_uniq',
        )
      ) {
        throw new BadRequestException(`A vendor with name "${name}" already exists`);
      }
      throw err;
    }
    if (!row) throw new BadRequestException('failed to create vendor');
    await this.audit.log({
      action: 'vendor.create',
      targetType: 'vendor',
      targetId: row.id,
      after: { name, email: row.email, phone: row.phone },
    });
    return row;
  }

  @Patch(':id')
  @RequirePermission('vendors.manage')
  async update(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: UpdateBody,
  ): Promise<VendorRow> {
    const [existing] = await this.db
      .select()
      .from(schema.vendors)
      .where(eq(schema.vendors.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Vendor not found');

    const update: Partial<typeof schema.vendors.$inferInsert> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    for (const key of ['name', 'contactName', 'email', 'phone', 'remitTo', 'notes'] as const) {
      const v = body[key as keyof UpdateBody];
      if (v !== undefined) {
        const next = typeof v === 'string' ? v.trim() || null : v;
        if (next !== existing[key]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (update as any)[key] = next;
          before[key] = existing[key];
          after[key] = next;
        }
      }
    }
    if (body.addressJson !== undefined) {
      update.addressJson = body.addressJson as never;
      before.addressJson = existing.addressJson;
      after.addressJson = body.addressJson;
    }
    if (body.isActive !== undefined && body.isActive !== existing.isActive) {
      update.isActive = body.isActive;
      before.isActive = existing.isActive;
      after.isActive = body.isActive;
    }
    if (Object.keys(after).length === 0) {
      const [unchanged] = await this.db
        .select(SELECT_COLS)
        .from(schema.vendors)
        .where(eq(schema.vendors.id, id))
        .limit(1);
      return unchanged!;
    }
    const [updated] = await this.db
      .update(schema.vendors)
      .set(update)
      .where(eq(schema.vendors.id, id))
      .returning(SELECT_COLS);
    if (!updated) throw new NotFoundException('Vendor not found after update');

    await this.audit.log({
      action: 'vendor.update',
      targetType: 'vendor',
      targetId: id,
      before,
      after,
    });
    // G11: remit-to changes are the classic vendor-master fraud —
    // someone quietly redirects payments. Every change is a critical
    // exception the owner sees.
    if ('remitTo' in after) {
      await this.exceptions.record({
        type: 'vendor_remit_change',
        severity: 'critical',
        entityType: 'vendor',
        entityId: id,
        summary: `Remit-to changed on vendor ${existing.name}`,
        metadata: { before: before.remitTo ?? null, after: after.remitTo ?? null },
      });
    }
    return updated;
  }

  @Delete(':id')
  @RequirePermission('vendors.manage')
  async delete(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.vendors)
      .where(eq(schema.vendors.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Vendor not found');

    // PO references vendors with ON DELETE RESTRICT — refuse the delete
    // if any PO points at this vendor and surface a clear error rather
    // than letting Postgres throw a foreign-key violation.
    const referencingPos = await this.db
      .select({ id: schema.purchaseOrders.id })
      .from(schema.purchaseOrders)
      .where(eq(schema.purchaseOrders.vendorId, id))
      .limit(1);
    if (referencingPos.length > 0) {
      throw new BadRequestException(
        'Cannot delete a vendor with existing purchase orders. Deactivate it instead.',
      );
    }

    await this.db.delete(schema.vendors).where(eq(schema.vendors.id, id));
    await this.audit.log({
      action: 'vendor.delete',
      targetType: 'vendor',
      targetId: id,
      before: { name: existing.name, email: existing.email },
    });
    return { deleted: true };
  }
}

function unwrap(err: unknown): unknown {
  let current: unknown = err;
  for (let i = 0; i < 5; i++) {
    if (
      current &&
      typeof current === 'object' &&
      'cause' in current &&
      (current as { cause?: unknown }).cause
    ) {
      current = (current as { cause: unknown }).cause;
    } else {
      return current;
    }
  }
  return current;
}

const SELECT_COLS = {
  id: schema.vendors.id,
  name: schema.vendors.name,
  contactName: schema.vendors.contactName,
  email: schema.vendors.email,
  phone: schema.vendors.phone,
  addressJson: schema.vendors.addressJson,
  remitTo: schema.vendors.remitTo,
  notes: schema.vendors.notes,
  isActive: schema.vendors.isActive,
  createdAt: schema.vendors.createdAt,
  updatedAt: schema.vendors.updatedAt,
} as const;
