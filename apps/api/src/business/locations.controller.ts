import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface LocationRow {
  id: string;
  name: string;
  timezone: string;
  taxRateBps: number | null;
  addressJson: unknown;
  isActive: boolean;
  createdAt: Date;
}

interface CreateBody {
  name?: string;
  timezone?: string;
  taxRateBps?: number | null;
  addressJson?: unknown;
}

interface UpdateBody extends CreateBody {
  isActive?: boolean;
}

/**
 * A timezone is only usable if the runtime's Intl database knows it —
 * everything downstream (close-of-day, Z-report bucketing) formats
 * through Intl, so this is the exact definition of "valid" we need.
 */
function assertValidTimezone(timezone: string): void {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
  } catch {
    throw new BadRequestException(
      `invalid timezone "${timezone}" — use an IANA name like America/Los_Angeles`,
    );
  }
}

@TenantScoped()
@Controller('v1/business/locations')
export class LocationsController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('locations.view')
  async list(@CurrentTenant() tenant: RequestTenantContext): Promise<LocationRow[]> {
    return this.db
      .select({
        id: schema.locations.id,
        name: schema.locations.name,
        timezone: schema.locations.timezone,
        taxRateBps: schema.locations.taxRateBps,
        addressJson: schema.locations.addressJson,
        isActive: schema.locations.isActive,
        createdAt: schema.locations.createdAt,
      })
      .from(schema.locations)
      .where(eq(schema.locations.businessId, tenant.businessId!))
      .orderBy(asc(schema.locations.name));
  }

  @Post()
  @RequirePermission('locations.create')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: CreateBody,
  ): Promise<LocationRow> {
    const name = body.name?.trim();
    const timezone = body.timezone?.trim();
    if (!name) throw new BadRequestException('name is required');
    if (!timezone) throw new BadRequestException('timezone is required');
    assertValidTimezone(timezone);
    if (body.taxRateBps != null && (!Number.isInteger(body.taxRateBps) || body.taxRateBps < 0)) {
      throw new BadRequestException('taxRateBps must be a non-negative integer');
    }
    const [row] = await this.db
      .insert(schema.locations)
      .values({
        businessId: tenant.businessId!,
        name,
        timezone,
        taxRateBps: body.taxRateBps ?? null,
        addressJson: (body.addressJson ?? null) as never,
      })
      .returning();
    if (!row) throw new BadRequestException('failed to create location');
    await this.audit.log({
      action: 'location.create',
      targetType: 'location',
      targetId: row.id,
      after: { name, timezone, taxRateBps: row.taxRateBps },
    });
    return toRow(row);
  }

  @Patch(':id')
  @RequirePermission('locations.update')
  async update(
    @CurrentTenant() tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: UpdateBody,
  ): Promise<LocationRow> {
    const [existing] = await this.db
      .select()
      .from(schema.locations)
      .where(and(eq(schema.locations.id, id), eq(schema.locations.businessId, tenant.businessId!)))
      .limit(1);
    if (!existing) throw new NotFoundException('Location not found');

    const update: Partial<typeof schema.locations.$inferInsert> = {};
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (body.name !== undefined && body.name.trim() !== existing.name) {
      update.name = body.name.trim();
      before.name = existing.name;
      after.name = update.name;
    }
    if (body.timezone !== undefined && body.timezone.trim() !== existing.timezone) {
      assertValidTimezone(body.timezone.trim());
      update.timezone = body.timezone.trim();
      before.timezone = existing.timezone;
      after.timezone = update.timezone;
    }
    if (body.taxRateBps !== undefined && body.taxRateBps !== existing.taxRateBps) {
      if (body.taxRateBps !== null && (!Number.isInteger(body.taxRateBps) || body.taxRateBps < 0)) {
        throw new BadRequestException('taxRateBps must be null or a non-negative integer');
      }
      update.taxRateBps = body.taxRateBps;
      before.taxRateBps = existing.taxRateBps;
      after.taxRateBps = body.taxRateBps;
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

    if (Object.keys(after).length === 0) return toRow(existing);

    const [updated] = await this.db
      .update(schema.locations)
      .set(update)
      .where(eq(schema.locations.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Location not found after update');

    await this.audit.log({
      action: 'location.update',
      targetType: 'location',
      targetId: updated.id,
      before,
      after,
    });

    return toRow(updated);
  }
}

function toRow(row: typeof schema.locations.$inferSelect): LocationRow {
  return {
    id: row.id,
    name: row.name,
    timezone: row.timezone,
    taxRateBps: row.taxRateBps ?? null,
    addressJson: row.addressJson,
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}
