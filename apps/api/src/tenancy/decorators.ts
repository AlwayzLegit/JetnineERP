import { SetMetadata, applyDecorators, UseGuards, UseInterceptors } from '@nestjs/common';
import type { Permission } from '@jetnine/shared';
import { AuditInterceptor } from '../audit/audit.interceptor';
import { SubscriptionGuard } from '../billing/subscription.guard';
import { IdempotencyInterceptor } from '../idempotency/idempotency.interceptor';
import { TenancyGuard } from './tenancy.guard';
import { PermissionGuard } from './permission.guard';
import { RlsContextInterceptor } from './rls-context.interceptor';

// Routes flagged @Public() bypass AuthGuard / TenancyGuard / PermissionGuard
// when those run as global guards. Anything not @Public() requires a valid
// session.
export const IS_PUBLIC_KEY = 'tenancy:public';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Routes flagged @SuperAdminOnly() require `users.is_super_admin = true` and
// skip the tenant resolution step (super admins aren't tied to a business).
export const IS_SUPER_ADMIN_ONLY_KEY = 'tenancy:super-admin-only';
export const SuperAdminOnly = () => SetMetadata(IS_SUPER_ADMIN_ONLY_KEY, true);

// Read by PermissionGuard. Multiple values are AND-ed: the user must hold
// every listed permission.
export const REQUIRED_PERMISSIONS_KEY = 'tenancy:required-permissions';
export const RequirePermission = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);

/**
 * Convenience: opts the controller into the tenant pipeline — tenant
 * resolution, permission gating, the per-request RLS transaction, and
 * the audit-log fallback for state-changing requests.
 *
 * AuthGuard already runs globally so we don't re-stack it here. Pair with
 * @RequirePermission(...) on individual handlers to gate by permission.
 *
 * The interceptors run in registration order: Idempotency runs first
 * (so its lock + cache live in their own auto-commit tx, surviving
 * handler rollback). RLS opens the per-request tx next, then Audit
 * runs inside it so its INSERT inherits the tenant context.
 */
export function TenantScoped() {
  return applyDecorators(
    UseGuards(TenancyGuard, SubscriptionGuard, PermissionGuard),
    UseInterceptors(IdempotencyInterceptor, RlsContextInterceptor, AuditInterceptor),
  );
}
