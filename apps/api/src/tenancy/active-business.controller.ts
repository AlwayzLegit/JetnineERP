import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Inject,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Response } from 'express';
import { schema } from '@jetnine/db';
import { CurrentUser, type CurrentUserPayload } from '../auth/current-user.decorator';
import { DRIZZLE } from '../database/database.module';
import { ACTIVE_BUSINESS_COOKIE } from './tenancy.guard';

interface MembershipSummary {
  businessId: string;
  businessSlug: string;
  businessName: string;
  membershipId: string;
  roleId: string;
  roleName: string;
  status: string;
}

/**
 * Controls the per-session active business selection.
 *
 *   GET /v1/auth/me                  — user + memberships (for the picker)
 *   POST /v1/auth/active-business    — set active business (sets cookie)
 *   DELETE /v1/auth/active-business  — clear active business (clears cookie)
 *
 * The active business lives in a cookie (jetnine.active_business_id) so the
 * browser sends it automatically on every request. The TenancyGuard reads
 * it (or the X-Business-Id override header) per-request.
 */
@Controller('v1/auth')
export class ActiveBusinessController {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    private readonly config: ConfigService,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: CurrentUserPayload): Promise<{
    user: CurrentUserPayload;
    memberships: MembershipSummary[];
  }> {
    const memberships = await this.db
      .select({
        businessId: schema.businesses.id,
        businessSlug: schema.businesses.slug,
        businessName: schema.businesses.name,
        membershipId: schema.memberships.id,
        roleId: schema.memberships.roleId,
        roleName: schema.roles.name,
        status: schema.memberships.status,
      })
      .from(schema.memberships)
      .innerJoin(schema.businesses, eq(schema.businesses.id, schema.memberships.businessId))
      .innerJoin(schema.roles, eq(schema.roles.id, schema.memberships.roleId))
      .where(eq(schema.memberships.userId, user.id));

    return { user, memberships };
  }

  @Post('active-business')
  async setActive(
    @CurrentUser() user: CurrentUserPayload,
    @Body('businessId') businessId: string | undefined,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ businessId: string }> {
    if (!businessId || !UUID_RE.test(businessId)) {
      throw new BadRequestException('businessId must be a uuid');
    }
    const allowed = user.isSuperAdmin || (await this.userHasMembership(user.id, businessId));
    if (!allowed) {
      throw new ForbiddenException('You are not a member of that business');
    }
    res.cookie(ACTIVE_BUSINESS_COOKIE, businessId, this.cookieOptions());
    return { businessId };
  }

  @Delete('active-business')
  clearActive(@Res({ passthrough: true }) res: Response): { cleared: true } {
    res.clearCookie(ACTIVE_BUSINESS_COOKIE, this.cookieOptions());
    return { cleared: true };
  }

  private async userHasMembership(userId: string, businessId: string): Promise<boolean> {
    const rows = await this.db
      .select({ id: schema.memberships.id })
      .from(schema.memberships)
      .where(
        and(
          eq(schema.memberships.userId, userId),
          eq(schema.memberships.businessId, businessId),
          eq(schema.memberships.status, 'active'),
        ),
      )
      .limit(1);
    return rows.length > 0;
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: this.config.get<string>('NODE_ENV') === 'production',
      path: '/',
      // 30 days — the picker isn't sensitive on its own; it's a UI hint that
      // RLS still enforces server-side.
      maxAge: 30 * 24 * 60 * 60 * 1000,
    };
  }
}

const UUID_RE = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
