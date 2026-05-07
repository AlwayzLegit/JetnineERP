export * from './platform';
export * from './auth';
export * from './tenancy';
export * from './audit';
export * from './catalog';
export * from './inventory';
export * from './customers';
export * from './sales';
export * from './cash';
export * from './billing';

// List of tables that carry a `business_id` and need RLS. Kept in sync with
// the migration script in src/migrations/rls.sql — when you add a new
// tenant-scoped table, append it both here and in that file.
export const TENANT_SCOPED_TABLES = [
  'locations',
  'memberships',
  'roles',
  'membership_location_scopes',
  'audit_logs',
  'products',
  'product_variants',
  'product_images',
  'categories',
  'inventory_levels',
  'inventory_movements',
  'customers',
  'sales',
  'sale_lines',
  'payments',
  'refunds',
  'refund_lines',
  'cash_shifts',
  'subscriptions',
] as const;
