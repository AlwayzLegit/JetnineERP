import { AsyncLocalStorage } from 'node:async_hooks';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { type DrizzleTransaction } from '@jetnine/db';
import type { Permission } from '@jetnine/shared';

export interface RequestTenantContext {
  /**
   * The acting user's id when the request was authenticated by a session
   * cookie. Null for API-key requests — there is no specific human; the
   * key id lives in `apiKeyId` instead.
   */
  userId: string | null;
  isSuperAdmin: boolean;
  // Null when the request is super-admin scope (or otherwise unbound to a
  // specific tenant).
  businessId: string | null;
  membershipId: string | null;
  roleId: string | null;
  roleName: string | null;
  permissions: Set<Permission>;
  /**
   * Sales-data visibility (Sales Views Phase 1): 'store' limits sales
   * documents and dollars to `scopeLocationIds`; 'all' is unrestricted.
   * API keys and super admins are always 'all'.
   */
  dataScope: 'all' | 'store';
  /**
   * Where the member may WRITE sales documents (ring sales, take
   * orders): 'approved' limits selling to `scopeLocationIds`; 'all' is
   * unrestricted. Independent of dataScope — a member can see every
   * store's numbers yet sell only at their own store.
   */
  sellingScope: 'all' | 'approved';
  /**
   * The location ids from membership_location_scopes. Loaded whenever
   * either scope is restricted; null when both are 'all'. An empty
   * array fails closed (no data / nowhere to sell, per the restricted
   * scope in question).
   */
  scopeLocationIds: string[] | null;
  // Populated from the request when the interceptor opens the tx; useful
  // for audit logging.
  ip: string | null;
  userAgent: string | null;
  // When a super admin is impersonating, this is the super admin's user id.
  // Carried into every audit_logs row written for this request.
  impersonatorUserId: string | null;
  /**
   * When the request was authenticated by an API key, this is the key's
   * id. Used to mark audit rows with `actorType='api_key'` and so the
   * audit log can be filtered to "what did this integration do".
   */
  apiKeyId: string | null;
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
  /**
   * Flipped to true by the RLS interceptor once the request's transaction
   * has committed. Fire-and-forget work spawned inside a handler (webhook
   * delivery, email sends) inherits this context via AsyncLocalStorage but
   * MUST NOT touch the closed transaction — the DRIZZLE proxy checks this
   * flag and falls back to the root connection.
   */
  closed: boolean;
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

/**
 * Like `getRequestContext()` but returns null instead of throwing when the
 * caller is outside a request scope. For code that legitimately runs on both
 * sides of the tenant pipeline — e.g. audit logging from a route that has no
 * business yet, which is exactly the case `@TenantScoped()` cannot cover.
 */
export function tryGetRequestContext(): RequestContext | null {
  return store.getStore() ?? null;
}

export function getRequestDb(): PostgresJsDatabase {
  return getRequestContext().db;
}

export function getRequestTx(): DrizzleTransaction {
  return getRequestContext().tx;
}

export const requestContextStore = store;
