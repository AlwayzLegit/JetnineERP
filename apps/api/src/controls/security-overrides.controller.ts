import { Controller, Get, Inject, Query } from '@nestjs/common';
import { and, desc, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { CurrentTenant } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { RequirePermission, TenantScoped } from '../tenancy/decorators';
import type { RequestTenantContext } from '../tenancy/request-context';

interface OverrideRow {
  id: string;
  actorUserId: string | null;
  actorEmail: string | null;
  authorizingUserId: string | null;
  authorizingEmail: string | null;
  permission: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  reasonCode: string | null;
  reason: string | null;
  createdAt: Date;
}

/**
 * The override register (PLAN-STORIS-GAP §0.1/§0.3): every second-user
 * authorization, reportable. The exception register (G5) will extend
 * this surface; for now the owner and the books can already answer
 * "who approved what, for whom, and why".
 */
@TenantScoped()
@Controller('v1/security-overrides')
export class SecurityOverridesController {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  @Get()
  @RequirePermission('security_overrides.view')
  async list(
    @CurrentTenant() tenant: RequestTenantContext,
    @Query('actorUserId') actorUserId?: string,
  ): Promise<OverrideRow[]> {
    const actor = alias(schema.users, 'actor');
    const authorizer = alias(schema.users, 'authorizer');
    return this.db
      .select({
        id: schema.securityOverrides.id,
        actorUserId: schema.securityOverrides.actorUserId,
        actorEmail: actor.email,
        authorizingUserId: schema.securityOverrides.authorizingUserId,
        authorizingEmail: authorizer.email,
        permission: schema.securityOverrides.permission,
        action: schema.securityOverrides.action,
        entityType: schema.securityOverrides.entityType,
        entityId: schema.securityOverrides.entityId,
        reasonCode: schema.reasonCodes.code,
        reason: schema.securityOverrides.reason,
        createdAt: schema.securityOverrides.createdAt,
      })
      .from(schema.securityOverrides)
      .leftJoin(actor, eq(actor.id, schema.securityOverrides.actorUserId))
      .leftJoin(authorizer, eq(authorizer.id, schema.securityOverrides.authorizingUserId))
      .leftJoin(
        schema.reasonCodes,
        eq(schema.reasonCodes.id, schema.securityOverrides.reasonCodeId),
      )
      .where(
        and(
          eq(schema.securityOverrides.businessId, tenant.businessId!),
          actorUserId ? eq(schema.securityOverrides.actorUserId, actorUserId) : undefined,
        ),
      )
      .orderBy(desc(schema.securityOverrides.createdAt))
      .limit(200);
  }
}
