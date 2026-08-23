import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Post,
  Query,
} from '@nestjs/common';
import { and, desc, eq, inArray } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface PlanBody {
  name?: string;
  basis?: 'percent_of_sale' | 'percent_of_margin';
  rateBps?: number;
}

/**
 * Commission plans and the ledger over them (STORIS cutover G5).
 * Salespeople see their own entries; managers see everyone's, approve a
 * period, and mark it paid at payroll.
 */
@TenantScoped()
@Controller('v1')
export class CommissionsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get('commission-plans')
  @RequirePermission('commissions.view_all')
  async listPlans(@CurrentTenant() _tenant: RequestTenantContext) {
    return this.db.select().from(schema.commissionPlans).limit(100);
  }

  @Post('commission-plans')
  @RequirePermission('commissions.manage')
  async createPlan(@CurrentTenant() tenant: RequestTenantContext, @Body() body: PlanBody) {
    if (!body.name?.trim()) throw new BadRequestException('name is required');
    if (body.basis !== 'percent_of_sale' && body.basis !== 'percent_of_margin') {
      throw new BadRequestException("basis must be 'percent_of_sale' or 'percent_of_margin'");
    }
    const rate = Number(body.rateBps ?? 0);
    if (!Number.isInteger(rate) || rate <= 0 || rate > 10000) {
      throw new BadRequestException('rateBps must be an integer between 1 and 10000');
    }
    const [plan] = await this.db
      .insert(schema.commissionPlans)
      .values({
        businessId: tenant.businessId!,
        name: body.name.trim(),
        basis: body.basis,
        rateBps: rate,
      })
      .returning();
    await this.audit.log({
      action: 'commission_plan.create',
      targetType: 'commission_plan',
      targetId: plan!.id,
      after: { name: plan!.name, basis: plan!.basis, rateBps: plan!.rateBps },
    });
    return plan;
  }

  /** Point a member at a plan (or null to take them off commission). */
  @Post('commission-plans/assign')
  @RequirePermission('commissions.manage')
  async assign(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Body() body: { membershipId?: string; planId?: string | null },
  ) {
    if (!body.membershipId) throw new BadRequestException('membershipId is required');
    if (body.planId) {
      const [plan] = await this.db
        .select({ id: schema.commissionPlans.id })
        .from(schema.commissionPlans)
        .where(eq(schema.commissionPlans.id, body.planId))
        .limit(1);
      if (!plan) throw new NotFoundException('Commission plan not found');
    }
    const [m] = await this.db
      .update(schema.memberships)
      .set({ commissionPlanId: body.planId ?? null })
      .where(eq(schema.memberships.id, body.membershipId))
      .returning({
        id: schema.memberships.id,
        commissionPlanId: schema.memberships.commissionPlanId,
      });
    if (!m) throw new NotFoundException('Membership not found');
    await this.audit.log({
      action: 'commission_plan.assign',
      targetType: 'membership',
      targetId: body.membershipId,
      after: { commissionPlanId: body.planId ?? null },
    });
    return m;
  }

  /**
   * The period report: per-salesperson totals plus the entries behind
   * them. `commissions.view_all` sees everyone; a member with only
   * `view_own` gets their own rows.
   */
  @Get('commissions/report')
  @RequirePermission('commissions.view_own')
  async report(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Query('period') period?: string,
  ) {
    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      throw new BadRequestException('period must be YYYY-MM');
    }
    const canSeeAll = tenant.permissions.has('commissions.view_all');
    let membershipFilter: string | null = null;
    if (!canSeeAll) {
      const [m] = await this.db
        .select({ id: schema.memberships.id })
        .from(schema.memberships)
        .where(
          and(
            eq(schema.memberships.userId, actor?.id ?? ''),
            eq(schema.memberships.businessId, tenant.businessId!),
          ),
        )
        .limit(1);
      if (!m) throw new ForbiddenException('No membership in this business');
      membershipFilter = m.id;
    }

    const where = membershipFilter
      ? and(
          eq(schema.commissionEntries.period, period),
          eq(schema.commissionEntries.membershipId, membershipFilter),
        )
      : eq(schema.commissionEntries.period, period);

    const entries = await this.db
      .select()
      .from(schema.commissionEntries)
      .where(where)
      .orderBy(desc(schema.commissionEntries.accruedAt))
      .limit(1000);

    const totals = new Map<
      string,
      { membershipId: string; totalCents: number; pendingCents: number; entries: number }
    >();
    for (const e of entries) {
      const t = totals.get(e.membershipId) ?? {
        membershipId: e.membershipId,
        totalCents: 0,
        pendingCents: 0,
        entries: 0,
      };
      t.totalCents += e.amountCents;
      if (e.status === 'pending') t.pendingCents += e.amountCents;
      t.entries += 1;
      totals.set(e.membershipId, t);
    }

    // Names for the report rows.
    const memberIds = [...totals.keys()];
    const members = memberIds.length
      ? await this.db
          .select({
            id: schema.memberships.id,
            userId: schema.memberships.userId,
            email: schema.users.email,
            name: schema.users.name,
          })
          .from(schema.memberships)
          .leftJoin(schema.users, eq(schema.users.id, schema.memberships.userId))
          .where(inArray(schema.memberships.id, memberIds))
      : [];
    const nameBy = new Map(members.map((m) => [m.id, m.name ?? m.email ?? m.id]));

    return {
      period,
      bySalesperson: [...totals.values()]
        .map((t) => ({ ...t, salesperson: nameBy.get(t.membershipId) ?? t.membershipId }))
        .sort((a, b) => b.totalCents - a.totalCents),
      entries,
    };
  }

  /** Approve or mark-paid a batch of entries (payroll actions). */
  @Post('commissions/entries/set-status')
  @RequirePermission('commissions.manage')
  async setStatus(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Body() body: { entryIds?: string[]; status?: 'approved' | 'paid' },
  ) {
    const ids = body.entryIds ?? [];
    if (ids.length === 0) throw new BadRequestException('entryIds must be non-empty');
    if (body.status !== 'approved' && body.status !== 'paid') {
      throw new BadRequestException("status must be 'approved' or 'paid'");
    }
    // pending → approved → paid, no skipping backwards.
    const from = body.status === 'approved' ? ['pending'] : ['approved'];
    const rows = await this.db
      .update(schema.commissionEntries)
      .set({ status: body.status, updatedAt: new Date() })
      .where(
        and(
          inArray(schema.commissionEntries.id, ids),
          inArray(schema.commissionEntries.status, from),
        ),
      )
      .returning({ id: schema.commissionEntries.id });
    await this.audit.log({
      action: `commissions.${body.status}`,
      targetType: 'commission_entries',
      targetId: undefined,
      after: { count: rows.length, entryIds: rows.map((r) => r.id) },
    });
    return { updated: rows.length };
  }
}
