import {
  CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import type { Request } from 'express';
import { DRIZZLE } from '../database/database.module';
import { IS_PUBLIC_KEY } from '../tenancy/decorators';
import { AUTH_INSTANCE } from './auth.tokens';
import type { AuthInstance } from './auth.config';
import type { CurrentUserPayload } from './current-user.decorator';

export const IMPERSONATE_COOKIE = 'jetnine.impersonate_target';

// Validates the session cookie via better-auth and attaches the user to the
// request. Registered globally via APP_GUARD; individual handlers/controllers
// opt out with @Public().
//
// If the signed-in user is a super admin and an impersonation cookie is set,
// the request is run AS the target user, with the super admin's id surfaced
// as `impersonatorUserId` on the payload (which the AuditService persists
// onto every audit row).
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @Inject(AUTH_INSTANCE) private readonly auth: AuthInstance,
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(DRIZZLE) private readonly db: PostgresJsDatabase,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request & { user?: CurrentUserPayload }>();

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) {
        for (const v of value) headers.append(key, v);
      } else if (value !== undefined) {
        headers.set(key, String(value));
      }
    }

    const session = await this.auth.api.getSession({ headers });
    if (!session) {
      throw new UnauthorizedException('No active session');
    }

    const realUser = session.user;
    const realIsSuper = Boolean((realUser as { isSuperAdmin?: boolean }).isSuperAdmin);

    // Detect impersonation: the cookie names the *target* user. We trust it
    // only if the actual session belongs to a super admin.
    const targetId = readImpersonateTargetCookie(req);
    if (targetId && realIsSuper && targetId !== realUser.id) {
      const target = await this.loadUser(targetId);
      if (target) {
        req.user = {
          id: target.id,
          email: target.email,
          emailVerified: target.emailVerified,
          name: target.name ?? null,
          isSuperAdmin: target.isSuperAdmin,
          twoFactorEnabled: target.twoFactorEnabled,
          sessionId: session.session.id,
          sessionToken: session.session.token,
          impersonatorUserId: realUser.id,
        };
        return true;
      }
      // Fall through: cookie pointed at a non-existent user. Ignore it.
    }

    req.user = {
      id: realUser.id,
      email: realUser.email,
      emailVerified: realUser.emailVerified,
      name: realUser.name ?? null,
      isSuperAdmin: realIsSuper,
      twoFactorEnabled: Boolean((realUser as { twoFactorEnabled?: boolean }).twoFactorEnabled),
      sessionId: session.session.id,
      sessionToken: session.session.token,
      impersonatorUserId: null,
    };
    return true;
  }

  private async loadUser(id: string): Promise<{
    id: string;
    email: string;
    emailVerified: boolean;
    name: string | null;
    isSuperAdmin: boolean;
    twoFactorEnabled: boolean;
  } | null> {
    const rows = await this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        emailVerified: schema.users.emailVerified,
        name: schema.users.name,
        isSuperAdmin: schema.users.isSuperAdmin,
        twoFactorEnabled: schema.users.twoFactorEnabled,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);
    return rows[0] ?? null;
  }
}

function readImpersonateTargetCookie(req: Request): string | null {
  const fromCookies = (req as Request & { cookies?: Record<string, string> }).cookies?.[
    IMPERSONATE_COOKIE
  ];
  if (typeof fromCookies === 'string' && fromCookies.length > 0) return fromCookies;
  const raw = req.headers.cookie;
  if (typeof raw !== 'string') return null;
  for (const part of raw.split(/;\s*/)) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq) === IMPERSONATE_COOKIE) {
      return decodeURIComponent(part.slice(eq + 1));
    }
  }
  return null;
}
