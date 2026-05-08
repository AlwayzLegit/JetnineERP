import { sql as raw } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import type { Sql, TransactionSql } from 'postgres';

// The exact transaction handle type Drizzle hands to the .transaction()
// callback. Derived from PostgresJsDatabase so it stays in sync if Drizzle's
// internal type parameters change.
export type DrizzleTransaction = Parameters<Parameters<PostgresJsDatabase['transaction']>[0]>[0];

export interface TenantContext {
  businessId?: string | null;
  userId?: string | null;
  isSuperAdmin?: boolean;
}

/**
 * Run `fn` inside a postgres-js transaction with RLS context set via SET LOCAL.
 *
 * - SET LOCAL ROLE app_user drops superuser privileges so RLS applies.
 * - SET LOCAL app.current_business_id is read by the tenant_isolation policy.
 * - SET LOCAL app.current_user_id scopes the per-user policies (sessions, users).
 * - SET LOCAL app.is_super_admin = 'true' bypasses tenant policies.
 *
 * All settings are scoped to the transaction; once the transaction ends, the
 * connection is back to its baseline before being returned to the pool.
 */
export async function withTenantContext<T>(
  sql: Sql,
  ctx: TenantContext,
  fn: (tx: TransactionSql) => Promise<T>,
): Promise<T> {
  return sql.begin(async (tx) => {
    await tx.unsafe('SET LOCAL ROLE app_user');
    await tx.unsafe(`SET LOCAL app.current_business_id = ${literal(ctx.businessId ?? '')}`);
    await tx.unsafe(`SET LOCAL app.current_user_id = ${literal(ctx.userId ?? '')}`);
    await tx.unsafe(
      `SET LOCAL app.is_super_admin = ${literal(ctx.isSuperAdmin ? 'true' : 'false')}`,
    );
    return fn(tx);
  }) as Promise<T>;
}

/**
 * Same as withTenantContext but yields a Drizzle transaction handle. Use
 * this from app code that runs ORM queries; the postgres-js TransactionSql
 * isn't directly assignable to drizzle()'s expected client shape, so we
 * route through Drizzle's own .transaction() to keep both the SET LOCAL
 * and the ORM API on the same connection.
 */
export async function withDrizzleTenantContext<T>(
  db: PostgresJsDatabase,
  ctx: TenantContext,
  fn: (tx: DrizzleTransaction) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    await tx.execute(raw`SET LOCAL ROLE app_user`);
    await tx.execute(
      raw.raw(`SET LOCAL app.current_business_id = ${literal(ctx.businessId ?? '')}`),
    );
    await tx.execute(raw.raw(`SET LOCAL app.current_user_id = ${literal(ctx.userId ?? '')}`));
    await tx.execute(
      raw.raw(`SET LOCAL app.is_super_admin = ${literal(ctx.isSuperAdmin ? 'true' : 'false')}`),
    );
    return fn(tx);
  });
}

// SET LOCAL doesn't accept bind parameters; quote literals defensively.
// We only ever pass UUIDs, booleans, or empty strings.
function literal(value: string): string {
  if (!/^[0-9a-fA-F-]*$/.test(value) && value !== 'true' && value !== 'false') {
    throw new Error(`Refusing to embed unsafe value into SET LOCAL: ${value}`);
  }
  return `'${value}'`;
}
