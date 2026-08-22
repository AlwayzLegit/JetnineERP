import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  ForbiddenException,
  Inject,
  NotFoundException,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Response } from 'express';
import { schema } from '@jetnine/db';
import { AuditService } from '../audit/audit.service';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { IMPERSONATE_COOKIE } from '../auth/auth.guard';
import { ACTIVE_BUSINESS_COOKIE } from '../tenancy/tenancy.guard';
import { DRIZZLE } from '../database/database.module';
import { SuperAdminOnly, TenantScoped } from '../tenancy/decorators';

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;

@TenantScoped()
@Controller('v1/admin/impersonate')
export class ImpersonateController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(ConfigService) private readonly config: ConfigService,
  ) {}

  @SuperAdminOnly()
  @Post()
  async start(
    @CurrentUser() actor: CurrentUserPayload,
    @Body('userId') userId: string | undefined,
    @Body('businessId') businessId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ targetUserId: string; businessId: string }> {
    // Defensive: the @SuperAdminOnly() guard already requires this, but
    // double-check so a misconfigured pipeline can't accidentally widen
    // the impersonation surface.
    if (!actor.isSuperAdmin) throw new ForbiddenException('Super-admin only');
    if (actor.impersonatorUserId) {
      throw new ConflictException(
        'Already impersonating. Stop the current session first via DELETE /v1/admin/impersonate.',
      );
    }
    if (!userId || !UUID_RE.test(userId)) {
      throw new BadRequestException('userId must be a uuid');
    }
    if (!businessId || !UUID_RE.test(businessId)) {
      throw new BadRequestException('businessId must be a uuid');
    }

    // Target must exist and not be a super admin (defense-in-depth: super
    // admins shouldn't be able to "become" each other for audit purposes).
    const [target] = await this.db
      .select({
        id: schema.users.id,
        isSuperAdmin: schema.users.isSuperAdmin,
        email: schema.users.email,
      })
      .from(schema.users)
      .where(eq(schema.users.id, userId))
      .limit(1);
    if (!target) throw new NotFoundException('User not found');
    if (target.isSuperAdmin) {
      throw new ForbiddenException('Cannot impersonate another super admin');
    }

    // Set both cookies: the impersonate target plus the active business so
    // the next request lands in the right tenant context immediately.
    const cookieOpts = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      path: '/',
      // Short-lived: forces the super admin to re-confirm if a session is
      // left active for more than a working day.
      maxAge: 8 * 60 * 60 * 1000,
    };
    res.cookie(IMPERSONATE_COOKIE, userId, cookieOpts);
    // The active-business cookie has to stay readable from JavaScript even on
    // this path — see the note on cookieOptions() in
    // active-business.controller.ts. The impersonation marker above stays
    // httpOnly; only this one is relaxed, and only to the same degree.
    res.cookie(ACTIVE_BUSINESS_COOKIE, businessId, { ...cookieOpts, httpOnly: false });

    await this.audit.log({
      action: 'auth.impersonate.start',
      targetType: 'user',
      targetId: userId,
      metadata: { businessId, targetEmail: target.email },
    });

    return { targetUserId: userId, businessId };
  }

  @Delete()
  async stop(
    @CurrentUser() actor: CurrentUserPayload,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ stopped: true }> {
    if (!actor.impersonatorUserId) {
      throw new ConflictException('Not currently impersonating');
    }
    await this.audit.log({
      action: 'auth.impersonate.stop',
      targetType: 'user',
      targetId: actor.id,
      metadata: { impersonator: actor.impersonatorUserId },
    });
    const cookieOpts = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      path: '/',
    };
    res.clearCookie(IMPERSONATE_COOKIE, cookieOpts);
    // Mirror the attributes it was set with, so the browser matches and
    // actually drops it rather than leaving a stale tenant behind.
    res.clearCookie(ACTIVE_BUSINESS_COOKIE, { ...cookieOpts, httpOnly: false });
    return { stopped: true };
  }
}
