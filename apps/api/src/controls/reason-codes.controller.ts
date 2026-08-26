import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { and, asc, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { REASON_USAGE_CLASSES, type ReasonUsageClass } from '@jetnine/shared';
import { AuditService } from '../audit/audit.service';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface ReasonCodeRow {
  id: string;
  code: string;
  description: string;
  usageClass: string;
  isRestricted: boolean;
  active: boolean;
  createdAt: Date;
}

interface CreateBody {
  code?: string;
  description?: string;
  usageClass?: ReasonUsageClass;
  isRestricted?: boolean;
}

interface UpdateBody {
  description?: string;
  isRestricted?: boolean;
  active?: boolean;
}

function isUniqueViolation(err: unknown): boolean {
  let cur: unknown = err;
  for (let i = 0; i < 5 && cur; i++) {
    const e = cur as { code?: string; constraint_name?: string; cause?: unknown };
    if (e.code === '23505' || e.constraint_name === 'reason_codes_business_class_code_uniq') {
      return true;
    }
    cur = e.cause;
  }
  return false;
}

/**
 * Reason-code registry (PLAN-STORIS-GAP §0.2). Listing is open to any
 * member — every reason prompt in the app reads it; management is its
 * own permission. Codes deactivate rather than delete: override and
 * exception rows reference them forever.
 */
@TenantScoped()
@Controller('v1/reason-codes')
export class ReasonCodesController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  async list(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('usageClass') usageClass?: string,
    @Query('includeInactive') includeInactive?: string,
  ): Promise<ReasonCodeRow[]> {
    if (usageClass && !REASON_USAGE_CLASSES.includes(usageClass as ReasonUsageClass)) {
      throw new BadRequestException(`usageClass must be one of ${REASON_USAGE_CLASSES.join(', ')}`);
    }
    return this.db
      .select({
        id: schema.reasonCodes.id,
        code: schema.reasonCodes.code,
        description: schema.reasonCodes.description,
        usageClass: schema.reasonCodes.usageClass,
        isRestricted: schema.reasonCodes.isRestricted,
        active: schema.reasonCodes.active,
        createdAt: schema.reasonCodes.createdAt,
      })
      .from(schema.reasonCodes)
      .where(
        and(
          eq(schema.reasonCodes.businessId, tenant.businessId!),
          usageClass ? eq(schema.reasonCodes.usageClass, usageClass) : undefined,
          includeInactive === '1' ? undefined : eq(schema.reasonCodes.active, true),
        ),
      )
      .orderBy(asc(schema.reasonCodes.usageClass), asc(schema.reasonCodes.code));
  }

  @Post()
  @RequirePermission('reason_codes.manage')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: CreateBody,
  ): Promise<ReasonCodeRow> {
    const code = body.code?.trim().toUpperCase();
    const description = body.description?.trim();
    if (!code) throw new BadRequestException('code is required');
    if (!description) throw new BadRequestException('description is required');
    if (!body.usageClass || !REASON_USAGE_CLASSES.includes(body.usageClass)) {
      throw new BadRequestException(`usageClass must be one of ${REASON_USAGE_CLASSES.join(', ')}`);
    }
    try {
      const [row] = await this.db
        .insert(schema.reasonCodes)
        .values({
          businessId: tenant.businessId!,
          code,
          description,
          usageClass: body.usageClass,
          isRestricted: body.isRestricted ?? false,
        })
        .returning();
      await this.audit.log({
        action: 'reason_code.create',
        targetType: 'reason_code',
        targetId: row!.id,
        after: { code, description, usageClass: body.usageClass },
      });
      return row!;
    } catch (err) {
      if (isUniqueViolation(err)) {
        throw new ConflictException(`Code "${code}" already exists for class "${body.usageClass}"`);
      }
      throw err;
    }
  }

  @Patch(':id')
  @RequirePermission('reason_codes.manage')
  async update(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: UpdateBody,
  ): Promise<ReasonCodeRow> {
    const [existing] = await this.db
      .select()
      .from(schema.reasonCodes)
      .where(eq(schema.reasonCodes.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Reason code not found');

    const patch: Partial<typeof schema.reasonCodes.$inferInsert> = { updatedAt: new Date() };
    if (body.description !== undefined) {
      const d = body.description.trim();
      if (!d) throw new BadRequestException('description cannot be empty');
      patch.description = d;
    }
    if (body.isRestricted !== undefined) patch.isRestricted = body.isRestricted;
    if (body.active !== undefined) patch.active = body.active;

    const [row] = await this.db
      .update(schema.reasonCodes)
      .set(patch)
      .where(eq(schema.reasonCodes.id, id))
      .returning();
    await this.audit.log({
      action: 'reason_code.update',
      targetType: 'reason_code',
      targetId: id,
      before: {
        description: existing.description,
        isRestricted: existing.isRestricted,
        active: existing.active,
      },
      after: {
        description: row!.description,
        isRestricted: row!.isRestricted,
        active: row!.active,
      },
    });
    return row!;
  }
}
