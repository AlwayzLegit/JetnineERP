import {
  BadRequestException,
  Body,
  Controller,
  ConflictException,
  ForbiddenException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { and, asc, desc, eq, sql } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';
import { GlService, resolvePeriod, type JournalLineInput } from './gl.service';

/**
 * In-house GL slice 1 (owner 2026-08-28, run-01 batch 1 as spec):
 * chart of accounts, fiscal periods with cascade close/reopen and the
 * period-13 year latch, and balanced manual journal batches. The
 * journal-event derivation posts through the same GlService in the
 * next slice.
 */

const ACCOUNT_TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'] as const;

interface AccountBody {
  code?: string;
  name?: string;
  accountType?: string;
  systemKey?: string | null;
  isActive?: boolean;
}

interface BatchBody {
  businessDate?: string;
  memo?: string | null;
  lines?: JournalLineInput[];
  /** Post immediately instead of leaving a draft. */
  post?: boolean;
}

/**
 * The seed chart: a minimal retail chart with the system keys the
 * journal-event derivation will need. Codes/names are editable after
 * seeding; system keys can be remapped in the accounts screen.
 */
const DEFAULT_CHART: { code: string; name: string; accountType: string; systemKey?: string }[] = [
  { code: '1000', name: 'Cash in Bank', accountType: 'asset', systemKey: 'cash_bank' },
  { code: '1050', name: 'Cash Drawers', accountType: 'asset', systemKey: 'cash_drawer' },
  {
    code: '1100',
    name: 'Accounts Receivable',
    accountType: 'asset',
    systemKey: 'accounts_receivable',
  },
  { code: '1200', name: 'Inventory', accountType: 'asset', systemKey: 'inventory' },
  {
    code: '1300',
    name: 'Landed Freight Asset',
    accountType: 'asset',
    systemKey: 'landed_freight_asset',
  },
  {
    code: '2000',
    name: 'Accounts Payable',
    accountType: 'liability',
    systemKey: 'accounts_payable',
  },
  {
    code: '2100',
    name: 'Received Not Recorded',
    accountType: 'liability',
    systemKey: 'received_not_recorded',
  },
  {
    code: '2200',
    name: 'Sales Tax Payable',
    accountType: 'liability',
    systemKey: 'sales_tax_payable',
  },
  {
    code: '2300',
    name: 'Customer Deposit Liability',
    accountType: 'liability',
    systemKey: 'deposit_liability',
  },
  {
    code: '2400',
    name: 'Gift Card Liability',
    accountType: 'liability',
    systemKey: 'gift_card_liability',
  },
  { code: '3000', name: "Owner's Equity", accountType: 'equity' },
  {
    code: '3900',
    name: 'Retained Earnings',
    accountType: 'equity',
    systemKey: 'retained_earnings',
  },
  { code: '4000', name: 'Sales', accountType: 'revenue', systemKey: 'sales_revenue' },
  { code: '4100', name: 'Delivery Charges', accountType: 'revenue', systemKey: 'delivery_revenue' },
  { code: '4200', name: 'Miscellaneous Fees', accountType: 'revenue', systemKey: 'fee_revenue' },
  { code: '4900', name: 'Sales Discounts', accountType: 'revenue', systemKey: 'sales_discounts' },
  { code: '5000', name: 'Cost of Goods Sold', accountType: 'expense', systemKey: 'cogs' },
  {
    code: '5100',
    name: 'Inventory Adjustments & Shrink',
    accountType: 'expense',
    systemKey: 'inventory_adjustment',
  },
  { code: '5200', name: 'Cash Over/Short', accountType: 'expense', systemKey: 'cash_over_short' },
  { code: '5300', name: 'Freight Expense', accountType: 'expense', systemKey: 'freight_expense' },
];

@TenantScoped()
@Controller('v1/gl')
export class GlController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(GlService) private readonly gl: GlService,
  ) {}

  // ------------------------------------------------ chart of accounts

  @Get('accounts')
  @RequirePermission('gl.view')
  async accounts(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('includeInactive') includeInactive?: string,
  ) {
    const conditions: SQL[] = [eq(schema.glAccounts.businessId, tenant.businessId!)];
    if (includeInactive !== 'true') conditions.push(eq(schema.glAccounts.isActive, true));
    return this.db
      .select()
      .from(schema.glAccounts)
      .where(and(...conditions))
      .orderBy(asc(schema.glAccounts.code));
  }

  @Post('accounts/seed-defaults')
  @RequirePermission('gl.manage')
  async seedDefaults(@CurrentTenant() tenant: RequestTenantContext) {
    const [existing] = await this.db
      .select({ id: schema.glAccounts.id })
      .from(schema.glAccounts)
      .where(eq(schema.glAccounts.businessId, tenant.businessId!))
      .limit(1);
    if (existing) {
      throw new ConflictException(
        'Chart of accounts already has entries — seed only applies to an empty chart',
      );
    }
    await this.db
      .insert(schema.glAccounts)
      .values(DEFAULT_CHART.map((a) => ({ ...a, businessId: tenant.businessId! })));
    await this.audit.log({
      action: 'gl.chart.seed',
      targetType: 'gl_account',
      after: { count: DEFAULT_CHART.length },
    });
    return this.accounts(tenant, 'true');
  }

  @Post('accounts')
  @RequirePermission('gl.manage')
  async createAccount(@CurrentTenant() tenant: RequestTenantContext, @Body() body: AccountBody) {
    const code = body.code?.trim();
    const name = body.name?.trim();
    if (!code || !/^[0-9]{3,8}$/.test(code)) {
      throw new BadRequestException('code must be 3-8 digits');
    }
    if (!name) throw new BadRequestException('name is required');
    if (!ACCOUNT_TYPES.includes(body.accountType as (typeof ACCOUNT_TYPES)[number])) {
      throw new BadRequestException(`accountType must be one of ${ACCOUNT_TYPES.join(', ')}`);
    }
    const [row] = await this.db
      .insert(schema.glAccounts)
      .values({
        businessId: tenant.businessId!,
        code,
        name,
        accountType: body.accountType!,
        systemKey: body.systemKey?.trim() || null,
      })
      .returning()
      .catch((err: { code?: string; cause?: { code?: string } }) => {
        if (err.code === '23505' || err.cause?.code === '23505') {
          throw new ConflictException('An account with this code (or system key) already exists');
        }
        throw err;
      });
    await this.audit.log({
      action: 'gl.account.create',
      targetType: 'gl_account',
      targetId: row!.id,
      after: { code, name, accountType: body.accountType, systemKey: row!.systemKey },
    });
    return row;
  }

  @Patch('accounts/:id')
  @RequirePermission('gl.manage')
  async updateAccount(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: AccountBody,
  ) {
    const [existing] = await this.db
      .select()
      .from(schema.glAccounts)
      .where(
        and(eq(schema.glAccounts.id, id), eq(schema.glAccounts.businessId, tenant.businessId!)),
      )
      .limit(1);
    if (!existing) throw new NotFoundException('Account not found');
    if (body.code !== undefined && body.code.trim() !== existing.code) {
      throw new BadRequestException('Account codes are immutable — create a new account instead');
    }
    const update: Partial<typeof schema.glAccounts.$inferInsert> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    if (body.name !== undefined && body.name.trim() && body.name.trim() !== existing.name) {
      update.name = body.name.trim();
      before.name = existing.name;
      after.name = update.name;
    }
    if (body.systemKey !== undefined) {
      const key = body.systemKey?.trim() || null;
      if (key !== existing.systemKey) {
        update.systemKey = key;
        before.systemKey = existing.systemKey;
        after.systemKey = key;
      }
    }
    if (body.isActive !== undefined && body.isActive !== existing.isActive) {
      update.isActive = body.isActive;
      before.isActive = existing.isActive;
      after.isActive = body.isActive;
    }
    if (Object.keys(after).length === 0) return existing;
    const [row] = await this.db
      .update(schema.glAccounts)
      .set(update)
      .where(eq(schema.glAccounts.id, id))
      .returning()
      .catch((err: { code?: string; cause?: { code?: string } }) => {
        if (err.code === '23505' || err.cause?.code === '23505') {
          throw new ConflictException('Another account already carries this system key');
        }
        throw err;
      });
    await this.audit.log({
      action: 'gl.account.update',
      targetType: 'gl_account',
      targetId: id,
      before,
      after,
    });
    return row;
  }

  // ------------------------------------------------------ fiscal periods

  @Get('periods')
  @RequirePermission('gl.view')
  async periods(@CurrentTenant() tenant: RequestTenantContext, @Query('year') yearStr?: string) {
    const year = Number(yearStr) || new Date().getUTCFullYear();
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new BadRequestException('year must be a 4-digit year');
    }
    const rows = await this.gl.yearPeriods(tenant.businessId!, year);
    // F6: the year is closed exactly when period 13 is closed.
    const p13 = rows.find((r) => r.period === 13);
    return { fiscalYear: year, yearClosed: p13?.status === 'closed', periods: rows };
  }

  /**
   * F4 cascade: closing period N closes every earlier open period of
   * the year. The client warns; the server just does what was asked.
   * Period 13 may close only after periods 1-12 (the year latch, F6).
   */
  @Post('periods/close')
  @RequirePermission('gl.manage')
  async closePeriod(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: { fiscalYear?: number; period?: number },
  ) {
    const { fiscalYear, period } = this.validatePeriodRef(body);
    const rows = await this.gl.yearPeriods(tenant.businessId!, fiscalYear);
    if (period === 13 && rows.some((r) => r.period <= 12 && r.status === 'open')) {
      throw new BadRequestException(
        'All 12 periods must be closed before period 13 can close the year',
      );
    }
    // F7 (year-end): closing period 13 rolls the year's P&L into
    // retained earnings BEFORE the latch closes, so the roll itself
    // posts into period 13. Idempotent — a re-close after a reopen only
    // rolls activity posted since the last roll (net P&L of zero posts
    // nothing).
    if (period === 13) {
      await this.rollRetainedEarnings(tenant.businessId!, fiscalYear);
    }
    const toClose = rows.filter((r) => r.period <= period && r.status === 'open');
    if (toClose.length === 0) {
      throw new BadRequestException('Period is already closed');
    }
    // F9, hardened: STORIS merely notifies about unposted transactions;
    // Jetnine refuses — a closed period with stranded drafts is how
    // books drift.
    const [drafts] = await this.db
      .select({ count: sql<number>`COUNT(*)::int` })
      .from(schema.glJournalBatches)
      .where(
        and(
          eq(schema.glJournalBatches.businessId, tenant.businessId!),
          eq(schema.glJournalBatches.fiscalYear, fiscalYear),
          eq(schema.glJournalBatches.status, 'draft'),
          sql`${schema.glJournalBatches.period} <= ${period}`,
        ),
      );
    if ((drafts?.count ?? 0) > 0) {
      throw new BadRequestException(
        `${drafts!.count} draft batch(es) sit in the closing range — post or re-date them first`,
      );
    }
    const now = new Date();
    await this.db
      .update(schema.glPeriods)
      .set({ status: 'closed', closedAt: now, closedByUserId: actor.id })
      .where(
        and(
          eq(schema.glPeriods.businessId, tenant.businessId!),
          eq(schema.glPeriods.fiscalYear, fiscalYear),
          sql`${schema.glPeriods.period} <= ${period}`,
          eq(schema.glPeriods.status, 'open'),
        ),
      );
    await this.audit.log({
      action: 'gl.period.close',
      targetType: 'gl_period',
      after: { fiscalYear, period, cascadeClosed: toClose.map((r) => r.period) },
    });
    return this.periods(tenant, String(fiscalYear));
  }

  /** F5 cascade: reopening period N reopens every later closed period. */
  @Post('periods/reopen')
  @RequirePermission('gl.manage')
  async reopenPeriod(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: { fiscalYear?: number; period?: number },
  ) {
    const { fiscalYear, period } = this.validatePeriodRef(body);
    const rows = await this.gl.yearPeriods(tenant.businessId!, fiscalYear);
    const toReopen = rows.filter((r) => r.period >= period && r.status === 'closed');
    if (toReopen.length === 0) throw new BadRequestException('Period is already open');
    await this.db
      .update(schema.glPeriods)
      .set({ status: 'open', closedAt: null, closedByUserId: null })
      .where(
        and(
          eq(schema.glPeriods.businessId, tenant.businessId!),
          eq(schema.glPeriods.fiscalYear, fiscalYear),
          sql`${schema.glPeriods.period} >= ${period}`,
          eq(schema.glPeriods.status, 'closed'),
        ),
      );
    await this.audit.log({
      action: 'gl.period.reopen',
      targetType: 'gl_period',
      after: { fiscalYear, period, cascadeReopened: toReopen.map((r) => r.period) },
    });
    return this.periods(tenant, String(fiscalYear));
  }

  // ------------------------------------------------------ journal batches

  @Get('journal-batches')
  @RequirePermission('gl.view')
  async batches(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('year') yearStr?: string,
    @Query('status') status?: string,
  ) {
    const conditions: SQL[] = [eq(schema.glJournalBatches.businessId, tenant.businessId!)];
    if (yearStr) conditions.push(eq(schema.glJournalBatches.fiscalYear, Number(yearStr)));
    if (status) conditions.push(eq(schema.glJournalBatches.status, status));
    const rows = await this.db
      .select({
        id: schema.glJournalBatches.id,
        number: schema.glJournalBatches.number,
        status: schema.glJournalBatches.status,
        batchType: schema.glJournalBatches.batchType,
        sourceType: schema.glJournalBatches.sourceType,
        businessDate: schema.glJournalBatches.businessDate,
        fiscalYear: schema.glJournalBatches.fiscalYear,
        period: schema.glJournalBatches.period,
        memo: schema.glJournalBatches.memo,
        postedAt: schema.glJournalBatches.postedAt,
        createdAt: schema.glJournalBatches.createdAt,
        debitCents: sql<number>`(SELECT COALESCE(SUM(l.debit_cents), 0) FROM gl_journal_lines l WHERE l.batch_id = ${schema.glJournalBatches.id})::int`,
      })
      .from(schema.glJournalBatches)
      .where(and(...conditions))
      .orderBy(desc(schema.glJournalBatches.createdAt))
      .limit(200);
    return { rows };
  }

  @Get('journal-batches/:id')
  @RequirePermission('gl.view')
  async batch(@CurrentTenant() tenant: RequestTenantContext, @Param('id') id: string) {
    return this.hydrateBatch(tenant.businessId!, id);
  }

  @Post('journal-batches')
  @RequirePermission('gl.post')
  async createBatch(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: BatchBody,
  ) {
    if (!body.businessDate || !/^\d{4}-\d{2}-\d{2}$/.test(body.businessDate)) {
      throw new BadRequestException('businessDate must be YYYY-MM-DD');
    }
    const { fiscalYear, period } = resolvePeriod(body.businessDate);
    const post = body.post === true;
    await this.gl.validateLines(tenant.businessId!, body.lines ?? [], post);
    if (post) await this.gl.assertPeriodOpen(tenant.businessId!, fiscalYear, period);

    const number = await this.gl.generateBatchNumber(tenant.businessId!, fiscalYear);
    const [batch] = await this.db
      .insert(schema.glJournalBatches)
      .values({
        businessId: tenant.businessId!,
        number,
        status: post ? 'posted' : 'draft',
        batchType: 'manual',
        businessDate: body.businessDate,
        fiscalYear,
        period,
        memo: body.memo ?? null,
        createdByUserId: actor.id,
        postedAt: post ? new Date() : null,
      })
      .returning();
    await this.db.insert(schema.glJournalLines).values(
      (body.lines ?? []).map((l) => ({
        businessId: tenant.businessId!,
        batchId: batch!.id,
        accountId: l.accountId,
        memo: l.memo ?? null,
        debitCents: l.debitCents ?? 0,
        creditCents: l.creditCents ?? 0,
      })),
    );
    await this.audit.log({
      action: post ? 'gl.batch.post' : 'gl.batch.create',
      targetType: 'gl_journal_batch',
      targetId: batch!.id,
      after: { number, businessDate: body.businessDate, lineCount: body.lines?.length ?? 0 },
    });
    return this.hydrateBatch(tenant.businessId!, batch!.id);
  }

  /** Drafts are editable; posted batches are append-only forever. */
  @Patch('journal-batches/:id')
  @RequirePermission('gl.post')
  async updateBatch(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: BatchBody,
  ) {
    const batch = await this.mustGetBatch(tenant.businessId!, id);
    if (batch.status !== 'draft') {
      throw new ForbiddenException('Posted batches are append-only — correct with a new batch');
    }
    const update: Partial<typeof schema.glJournalBatches.$inferInsert> = {
      updatedAt: new Date(),
    };
    if (body.businessDate !== undefined) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(body.businessDate)) {
        throw new BadRequestException('businessDate must be YYYY-MM-DD');
      }
      const { fiscalYear, period } = resolvePeriod(body.businessDate);
      update.businessDate = body.businessDate;
      update.fiscalYear = fiscalYear;
      update.period = period;
    }
    if (body.memo !== undefined) update.memo = body.memo ?? null;
    if (body.lines !== undefined) {
      await this.gl.validateLines(tenant.businessId!, body.lines, false);
      await this.db.delete(schema.glJournalLines).where(eq(schema.glJournalLines.batchId, id));
      await this.db.insert(schema.glJournalLines).values(
        body.lines.map((l) => ({
          businessId: tenant.businessId!,
          batchId: id,
          accountId: l.accountId,
          memo: l.memo ?? null,
          debitCents: l.debitCents ?? 0,
          creditCents: l.creditCents ?? 0,
        })),
      );
    }
    await this.db
      .update(schema.glJournalBatches)
      .set(update)
      .where(eq(schema.glJournalBatches.id, id));
    await this.audit.log({
      action: 'gl.batch.update',
      targetType: 'gl_journal_batch',
      targetId: id,
      after: { lineCount: body.lines?.length },
    });
    return this.hydrateBatch(tenant.businessId!, id);
  }

  @Post('journal-batches/:id/post')
  @RequirePermission('gl.post')
  async postBatch(@CurrentTenant() tenant: RequestTenantContext, @Param('id') id: string) {
    const batch = await this.mustGetBatch(tenant.businessId!, id);
    if (batch.status !== 'draft') throw new ForbiddenException('Batch is already posted');
    const lines = await this.db
      .select()
      .from(schema.glJournalLines)
      .where(eq(schema.glJournalLines.batchId, id));
    await this.gl.validateLines(
      tenant.businessId!,
      lines.map((l) => ({
        accountId: l.accountId,
        debitCents: l.debitCents,
        creditCents: l.creditCents,
      })),
      true,
    );
    await this.gl.assertPeriodOpen(tenant.businessId!, batch.fiscalYear, batch.period);
    await this.db
      .update(schema.glJournalBatches)
      .set({ status: 'posted', postedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.glJournalBatches.id, id));
    await this.audit.log({
      action: 'gl.batch.post',
      targetType: 'gl_journal_batch',
      targetId: id,
      after: { number: batch.number },
    });
    return this.hydrateBatch(tenant.businessId!, id);
  }

  // ---------------------------------------------------------- reports

  /** Posted activity summed per account for a year (optionally one period). */
  @Get('trial-balance')
  @RequirePermission('gl.view')
  async trialBalance(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('year') yearStr?: string,
    @Query('period') periodStr?: string,
  ) {
    const year = Number(yearStr) || new Date().getUTCFullYear();
    const period = periodStr ? Number(periodStr) : null;
    const conditions: SQL[] = [
      eq(schema.glJournalBatches.businessId, tenant.businessId!),
      eq(schema.glJournalBatches.status, 'posted'),
      eq(schema.glJournalBatches.fiscalYear, year),
    ];
    if (period != null) conditions.push(eq(schema.glJournalBatches.period, period));
    const rows = await this.db
      .select({
        accountId: schema.glAccounts.id,
        code: schema.glAccounts.code,
        name: schema.glAccounts.name,
        accountType: schema.glAccounts.accountType,
        debitCents: sql<number>`COALESCE(SUM(${schema.glJournalLines.debitCents}), 0)::int`,
        creditCents: sql<number>`COALESCE(SUM(${schema.glJournalLines.creditCents}), 0)::int`,
      })
      .from(schema.glJournalLines)
      .innerJoin(
        schema.glJournalBatches,
        eq(schema.glJournalBatches.id, schema.glJournalLines.batchId),
      )
      .innerJoin(schema.glAccounts, eq(schema.glAccounts.id, schema.glJournalLines.accountId))
      .where(and(...conditions))
      .groupBy(
        schema.glAccounts.id,
        schema.glAccounts.code,
        schema.glAccounts.name,
        schema.glAccounts.accountType,
      )
      .orderBy(asc(schema.glAccounts.code));
    const totals = rows.reduce(
      (t, r) => ({
        debitCents: t.debitCents + r.debitCents,
        creditCents: t.creditCents + r.creditCents,
      }),
      { debitCents: 0, creditCents: 0 },
    );
    return { fiscalYear: year, period, rows, totals };
  }

  /**
   * F277-lean account inquiry: one account, per-period totals for the
   * year, and the posted lines behind them (batch drill-through via
   * the batch id on every line).
   */
  @Get('accounts/:id/activity')
  @RequirePermission('gl.view')
  async accountActivity(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
    @Query('year') yearStr?: string,
  ) {
    const year = Number(yearStr) || new Date().getUTCFullYear();
    const [account] = await this.db
      .select()
      .from(schema.glAccounts)
      .where(
        and(eq(schema.glAccounts.id, id), eq(schema.glAccounts.businessId, tenant.businessId!)),
      )
      .limit(1);
    if (!account) throw new NotFoundException('Account not found');

    const byPeriod = await this.db
      .select({
        period: schema.glJournalBatches.period,
        debitCents: sql<number>`COALESCE(SUM(${schema.glJournalLines.debitCents}), 0)::int`,
        creditCents: sql<number>`COALESCE(SUM(${schema.glJournalLines.creditCents}), 0)::int`,
      })
      .from(schema.glJournalLines)
      .innerJoin(
        schema.glJournalBatches,
        eq(schema.glJournalBatches.id, schema.glJournalLines.batchId),
      )
      .where(
        and(
          eq(schema.glJournalBatches.businessId, tenant.businessId!),
          eq(schema.glJournalBatches.status, 'posted'),
          eq(schema.glJournalBatches.fiscalYear, year),
          eq(schema.glJournalLines.accountId, id),
        ),
      )
      .groupBy(schema.glJournalBatches.period)
      .orderBy(asc(schema.glJournalBatches.period));

    const lines = await this.db
      .select({
        batchId: schema.glJournalBatches.id,
        batchNumber: schema.glJournalBatches.number,
        batchType: schema.glJournalBatches.batchType,
        sourceType: schema.glJournalBatches.sourceType,
        businessDate: schema.glJournalBatches.businessDate,
        period: schema.glJournalBatches.period,
        memo: schema.glJournalLines.memo,
        debitCents: schema.glJournalLines.debitCents,
        creditCents: schema.glJournalLines.creditCents,
      })
      .from(schema.glJournalLines)
      .innerJoin(
        schema.glJournalBatches,
        eq(schema.glJournalBatches.id, schema.glJournalLines.batchId),
      )
      .where(
        and(
          eq(schema.glJournalBatches.businessId, tenant.businessId!),
          eq(schema.glJournalBatches.status, 'posted'),
          eq(schema.glJournalBatches.fiscalYear, year),
          eq(schema.glJournalLines.accountId, id),
        ),
      )
      .orderBy(desc(schema.glJournalBatches.businessDate))
      .limit(500);

    return { account, fiscalYear: year, byPeriod, lines };
  }

  // ------------------------------------------------------------ private

  /**
   * Zero every P&L account's net for the year into retained earnings
   * (run-01 F7, adapted: our latch is period 13, so adjustments are
   * included). Refuses when 'retained_earnings' is unmapped (anti-F1).
   */
  private async rollRetainedEarnings(businessId: string, fiscalYear: number): Promise<void> {
    const rows = await this.db
      .select({
        accountId: schema.glAccounts.id,
        code: schema.glAccounts.code,
        accountType: schema.glAccounts.accountType,
        debitCents: sql<number>`COALESCE(SUM(${schema.glJournalLines.debitCents}), 0)::int`,
        creditCents: sql<number>`COALESCE(SUM(${schema.glJournalLines.creditCents}), 0)::int`,
      })
      .from(schema.glJournalLines)
      .innerJoin(
        schema.glJournalBatches,
        eq(schema.glJournalBatches.id, schema.glJournalLines.batchId),
      )
      .innerJoin(schema.glAccounts, eq(schema.glAccounts.id, schema.glJournalLines.accountId))
      .where(
        and(
          eq(schema.glJournalBatches.businessId, businessId),
          eq(schema.glJournalBatches.status, 'posted'),
          eq(schema.glJournalBatches.fiscalYear, fiscalYear),
          sql`${schema.glAccounts.accountType} IN ('revenue', 'expense')`,
        ),
      )
      .groupBy(schema.glAccounts.id, schema.glAccounts.code, schema.glAccounts.accountType);

    const legs: { accountId: string; debitCents: number; creditCents: number; memo: string }[] = [];
    let netIncomeCents = 0;
    for (const r of rows) {
      const net = r.creditCents - r.debitCents; // credit-positive
      if (net === 0) continue;
      if (net > 0) {
        legs.push({
          accountId: r.accountId,
          debitCents: net,
          creditCents: 0,
          memo: `Close ${r.code}`,
        });
      } else {
        legs.push({
          accountId: r.accountId,
          debitCents: 0,
          creditCents: -net,
          memo: `Close ${r.code}`,
        });
      }
      netIncomeCents += net;
    }
    if (legs.length === 0) return; // nothing to roll (or already rolled)

    const [re] = await this.db
      .select({ id: schema.glAccounts.id })
      .from(schema.glAccounts)
      .where(
        and(
          eq(schema.glAccounts.businessId, businessId),
          eq(schema.glAccounts.systemKey, 'retained_earnings'),
          eq(schema.glAccounts.isActive, true),
        ),
      )
      .limit(1);
    if (!re) {
      throw new BadRequestException(
        "Map an active account to system key 'retained_earnings' before closing the year",
      );
    }
    if (netIncomeCents > 0) {
      legs.push({
        accountId: re.id,
        debitCents: 0,
        creditCents: netIncomeCents,
        memo: `Net income ${fiscalYear} to retained earnings`,
      });
    } else if (netIncomeCents < 0) {
      legs.push({
        accountId: re.id,
        debitCents: -netIncomeCents,
        creditCents: 0,
        memo: `Net loss ${fiscalYear} to retained earnings`,
      });
    }

    const number = await this.gl.generateBatchNumber(businessId, fiscalYear);
    const [batch] = await this.db
      .insert(schema.glJournalBatches)
      .values({
        businessId,
        number,
        status: 'posted',
        batchType: 'year_end',
        sourceType: 'year_end_roll',
        businessDate: `${fiscalYear}-12-31`,
        fiscalYear,
        period: 13,
        memo: `Year-end roll ${fiscalYear}: P&L into retained earnings`,
        postedAt: new Date(),
      })
      .returning();
    await this.db.insert(schema.glJournalLines).values(
      legs.map((l) => ({
        businessId,
        batchId: batch!.id,
        accountId: l.accountId,
        memo: l.memo,
        debitCents: l.debitCents,
        creditCents: l.creditCents,
      })),
    );
    await this.audit.log({
      action: 'gl.year_end.roll',
      targetType: 'gl_journal_batch',
      targetId: batch!.id,
      after: { fiscalYear, netIncomeCents, accountsClosed: legs.length - 1 },
    });
  }

  private validatePeriodRef(body: { fiscalYear?: number; period?: number }) {
    const { fiscalYear, period } = body;
    if (!Number.isInteger(fiscalYear) || fiscalYear! < 2000 || fiscalYear! > 2100) {
      throw new BadRequestException('fiscalYear must be a 4-digit year');
    }
    if (!Number.isInteger(period) || period! < 1 || period! > 13) {
      throw new BadRequestException('period must be 1-13');
    }
    return { fiscalYear: fiscalYear!, period: period! };
  }

  private async mustGetBatch(businessId: string, id: string) {
    const [row] = await this.db
      .select()
      .from(schema.glJournalBatches)
      .where(
        and(eq(schema.glJournalBatches.id, id), eq(schema.glJournalBatches.businessId, businessId)),
      )
      .limit(1);
    if (!row) throw new NotFoundException('Journal batch not found');
    return row;
  }

  private async hydrateBatch(businessId: string, id: string) {
    const batch = await this.mustGetBatch(businessId, id);
    const lines = await this.db
      .select({
        id: schema.glJournalLines.id,
        accountId: schema.glJournalLines.accountId,
        accountCode: schema.glAccounts.code,
        accountName: schema.glAccounts.name,
        memo: schema.glJournalLines.memo,
        debitCents: schema.glJournalLines.debitCents,
        creditCents: schema.glJournalLines.creditCents,
      })
      .from(schema.glJournalLines)
      .innerJoin(schema.glAccounts, eq(schema.glAccounts.id, schema.glJournalLines.accountId))
      .where(eq(schema.glJournalLines.batchId, id))
      .orderBy(asc(schema.glAccounts.code));
    const debitCents = lines.reduce((s, l) => s + l.debitCents, 0);
    const creditCents = lines.reduce((s, l) => s + l.creditCents, 0);
    return { ...batch, lines, debitCents, creditCents, balanced: debitCents === creditCents };
  }
}
