import {
  CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AUTH_INSTANCE } from './auth.tokens';
import type { AuthInstance } from './auth.config';
import type { CurrentUserPayload } from './current-user.decorator';

// Validates the session cookie via better-auth and attaches the user to the
// request. Apply with `@UseGuards(AuthGuard)` or globally via APP_GUARD.
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AUTH_INSTANCE) private readonly auth: AuthInstance) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
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

    req.user = {
      id: session.user.id,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      name: session.user.name ?? null,
      isSuperAdmin: Boolean((session.user as { isSuperAdmin?: boolean }).isSuperAdmin),
      twoFactorEnabled: Boolean((session.user as { twoFactorEnabled?: boolean }).twoFactorEnabled),
      sessionId: session.session.id,
      sessionToken: session.session.token,
    };
    return true;
  }
}
