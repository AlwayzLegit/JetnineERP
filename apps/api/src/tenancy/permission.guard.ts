import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@jetnine/shared';
import type { Request } from 'express';
import { IS_PUBLIC_KEY, REQUIRED_PERMISSIONS_KEY } from './decorators';
import type { RequestTenantContext } from './request-context';

/**
 * Reads @RequirePermission(...) metadata and 403s if the user is missing
 * any of the listed permissions. Super admins always pass.
 *
 * Runs after TenancyGuard so `req.tenant.permissions` is populated.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const required = this.reflector.getAllAndMerge<Permission[]>(REQUIRED_PERMISSIONS_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<Request & { tenant?: RequestTenantContext }>();
    const tenant = req.tenant;
    if (!tenant) {
      // TenancyGuard should have populated this; fail closed otherwise.
      throw new ForbiddenException('No tenant context');
    }
    if (tenant.isSuperAdmin) return true;

    const missing = required.filter((p) => !tenant.permissions.has(p));
    if (missing.length > 0) {
      throw new ForbiddenException(
        `Missing required permission${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      );
    }
    return true;
  }
}
