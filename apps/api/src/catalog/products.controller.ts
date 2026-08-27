import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { and, asc, desc, eq, gt, or, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import {
  buildPage,
  clampLimit as clampPageLimit,
  decodeCursor,
  type PageResponse,
} from '../common/pagination';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface VariantInput {
  sku?: string | null;
  name?: string | null;
  priceCents: number;
  costCents?: number | null;
  barcode?: string | null;
  attributesJson?: Record<string, unknown> | null;
}

interface CreateProductBody {
  sku?: string | null;
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  taxClassId?: string | null;
  brandId?: string | null;
  collectionId?: string | null;
  variants?: VariantInput[];
}

interface UpdateProductBody {
  sku?: string | null;
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  taxClassId?: string | null;
  brandId?: string | null;
  collectionId?: string | null;
  isActive?: boolean;
  /** G7: variants of a serial-tracked product carry serial_units rows. */
  serialTracked?: boolean;
}

interface VariantOut {
  id: string;
  sku: string | null;
  name: string | null;
  barcode: string | null;
  priceCents: number;
  costCents: number | null;
  attributesJson: unknown;
  isActive: boolean;
  reorderPoint: number | null;
  reorderQty: number | null;
  preferredVendorId: string | null;
  vendorSku: string | null;
}

interface ProductOut {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  categoryId: string | null;
  taxClassId: string | null;
  brandId: string | null;
  collectionId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  variants: VariantOut[];
  images: { id: string; storageKey: string; altText: string | null; position: number }[];
}

@TenantScoped()
@Controller('v1/products')
export class CatalogProductsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /**
   * List products. Query params:
   *   q         — full-text search across products + variants (tsvector)
   *   categoryId — restrict to a category
   *   limit      — 1..200, default 50
   */
  @Get()
  @RequirePermission('products.view')
  async list(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('q') q?: string,
    @Query('categoryId') categoryId?: string,
    @Query('limit') limitStr?: string,
    @Query('cursor') cursorStr?: string,
  ): Promise<PageResponse<{ id: string; sku: string | null; name: string; isActive: boolean }>> {
    void tenant;
    const limit = clampPageLimit(limitStr);
    const filters: ReturnType<typeof and>[] = [];
    if (categoryId) filters.push(eq(schema.products.categoryId, categoryId));

    if (q && q.trim().length > 0) {
      // Search returns ts_rank-ordered results — single page, no cursor.
      const tsq = sql`websearch_to_tsquery('simple', ${q})`;
      const data = await this.db
        .select({
          id: schema.products.id,
          sku: schema.products.sku,
          name: schema.products.name,
          isActive: schema.products.isActive,
        })
        .from(schema.products)
        .where(
          and(
            ...filters,
            sql`${schema.products.searchTsv} @@ ${tsq}
                OR EXISTS (
                  SELECT 1 FROM ${schema.productVariants} v
                  WHERE v.product_id = ${schema.products.id}
                    AND v.search_tsv @@ ${tsq}
                )`,
          ),
        )
        .orderBy(desc(sql`ts_rank(${schema.products.searchTsv}, ${tsq})`))
        .limit(limit);
      return { data, nextCursor: null };
    }

    // Default browse: alphabetical by name, with id as the tiebreaker.
    const cursor = decodeCursor(cursorStr);
    if (cursor) {
      filters.push(
        or(
          gt(schema.products.name, cursor.v as string),
          and(eq(schema.products.name, cursor.v as string), gt(schema.products.id, cursor.id)),
        )!,
      );
    }
    const rows = await this.db
      .select({
        id: schema.products.id,
        sku: schema.products.sku,
        name: schema.products.name,
        isActive: schema.products.isActive,
      })
      .from(schema.products)
      .where(filters.length ? and(...filters) : undefined)
      .orderBy(asc(schema.products.name), asc(schema.products.id))
      .limit(limit + 1);
    return buildPage(rows, limit, (r) => r.name);
  }

  @Get(':id')
  @RequirePermission('products.view')
  async get(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<ProductOut> {
    const [p] = await this.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);
    if (!p) throw new NotFoundException('Product not found');

    const variants = await this.db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.productId, id))
      .orderBy(asc(schema.productVariants.createdAt));
    const images = await this.db
      .select()
      .from(schema.productImages)
      .where(eq(schema.productImages.productId, id))
      .orderBy(asc(schema.productImages.position));

    const canSeeCost = tenant.isSuperAdmin || tenant.permissions.has('products.cost.view');

    return {
      id: p.id,
      sku: p.sku ?? null,
      name: p.name,
      description: p.description ?? null,
      categoryId: p.categoryId ?? null,
      taxClassId: p.taxClassId ?? null,
      brandId: p.brandId ?? null,
      collectionId: p.collectionId ?? null,
      isActive: p.isActive,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      variants: variants.map((v) => ({
        id: v.id,
        sku: v.sku ?? null,
        name: v.name ?? null,
        barcode: v.barcode ?? null,
        priceCents: v.priceCents,
        costCents: canSeeCost ? (v.costCents ?? null) : null,
        attributesJson: v.attributesJson,
        isActive: v.isActive,
        reorderPoint: v.reorderPoint ?? null,
        reorderQty: v.reorderQty ?? null,
        preferredVendorId: v.preferredVendorId ?? null,
        vendorSku: v.vendorSku ?? null,
      })),
      images: images.map((i) => ({
        id: i.id,
        storageKey: i.storageKey,
        altText: i.altText ?? null,
        position: i.position,
      })),
    };
  }

  @Post()
  @RequirePermission('products.create')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: CreateProductBody,
  ): Promise<ProductOut> {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('name is required');

    const [p] = await this.db
      .insert(schema.products)
      .values({
        businessId: tenant.businessId!,
        name,
        sku: body.sku ?? null,
        description: body.description ?? null,
        categoryId: body.categoryId ?? null,
        taxClassId: body.taxClassId ?? null,
        brandId: body.brandId ?? null,
        collectionId: body.collectionId ?? null,
      })
      .returning()
      .catch((err) => {
        if (err instanceof Error && err.message.includes('products_business_sku_uniq')) {
          throw new ConflictException(`SKU "${body.sku}" already exists in this business`);
        }
        throw err;
      });
    if (!p) throw new BadRequestException('failed to create product');

    if (body.variants && body.variants.length > 0) {
      validateVariants(body.variants);
      await this.db.insert(schema.productVariants).values(
        body.variants.map((v) => ({
          businessId: tenant.businessId!,
          productId: p.id,
          sku: v.sku ?? null,
          name: v.name ?? null,
          priceCents: v.priceCents,
          costCents: v.costCents ?? null,
          barcode: v.barcode ?? null,
          attributesJson: (v.attributesJson ?? null) as never,
        })),
      );
    }

    await this.audit.log({
      action: 'product.create',
      targetType: 'product',
      targetId: p.id,
      after: {
        name: p.name,
        sku: p.sku,
        variantCount: body.variants?.length ?? 0,
      },
    });

    return this.get(tenant, p.id);
  }

  @Patch(':id')
  @RequirePermission('products.update')
  async update(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: UpdateProductBody,
  ): Promise<ProductOut> {
    const [existing] = await this.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Product not found');

    const update: Partial<typeof schema.products.$inferInsert> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (body.name !== undefined && body.name.trim() !== existing.name) {
      update.name = body.name.trim();
      before.name = existing.name;
      after.name = update.name;
    }
    if (body.sku !== undefined && body.sku !== existing.sku) {
      update.sku = body.sku;
      before.sku = existing.sku;
      after.sku = body.sku;
    }
    if (body.description !== undefined && body.description !== existing.description) {
      update.description = body.description;
      before.description = existing.description;
      after.description = body.description;
    }
    if (body.categoryId !== undefined && body.categoryId !== existing.categoryId) {
      update.categoryId = body.categoryId;
      before.categoryId = existing.categoryId;
      after.categoryId = body.categoryId;
    }
    if (body.taxClassId !== undefined && body.taxClassId !== existing.taxClassId) {
      update.taxClassId = body.taxClassId;
      before.taxClassId = existing.taxClassId;
      after.taxClassId = body.taxClassId;
    }
    if (body.brandId !== undefined && body.brandId !== existing.brandId) {
      update.brandId = body.brandId;
      before.brandId = existing.brandId;
      after.brandId = body.brandId;
    }
    if (body.collectionId !== undefined && body.collectionId !== existing.collectionId) {
      update.collectionId = body.collectionId;
      before.collectionId = existing.collectionId;
      after.collectionId = body.collectionId;
    }
    if (body.serialTracked !== undefined && body.serialTracked !== existing.serialTracked) {
      update.serialTracked = body.serialTracked;
      before.serialTracked = existing.serialTracked;
      after.serialTracked = body.serialTracked;
    }
    if (body.isActive !== undefined && body.isActive !== existing.isActive) {
      update.isActive = body.isActive;
      before.isActive = existing.isActive;
      after.isActive = body.isActive;
    }

    if (Object.keys(after).length > 0) {
      await this.db.update(schema.products).set(update).where(eq(schema.products.id, id));
      await this.audit.log({
        action: 'product.update',
        targetType: 'product',
        targetId: id,
        before,
        after,
      });
    }

    return this.get(tenant, id);
  }

  /**
   * Reorder automation settings for one variant. Explicit null clears a
   * field; a variant with a null reorderPoint is not managed.
   */
  @Patch('variants/:variantId/reorder')
  @RequirePermission('products.update')
  async updateReorder(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('variantId') variantId: string,
    @Body()
    body: {
      reorderPoint?: number | null;
      reorderQty?: number | null;
      preferredVendorId?: string | null;
      vendorSku?: string | null;
    },
  ): Promise<{
    id: string;
    reorderPoint: number | null;
    reorderQty: number | null;
    preferredVendorId: string | null;
    vendorSku: string | null;
  }> {
    const [variant] = await this.db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, variantId))
      .limit(1);
    if (!variant) throw new NotFoundException('Variant not found');

    const update: Partial<typeof schema.productVariants.$inferInsert> = {};
    for (const key of ['reorderPoint', 'reorderQty'] as const) {
      const value = body[key];
      if (value === undefined) continue;
      if (value !== null && (!Number.isInteger(value) || value < 0)) {
        throw new BadRequestException(`${key} must be a non-negative integer or null`);
      }
      update[key] = value;
    }
    if (body.preferredVendorId !== undefined) {
      if (body.preferredVendorId !== null) {
        const [vendor] = await this.db
          .select({ id: schema.vendors.id })
          .from(schema.vendors)
          .where(eq(schema.vendors.id, body.preferredVendorId))
          .limit(1);
        if (!vendor) throw new NotFoundException('Vendor not found');
      }
      update.preferredVendorId = body.preferredVendorId;
    }
    if (body.vendorSku !== undefined) {
      if (body.vendorSku !== null) {
        const trimmed = body.vendorSku.trim();
        if (trimmed.length === 0 || trimmed.length > 100) {
          throw new BadRequestException('vendorSku must be 1–100 characters or null');
        }
        update.vendorSku = trimmed;
      } else {
        update.vendorSku = null;
      }
    }
    if (Object.keys(update).length > 0) {
      await this.db
        .update(schema.productVariants)
        .set(update)
        .where(eq(schema.productVariants.id, variantId));
      await this.audit.log({
        action: 'product.variant.reorder_settings',
        targetType: 'product_variant',
        targetId: variantId,
        before: {
          reorderPoint: variant.reorderPoint,
          reorderQty: variant.reorderQty,
          preferredVendorId: variant.preferredVendorId,
          vendorSku: variant.vendorSku,
        },
        after: update,
      });
    }
    const [updated] = await this.db
      .select({
        id: schema.productVariants.id,
        reorderPoint: schema.productVariants.reorderPoint,
        reorderQty: schema.productVariants.reorderQty,
        preferredVendorId: schema.productVariants.preferredVendorId,
        vendorSku: schema.productVariants.vendorSku,
      })
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, variantId))
      .limit(1);
    return updated!;
  }

  @Delete(':id')
  @RequirePermission('products.delete')
  async delete(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ deactivated: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.products)
      .where(eq(schema.products.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Product not found');
    if (!existing.isActive) return { deactivated: true };
    await this.db
      .update(schema.products)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(schema.products.id, id));
    await this.audit.log({
      action: 'product.deactivate',
      targetType: 'product',
      targetId: id,
      before: { isActive: true },
      after: { isActive: false },
    });
    return { deactivated: true };
  }
}

export function validateVariants(variants: VariantInput[]): void {
  for (const v of variants) {
    if (!Number.isInteger(v.priceCents) || v.priceCents < 0) {
      throw new BadRequestException('variants[].priceCents must be a non-negative integer');
    }
    if (v.costCents != null && (!Number.isInteger(v.costCents) || v.costCents < 0)) {
      throw new BadRequestException('variants[].costCents must be a non-negative integer or null');
    }
  }
}
