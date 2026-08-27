import { BadRequestException, Body, Controller, Get, Inject, Patch } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { isSupportedCurrency, SUPPORTED_CURRENCIES } from '@jetnine/shared';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

/** White-label branding. All fields optional; null clears the field. */
export interface BusinessBranding {
  /** #rrggbb accent applied as the app's brand color for this tenant. */
  accentColor?: string | null;
  /** https URL rendered in the sidebar header. */
  logoUrl?: string | null;
  /** Display-name override for the shell + receipts; legal `name` stays. */
  publicName?: string | null;
}

interface BusinessSettings {
  id: string;
  slug: string;
  name: string;
  status: string;
  plan: string | null;
  currencyCode: string;
  defaultTaxRateBps: number;
  receiptHeader: string | null;
  receiptFooter: string | null;
  branding: BusinessBranding | null;
  ops: OpsSettings | null;
}

/** PLAN-POS-OPERATIONS operational knobs; all optional, admin-edited. */
interface OpsSettings {
  recyclingFeeCents?: number | null;
  invoiceHeaderNote?: string | null;
  invoiceFooterNote?: string | null;
  unlockRoleIds?: string[] | null;
  deliveryDailyCap?: number | null;
  poReplyTo?: string | null;
  /** G9: block delivery-ticket print above this balance due (null = off). */
  maxBalanceForTicketPrintCents?: number | null;
  /** G11: auto-clear matched invoices within this variance (null = manual). */
  invoiceVarianceToleranceCents?: number | null;
  /** G11: hide expected quantities on the receiving grid. */
  blindReceiving?: boolean | null;
  /** G12: optional per-day piece budget for the trucks. */
  deliveryDailyPieceCap?: number | null;
  /** G12: optional per-day capacity-unit budget (variant capacityUnits). */
  deliveryDailyCapacityUnits?: number | null;
  /** G12: zip-prefix → route map ("912" → "Glendale AM"). */
  zipRoutes?: Record<string, string> | null;
  /** B14: how contested stock is prioritized when backfilling Pending
   * lines — 'delivery_date' (owner default) or 'order_date'. */
  reserveBasis?: 'delivery_date' | 'order_date' | null;
  /** I4 (RTN-040): days after completion a return is allowed without a
   * manager override (null = no window, returns always allowed). */
  returnWindowDays?: number | null;
  /** Exchange pack: % of the return credit charged as a restocking fee
   * on exchanges (null/0 = none). Overridable per exchange with its own
   * permission. */
  restockingFeePercent?: number | null;
  /** Exchange pack (E1): hold every new exchange for approval. */
  exchangeHoldAtEntry?: boolean | null;
  /** J4 (XFR-052 / CFG-POS-AUTOSCHED): blank disables auto transfers;
   * 0 is valid and means same-day + 1 per the XFR-053 formula. */
  autoScheduleDays?: number | null;
  /** REPL-040: nightly auto-replenishment PO drafts (off by default). */
  autoReplenishmentEnabled?: boolean | null;
  /** G6 three-tier price-variance thresholds (defaults 5% / $50 / 15%). */
  priceVariance?: {
    tier1Pct?: number | null;
    tier1MaxCents?: number | null;
    tier2Pct?: number | null;
  } | null;
}

interface UpdateBody {
  name?: string;
  defaultTaxRateBps?: number;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  /**
   * ISO 4217 code from the curated set (`SUPPORTED_CURRENCIES`).
   * Validated against that list; unknown codes are rejected 400 so a
   * stale client can't drop the business into a state where balances
   * render with an unsupported symbol.
   */
  currencyCode?: string;
  branding?: BusinessBranding;
  ops?: OpsSettings;
}

