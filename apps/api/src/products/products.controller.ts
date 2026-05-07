import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { TenantScoped, RequirePermission } from '../tenancy/decorators';
import { getRequestDb } from '../tenancy/request-context';
import type { RequestTenantContext } from '../tenancy/request-context';

interface ProductSummary {
  id: string;
  sku: string | null;
  name: string;
}

interface VariantSummary {
  id: string;
  sku: string | null;
  name: string | null;
  priceCents: number;
}

/**
 * Stub products endpoint. Real CRUD lands in Epic 1.7. The PATCH variant
 * below exists in 1.4 only to demonstrate explicit audit logging — Epic
 * 1.7 will replace it with the full CRUD surface.
 */
@TenantScoped()
@Controller('v1/products')
export class ProductsController {
  constructor(@Inject(AuditService) private readonly audit: AuditService) {}

  @Get()
  @RequirePermission('products.view')
  async list(@CurrentTenant() _tenant: RequestTenantContext | null): Promise<ProductSummary[]> {
    const db = getRequestDb();
    const rows = await db
      .select({
        id: schema.products.id,
        sku: schema.products.sku,
        name: schema.products.name,
      })
      .from(schema.products);
    return rows;
  }

  // Update variant price. The handler explicitly calls AuditService.log() so
  // the audit row carries the before/after diff (PLAN.md §9 Epic 1.4
  // acceptance: "Updating a product price creates an audit_logs row with
  // the old and new prices").
  @Patch('variants/:id/price')
  @RequirePermission('products.update')
  async updateVariantPrice(
    @Param('id') id: string,
    @Body('priceCents') priceCents: number | undefined,
  ): Promise<VariantSummary> {
    if (!Number.isInteger(priceCents) || (priceCents as number) < 0) {
      throw new BadRequestException('priceCents must be a non-negative integer');
    }
    const db = getRequestDb();
    const before = await db
      .select()
      .from(schema.productVariants)
      .where(eq(schema.productVariants.id, id))
      .limit(1);
    const existing = before[0];
    if (!existing) throw new NotFoundException('Variant not found');

    const [updated] = await db
      .update(schema.productVariants)
      .set({ priceCents: priceCents as number })
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
}
