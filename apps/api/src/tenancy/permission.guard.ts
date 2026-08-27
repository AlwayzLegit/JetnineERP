import {
  CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Permission } from '@jetnine/shared';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import type { Request } from 'express';
import { ROOT_DRIZZLE } from '../database/database.module';
import { IS_PUBLIC_KEY, REQUIRED_PERMISSIONS_KEY } from './decorators';
import type { RequestTenantContext } from './request-context';

/**
 * Reads @RequirePermission(...) metadata and 403s if the user is missing
 * any of the listed permissions. Super admins always pass.
 *
 * Runs after TenancyGuard so `req.tenant.permissions` is populated.
 *
 * AUD-004 (sysadmin pack): a denied attempt is itself an event — denial
 * patterns are the loss-prevention / insider-threat signal, so every
 * 403 lands in the audit stream (best-effort, never blocking the
 * response). Root handle: the guard runs before the RLS request
 * context exists, so the row carries an explicit businessId.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly logger = new Logger(PermissionGuard.name);

  constructor(
    @Inject(Reflector) private readonly reflector: Reflector,
    @Inject(ROOT_DRIZZLE) private readonly rootDb: PostgresJsDatabase,
  ) {}

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
      void this.rootDb
        .insert(schema.auditLogs)
        .values({
          businessId: tenant.businessId ?? null,
          actorUserId: tenant.userId ?? null,
          actorType: 'user',
          action: 'permission.denied',
          targetType: 'route',
          targetId: `${req.method} ${req.path}`,
          changesJson: { missing },
        })
        .catch((err) => this.logger.warn({ err }, 'failed to record permission denial'));
      throw new ForbiddenException(
        `Missing required permission${missing.length > 1 ? 's' : ''}: ${missing.join(', ')}`,
      );
    }
    return true;
  }
}
