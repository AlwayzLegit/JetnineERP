import {
  BadRequestException,
  Body,
  Controller,
  ConflictException,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

/**
 * Brand + Collection reference data (STORIS Brand Settings / Collection
 * Settings, lean). Convention: no dedicated permission — anyone who can
 * edit products (`products.update`) can define the labels products carry,
 * mirroring where STORIS files these under Product Settings. Deactivate,
 * never delete: products reference them with set-null FKs, but history
 * (printed invoices) reads better when the label survives.
 */

function cleanName(raw: unknown): string {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    throw new BadRequestException('name is required');
  }
  const name = raw.trim();
  if (name.length > 120) throw new BadRequestException('name must be 120 characters or fewer');
  return name;
}

@TenantScoped()
@Controller('v1/brands')
export class BrandsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('products.view')
  async list(): Promise<{ id: string; name: string; isActive: boolean }[]> {
    return this.db
      .select({
        id: schema.brands.id,
        name: schema.brands.name,
        isActive: schema.brands.isActive,
      })
      .from(schema.brands)
      .orderBy(asc(schema.brands.name));
  }

  @Post()
  @RequirePermission('products.update')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: { name?: string },
  ): Promise<{ id: string; name: string; isActive: boolean }> {
    const name = cleanName(body.name);
    const [existing] = await this.db
      .select({ id: schema.brands.id })
      .from(schema.brands)
      .where(eq(schema.brands.name, name))
      .limit(1);
    if (existing) throw new ConflictException(`Brand "${name}" already exists`);
    const [row] = await this.db
      .insert(schema.brands)
      .values({ businessId: tenant.businessId!, name })
      .returning();
    if (!row) throw new BadRequestException('failed to create brand');
    await this.audit.log({
      action: 'brand.create',
      targetType: 'brand',
      targetId: row.id,
      after: { name },
    });
    return { id: row.id, name: row.name, isActive: row.isActive };
  }

  @Patch(':id')
  @RequirePermission('products.update')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; isActive?: boolean },
  ): Promise<{ updated: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.brands)
      .where(eq(schema.brands.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Brand not found');
    const update: Partial<typeof schema.brands.$inferInsert> = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = cleanName(body.name);
      if (name !== existing.name) {
        update.name = name;
        before.name = existing.name;
        after.name = name;
      }
    }
    if (body.isActive !== undefined && body.isActive !== existing.isActive) {
      update.isActive = body.isActive;
      before.isActive = existing.isActive;
      after.isActive = body.isActive;
    }
    if (Object.keys(after).length === 0) return { updated: true };
    await this.db.update(schema.brands).set(update).where(eq(schema.brands.id, id));
    await this.audit.log({
      action: 'brand.update',
      targetType: 'brand',
      targetId: id,
      before,
      after,
    });
    return { updated: true };
  }
}

@TenantScoped()
@Controller('v1/collections')
export class CollectionsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('products.view')
  async list(): Promise<
    {
      id: string;
      name: string;
      vendorId: string | null;
      vendorName: string | null;
      isActive: boolean;
    }[]
  > {
    return this.db
      .select({
        id: schema.collections.id,
        name: schema.collections.name,
        vendorId: schema.collections.vendorId,
        vendorName: schema.vendors.name,
        isActive: schema.collections.isActive,
      })
      .from(schema.collections)
      .leftJoin(schema.vendors, eq(schema.vendors.id, schema.collections.vendorId))
      .orderBy(asc(schema.collections.name));
  }

  @Post()
  @RequirePermission('products.update')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: { name?: string; vendorId?: string | null },
  ): Promise<{ id: string; name: string; vendorId: string | null; isActive: boolean }> {
    const name = cleanName(body.name);
    const [existing] = await this.db
      .select({ id: schema.collections.id })
      .from(schema.collections)
      .where(eq(schema.collections.name, name))
      .limit(1);
    if (existing) throw new ConflictException(`Collection "${name}" already exists`);
    if (body.vendorId) {
      const [vendor] = await this.db
        .select({ id: schema.vendors.id })
        .from(schema.vendors)
        .where(eq(schema.vendors.id, body.vendorId))
        .limit(1);
      if (!vendor) throw new BadRequestException('vendorId does not match a vendor');
    }
    const [row] = await this.db
      .insert(schema.collections)
      .values({ businessId: tenant.businessId!, name, vendorId: body.vendorId ?? null })
      .returning();
    if (!row) throw new BadRequestException('failed to create collection');
    await this.audit.log({
      action: 'collection.create',
      targetType: 'collection',
      targetId: row.id,
      after: { name, vendorId: row.vendorId },
    });
    return { id: row.id, name: row.name, vendorId: row.vendorId, isActive: row.isActive };
  }

  @Patch(':id')
  @RequirePermission('products.update')
  async update(
    @Param('id') id: string,
    @Body() body: { name?: string; vendorId?: string | null; isActive?: boolean },
  ): Promise<{ updated: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.collections)
      .where(eq(schema.collections.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Collection not found');
    const update: Partial<typeof schema.collections.$inferInsert> = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = cleanName(body.name);
      if (name !== existing.name) {
        update.name = name;
        before.name = existing.name;
        after.name = name;
      }
    }
    if (body.vendorId !== undefined && body.vendorId !== existing.vendorId) {
      if (body.vendorId) {
        const [vendor] = await this.db
          .select({ id: schema.vendors.id })
          .from(schema.vendors)
          .where(eq(schema.vendors.id, body.vendorId))
          .limit(1);
        if (!vendor) throw new BadRequestException('vendorId does not match a vendor');
      }
      update.vendorId = body.vendorId ?? null;
      before.vendorId = existing.vendorId;
      after.vendorId = body.vendorId ?? null;
    }
    if (body.isActive !== undefined && body.isActive !== existing.isActive) {
      update.isActive = body.isActive;
      before.isActive = existing.isActive;
      after.isActive = body.isActive;
    }
    if (Object.keys(after).length === 0) return { updated: true };
    await this.db.update(schema.collections).set(update).where(eq(schema.collections.id, id));
    await this.audit.log({
      action: 'collection.update',
      targetType: 'collection',
      targetId: id,
      before,
      after,
    });
    return { updated: true };
  }
}
