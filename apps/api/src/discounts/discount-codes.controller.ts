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
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface DiscountCodeRow {
  id: string;
  code: string;
  kind: 'percent' | 'fixed';
  value: number;
  description: string | null;
  isActive: boolean;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  minSubtotalCents: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateBody {
  code?: string;
  kind?: 'percent' | 'fixed';
  /** Basis points if kind=percent (1500 = 15%). Cents if kind=fixed. */
  value?: number;
  description?: string | null;
  isActive?: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
  usageLimit?: number | null;
  perCustomerLimit?: number | null;
  minSubtotalCents?: number | null;
}

type UpdateBody = CreateBody;

const CODE_RE = /^[A-Z0-9][A-Z0-9_-]{1,31}$/i;
const VALID_KINDS = new Set(['percent', 'fixed']);

@TenantScoped()
@Controller('v1/business/discount-codes')
export class DiscountCodesController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  @Get()
  @RequirePermission('discounts.view')
  async list(@CurrentTenant() _tenant: RequestTenantContext): Promise<DiscountCodeRow[]> {
    const rows = await this.db
      .select()
      .from(schema.discountCodes)
      .orderBy(asc(schema.discountCodes.code));
    return rows.map((r) => ({
      id: r.id,
      code: r.code,
      kind: r.kind as 'percent' | 'fixed',
      value: r.value,
      description: r.description,
      isActive: r.isActive,
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      usageLimit: r.usageLimit,
      usageCount: r.usageCount,
      perCustomerLimit: r.perCustomerLimit,
      minSubtotalCents: r.minSubtotalCents,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  @Post()
  @RequirePermission('discounts.manage')
  async create(
    @CurrentTenant() tenant: RequestTenantContext,
    @Body() body: CreateBody,
  ): Promise<DiscountCodeRow> {
    const code = body.code?.trim();
    if (!code) throw new BadRequestException('code is required');
    if (!CODE_RE.test(code)) {
      throw new BadRequestException(
        'code must be 2-32 chars, alphanumeric/dash/underscore, starts with alphanumeric',
      );
    }
    if (!body.kind || !VALID_KINDS.has(body.kind)) {
      throw new BadRequestException("kind must be 'percent' or 'fixed'");
    }
    validateValue(body.kind, body.value);
    const startsAt = parseDate(body.startsAt);
    const endsAt = parseDate(body.endsAt);
    if (startsAt && endsAt && startsAt.getTime() > endsAt.getTime()) {
      throw new BadRequestException('startsAt must be before endsAt');
    }
    validateLimit('usageLimit', body.usageLimit);
    validateLimit('perCustomerLimit', body.perCustomerLimit);
    validateLimit('minSubtotalCents', body.minSubtotalCents);

    let row;
    try {
      [row] = await this.db
        .insert(schema.discountCodes)
        .values({
          businessId: tenant.businessId!,
          code,
          kind: body.kind,
          value: body.value!,
          description: body.description?.trim() || null,
          isActive: body.isActive ?? true,
          startsAt,
          endsAt,
          usageLimit: body.usageLimit ?? null,
          perCustomerLimit: body.perCustomerLimit ?? null,
          minSubtotalCents: body.minSubtotalCents ?? null,
        })
        .returning();
    } catch (err) {
      const root = unwrap(err);
      if (
        (root as { constraint_name?: string }).constraint_name ===
        'discount_codes_business_code_uniq'
      ) {
        throw new BadRequestException(`A discount code "${code}" already exists`);
      }
      throw err;
    }
    if (!row) throw new BadRequestException('failed to create discount code');

    await this.audit.log({
      action: 'discount_code.create',
      targetType: 'discount_code',
      targetId: row.id,
      after: { code, kind: body.kind, value: body.value },
    });
    return rowToView(row);
  }

  @Patch(':id')
  @RequirePermission('discounts.manage')
  async update(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
    @Body() body: UpdateBody,
  ): Promise<DiscountCodeRow> {
    const [existing] = await this.db
      .select()
      .from(schema.discountCodes)
      .where(eq(schema.discountCodes.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Discount code not found');

    const update: Partial<typeof schema.discountCodes.$inferInsert> = { updatedAt: new Date() };
    const before: Record<string, unknown> = {};
    const after: Record<string, unknown> = {};

    if (body.code !== undefined) {
      const next = body.code.trim();
      if (!CODE_RE.test(next)) {
        throw new BadRequestException('code must match the pattern');
      }
      if (next !== existing.code) {
        update.code = next;
        before.code = existing.code;
        after.code = next;
      }
    }
    if (body.kind !== undefined && body.kind !== existing.kind) {
      if (!VALID_KINDS.has(body.kind)) throw new BadRequestException('invalid kind');
      update.kind = body.kind;
      before.kind = existing.kind;
      after.kind = body.kind;
    }
    if (body.value !== undefined && body.value !== existing.value) {
      validateValue((body.kind ?? existing.kind) as 'percent' | 'fixed', body.value);
      update.value = body.value;
      before.value = existing.value;
      after.value = body.value;
    }
    if (body.description !== undefined) {
      const next = body.description?.trim() || null;
      if (next !== existing.description) {
        update.description = next;
        before.description = existing.description;
        after.description = next;
      }
    }
    if (body.isActive !== undefined && body.isActive !== existing.isActive) {
      update.isActive = body.isActive;
      before.isActive = existing.isActive;
      after.isActive = body.isActive;
    }
    if (body.startsAt !== undefined) {
      const next = parseDate(body.startsAt);
      if ((next?.getTime() ?? null) !== (existing.startsAt?.getTime() ?? null)) {
        update.startsAt = next;
        before.startsAt = existing.startsAt;
        after.startsAt = next;
      }
    }
    if (body.endsAt !== undefined) {
      const next = parseDate(body.endsAt);
      if ((next?.getTime() ?? null) !== (existing.endsAt?.getTime() ?? null)) {
        update.endsAt = next;
        before.endsAt = existing.endsAt;
        after.endsAt = next;
      }
    }
    for (const key of ['usageLimit', 'perCustomerLimit', 'minSubtotalCents'] as const) {
      if (body[key] !== undefined) {
        validateLimit(key, body[key] as number | null | undefined);
        const next = body[key] ?? null;
        if (next !== existing[key]) {
          (update as Record<string, unknown>)[key] = next;
          before[key] = existing[key];
          after[key] = next;
        }
      }
    }

    if (Object.keys(after).length === 0) {
      return rowToView(existing);
    }
    const [updated] = await this.db
      .update(schema.discountCodes)
      .set(update)
      .where(eq(schema.discountCodes.id, id))
      .returning();
    if (!updated) throw new NotFoundException('Discount code not found after update');

    await this.audit.log({
      action: 'discount_code.update',
      targetType: 'discount_code',
      targetId: id,
      before,
      after,
    });
    return rowToView(updated);
  }

  @Delete(':id')
  @RequirePermission('discounts.manage')
  async delete(
    @CurrentTenant() _tenant: RequestTenantContext,
    @Param('id') id: string,
  ): Promise<{ deleted: true }> {
    const [existing] = await this.db
      .select()
      .from(schema.discountCodes)
      .where(eq(schema.discountCodes.id, id))
      .limit(1);
    if (!existing) throw new NotFoundException('Discount code not found');

    // Redemptions reference us with ON DELETE CASCADE — they are
    // historical and conceptually part of the code's lifetime; deleting
    // the code drops them too. If a merchant wants to keep history,
    // they should toggle isActive=false instead. The audit row records
    // how many redemptions were swept along.
    const redemptions = await this.db
      .select({ id: schema.discountRedemptions.id })
      .from(schema.discountRedemptions)
      .where(eq(schema.discountRedemptions.discountCodeId, id));

    await this.db.delete(schema.discountCodes).where(eq(schema.discountCodes.id, id));
    await this.audit.log({
      action: 'discount_code.delete',
      targetType: 'discount_code',
      targetId: id,
      before: { code: existing.code, kind: existing.kind, value: existing.value },
      metadata: { redemptionsRemoved: redemptions.length },
    });
    return { deleted: true };
  }
}

function validateValue(kind: 'percent' | 'fixed', value: number | undefined): void {
  if (typeof value !== 'number' || !Number.isInteger(value) || value <= 0) {
    throw new BadRequestException('value must be a positive integer');
  }
  if (kind === 'percent' && value > 10_000) {
    throw new BadRequestException('percent value (basis points) cannot exceed 10000 (100%)');
  }
}

function validateLimit(name: string, value: number | null | undefined): void {
  if (value === undefined || value === null) return;
  if (!Number.isInteger(value) || value < 0) {
    throw new BadRequestException(`${name} must be a non-negative integer or null`);
  }
}

function parseDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function rowToView(r: typeof schema.discountCodes.$inferSelect): DiscountCodeRow {
  return {
    id: r.id,
    code: r.code,
    kind: r.kind as 'percent' | 'fixed',
    value: r.value,
    description: r.description,
    isActive: r.isActive,
    startsAt: r.startsAt,
    endsAt: r.endsAt,
    usageLimit: r.usageLimit,
    usageCount: r.usageCount,
    perCustomerLimit: r.perCustomerLimit,
    minSubtotalCents: r.minSubtotalCents,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
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
