import { BadRequestException, Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { JOB_REGISTRY, JobsService, type JobDefinition } from './jobs.service';
import { jobHealth, parseJobDetail, type JobHealth } from './job-health';

interface JobRunRow {
  id: string;
  jobId: string;
  businessDate: string;
  status: string;
  startedAt: Date;
  finishedAt: Date | null;
  durationMs: number | null;
  recordsAffected: number;
  detailJson: string | null;
  error: string | null;
}

/**
 * The nightly batch surface (JOB-002): the operator can see the declared
 * step list, read the morning run report, and re-run a business date —
 * everything STORIS's Generate Daily Reports hides.
 */
@TenantScoped()
@Controller('v1/jobs')
export class JobsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(JobsService) private readonly jobs: JobsService,
  ) {}

  /** The declared step list — id, order, dependencies, destructive flag. */
  @Get()
  @RequirePermission('business.settings.view')
  registry(): JobDefinition[] {
    return [...JOB_REGISTRY].sort((a, b) => a.order - b.order);
  }

  /** The run log, newest first (the morning run report). */
  @Get('runs')
  @RequirePermission('business.settings.view')
  async runs(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Query('date') date?: string,
  ): Promise<(JobRunRow & JobHealth)[]> {
    const rows = await this.db
      .select()
      .from(schema.jobRuns)
      .where(date ? eq(schema.jobRuns.businessDate, date) : undefined)
      .orderBy(desc(schema.jobRuns.businessDate), desc(schema.jobRuns.startedAt))
      .limit(200);
    return rows.map((row) => ({
      ...row,
      ...jobHealth(row.jobId, row.status, parseJobDetail(row.detailJson), row.error),
    }));
  }

  /**
   * Run the nightly pass now for one business date (default: yesterday,
   * business-local). Steps that already succeeded for that date are not
   * re-run — delete nothing, re-running is always safe.
   */
  @Post('run')
  @RequirePermission('business.settings.update')
  async run(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: { businessDate?: string },
  ): Promise<{ businessDate: string; results: { jobId: string; status: string }[] }> {
    let businessDate = body.businessDate;
    if (businessDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(businessDate)) {
      throw new BadRequestException('businessDate must be YYYY-MM-DD');
    }
    if (!businessDate) {
      businessDate = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    }
    const results = await this.jobs.runForBusiness(tenant.businessId!, businessDate);
    await this.audit.log({
      action: 'jobs.run',
      targetType: 'business',
      targetId: tenant.businessId!,
      after: { businessDate, results },
    });
    return { businessDate, results };
  }
}
