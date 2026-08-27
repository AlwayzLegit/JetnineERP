import { type SQL, inArray, sql } from 'drizzle-orm';
import type { PgColumn } from 'drizzle-orm/pg-core';
import type { RequestTenantContext } from '../tenancy/request-context';

/**
 * Store-level sales-data scoping (Sales Views Phase 1, owner-confirmed
 * 2026-08-27). Members with `data_scope = 'store'` see sales documents and
 * dollars only for the locations in their membership_location_scopes rows.
 *
 * Returns a WHERE fragment to AND into the query, or undefined when the
 * caller is unrestricted. A store-scoped member with no scope rows gets
 * `FALSE` — they see nothing, never everything. Combine with any
 * caller-supplied locationId filter by plain AND: a requested location
 * outside the scope intersects to an empty result rather than leaking.
 */
export function salesScopeCond(
  tenant: RequestTenantContext,
  locationColumn: PgColumn | SQL,
): SQL | undefined {
  if (tenant.dataScope !== 'store') return undefined;
  const ids = tenant.scopeLocationIds ?? [];
  if (ids.length === 0) return sql`false`;
  if (isSql(locationColumn)) {
    return sql`${locationColumn} IN (${sql.join(
      ids.map((id) => sql`${id}::uuid`),
      sql`, `,
    )})`;
  }
  return inArray(locationColumn, ids);
}

function isSql(x: PgColumn | SQL): x is SQL {
  return !('name' in x && 'table' in x);
}
