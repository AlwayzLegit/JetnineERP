import { Inject, Injectable } from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { schema } from '@jetnine/db';
import { randomUUID } from 'node:crypto';
import { notifyOrderUpdate } from '../orders/collaboration';
import { DRIZZLE } from '../database/database.module';
import { tryGetRequestContext } from '../tenancy/request-context';
import { type JsonDiff, diffJson } from './diff';

type ActorType = 'user' | 'super_admin' | 'system' | 'api_key';

export interface AuditLogInput {
  /**
   * Dotted action name, e.g. "product.update", "auth.login", "membership.invite".
   * Stable strings — UIs will filter by them.
   */
  action: string;
  targetType?: string;
  targetId?: string;
  /** Free-form metadata when there's no before/after diff to record. */
  metadata?: Record<string, unknown>;
  /** Pair these to compute a minimal field-level diff via diffJson(). */
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  /**
   * Only for routes that run outside the tenant pipeline (no
   * `@TenantScoped()`, so no request context to read these from). Self-
   * service onboarding is the case that matters: the business does not
   * exist until the handler creates it, so there is nothing for
   * `@TenantScoped()` to resolve, yet the creation is exactly the kind of
   * event the audit log must not miss.
   */
  businessId?: string | null;
  actorUserId?: string | null;
}

@Injectable()
export class AuditService {
  constructor(@Inject(DRIZZLE) private readonly rootDb: PostgresJsDatabase) {}

  /**
   * Records an audit log row using the request's RLS-scoped transaction.
   * Reads actor + business + ip + user-agent from AsyncLocalStorage; only
   * the action-specific fields need to be passed in.
   *
   * Marks the request as audit-logged so the generic AuditInterceptor
   * skips its fallback row.
   *
   * Outside a request scope (a route without `@TenantScoped()`), falls back
   * to the root connection and takes `businessId` / `actorUserId` from the
   * input. Previously this threw, which turned self-service business
   * creation into a 500 *after* the business, its roles and the owner
   * membership had already been written.
   */
  async log(input: AuditLogInput): Promise<void> {
    const ctx = tryGetRequestContext();
    // Never touch a transaction that already committed (fire-and-forget
    // work outliving its request); the root handle routes correctly.
    const db = ctx && !ctx.closed ? ctx.db : this.rootDb;

    let changesJson: Record<string, unknown> | null = null;
    if (input.before !== undefined || input.after !== undefined) {
      const diff: JsonDiff | null = diffJson(input.before ?? null, input.after ?? null);
      if (diff) changesJson = { before: diff.before, after: diff.after };
    }
    // For API-key requests we add the key id to the metadata so the audit
    // log filter can answer "what did this integration do" without
    // touching schema.
    if (ctx?.apiKeyId) {
      changesJson = {
        ...(changesJson ?? {}),
        metadata: {
          ...((changesJson as { metadata?: Record<string, unknown> } | null)?.metadata ?? {}),
          ...(input.metadata ?? {}),
          apiKeyId: ctx.apiKeyId,
        },
      };
    } else if (input.metadata) {
      changesJson = { ...(changesJson ?? {}), metadata: input.metadata };
    }

    const eventId = randomUUID();
    await db.insert(schema.auditLogs).values({
      id: eventId,
      businessId: input.businessId ?? ctx?.businessId ?? null,
      actorUserId: input.actorUserId ?? ctx?.userId ?? null,
      actorType: actorTypeFor(
        ctx?.isSuperAdmin ?? false,
        ctx?.impersonatorUserId ?? null,
        ctx?.apiKeyId ?? null,
      ),
      impersonatorUserId: ctx?.impersonatorUserId ?? null,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      changesJson: changesJson ?? null,
      ip: ctx?.ip ?? null,
      userAgent: ctx?.userAgent ?? null,
    });

    if (ctx?.businessId)
      await notifyOrderUpdate(db as unknown as PostgresJsDatabase, {
        businessId: ctx.businessId,
        actorMembershipId: ctx.membershipId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId,
        eventId,
      });

    if (ctx) ctx.auditLogged = true;
  }
}

function actorTypeFor(
  isSuperAdmin: boolean,
  impersonatorUserId: string | null,
  apiKeyId: string | null,
): ActorType {
  if (apiKeyId) return 'api_key';
  // When a super admin is impersonating, the effective user is a normal
  // business user; the audit row's actor_type reflects the *effective*
  // identity. The impersonator_user_id column makes the original visible.
  if (impersonatorUserId) return 'user';
  return isSuperAdmin ? 'super_admin' : 'user';
}
