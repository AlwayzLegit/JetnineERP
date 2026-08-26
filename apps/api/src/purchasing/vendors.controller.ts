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
} from '@nestjs/common';
import { asc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { ExceptionsService } from '../controls/exceptions.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface VendorRow {
  id: string;
  name: string;
  contactName: string | null;
  email: string | null;
  phone: string | null;
  addressJson: unknown;
  remitTo: string | null;
  notes: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBody {
  name?: string;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  addressJson?: unknown;
  remitTo?: string | null;
  notes?: string | null;
}

type UpdateBody = CreateBody & { isActive?: boolean };

@TenantScoped()
@Controller('v1/vendors')
export class VendorsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ExceptionsService) private readonly exceptions: ExceptionsService,
  ) {}

  @Get()
  @RequirePermission('vendors.view')
  async list(@CurrentTenant() _tenant: RequestTenantContext): Promise<VendorRow[]> {
    return this.db.select(SELECT_COLS).from(schema.vendors).orderBy(asc(schema.vendors.name));
  }

  @Get(':id')
  @RequirePermission('vendors.view')
  async get(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<VendorRow> {
    const [row] = await this.db
      .select(SELECT_COLS)
      .from(schema.vendors)
      .where(eq(schema.vendors.id, id))
      .limit(1);
    if (!row) throw new NotFoundException('Vendor not found');
    return row;
  }

  @Post()
  @RequirePermission('vendors.manage')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: CreateBody,
  ): Promise<VendorRow> {
    const name = body.name?.trim();
    if (!name) throw new BadRequestException('name is required');
    let row: VendorRow | undefined;
    try {
      [row] = await this.db
        .insert(schema.vendors)
        .values({
          businessId: tenant.businessId!,
          name,
          contactName: body.contactName?.trim() || null,
          email: body.email?.trim() || null,
          phone: body.phone?.trim() || null,
          addressJson: (body.addressJson ?? null) as never,
          remitTo: body.remitTo?.trim() || null,
          notes: body.notes?.trim() || null,
        })
        .returning(SELECT_COLS);
    } catch (err) {
      // Drizzle wraps postgres errors; unwrap to look at the underlying
      // constraint name. We treat unique-violation on the business+name
      // index as a soft 400 rather than a 500.
      const root = unwrap(err);
      if (
        (root as { constraint_name?: string }).constraint_name === 'vendors_business_name_uniq' ||
        (root as { code?: string; message?: string }).message?.includes(
          'vendors_business_name_uniq',
        )
      ) {
        throw new BadRequestException(`A vendor with name "${name}" already exists`);
      }
      throw err;
    }
    if (!row) throw new BadRequestException('failed to create vendor');
    await this.audit.log({
      action: 'vendor.create',
      targetType: 'vendor',
      targetId: row.id,
      after: { name, email: row.email, phone: row.phone },
    });
    return row;
  }

  @Patch(':id')
  @RequirePermission('vendors.manage')
  async update(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: UpdateBody,
  ): Promise<VendorRow> {
    const [existing] = await this.db
      .select()
      .from(schema.vendors)
      .where(eq(schema.vendors.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Vendor not found');

    const update: Partial<typeof schema.vendors.$inferInsert> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};
    for (const key of ['name', 'contactName', 'email', 'phone', 'remitTo', 'notes'] as const) {
      const v = body[key as keyof UpdateBody];
      if (v !== undefined) {
        const next = typeof v === 'string' ? v.trim() || null : v;
        if (next !== existing[key]) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (update as any)[key] = next;
          before[key] = existing[key];
          after[key] = next;
        }
      }
    }
    if (body.addressJson !== undefined) {
      update.addressJson = body.addressJson as never;
      before.addressJson = existing.addressJson;
      after.addressJson = body.addressJson;
    }
    if (body.isActive !== undefined && body.isActive !== existing.isActive) {
      update.isActive = body.isActive;
      before.isActive = existing.isActive;
      after.isActive = body.isActive;
    }
    if (Object.keys(after).length === 0) {
      const [unchanged] = await this.db
        .select(SELECT_COLS)
        .from(schema.vendors)
        .where(eq(schema.vendors.id, id))
        .limit(1);
      return unchanged!;
    }
    const [updated] = await this.db
      .update(schema.vendors)
      .set(update)
      .where(eq(schema.vendors.id, id))
      .returning(SELECT_COLS);
    if (!updated) throw new NotFoundException('Vendor not found after update');

    await this.audit.log({
      action: 'vendor.update',
      targetType: 'vendor',
      targetId: id,
      before,
      after,
    });
    // G11: remit-to changes are the classic vendor-master fraud —
    // someone quietly redirects payments. Every change is a critical
    // exception the owner sees.
    if ('remitTo' in after) {
      await this.exceptions.record({
        type: 'vendor_remit_change',
        severity: 'critical',
        entityType: 'vendor',
        entityId: id,
        summary: `Remit-to changed on vendor ${existing.name}`,
        metadata: { before: before.remitTo ?? null, after: after.remitTo ?? null },
      });
    }
    return updated;
  }

  @Delete(':id')
  @RequirePermission('vendors.manage')
  async delete(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.vendors)
      .where(eq(schema.vendors.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Vendor not found');

    // PO references vendors with ON DELETE RESTRICT — refuse the delete
    // if any PO points at this vendor and surface a clear error rather
    // than letting Postgres throw a foreign-key violation.
    const referencingPos = await this.db
      .select({ id: schema.purchaseOrders.id })
      .from(schema.purchaseOrders)
      .where(eq(schema.purchaseOrders.vendorId, id))
      .limit(1);
    if (referencingPos.length > 0) {
      throw new BadRequestException(
        'Cannot delete a vendor with existing purchase orders. Deactivate it instead.',
      );
    }

    await this.db.delete(schema.vendors).where(eq(schema.vendors.id, id));
    await this.audit.log({
      action: 'vendor.delete',
      targetType: 'vendor',
      targetId: id,
      before: { name: existing.name, email: existing.email },
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

const SELECT_COLS = {
  id: schema.vendors.id,
  name: schema.vendors.name,
  contactName: schema.vendors.contactName,
  email: schema.vendors.email,
  phone: schema.vendors.phone,
  addressJson: schema.vendors.addressJson,
  remitTo: schema.vendors.remitTo,
  notes: schema.vendors.notes,
  isActive: schema.vendors.isActive,
  createdAt: schema.vendors.createdAt,
  updatedAt: schema.vendors.updatedAt,
} as const;
