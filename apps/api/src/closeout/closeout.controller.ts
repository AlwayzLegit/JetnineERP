import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Post,
} from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { CloseoutService, type CloseoutSummary } from './closeout.service';

interface CloseoutRow {
  id: string;
  locationId: string;
  locationName: string | null;
  closeDate: string;
  ranAt: Date;
  trigger: string;
  exceptionCount: number;
  stockReleasedCount: number;
  summaryJson: unknown;
}

/**
 * Manual trigger + history for the P9 daily close. The scheduler is the
 * normal caller; the endpoint exists for "run tonight's close now" and
 * for tests. Idempotent either way.
 */
@TenantScoped()
@Controller('v1/closeouts')
export class CloseoutController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(CloseoutService) private readonly closeout: CloseoutService,
  ) {}

  @Get()
  @RequirePermission('reports.sales.view')
  async list(@CurrentTenant() tenant: RequestTenantContext): Promise<CloseoutRow[]> {
    return this.db
      .select({
        id: schema.dailyCloseouts.id,
        locationId: schema.dailyCloseouts.locationId,
        locationName: schema.locations.name,
        closeDate: schema.dailyCloseouts.closeDate,
        ranAt: schema.dailyCloseouts.ranAt,
        trigger: schema.dailyCloseouts.trigger,
        exceptionCount: schema.dailyCloseouts.exceptionCount,
        stockReleasedCount: schema.dailyCloseouts.stockReleasedCount,
        summaryJson: schema.dailyCloseouts.summaryJson,
      })
      .from(schema.dailyCloseouts)
      .leftJoin(schema.locations, eq(schema.locations.id, schema.dailyCloseouts.locationId))
      .where(eq(schema.dailyCloseouts.businessId, tenant.businessId!))
      .orderBy(desc(schema.dailyCloseouts.ranAt))
      .limit(60);
  }

  @Post('run')
  @RequirePermission('business.settings.update')
  async run(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: { locationId?: string; date?: string },
  ): Promise<CloseoutSummary> {
    if (!body.locationId) throw new BadRequestException('locationId is required');
    const [loc] = await this.db
      .select({ id: schema.locations.id, businessId: schema.locations.businessId })
      .from(schema.locations)
      .where(
        and(
          eq(schema.locations.id, body.locationId),
          eq(schema.locations.businessId, tenant.businessId!),
        ),
      )
      .limit(1);
    if (!loc) throw new NotFoundException('Location not found');
    const date = body.date ?? new Date().toISOString().slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must be YYYY-MM-DD');
    }
    return this.closeout.runForLocation({
      businessId: tenant.businessId!,
      locationId: loc.id,
      closeDate: date,
      trigger: 'manual',
      releaseStock: true,
      actorUserId: actor?.id ?? null,
    });
  }
}