function validateOps(input: OpsSettings): OpsSettings {
  const out: OpsSettings = {};
  if (input.recyclingFeeCents !== undefined) {
    if (
      input.recyclingFeeCents !== null &&
      (!Number.isInteger(input.recyclingFeeCents) || input.recyclingFeeCents < 0)
    ) {
      throw new BadRequestException('ops.recyclingFeeCents must be a non-negative integer');
    }
    out.recyclingFeeCents = input.recyclingFeeCents;
  }
  if (input.deliveryDailyCap !== undefined) {
    if (
      input.deliveryDailyCap !== null &&
      (!Number.isInteger(input.deliveryDailyCap) || input.deliveryDailyCap < 1)
    ) {
      throw new BadRequestException('ops.deliveryDailyCap must be a positive integer');
    }
    out.deliveryDailyCap = input.deliveryDailyCap;
  }
  if (input.invoiceHeaderNote !== undefined) out.invoiceHeaderNote = input.invoiceHeaderNote;
  if (input.invoiceFooterNote !== undefined) out.invoiceFooterNote = input.invoiceFooterNote;
  if (input.poReplyTo !== undefined) out.poReplyTo = input.poReplyTo;
  if (input.unlockRoleIds !== undefined) {
    if (input.unlockRoleIds !== null && !Array.isArray(input.unlockRoleIds)) {
      throw new BadRequestException('ops.unlockRoleIds must be an array of role ids');
    }
    out.unlockRoleIds = input.unlockRoleIds;
  }
  if (input.maxBalanceForTicketPrintCents !== undefined) {
    if (
      input.maxBalanceForTicketPrintCents !== null &&
      (!Number.isInteger(input.maxBalanceForTicketPrintCents) ||
        input.maxBalanceForTicketPrintCents < 0)
    ) {
      throw new BadRequestException(
        'ops.maxBalanceForTicketPrintCents must be a non-negative integer',
      );
    }
    out.maxBalanceForTicketPrintCents = input.maxBalanceForTicketPrintCents;
  }
  if (input.invoiceVarianceToleranceCents !== undefined) {
    if (
      input.invoiceVarianceToleranceCents !== null &&
      (!Number.isInteger(input.invoiceVarianceToleranceCents) ||
        input.invoiceVarianceToleranceCents < 0)
    ) {
      throw new BadRequestException(
        'ops.invoiceVarianceToleranceCents must be a non-negative integer',
      );
    }
    out.invoiceVarianceToleranceCents = input.invoiceVarianceToleranceCents;
  }
  if (input.blindReceiving !== undefined) {
    if (input.blindReceiving !== null && typeof input.blindReceiving !== 'boolean') {
      throw new BadRequestException('ops.blindReceiving must be a boolean');
    }
    out.blindReceiving = input.blindReceiving;
  }
  for (const key of ['deliveryDailyPieceCap', 'deliveryDailyCapacityUnits'] as const) {
    if (input[key] !== undefined) {
      if (input[key] !== null && (!Number.isInteger(input[key]) || (input[key] as number) < 1)) {
        throw new BadRequestException(`ops.${key} must be a positive integer`);
      }
      out[key] = input[key];
    }
  }
  if (input.zipRoutes !== undefined) {
    if (input.zipRoutes !== null) {
      if (typeof input.zipRoutes !== 'object' || Array.isArray(input.zipRoutes)) {
        throw new BadRequestException('ops.zipRoutes must be an object of prefix → route');
      }
      for (const [prefix, route] of Object.entries(input.zipRoutes)) {
        if (!/^\d{1,5}$/.test(prefix) || typeof route !== 'string' || !route.trim()) {
          throw new BadRequestException(
            'ops.zipRoutes keys must be 1–5 digit zip prefixes with non-empty route names',
          );
        }
      }
    }
    out.zipRoutes = input.zipRoutes;
  }
  if (input.reserveBasis !== undefined) {
    if (
      input.reserveBasis !== null &&
      input.reserveBasis !== 'delivery_date' &&
      input.reserveBasis !== 'order_date'
    ) {
      throw new BadRequestException("ops.reserveBasis must be 'delivery_date' or 'order_date'");
    }
    out.reserveBasis = input.reserveBasis;
  }
  if (input.returnWindowDays !== undefined) {
    if (
      input.returnWindowDays !== null &&
      (!Number.isInteger(input.returnWindowDays) || input.returnWindowDays < 1)
    ) {
      throw new BadRequestException('ops.returnWindowDays must be a positive integer or null');
    }
    out.returnWindowDays = input.returnWindowDays;
  }
  if (input.restockingFeePercent !== undefined) {
    if (
      input.restockingFeePercent !== null &&
      (typeof input.restockingFeePercent !== 'number' ||
        !Number.isFinite(input.restockingFeePercent) ||
        input.restockingFeePercent < 0 ||
        input.restockingFeePercent > 100)
    ) {
      throw new BadRequestException('ops.restockingFeePercent must be between 0 and 100, or null');
    }
    out.restockingFeePercent = input.restockingFeePercent;
  }
  if (input.exchangeHoldAtEntry !== undefined) {
    if (input.exchangeHoldAtEntry !== null && typeof input.exchangeHoldAtEntry !== 'boolean') {
      throw new BadRequestException('ops.exchangeHoldAtEntry must be a boolean or null');
    }
    out.exchangeHoldAtEntry = input.exchangeHoldAtEntry;
  }
  if (input.autoScheduleDays !== undefined) {
    if (
      input.autoScheduleDays !== null &&
      (!Number.isInteger(input.autoScheduleDays) || input.autoScheduleDays < 0)
    ) {
      throw new BadRequestException('ops.autoScheduleDays must be a non-negative integer or null');
    }
    out.autoScheduleDays = input.autoScheduleDays;
  }
  if (input.autoReplenishmentEnabled !== undefined) {
    if (
      input.autoReplenishmentEnabled !== null &&
      typeof input.autoReplenishmentEnabled !== 'boolean'
    ) {
      throw new BadRequestException('ops.autoReplenishmentEnabled must be a boolean or null');
    }
    out.autoReplenishmentEnabled = input.autoReplenishmentEnabled;
  }
  if (input.priceVariance !== undefined) {
    if (input.priceVariance !== null) {
      const pv = input.priceVariance;
      for (const [key, val] of Object.entries(pv) as [string, number | null | undefined][]) {
        if (val != null && (typeof val !== 'number' || !Number.isFinite(val) || val < 0)) {
          throw new BadRequestException(`ops.priceVariance.${key} must be a non-negative number`);
        }
      }
      if (pv.tier1Pct != null && pv.tier2Pct != null && pv.tier2Pct < pv.tier1Pct) {
        throw new BadRequestException('ops.priceVariance.tier2Pct must be ≥ tier1Pct');
      }
    }
    out.priceVariance = input.priceVariance;
  }
  return out;
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

function validateBranding(input: BusinessBranding): BusinessBranding {
  const out: BusinessBranding = {};
  if (input.accentColor !== undefined) {
    if (input.accentColor !== null && !HEX_COLOR_RE.test(input.accentColor)) {
      throw new BadRequestException('branding.accentColor must be a #rrggbb hex color');
    }
    out.accentColor = input.accentColor;
  }
  if (input.logoUrl !== undefined) {
    if (input.logoUrl !== null) {
      let url: URL;
      try {
        url = new URL(input.logoUrl);
      } catch {
        throw new BadRequestException('branding.logoUrl must be a valid URL');
      }
      if (url.protocol !== 'https:') {
        throw new BadRequestException('branding.logoUrl must be https');
      }
      if (input.logoUrl.length > 2000) {
        throw new BadRequestException('branding.logoUrl too long');
      }
    }
    out.logoUrl = input.logoUrl;
  }
  if (input.publicName !== undefined) {
    if (input.publicName !== null) {
      const trimmed = input.publicName.trim();
      if (trimmed.length === 0 || trimmed.length > 120) {
        throw new BadRequestException('branding.publicName must be 1–120 characters');
      }
      out.publicName = trimmed;
    } else {
      out.publicName = null;
    }
  }
  return out;
}

@TenantScoped()
@Controller('v1/business/settings')
export class SettingsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('business.settings.view')
  async get(@CurrentTenant() tenant: RequestTenantContext): Promise<BusinessSettings> {
    const [b] = await this.db
      .select()
      .from(schema.businesses)
      .where(eq(schema.businesses.id, tenant.businessId!))
      .limit(1);
    if (!b) throw new BadRequestException('Business not found');
    return toSettings(b);
  }

  @Patch()
  @RequirePermission('business.settings.update')
  async update(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: UpdateBody,
  ): Promise<BusinessSettings> {
    const [existing] = await this.db
      .select()
      .from(schema.businesses)
      .where(eq(schema.businesses.id, tenant.businessId!))
      .limit(1);
    if (!existing) throw new BadRequestException('Business not found');

    const update: Partial<typeof schema.businesses.$inferInsert> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const trimmed = body.name.trim();
      if (!trimmed) throw new BadRequestException('name cannot be empty');
      if (trimmed !== existing.name) {
        update.name = trimmed;
        before.name = existing.name;
        after.name = trimmed;
      }
    }
    if (body.defaultTaxRateBps !== undefined) {
      if (!Number.isInteger(body.defaultTaxRateBps) || body.defaultTaxRateBps < 0) {
        throw new BadRequestException('defaultTaxRateBps must be a non-negative integer');
      }
      if (body.defaultTaxRateBps !== existing.defaultTaxRateBps) {
        update.defaultTaxRateBps = body.defaultTaxRateBps;
        before.defaultTaxRateBps = existing.defaultTaxRateBps;
        after.defaultTaxRateBps = body.defaultTaxRateBps;
      }
    }
    if (body.receiptHeader !== undefined && body.receiptHeader !== existing.receiptHeader) {
      update.receiptHeader = body.receiptHeader;
      before.receiptHeader = existing.receiptHeader;
      after.receiptHeader = body.receiptHeader;
    }
    if (body.receiptFooter !== undefined && body.receiptFooter !== existing.receiptFooter) {
      update.receiptFooter = body.receiptFooter;
      before.receiptFooter = existing.receiptFooter;
      after.receiptFooter = body.receiptFooter;
    }
    if (body.currencyCode !== undefined) {
      const next = body.currencyCode.toUpperCase();
      if (!isSupportedCurrency(next)) {
        throw new BadRequestException(
          `currencyCode must be one of: ${SUPPORTED_CURRENCIES.join(', ')}`,
        );
      }
      if (next !== existing.currencyCode) {
        update.currencyCode = next;
        before.currencyCode = existing.currencyCode;
        after.currencyCode = next;
      }
    }
    if (body.branding !== undefined) {
      // Merge field-by-field: PATCHing one branding field must not wipe
      // the others; explicit null clears a field.
      const patch = validateBranding(body.branding);
      const current = (existing.brandingJson ?? {}) as BusinessBranding;
      const merged: BusinessBranding = { ...current, ...patch };
      for (const key of Object.keys(merged) as (keyof BusinessBranding)[]) {
        if (merged[key] == null) delete merged[key];
      }
      const next = Object.keys(merged).length > 0 ? merged : null;
      if (JSON.stringify(next) !== JSON.stringify(existing.brandingJson ?? null)) {
        update.brandingJson = next;
        before.branding = existing.brandingJson ?? null;
        after.branding = next;
      }
    }

    if (body.ops !== undefined) {
      // Same merge semantics as branding: field-by-field, null clears.
      const patch = validateOps(body.ops);
      const current = (existing.opsSettingsJson ?? {}) as OpsSettings;
      const merged: OpsSettings = { ...current, ...patch };
      for (const key of Object.keys(merged) as (keyof OpsSettings)[]) {
        if (merged[key] == null) delete merged[key];
      }
      const next = Object.keys(merged).length > 0 ? merged : null;
      if (JSON.stringify(next) !== JSON.stringify(existing.opsSettingsJson ?? null)) {
        update.opsSettingsJson = next;
        before.ops = existing.opsSettingsJson ?? null;
        after.ops = next;
      }
    }

    if (Object.keys(after).length === 0) return toSettings(existing);

    const [updated] = await this.db
      .update(schema.businesses)
      .set(update)
      .where(eq(schema.businesses.id, tenant.businessId!))
      .returning();
    if (!updated) throw new BadRequestException('Business not found after update');

    await this.audit.log({
      action: 'business.settings.update',
      targetType: 'business',
      targetId: updated.id,
      before,
      after,
    });

    return toSettings(updated);
  }
}

function toSettings(b: typeof schema.businesses.$inferSelect): BusinessSettings {
  return {
    id: b.id,
    slug: b.slug,
    name: b.name,
    status: b.status,
    plan: b.plan ?? null,
    currencyCode: b.currencyCode,
    defaultTaxRateBps: b.defaultTaxRateBps,
    receiptHeader: b.receiptHeader ?? null,
    receiptFooter: b.receiptFooter ?? null,
    branding: (b.brandingJson as BusinessBranding | null) ?? null,
    ops: (b.opsSettingsJson as OpsSettings | null) ?? null,
  };
}
