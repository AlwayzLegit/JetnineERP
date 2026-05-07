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
export * from './stripe';
export * from './purchasing';
export * from './transfers';
export * from './taxes';
export * from './discounts';
export * from './webhooks';
export * from './api-keys';
export * from './idempotency';
export * from './gift-cards';

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
  'merchant_stripe_accounts',
  'stripe_oauth_states',
  'vendors',
  'purchase_orders',
  'purchase_order_lines',
  'stock_transfers',
  'stock_transfer_lines',
  'tax_classes',
  'discount_codes',
  'discount_redemptions',
  'webhook_endpoints',
  'webhook_deliveries',
  'api_keys',
  'idempotency_keys',
  'gift_cards',
  'gift_card_transactions',
] as const;
