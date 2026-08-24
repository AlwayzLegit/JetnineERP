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
  };
}
