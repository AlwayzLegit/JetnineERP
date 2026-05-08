import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import { and, asc, eq, isNotNull } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface TaxClassRow {
  id: string;
  name: string;
  description: string | null;
  rateBps: number;
  isDefault: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface TaxClassRateRow {
  id: string;
  locationId: string;
  rateBps: number;
}

interface CreateBody {
  name?: string;
  description?: string | null;
  rateBps?: number;
  isDefault?: boolean;
}

type UpdateBody = CreateBody;

interface UpsertRateBody {
  rateBps?: number;
}

@TenantScoped()
@Controller('v1/business/tax-classes')
export class TaxClassesController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('business.settings.view')
  async list(@CurrentTenant() _tenant: RequestTenantContext): Promise<TaxClassRow[]> {
    const classes = await this.db
      .select()
      .from(schema.taxClasses)
      .orderBy(asc(schema.taxClasses.name));
    if (classes.length === 0) return [];
    // Per-class product counts so the UI can warn before deletion.
    const counts = await this.db
      .select({
        taxClassId: schema.products.taxClassId,
        count: schema.products.id,
      })
      .from(schema.products)
      .where(isNotNull(schema.products.taxClassId));
    const countMap = new Map<string, number>();
    for (const r of counts) {
      if (!r.taxClassId) continue;
      countMap.set(r.taxClassId, (countMap.get(r.taxClassId) ?? 0) + 1);
    }
    return classes.map((c) => ({
      id: c.id,
      name: c.name,
      description: c.description,
      rateBps: c.rateBps,
      isDefault: c.isDefault,
      productCount: countMap.get(c.id) ?? 0,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    }));
  }

  @Post()
  @RequirePermission('business.settings.update')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: CreateBody,
  ): Promise<TaxClassRow> {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('name is required');
    if (typeof body.rateBps !== 'number' || !Number.isInteger(body.rateBps) || body.rateBps < 0) {
      throw new BadRequestException('rateBps must be a non-negative integer');
    }
    if (body.rateBps > 100_000) {
      throw new BadRequestException('rateBps cannot exceed 100000 (1000%)');
    }

    // If this is the first class flagged default, clear any other
    // defaults so we maintain a single-default invariant.
    if (body.isDefault) {
      await this.db
        .update(schema.taxClasses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(eq(schema.taxClasses.isDefault, true));
    }

    let row;
    try {
      [row] = await this.db
        .insert(schema.taxClasses)
        .values({
          businessId: tenant.businessId!,
          name,
          description: body.description?.trim() || null,
          rateBps: body.rateBps,
          isDefault: body.isDefault ?? false,
        })
        .returning();
    } catch (err) {
      const root = unwrap(err);
      if (
        (root as { constraint_name?: string }).constraint_name === 'tax_classes_business_name_uniq'
      ) {
        throw new BadRequestException(`A tax class named "${name}" already exists`);
      }
      throw err;
    }
    if (!row) throw new BadRequestException('failed to create tax class');

    await this.audit.log({
      action: 'tax_class.create',
      targetType: 'tax_class',
      targetId: row.id,
      after: { name, rateBps: body.rateBps, isDefault: body.isDefault ?? false },
    });
    return { ...row, productCount: 0 };
  }

  @Patch(':id')
  @RequirePermission('business.settings.update')
  async update(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: UpdateBody,
  ): Promise<TaxClassRow> {
    const [existing] = await this.db
      .select()
      .from(schema.taxClasses)
      .where(eq(schema.taxClasses.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Tax class not found');

    const update: Partial<typeof schema.taxClasses.$inferInsert> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const next = body.name.trim();
      if (!next) throw new BadRequestException('name cannot be empty');
      if (next !== existing.name) {
        update.name = next;
        before.name = existing.name;
        after.name = next;
      }
    }
    if (body.description !== undefined) {
      const next = body.description?.trim() || null;
      if (next !== existing.description) {
        update.description = next;
        before.description = existing.description;
        after.description = next;
      }
    }
    if (body.rateBps !== undefined) {
      if (!Number.isInteger(body.rateBps) || body.rateBps < 0 || body.rateBps > 100_000) {
        throw new BadRequestException('rateBps must be a non-negative integer ≤ 100000');
      }
      if (body.rateBps !== existing.rateBps) {
        update.rateBps = body.rateBps;
        before.rateBps = existing.rateBps;
        after.rateBps = body.rateBps;
      }
    }
    if (body.isDefault !== undefined && body.isDefault !== existing.isDefault) {
      // Promoting this one demotes all others; demoting is allowed
      // standalone (the business may want zero defaults temporarily).
      if (body.isDefault) {
        await this.db.update(schema.taxClasses).set({ isDefault: false, updatedAt: new Date() });
      }
      update.isDefault = body.isDefault;
      before.isDefault = existing.isDefault;
      after.isDefault = body.isDefault;
    }

    if (Object.keys(after).length === 0) {
      const reread = await this.list(_tenant);
      const found = reread.find((c) => c.id === id);
      if (!found) throw new NotFoundException('Tax class not found after read');
      return found;
    }

    let updated;
    try {
      [updated] = await this.db
        .update(schema.taxClasses)
        .set(update)
        .where(eq(schema.taxClasses.id, id))
        .returning();
    } catch (err) {
      const root = unwrap(err);
      if (
        (root as { constraint_name?: string }).constraint_name === 'tax_classes_business_name_uniq'
      ) {
        throw new BadRequestException('A tax class with that name already exists');
      }
      throw err;
    }
    if (!updated) throw new NotFoundException('Tax class not found after update');

    await this.audit.log({
      action: 'tax_class.update',
      targetType: 'tax_class',
      targetId: id,
      before,
      after,
    });
    const reread = await this.list(_tenant);
    return reread.find((c) => c.id === id) ?? { ...updated, productCount: 0 };
  }

  @Delete(':id')
  @RequirePermission('business.settings.update')
  async delete(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.taxClasses)
      .where(eq(schema.taxClasses.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Tax class not found');

    // Products reference tax_classes ON DELETE SET NULL, so deleting
    // is safe — those products will revert to the location/business
    // default rate. Surface the impact in the audit row.
    const referencingProducts = await this.db
      .select({ id: schema.products.id })
      .from(schema.products)
      .where(eq(schema.products.taxClassId, id));

    await this.db.delete(schema.taxClasses).where(eq(schema.taxClasses.id, id));
    await this.audit.log({
      action: 'tax_class.delete',
      targetType: 'tax_class',
      targetId: id,
      before: { name: existing.name, rateBps: existing.rateBps },
      metadata: { detachedProductCount: referencingProducts.length },
    });
    return { deleted: true };
  }

  /**
   * Per-location overrides for a tax class. PUT semantics: if a row
   * for (taxClassId, locationId) exists, update it; otherwise insert.
   * Lets a merchant configure "Apparel: 0% in NJ, 8% in NY" with a
   * single round-trip per location.
   */
  @Get(':id/rates')
  @RequirePermission('business.settings.view')
  async listRates(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<TaxClassRateRow[]> {
    const [taxClass] = await this.db
      .select()
      .from(schema.taxClasses)
      .where(eq(schema.taxClasses.id, id))
      .limit(1);
    if (!taxClass) throw new NotFoundException('Tax class not found');
    const rows = await this.db
      .select({
        id: schema.taxClassRates.id,
        locationId: schema.taxClassRates.locationId,
        rateBps: schema.taxClassRates.rateBps,
      })
      .from(schema.taxClassRates)
      .where(eq(schema.taxClassRates.taxClassId, id));
    return rows;
  }

  @Put(':id/rates/:locationId')
  @RequirePermission('business.settings.update')
  async upsertRate(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') taxClassId: string,
    @Param('locationId') locationId: string,
    @Body() body: UpsertRateBody,
  ): Promise<TaxClassRateRow> {
    if (
      typeof body.rateBps !== 'number' ||
      !Number.isInteger(body.rateBps) ||
      body.rateBps < 0 ||
      body.rateBps > 100_000
    ) {
      throw new BadRequestException('rateBps must be a non-negative integer ≤ 100000');
    }
    const [taxClass] = await this.db
      .select()
      .from(schema.taxClasses)
      .where(eq(schema.taxClasses.id, taxClassId))
      .limit(1);
    if (!taxClass) throw new NotFoundException('Tax class not found');
    const [location] = await this.db
      .select()
      .from(schema.locations)
      .where(eq(schema.locations.id, locationId))
      .limit(1);
    if (!location) throw new NotFoundException('Location not found');

    const [existing] = await this.db
      .select()
      .from(schema.taxClassRates)
      .where(
        and(
          eq(schema.taxClassRates.taxClassId, taxClassId),
          eq(schema.taxClassRates.locationId, locationId),
        ),
      )
      .limit(1);

    let row;
    if (existing) {
      [row] = await this.db
        .update(schema.taxClassRates)
        .set({ rateBps: body.rateBps, updatedAt: new Date() })
        .where(eq(schema.taxClassRates.id, existing.id))
        .returning();
    } else {
      [row] = await this.db
        .insert(schema.taxClassRates)
        .values({
          businessId: tenant.businessId!,
          taxClassId,
          locationId,
          rateBps: body.rateBps,
        })
        .returning();
    }
    if (!row) throw new BadRequestException('failed to upsert tax class rate');

    await this.audit.log({
      action: 'tax_class.rate.upsert',
      targetType: 'tax_class',
      targetId: taxClassId,
      before: existing ? { rateBps: existing.rateBps } : null,
      after: { locationId, rateBps: body.rateBps },
    });
    return { id: row.id, locationId: row.locationId, rateBps: row.rateBps };
  }

  @Delete(':id/rates/:locationId')
  @RequirePermission('business.settings.update')
  async removeRate(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') taxClassId: string,
    @Param('locationId') locationId: string,
  ): Promise<{ deleted: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.taxClassRates)
      .where(
        and(
          eq(schema.taxClassRates.taxClassId, taxClassId),
          eq(schema.taxClassRates.locationId, locationId),
        ),
      )
      .limit(1);
    if (!existing) {
      // Idempotent — removing a row that doesn't exist is fine.
      return { deleted: true };
    }
    await this.db.delete(schema.taxClassRates).where(eq(schema.taxClassRates.id, existing.id));
    await this.audit.log({
      action: 'tax_class.rate.remove',
      targetType: 'tax_class',
      targetId: taxClassId,
      before: { locationId, rateBps: existing.rateBps },
    });
    return { deleted: true };
  }
}

function unwrap(err: unknown): unknown {
  let current: unknown = err;
  for (let i = 0; i < 5; i++) {
    if (
      current &&
      typeof current === 'object' &&
      'cause' in current &&
      (current as { cause?: unknown }).cause
    ) {
      current = (current as { cause: unknown }).cause;
    } else {
      return current;
    }
  }
  return current;
}
