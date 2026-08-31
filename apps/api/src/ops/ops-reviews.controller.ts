import { BadRequestException, Body, Controller, Get, Inject, Post, Query } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentTenant, CurrentUser } from '../auth/current-user.decorator';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { AuditService } from '../audit/audit.service';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

/** The feed sources a review may be recorded against. */
const SUBJECT_TYPES = new Set([
  'negative_stock',
  'take_with_open',
  'drawer_variance',
  'refund',
  'return',
  'exchange',
  'write_off',
  'inventory_movement',
  'gift_card_adjustment',
  'security_override',
  'exception',
]);

const MAX_BULK = 100;

interface ClearSubject {
  subjectType: string;
  subjectId: string;
}

interface BulkClearBody {
  subjects?: ClearSubject[];
  note?: string | null;
}

interface BulkClearResult {
  cleared: number;
  /** Subjects that were already signed off — reported, never an error. */
  alreadyCleared: ClearSubject[];
  reviewedAt: Date;
}

/**
 * Sign-off for the operations feed (owner 2026-08-31). The Operations
 * member does not approve anything — the approval permissions stay with
 * the Manager — but every row they read gets cleared with their name on
 * it, so "nobody looked at that" stops being a possible answer.
 *
 * `exception` subjects clear through `exception_events.acknowledged_at`,
 * which already exists and is already reportable; everything else is
 * stamped in `ops_reviews`. Clearing is idempotent: re-clearing a
 * subject reports it as already cleared rather than failing the batch,
 * because two people pressing the button on the same row is a race, not
 * an error.
 */
@TenantScoped()
@Controller('v1/ops-reviews')
export class OpsReviewsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  /** What has been signed off lately, newest first. */
  @Get()
  @RequirePermission('ops.dashboard.view')
  async list(@CurrentTenant() tenant: RequestTenantContext, @Query('limit') limitStr?: string) {
    const limit = Math.min(200, Math.max(1, Number(limitStr) || 50));
    return this.db
      .select({
        id: schema.opsReviews.id,
        subjectType: schema.opsReviews.subjectType,
        subjectId: schema.opsReviews.subjectId,
        reviewedAt: schema.opsReviews.reviewedAt,
        note: schema.opsReviews.note,
        reviewedByName: schema.users.name,
        reviewedByEmail: schema.users.email,
      })
      .from(schema.opsReviews)
      .leftJoin(schema.users, eq(schema.users.id, schema.opsReviews.reviewedByUserId))
      .where(eq(schema.opsReviews.businessId, tenant.businessId!))
      .orderBy(desc(schema.opsReviews.reviewedAt))
      .limit(limit);
  }

  @Post('bulk')
  @RequirePermission('ops.review.clear')
  async clear(
    @CurrentTenant() tenant: RequestTenantContext,
    @CurrentUser() actor: CurrentUserPayload,
    @Body() body: BulkClearBody,
  ): Promise<BulkClearResult> {
    const businessId = tenant.businessId!;
    const subjects = body.subjects ?? [];
    if (subjects.length === 0) {
      throw new BadRequestException('subjects must hold at least one row to clear');
    }
    if (subjects.length > MAX_BULK) {
      throw new BadRequestException(`subjects is capped at ${MAX_BULK} rows per request`);
    }
    for (const s of subjects) {
      if (!s?.subjectType || !s?.subjectId) {
        throw new BadRequestException('every subject needs a subjectType and a subjectId');
      }
      if (!SUBJECT_TYPES.has(s.subjectType)) {
        throw new BadRequestException(`unknown subjectType: ${s.subjectType}`);
      }
    }
    const note = body.note?.trim() ? body.note.trim() : null;
    const reviewedAt = new Date();
    const userId = actor?.id ?? null;

    // De-duplicate inside the request: a double-click should not make
    // the unique index decide the outcome.
    const seen = new Set<string>();
    const unique = subjects.filter((s) => {
      const key = `${s.subjectType}:${s.subjectId}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const exceptionIds = unique
      .filter((s) => s.subjectType === 'exception')
      .map((s) => s.subjectId);
    const reviewRows = unique.filter((s) => s.subjectType !== 'exception');
    const alreadyCleared: ClearSubject[] = [];
    let cleared = 0;

    if (exceptionIds.length > 0) {
      // Only rows still open move; the rest are reported back as-is.
      const open = await this.db
        .select({ id: schema.exceptionEvents.id })
        .from(schema.exceptionEvents)
        .where(
          and(
            eq(schema.exceptionEvents.businessId, businessId),
            inArray(schema.exceptionEvents.id, exceptionIds),
            sql`${schema.exceptionEvents.acknowledgedAt} IS NULL`,
          ),
        );
      const openIds = new Set(open.map((r) => r.id));
      for (const id of exceptionIds) {
        if (!openIds.has(id)) alreadyCleared.push({ subjectType: 'exception', subjectId: id });
      }
      if (openIds.size > 0) {
        await this.db
          .update(schema.exceptionEvents)
          .set({ acknowledgedAt: reviewedAt, acknowledgedByUserId: userId })
          .where(
            and(
              eq(schema.exceptionEvents.businessId, businessId),
              inArray(schema.exceptionEvents.id, [...openIds]),
            ),
          );
        cleared += openIds.size;
      }
    }

    if (reviewRows.length > 0) {
      const inserted = await this.db
        .insert(schema.opsReviews)
        .values(
          reviewRows.map((s) => ({
            businessId,
            subjectType: s.subjectType,
            subjectId: s.subjectId,
            reviewedByUserId: userId,
            reviewedAt,
            note,
          })),
        )
        .onConflictDoNothing({
          target: [
            schema.opsReviews.businessId,
            schema.opsReviews.subjectType,
            schema.opsReviews.subjectId,
          ],
        })
        .returning({
          subjectType: schema.opsReviews.subjectType,
          subjectId: schema.opsReviews.subjectId,
        });
      cleared += inserted.length;
      const insertedKeys = new Set(inserted.map((r) => `${r.subjectType}:${r.subjectId}`));
      for (const s of reviewRows) {
        if (!insertedKeys.has(`${s.subjectType}:${s.subjectId}`)) alreadyCleared.push(s);
      }
    }

    await this.audit.log({
      action: 'ops_review.clear',
      targetType: 'ops_review',
      metadata: {
        cleared,
        alreadyCleared: alreadyCleared.length,
        subjects: unique.map((s) => `${s.subjectType}:${s.subjectId}`),
        note,
      },
    });

    return { cleared, alreadyCleared, reviewedAt };
  }
}
