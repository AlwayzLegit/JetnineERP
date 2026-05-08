import { Controller, Get, Inject } from '@nestjs/common';
import { count, eq, gte, sum } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';
import { SuperAdminOnly, TenantScoped } from '../tenancy/decorators';

interface PlatformMetrics {
  totalBusinesses: number;
  activeBusinesses: number;
  totalUsers: number;
  salesLast30Days: {
    count: number;
    grossCents: number;
  };
}

@SuperAdminOnly()
@TenantScoped()
@Controller('v1/admin/metrics')
export class AdminMetricsController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  @Get()
  async metrics(): Promise<PlatformMetrics> {
    const [totalBiz] = await this.db.select({ value: count() }).from(schema.businesses);
    const [activeBiz] = await this.db
      .select({ value: count() })
      .from(schema.businesses)
      .where(eq(schema.businesses.status, 'active'));
    const [totalUsers] = await this.db.select({ value: count() }).from(schema.users);

    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [recent] = await this.db
      .select({ count: count(), gross: sum(schema.sales.totalCents) })
      .from(schema.sales)
      .where(gte(schema.sales.createdAt, since));

    return {
      totalBusinesses: Number(totalBiz?.value ?? 0),
      activeBusinesses: Number(activeBiz?.value ?? 0),
      totalUsers: Number(totalUsers?.value ?? 0),
      salesLast30Days: {
        count: Number(recent?.count ?? 0),
        grossCents: Number(recent?.gross ?? 0),
      },
    };
  }
}
