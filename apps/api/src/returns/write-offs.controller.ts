import { Controller, Get, Inject, Query } from '@nestjs/common';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface WriteOffRow {
  id: string;
  sku: string | null;
  productName: string | null;
  locationName: string | null;
  quantity: number;
  unitCostCents: number;
  totalCostCents: number;
  reasonCode: string | null;
  reason: string | null;
  actorEmail: string | null;
  createdAt: Date;
}

/**
 * The shrink/write-off register (PLAN-STORIS-GAP §8 / G4): every
 * scrapped unit, valued at cost, with who and why — the report the
 * owner reads weekly. `totalCents` in the response header row makes the
 * dollar exposure one glance.
 */
@TenantScoped()
@Controller('v1/write-offs')
export class WriteOffsController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  @Get()
  @RequirePermission('reports.inventory.view')
  async list(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('days') daysStr?: string,
  ): Promise<{ totalCostCents: number; rows: WriteOffRow[] }> {
    const days = Math.min(365, Math.max(1, Number(daysStr) || 30));
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const rows = await this.db
      .select({
        id: schema.writeOffs.id,
        sku: schema.productVariants.sku,
        productName: schema.products.name,
        locationName: schema.locations.name,
        quantity: schema.writeOffs.quantity,
        unitCostCents: schema.writeOffs.unitCostCents,
        totalCostCents: schema.writeOffs.totalCostCents,
        reasonCode: schema.reasonCodes.code,
        reason: schema.writeOffs.reason,
        actorEmail: schema.users.email,
        createdAt: schema.writeOffs.createdAt,
      })
      .from(schema.writeOffs)
      .leftJoin(schema.productVariants, eq(schema.productVariants.id, schema.writeOffs.variantId))
      .leftJoin(schema.products, eq(schema.products.id, schema.productVariants.productId))
      .leftJoin(schema.locations, eq(schema.locations.id, schema.writeOffs.locationId))
      .leftJoin(schema.reasonCodes, eq(schema.reasonCodes.id, schema.writeOffs.reasonCodeId))
      .leftJoin(schema.users, eq(schema.users.id, schema.writeOffs.actorUserId))
      .where(
        and(
          eq(schema.writeOffs.businessId, tenant.businessId!),
          gte(schema.writeOffs.createdAt, since),
        ),
      )
      .orderBy(desc(schema.writeOffs.createdAt))
      .limit(500);
    const [agg] = await this.db
      .select({ total: sql<number>`coalesce(sum(${schema.writeOffs.totalCostCents}), 0)::int` })
      .from(schema.writeOffs)
      .where(
        and(
          eq(schema.writeOffs.businessId, tenant.businessId!),
          gte(schema.writeOffs.createdAt, since),
        ),
      );
    return { totalCostCents: agg?.total ?? 0, rows };
  }
}
