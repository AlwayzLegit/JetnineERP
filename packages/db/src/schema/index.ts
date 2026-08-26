export * from './platform';
export * from './auth';
export * from './tenancy';
export * from './audit';
export * from './catalog';
export * from './inventory';
export * from './customers';
export * from './orders';
export * from './sales';
export * from './money-plans';
export * from './service';
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
export * from './migration';
export * from './templates';
export * from './integrations';
export * from './marketing';
export * from './returns';

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
  'orders',
  'order_lines',
  'deliveries',
  'delivery_lines',
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
  'tax_class_rates',
  'discount_codes',
  'discount_redemptions',
  'webhook_endpoints',
  'webhook_deliveries',
  'api_keys',
  'idempotency_keys',
  'gift_cards',
  'gift_card_transactions',
  'legacy_refs',
  'import_batches',
  'import_rows',
  'integrations',
  'po_line_allocations',
  'serial_units',
  'payment_plans',
  'payment_plan_installments',
  'commission_plans',
  'commission_entries',
  'service_orders',
  'service_order_lines',
  'service_order_notes',
  'customer_notes',
  'customer_tags',
  'customer_tag_links',
  'customer_segments',
  'campaigns',
  'order_sequences',
  'membership_permission_overrides',
  'vendor_invoices',
  'as_is_items',
  'store_credit_entries',
] as const;
