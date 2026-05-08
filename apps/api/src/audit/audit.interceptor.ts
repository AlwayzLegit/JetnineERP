import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import { schema } from '@jetnine/db';
import type { Request } from 'express';
import { Observable, from, mergeMap, of } from 'rxjs';
import {
  type RequestTenantContext,
  getRequestContext,
  getRequestDb,
} from '../tenancy/request-context';

const STATE_CHANGING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Fields scrubbed from request bodies before they're recorded. Same list as
// pino's redact paths in app.module.ts; PLAN.md §10.6 says "Never log
// secrets, tokens, or PII".
const REDACTED_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'currentPassword',
  'newPassword',
  'secret',
  'apiKey',
  'api_key',
]);

/**
 * Auto-logs every successful state-changing call. Handlers that need to
 * record richer semantics (before/after diffs, custom action names) call
 * AuditService.log() explicitly — that flips ctx.auditLogged so this
 * interceptor's fallback row doesn't duplicate.
 *
 * Runs inside RlsContextInterceptor's transaction so the INSERT inherits
 * the tenant RLS context. Failed requests are NOT logged here (the tx
 * rolls back); the AuditService is responsible for capturing partial
 * failures when it matters.
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(execCtx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = execCtx.switchToHttp().getRequest<Request & { tenant?: RequestTenantContext }>();
    if (!STATE_CHANGING_METHODS.has(req.method)) {
      return next.handle();
    }

    // Run the handler; on success, write the fallback audit row inside
    // the same transaction (it must commit together with the handler's
    // changes — otherwise either the audit row leaks if the handler
    // rolls back, or the audit row vanishes if it tries to write after
    // commit). mergeMap awaits maybeLog before forwarding the result.
    return next
      .handle()
      .pipe(
        mergeMap((result: unknown) => from(this.maybeLog(req)).pipe(mergeMap(() => of(result)))),
      );
  }

  private async maybeLog(req: Request): Promise<void> {
    let ctx;
    try {
      ctx = getRequestContext();
    } catch {
      // No tenant context (e.g. handler used the route without
      // @TenantScoped). Nothing to audit against.
      return;
    }
    if (ctx.auditLogged) return;

    const db = getRequestDb();
    const actorType = ctx.impersonatorUserId ? 'user' : ctx.isSuperAdmin ? 'super_admin' : 'user';
    await db
      .insert(schema.auditLogs)
      .values({
        businessId: ctx.businessId,
        actorUserId: ctx.userId,
        actorType,
        impersonatorUserId: ctx.impersonatorUserId,
        action: deriveAction(req),
        targetType: null,
        targetId: null,
        changesJson: {
          method: req.method,
          path: req.originalUrl ?? req.url,
          body: redact(req.body),
        },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      })
      .catch(() => {
        // Best-effort fallback — don't fail the request because the audit
        // row couldn't be written. The explicit AuditService.log() path
        // would surface errors to the caller for important changes.
      });
    ctx.auditLogged = true;
  }
}

// Cheap action name derivation for the fallback case: "<method>.<path>".
// Real handlers should use AuditService.log() with a stable action string.
function deriveAction(req: Request): string {
  const path = (req.originalUrl ?? req.url ?? '').split('?')[0] ?? '';
  return `${req.method.toLowerCase()} ${path}`;
}

function redact(value: unknown): unknown {
  if (value == null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map(redact);
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (REDACTED_KEYS.has(k)) {
      out[k] = '[redacted]';
    } else {
      out[k] = redact(v);
    }
  }
  return out;
}
