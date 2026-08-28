import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';

/**
 * Shared GL mechanics (in-house GL slice 1): period resolution with
 * lazy materialization, the open-period posting gate, and batch
 * numbering. The journal-event derivation (slice 2) posts through the
 * same service so the gates can never diverge.
 */

export interface JournalLineInput {
  accountId: string;
  memo?: string | null;
  debitCents?: number;
  creditCents?: number;
}

/** Fiscal calendar: calendar months, presumed pending GAP Q4. */
export function resolvePeriod(businessDate: string): { fiscalYear: number; period: number } {
  const [y, m] = businessDate.split('-').map(Number);
  return { fiscalYear: y!, period: m! };
}

@Injectable()
export class GlService {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  /** Lazily materialize the 13 period rows for a fiscal year. */
  async ensureYear(businessId: string, fiscalYear: number): Promise<void> {
    const existing = await this.db
      .select({ period: schema.glPeriods.period })
      .from(schema.glPeriods)
      .where(
        and(
          eq(schema.glPeriods.businessId, businessId),
          eq(schema.glPeriods.fiscalYear, fiscalYear),
        ),
      );
    if (existing.length >= 13) return;
    const have = new Set(existing.map((p) => p.period));
    const missing = Array.from({ length: 13 }, (_, i) => i + 1).filter((p) => !have.has(p));
    if (missing.length === 0) return;
    await this.db
      .insert(schema.glPeriods)
      .values(missing.map((period) => ({ businessId, fiscalYear, period })))
      .onConflictDoNothing();
  }

  async periodStatus(businessId: string, fiscalYear: number, period: number): Promise<string> {
    await this.ensureYear(businessId, fiscalYear);
    const [row] = await this.db
      .select({ status: schema.glPeriods.status })
      .from(schema.glPeriods)
      .where(
        and(
          eq(schema.glPeriods.businessId, businessId),
          eq(schema.glPeriods.fiscalYear, fiscalYear),
          eq(schema.glPeriods.period, period),
        ),
      )
      .limit(1);
    return row?.status ?? 'open';
  }

  /** F4: posting into a closed period is a hard refusal, never a warning. */
  async assertPeriodOpen(businessId: string, fiscalYear: number, period: number): Promise<void> {
    const status = await this.periodStatus(businessId, fiscalYear, period);
    if (status !== 'open') {
      throw new BadRequestException(
        `Fiscal period ${fiscalYear}-${String(period).padStart(2, '0')} is closed — reopen it before posting`,
      );
    }
  }

  /**
   * Validate lines (one-sided, positive, active accounts of this
   * business) and return the totals. `requireBalanced` is the posting
   * gate; drafts may be lopsided while being written.
   */
  async validateLines(
    businessId: string,
    lines: JournalLineInput[],
    requireBalanced: boolean,
  ): Promise<{ debitCents: number; creditCents: number }> {
    if (lines.length === 0)
      throw new BadRequestException('A journal batch needs at least one line');
    let debitCents = 0;
    let creditCents = 0;
    for (const l of lines) {
      const debit = l.debitCents ?? 0;
      const credit = l.creditCents ?? 0;
      if (!Number.isInteger(debit) || !Number.isInteger(credit) || debit < 0 || credit < 0) {
        throw new BadRequestException('Line amounts must be non-negative integer cents');
      }
      if (debit > 0 === credit > 0) {
        throw new BadRequestException('Each line must be a debit XOR a credit (one side, > 0)');
      }
      if (!l.accountId) throw new BadRequestException('lines[].accountId is required');
      debitCents += debit;
      creditCents += credit;
    }
    const accountIds = [...new Set(lines.map((l) => l.accountId))];
    const accounts = await this.db
      .select({ id: schema.glAccounts.id, isActive: schema.glAccounts.isActive })
      .from(schema.glAccounts)
      .where(
        and(
          eq(schema.glAccounts.businessId, businessId),
          inArray(schema.glAccounts.id, accountIds),
        ),
      );
    const byId = new Map(accounts.map((a) => [a.id, a]));
    for (const id of accountIds) {
      const acc = byId.get(id);
      if (!acc) throw new BadRequestException(`GL account not found: ${id}`);
      if (!acc.isActive) throw new BadRequestException(`GL account is inactive: ${id}`);
    }
    if (requireBalanced && debitCents !== creditCents) {
      throw new BadRequestException(
        `Batch is out of balance: debits ${debitCents}¢ vs credits ${creditCents}¢`,
      );
    }
    return { debitCents, creditCents };
  }

  async generateBatchNumber(businessId: string, fiscalYear: number): Promise<string> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const rows = await this.db
        .select({ count: sql<number>`COUNT(*)::int` })
        .from(schema.glJournalBatches)
        .where(
          and(
            eq(schema.glJournalBatches.businessId, businessId),
            sql`${schema.glJournalBatches.number} LIKE ${`GL-${fiscalYear}-%`}`,
          ),
        );
      const seq = (rows[0]?.count ?? 0) + 1 + attempt;
      const candidate = `GL-${fiscalYear}-${String(seq).padStart(6, '0')}`;
      const [existing] = await this.db
        .select({ id: schema.glJournalBatches.id })
        .from(schema.glJournalBatches)
        .where(
          and(
            eq(schema.glJournalBatches.businessId, businessId),
            eq(schema.glJournalBatches.number, candidate),
          ),
        )
        .limit(1);
      if (!existing) return candidate;
    }
    throw new BadRequestException('failed to allocate a GL batch number');
  }

  /** The full period list for a year, materialized and ordered. */
  async yearPeriods(businessId: string, fiscalYear: number) {
    await this.ensureYear(businessId, fiscalYear);
    return this.db
      .select()
      .from(schema.glPeriods)
      .where(
        and(
          eq(schema.glPeriods.businessId, businessId),
          eq(schema.glPeriods.fiscalYear, fiscalYear),
        ),
      )
      .orderBy(asc(schema.glPeriods.period));
  }
}
