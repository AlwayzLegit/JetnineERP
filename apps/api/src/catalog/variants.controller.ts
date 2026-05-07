import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { validateVariants } from './products.controller';

interface UpdateVariantBody {
  sku?: string | null;
  name?: string | null;
  priceCents?: number;
  costCents?: number | null;
  barcode?: string | null;
  attributesJson?: Record<string, unknown> | null;
  isActive?: boolean;
}

@TenantScoped()
@Controller('v1/products')
export class VariantsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Post(':productId/variants')
  @RequirePermission('products.update')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('productId') productId: string,
    @Body()
    body: {
      sku?: string;
      name?: string;
      priceCents?: number;
      costCents?: number | null;
      barcode?: string | null;
      attributesJson?: Record<string, unknown> | null;
    },
  ) {
    if (typeof body.priceCents !== 'number') {
      throw new BadRequestException('priceCents is required');
    }
    validateVariants([
      {
        priceCents: body.priceCents,
        costCents: body.costCents ?? null,
      },
    ]);
    const [variant] = await this.db
      .insert(schema.productVariants)
      .values({
        businessId: tenant.businessId!,
        productId,
        sku: body.sku ?? null,
        name: body.name ?? null,
        priceCents: body.priceCents,
        costCents: body.costCents ?? null,
        barcode: body.barcode ?? null,
        attributesJson: (body.attributesJson ?? null) as never,
      })
      .returning();
    if (!variant) throw new BadRequestException('failed to create variant');
    await this.audit.log({
      action: 'product.variant.create',
      targetType: 'product_variant',
      targetId: variant.id,
      after: { sku: variant.sku, priceCents: variant.priceCents, productId },
    });
    return variant;
  }

  @Patch('variants/:id')
  @RequirePermission('products.update')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateVariantBody,
  ): Promise<{ updated: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Variant not found');

    if (body.priceCents !== undefined) {
      validateVariants([{ priceCents: body.priceCents, costCents: body.costCents ?? null }]);
    }

    const update: Partial<typeof schema.productVariants.$inferInsert> = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    for (const key of ['sku', 'name', 'priceCents', 'costCents', 'barcode', 'isActive'] as const) {
      const v = body[key as keyof UpdateVariantBody];
      if (v !== undefined && v !== existing[key]) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (update as any)[key] = v;
        before[key] = existing[key];
        after[key] = v;
      }
    }
    if (body.attributesJson !== undefined) {
      update.attributesJson = body.attributesJson as never;
      before.attributesJson = existing.attributesJson;
      after.attributesJson = body.attributesJson;
    }

    if (Object.keys(after).length === 0) return { updated: true };

    await this.db
      .update(schema.productVariants)
      .set(update)
      .where(eq(schema.productVariants.id, id));
    await this.audit.log({
      action: 'product.variant.update',
      targetType: 'product_variant',
      targetId: id,
      before,
      after,
    });
    return { updated: true };
  }

  /**
   * Backwards-compatible price-only PATCH retained for Epic 1.3/1.4 tests
   * and the audit-log demo. PATCH /variants/:id is the general update;
   * this endpoint stays narrowly scoped for consumers that only need to
   * touch price.
   */
  @Patch('variants/:id/price')
  @RequirePermission('products.update')
  async updatePrice(
    @Param('id') id: string,
    @Body('priceCents') priceCents: number | undefined,
  ): Promise<{
    id: string;
    sku: string | null;
    name: string | null;
    priceCents: number;
  }> {
    if (typeof priceCents !== 'number' || priceCents < 0 || !Number.isInteger(priceCents)) {
      throw new BadRequestException('priceCents must be a non-negative integer');
    }
    const [existing] = await this.db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Variant not found');
    const [updated] = await this.db
      .update(schema.productVariants)
      .set({ priceCents })
      .where(eq(schema.productVariants.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Variant not found after update');
    await this.audit.log({
      action: 'product.variant.price.update',
      targetType: 'product_variant',
      targetId: updated.id,
      before: { priceCents: existing.priceCents },
      after: { priceCents: updated.priceCents },
    });
    return {
      id: updated.id,
      sku: updated.sku,
      name: updated.name,
      priceCents: updated.priceCents,
    };
  }

  @Delete('variants/:id')
  @RequirePermission('products.update')
  async deactivate(@Param('id') id: string): Promise<{ deactivated: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Variant not found');
    if (!existing.isActive) return { deactivated: true };
    await this.db
      .update(schema.productVariants)
      .set({ isActive: false })
      .where(eq(schema.productVariants.id, id));
    await this.audit.log({
      action: 'product.variant.deactivate',
      targetType: 'product_variant',
      targetId: id,
      before: { isActive: true },
      after: { isActive: false },
    });
    return { deactivated: true };
  }
}
