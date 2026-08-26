import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';
import { ExceptionsService } from './exceptions.service';
import { SecurityOverrideService, type OverrideCredentials } from './security-override.service';

/** One priced line as the variance gate sees it, whatever wrote it. */
export interface PricedLine {
  quantity: number;
  unitPriceCents: number;
  lineDiscountCents: number;
  lineType: string;
  listPriceCents: number;
  costCents: number | null;
  description: string;
}

export interface PriceControlBody {
  priceReasonCodeId?: string;
  priceReason?: string;
  override?: OverrideCredentials;
}

/**
 * The G6 price-variance gate, shared by every path that can discount:
 * sales orders, order line edits, AND the register (`POST /v1/sales`).
 *
 * It lived on OrdersController until the 2026-08-26 QA pass found the
 * register bypassing it entirely — including New Sale's own fully-paid
 * take-with fast lane, which posts a register sale. A control that only
 * one of two doors honours is not a control, so it now sits in one
 * service both doors call.
 */
@Injectable()
export class PriceVarianceService {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(SecurityOverrideService) private readonly overrides: SecurityOverrideService,
    @Inject(ExceptionsService) private readonly exceptions: ExceptionsService,
  ) {}

  /**
   * G6 three-tier price variance (PLAN-STORIS-GAP §5 / amendment A6),
   * applied to line price overrides, line discounts, and the order
   * discount against catalog list prices:
   *
   *   tier 1 — ≤ tier1Pct (5%) OR ≤ tier1MaxCents ($50): logged only.
   *   tier 2 — up to tier2Pct (15%): a coded reason is required
   *            (class `exception`) and the discount hits the register.
   *   tier 3 — beyond tier2Pct, or selling below cost: a manager
   *            security override (`orders.price_override`) on top.
   *
   * Thresholds are admin-editable via ops settings `priceVariance`.
   */
  async enforce(
    businessId: string,
    priced: readonly PricedLine[],
    orderDiscountCents: number,
    body: PriceControlBody,
    context: { action: string; entityType?: string; entityId?: string },
  ): Promise<void> {
    const [biz] = await this.db
      .select({ opsSettingsJson: schema.businesses.opsSettingsJson })
      .from(schema.businesses)
      .where(eq(schema.businesses.id, businessId))
      .limit(1);
    const pv = (
      (biz?.opsSettingsJson ?? {}) as {
        priceVariance?: { tier1Pct?: number; tier1MaxCents?: number; tier2Pct?: number } | null;
      }
    ).priceVariance;
    const tier1Pct = pv?.tier1Pct ?? 5;
    const tier1MaxCents = pv?.tier1MaxCents ?? 5000;
    const tier2Pct = pv?.tier2Pct ?? 15;

    let worstTier = 1;
    let belowCost = false;
    let totalDiscountCents = 0;
    let listTotalCents = 0;
    const flagged: string[] = [];

    for (const l of priced) {
      if (l.lineType === 'custom') continue;
      const listTotal = l.listPriceCents * l.quantity;
      listTotalCents += listTotal;
      const effectiveTotal = l.unitPriceCents * l.quantity - l.lineDiscountCents;
      const discount = listTotal - effectiveTotal;
      if (discount <= 0) continue;
      totalDiscountCents += discount;
      const pct = listTotal > 0 ? (discount / listTotal) * 100 : 0;
      const lineBelowCost = l.costCents != null && effectiveTotal / l.quantity < l.costCents;
      if (lineBelowCost) belowCost = true;
      const tier =
        pct > tier2Pct || lineBelowCost ? 3 : pct > tier1Pct && discount > tier1MaxCents ? 2 : 1;
      if (tier > 1) flagged.push(`${l.description}: -${pct.toFixed(1)}%`);
      worstTier = Math.max(worstTier, tier);
    }
    if (orderDiscountCents > 0 && listTotalCents > 0) {
      const pct = (orderDiscountCents / listTotalCents) * 100;
      const tier =
        pct > tier2Pct ? 3 : pct > tier1Pct && orderDiscountCents > tier1MaxCents ? 2 : 1;
      if (tier > 1) flagged.push(`order discount: -${pct.toFixed(1)}%`);
      worstTier = Math.max(worstTier, tier);
      totalDiscountCents += orderDiscountCents;
    }
    if (worstTier === 1) return;

    if (worstTier === 3) {
      await this.overrides.require({
        permission: 'orders.price_override',
        action: `${context.action}: ${flagged.join('; ')}${belowCost ? ' (below cost)' : ''}`,
        entityType: context.entityType,
        entityId: context.entityId,
        override: body.override,
      });
    }
    if (
      !body.priceReasonCodeId &&
      !body.priceReason?.trim() &&
      !body.override?.reasonCodeId &&
      !body.override?.reason?.trim()
    ) {
      throw new BadRequestException({
        statusCode: 400,
        code: 'REASON_REQUIRED',
        usageClass: 'exception',
        message: `This discount (${flagged.join('; ')}) needs a reason`,
      });
    }
    const reason = await this.overrides.resolveReason('exception', {
      reasonCodeId: body.priceReasonCodeId ?? body.override?.reasonCodeId,
      reason: body.priceReason ?? body.override?.reason,
    });
    await this.exceptions.record({
      type: 'price_override',
      severity: belowCost ? 'critical' : worstTier === 3 ? 'warning' : 'info',
      entityType: context.entityType,
      entityId: context.entityId,
      summary: `${context.action}: ${flagged.join('; ')} — $${(totalDiscountCents / 100).toFixed(2)} off list${belowCost ? ', BELOW COST' : ''}`,
      metadata: {
        totalDiscountCents,
        tier: worstTier,
        belowCost,
        reasonCode: reason.reasonCode,
        reason: reason.reasonText,
      },
    });
  }
}
