import { Injectable } from '@nestjs/common';
import { schema } from '@jetnine/db';
import { getRequestContext, getRequestDb } from '../tenancy/request-context';
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
}

@Injectable()
export class AuditService {
  /**
   * Records an audit log row using the request's RLS-scoped transaction.
   * Reads actor + business + ip + user-agent from AsyncLocalStorage; only
   * the action-specific fields need to be passed in.
   *
   * Marks the request as audit-logged so the generic AuditInterceptor
   * skips its fallback row.
   */
  async log(input: AuditLogInput): Promise<void> {
    const ctx = getRequestContext();
    const db = getRequestDb();

    let changesJson: Record<string, unknown> | null = null;
    if (input.before !== undefined || input.after !== undefined) {
      const diff: JsonDiff | null = diffJson(input.before ?? null, input.after ?? null);
      if (diff) changesJson = { before: diff.before, after: diff.after };
    }
    // For API-key requests we add the key id to the metadata so the audit
    // log filter can answer "what did this integration do" without
    // touching schema.
    if (ctx.apiKeyId) {
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

    await db.insert(schema.auditLogs).values({
      businessId: ctx.businessId,
      actorUserId: ctx.userId,
      actorType: actorTypeFor(ctx.isSuperAdmin, ctx.impersonatorUserId, ctx.apiKeyId),
      impersonatorUserId: ctx.impersonatorUserId,
      action: input.action,
      targetType: input.targetType ?? null,
      targetId: input.targetId ?? null,
      changesJson: changesJson ?? null,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    ctx.auditLogged = true;
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
