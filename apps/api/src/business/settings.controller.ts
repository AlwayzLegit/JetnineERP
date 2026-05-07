import { BadRequestException, Body, Controller, Get, Inject, Patch } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

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
}

interface UpdateBody {
  name?: string;
  defaultTaxRateBps?: number;
  receiptHeader?: string | null;
  receiptFooter?: string | null;
  // currencyCode is fixed to USD for MVP per PLAN §5.3; not editable.
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
  };
}
