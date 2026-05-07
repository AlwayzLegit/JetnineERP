import { AsyncLocalStorage } from 'node:async_hooks';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { type DrizzleTransaction } from '@jetnine/db';
import type { Permission } from '@jetnine/shared';

export interface RequestTenantContext {
  userId: string;
  isSuperAdmin: boolean;
  // Null when the request is super-admin scope (or otherwise unbound to a
  // specific tenant).
  businessId: string | null;
  membershipId: string | null;
  roleId: string | null;
  roleName: string | null;
  permissions: Set<Permission>;
  // Populated from the request when the interceptor opens the tx; useful
  // for audit logging.
  ip: string | null;
  userAgent: string | null;
  // Set true when an audit handler explicitly logged this request, so the
  // generic AuditInterceptor knows not to also write a fallback row.
  auditLogged: boolean;
}

export interface RequestContext extends RequestTenantContext {
  // Drizzle transaction handle for this request. All ORM queries inside
  // the handler should route through this so they share the connection on
  // which `SET LOCAL ROLE app_user` and the tenant GUCs were applied.
  // Outside the AsyncLocalStorage scope (i.e. outside a request), this is
  // unset and `getRequestDb()` throws.
  tx: DrizzleTransaction;
  db: PostgresJsDatabase;
}

const store = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext {
  const ctx = store.getStore();
  if (!ctx) {
    throw new Error(
      'No request context in scope. Either the route is missing @TenantScoped() or you are calling this outside a request handler.',
    );
  }
  return ctx;
}

export function getRequestDb(): PostgresJsDatabase {
  return getRequestContext().db;
}

export function getRequestTx(): DrizzleTransaction {
  return getRequestContext().tx;
}

export const requestContextStore = store;
