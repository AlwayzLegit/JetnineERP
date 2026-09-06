import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request } from 'express';
import { schema } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';
import type { RequestTenantContext } from '../tenancy/request-context';
import { isReadOnly, type SubscriptionStatus } from './subscription-state';

/**
 * Enforces the read-only mode that kicks in when a business's
 * subscription has lapsed (trial ended without payment, or post-trial
 * `past_due` / `canceled`). The mode is read-only — not blocked — so
 * users can still log in, see their data, and pay to reactivate.
 *
 * Pass-through rules:
 *  1. Non-tenant routes (no `req.tenant`): pass — guard targets per-
 *     business endpoints only.
 *  2. Super-admin: pass. Agency (house) accounts — PLAN §15 — also pass:
 *     the platform owner runs them and they are never billed.
 *  3. GET requests: pass (read access stays open).
 *  4. /v1/billing/* and /v1/business/settings (so the user can see and
 *     update their plan / fix payment): pass.
 *  5. Otherwise, if the subscription is read-only, return HTTP 402.
 */
@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request & { tenant?: RequestTenantContext }>();

    if (!req.tenant || !req.tenant.businessId) return true;
    if (req.tenant.isSuperAdmin) return true;
    if (req.method === 'GET' || req.method === 'HEAD') return true;
    if (req.path.startsWith('/v1/billing')) return true;
    if (req.path.startsWith('/v1/business/settings')) return true;
    // Allow auth/2fa-related state changes (sign out, MFA verify) so a
    // locked-out user can still sign in cleanly.
    if (req.path.startsWith('/api/auth/')) return true;

    const [biz] = await this.db
      .select({
        accountKind: schema.businesses.accountKind,
        status: schema.businesses.status,
        trialEndsAt: schema.businesses.trialEndsAt,
      })
      .from(schema.businesses)
      .where(eq(schema.businesses.id, req.tenant.businessId))
      .limit(1);
    if (!biz) return true;
    // PLAN §15: agency (house) accounts are operated by the platform
    // owner and are never billed, so they never go read-only.
    if (biz.accountKind === 'agency') return true;

    const [sub] = await this.db
      .select({
        status: schema.subscriptions.status,
        trialEndsAt: schema.subscriptions.trialEndsAt,
      })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.businessId, req.tenant.businessId))
      .limit(1);

    if (!sub) {
      // No subscription record yet — fall back to the businesses.status
      // and trial_ends_at columns. A brand-new business without a
      // subscription row is treated as in-trial.
      const status =
        biz.status === 'cancelled' || biz.status === 'suspended'
          ? 'past_due'
          : biz.status === 'active'
            ? 'active'
            : 'trial';
      if (isReadOnly(status, biz.trialEndsAt)) {
        throw new HttpException(
          {
            statusCode: 402,
            error: 'Payment Required',
            message:
              'Subscription required. Visit Settings → Billing to start or reactivate your plan.',
          },
          HttpStatus.PAYMENT_REQUIRED,
        );
      }
      return true;
    }

    if (isReadOnly(sub.status as SubscriptionStatus, sub.trialEndsAt)) {
      throw new HttpException(
        {
          statusCode: 402,
          error: 'Payment Required',
          message:
            'Subscription required. Visit Settings → Billing to start or reactivate your plan.',
        },
        HttpStatus.PAYMENT_REQUIRED,
      );
    }
    return true;
  }
}
