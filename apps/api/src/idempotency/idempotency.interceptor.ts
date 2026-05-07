import {
  BadRequestException,
  type CallHandler,
  ConflictException,
  type ExecutionContext,
  HttpException,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable, firstValueFrom, from } from 'rxjs';
import type { RequestTenantContext } from '../tenancy/request-context';
import { IdempotencyService } from './idempotency.service';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const HEADER = 'idempotency-key';
const MAX_KEY_LEN = 255;
const MIN_KEY_LEN = 1;
// Conservative charset — printable ASCII excluding whitespace and quotes.
const KEY_RE = /^[A-Za-z0-9._:\-+/=]{1,255}$/;

/**
 * Stripe-style idempotency: clients send `Idempotency-Key: <opaque>`
 * on POST/PUT/PATCH/DELETE; we cache the response and replay it on
 * retries with the same key. Keys are scoped to the active business —
 * two tenants can independently use the same key string.
 *
 * Wired in `TenantScoped()` *before* the RLS interceptor so the lock
 * lives in its own auto-commit transaction. That way the lock survives
 * a handler rollback (otherwise a partial-failure retry would silently
 * re-execute the side effect).
 */
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly idem: IdempotencyService) {}

  intercept(execCtx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = execCtx.switchToHttp().getRequest<Request & { tenant?: RequestTenantContext }>();
    const res = execCtx.switchToHttp().getResponse<Response>();

    if (!MUTATING_METHODS.has(req.method)) return next.handle();
    const rawKey = req.headers[HEADER];
    if (typeof rawKey !== 'string' || rawKey.length === 0) return next.handle();

    const key = rawKey.trim();
    if (key.length < MIN_KEY_LEN || key.length > MAX_KEY_LEN || !KEY_RE.test(key)) {
      return from(
        Promise.reject(
          new BadRequestException(
            `Idempotency-Key must be 1-${MAX_KEY_LEN} chars matching [A-Za-z0-9._:\\-+/=]`,
          ),
        ),
      );
    }

    // No tenant => no scope to bind the key to. Skip; the route is
    // either super-admin-only (no business) or @Public (no auth). Those
    // aren't expected to use idempotency keys.
    const businessId = req.tenant?.businessId ?? null;
    if (!businessId) return next.handle();

    const path = (req.originalUrl ?? req.url ?? '').split('?')[0] ?? '';
    const fingerprint = this.idem.fingerprint(req.method, path, req.body);

    return from(this.run(execCtx, next, { businessId, key, fingerprint, res }));
  }

  private async run(
    _execCtx: ExecutionContext,
    next: CallHandler,
    args: { businessId: string; key: string; fingerprint: string; res: Response },
  ): Promise<unknown> {
    const { businessId, key, fingerprint, res } = args;
    const outcome = await this.idem.acquire({ businessId, key, fingerprint });

    if (outcome.kind === 'conflict') {
      throw new ConflictException(outcome.reason);
    }
    if (outcome.kind === 'replay') {
      res.setHeader('idempotent-replayed', 'true');
      res.status(outcome.status);
      return outcome.body;
    }

    // Fresh: run the handler, capture the response, persist it. On
    // failure release the lock so a retry can proceed (errors are
    // not cached — see service comment).
    try {
      const body = await firstValueFrom(next.handle() as Observable<unknown>);
      const status = res.statusCode || 200;
      await this.idem.complete({ businessId, key, status, body });
      return body;
    } catch (err) {
      await this.idem.release({ businessId, key });
      // Preserve original error type so Nest's exception filter still
      // formats it correctly (HttpException, ValidationException, etc.).
      if (err instanceof HttpException) throw err;
      throw err;
    }
  }
}
