import type { Sql, TransactionSql } from 'postgres';

export interface TenantContext {
  businessId?: string | null;
  userId?: string | null;
  isSuperAdmin?: boolean;
}

/**
 * Run `fn` inside a transaction with RLS context set via SET LOCAL.
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

// SET LOCAL doesn't accept bind parameters; quote literals defensively.
// We only ever pass UUIDs, booleans, or empty strings.
function literal(value: string): string {
  if (!/^[0-9a-fA-F-]*$/.test(value) && value !== 'true' && value !== 'false') {
    throw new Error(`Refusing to embed unsafe value into SET LOCAL: ${value}`);
  }
  return `'${value}'`;
}
