import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  PreconditionFailedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { and, eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import type { Permission } from '@jetnine/shared';
import type { Request } from 'express';
import { DRIZZLE } from '../database/database.module';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import { IS_PUBLIC_KEY, IS_SUPER_ADMIN_ONLY_KEY } from './decorators';
import type { RequestTenantContext } from './request-context';

export const ACTIVE_BUSINESS_COOKIE = 'jetnine.active_business_id';
export const ACTIVE_BUSINESS_HEADER = 'x-business-id';

/**
 * Resolves the active business for the current request and loads the user's
 * permissions for it. Runs after AuthGuard, so `req.user` is populated.
 *
 * The active business is read from (in order):
 *   1. The X-Business-Id header (mostly for tests + machine clients)
 *   2. The jetnine.active_business_id cookie (set by POST /v1/auth/active-business)
 *
 * If the user holds no membership for that business, this guard 403s. If
 * the user has memberships but none was selected, it 412 (Precondition
 * Failed) so the client knows to show a "pick a business" picker.
 *
 * Routes marked @SuperAdminOnly() bypass tenant resolution entirely (super
 * admins do platform-level work; their tenant context is empty).
 */
@Injectable()
export class TenancyGuard implements CanActivate {
  constructor(
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
    @Inject(Reflector) private readonly reflector: Reflector,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<
      Request & {
        user?: CurrentUserPayload;
        tenant?: RequestTenantContext;
      }
    >();
    const user = req.user;
    if (!user) {
      // AuthGuard should have run first; if it didn't, fail closed.
      throw new ForbiddenException('Not signed in');
    }

    const superAdminOnly = this.reflector.getAllAndOverride<boolean>(IS_SUPER_ADMIN_ONLY_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (superAdminOnly) {
      if (!user.isSuperAdmin) throw new ForbiddenException('Super-admin only');
      req.tenant = emptyTenantContext(user);
      return true;
    }

    const businessId = pickActiveBusinessId(req);
    if (!businessId) {
      // For super admins we still let them through with an empty tenant
      // context — they may be calling super-admin-only endpoints from a UI
      // that hasn't selected a business yet.
      if (user.isSuperAdmin) {
        req.tenant = emptyTenantContext(user);
        return true;
      }
      throw new PreconditionFailedException(
        'No active business selected. POST /v1/auth/active-business first.',
      );
    }

    const membership = await this.loadMembership(user.id, businessId);
    if (!membership) {
      // Super admins may operate on any business via impersonation; load
      // permissions as if they had the Owner role-equivalent (all perms).
      // For now we just give them an empty permission set and rely on the
      // is_super_admin flag to bypass per-permission checks downstream.
      if (user.isSuperAdmin) {
        req.tenant = {
          userId: user.id,
          isSuperAdmin: true,
          businessId,
          membershipId: null,
          roleId: null,
          roleName: null,
          permissions: new Set<Permission>(),
        };
        return true;
      }
      throw new ForbiddenException('You are not a member of that business');
    }

    const permissions = await this.loadPermissions(membership.roleId);
    req.tenant = {
      userId: user.id,
      isSuperAdmin: user.isSuperAdmin,
      businessId,
      membershipId: membership.membershipId,
      roleId: membership.roleId,
      roleName: membership.roleName,
      permissions,
    };
    return true;
  }

  private async loadMembership(
    userId: string,
    businessId: string,
  ): Promise<{ membershipId: string; roleId: string; roleName: string } | null> {
    const rows = await this.db
      .select({
        membershipId: schema.memberships.id,
        roleId: schema.memberships.roleId,
        roleName: schema.roles.name,
        status: schema.memberships.status,
      })
      .from(schema.memberships)
      .innerJoin(schema.roles, eq(schema.roles.id, schema.memberships.roleId))
      .where(
        and(eq(schema.memberships.userId, userId), eq(schema.memberships.businessId, businessId)),
      )
      .limit(1);
    const found = rows[0];
    if (!found) return null;
    if (found.status !== 'active') return null;
    return {
      membershipId: found.membershipId,
      roleId: found.roleId,
      roleName: found.roleName,
    };
  }

  private async loadPermissions(roleId: string): Promise<Set<Permission>> {
    const rows = await this.db
      .select({ permission: schema.rolePermissions.permission })
      .from(schema.rolePermissions)
      .where(eq(schema.rolePermissions.roleId, roleId));
    return new Set(rows.map((r) => r.permission as Permission));
  }
}

function pickActiveBusinessId(req: Request): string | null {
  const fromHeader = req.headers[ACTIVE_BUSINESS_HEADER];
  if (typeof fromHeader === 'string' && fromHeader.length > 0) return fromHeader;
  const fromCookie = (req as Request & { cookies?: Record<string, string> }).cookies?.[
    ACTIVE_BUSINESS_COOKIE
  ];
  if (typeof fromCookie === 'string' && fromCookie.length > 0) return fromCookie;
  // Express doesn't parse cookies by default; fall back to manual parse.
  const raw = req.headers.cookie;
  if (typeof raw !== 'string') return null;
  for (const part of raw.split(/;\s*/)) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    const k = part.slice(0, eq);
    if (k === ACTIVE_BUSINESS_COOKIE) {
      return decodeURIComponent(part.slice(eq + 1));
    }
  }
  return null;
}

function emptyTenantContext(user: CurrentUserPayload): RequestTenantContext {
  return {
    userId: user.id,
    isSuperAdmin: user.isSuperAdmin,
    businessId: null,
    membershipId: null,
    roleId: null,
    roleName: null,
    permissions: new Set<Permission>(),
  };
}
