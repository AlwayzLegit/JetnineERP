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
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
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
  variants?: VariantInput[];
}

interface UpdateProductBody {
  sku?: string | null;
  name?: string;
  description?: string | null;
  categoryId?: string | null;
  taxClassId?: string | null;
  isActive?: boolean;
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
}

interface ProductOut {
  id: string;
  sku: string | null;
  name: string;
  description: string | null;
  categoryId: string | null;
  taxClassId: string | null;
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
  ): Promise<{ id: string; sku: string | null; name: string; isActive: boolean }[]> {
    const limit = clampLimit(limitStr);
    const where: ReturnType<typeof and>[] = [];
    if (categoryId) where.push(eq(schema.products.categoryId, categoryId));

    if (q && q.trim().length > 0) {
      // Combine the products' own search_tsv with any variants matching the
      // query — that way searching for a variant SKU or barcode lights up
      // the parent product. RLS scopes both halves to this business.
      const tsq = sql`websearch_to_tsquery('simple', ${q})`;
      const products = await this.db
        .select({
          id: schema.products.id,
          sku: schema.products.sku,
          name: schema.products.name,
          isActive: schema.products.isActive,
        })
        .from(schema.products)
        .where(
          and(
            ...where,
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
      return products;
    }

    const rows = await this.db
      .select({
        id: schema.products.id,
        sku: schema.products.sku,
        name: schema.products.name,
        isActive: schema.products.isActive,
      })
      .from(schema.products)
      .where(where.length ? and(...where) : undefined)
      .orderBy(asc(schema.products.name))
      .limit(limit);
    void tenant;
    return rows;
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

export function clampLimit(raw: string | undefined): number {
  const n = Number(raw ?? '50');
  if (!Number.isFinite(n) || n <= 0) return 50;
  return Math.min(Math.max(Math.floor(n), 1), 200);
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
