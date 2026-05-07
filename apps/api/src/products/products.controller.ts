import { Controller, Get } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { CurrentTenant } from '../auth/current-user.decorator';
import { TenantScoped, RequirePermission } from '../tenancy/decorators';
import { getRequestDb } from '../tenancy/request-context';
import type { RequestTenantContext } from '../tenancy/request-context';

interface ProductSummary {
  id: string;
  sku: string | null;
  name: string;
}

/**
 * Stub products endpoint. Real CRUD lands in Epic 1.7. This exists in 1.3
 * so the acceptance test can prove the @RequirePermission gate works
 * end-to-end against a real handler.
 */
@TenantScoped()
@Controller('v1/products')
export class ProductsController {
  @Get()
  @RequirePermission('products.view')
  async list(@CurrentTenant() _tenant: RequestTenantContext | null): Promise<ProductSummary[]> {
    // RLS scopes the query to the active business; we don't need a manual
    // WHERE business_id = ... clause here, but adding one would be belt-and-
    // suspenders.
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
}
