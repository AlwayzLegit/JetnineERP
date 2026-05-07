import {
  type CallHandler,
  type ExecutionContext,
  Inject,
  Injectable,
  type NestInterceptor,
} from '@nestjs/common';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Request } from 'express';
import { Observable, from, lastValueFrom } from 'rxjs';
import { withDrizzleTenantContext } from '@jetnine/db';
import { DRIZZLE } from '../database/database.module';
import type { CurrentUserPayload } from '../auth/current-user.decorator';
import {
  type RequestContext,
  type RequestTenantContext,
  requestContextStore,
} from './request-context';

/**
 * Opens a Drizzle transaction (which underneath uses a single postgres-js
 * connection), drops to the app_user role, sets the tenant GUCs
 * (current_business_id, current_user_id, is_super_admin), stashes the
 * transaction handle in AsyncLocalStorage, and runs the handler inside that
 * scope. On commit/rollback the connection is returned to the pool with all
 * SET LOCAL state discarded.
 *
 * Inside the handler, code calls `getRequestDb()` to issue ORM queries against
 * the scoped transaction. RLS policies match because the SET LOCAL ROLE
 * app_user step has already run on the same connection.
 */
@Injectable()
export class RlsContextInterceptor implements NestInterceptor {
  constructor(@Inject(DRIZZLE) private readonly db: PostgresJsDatabase) {}

  intercept(execCtx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = execCtx
      .switchToHttp()
      .getRequest<Request & { user?: CurrentUserPayload; tenant?: RequestTenantContext }>();
    const tenant = req.tenant;
    if (!tenant) {
      // Defensive: TenancyGuard didn't run, so we have nothing to scope.
      // Pass through without opening a transaction.
      return next.handle();
    }

    return from(
      withDrizzleTenantContext(
        this.db,
        {
          businessId: tenant.businessId ?? null,
          userId: tenant.userId,
          isSuperAdmin: tenant.isSuperAdmin,
        },
        async (tx) => {
          const ctx: RequestContext = {
            ...tenant,
            // Drizzle transaction is bound to a single underlying postgres-js
            // connection; consumers should issue all queries through `db`.
            tx,
            db: tx,
          };
          return requestContextStore.run(ctx, () => lastValueFrom(next.handle()));
        },
      ),
    );
  }
}
