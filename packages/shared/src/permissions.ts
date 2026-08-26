export const PERMISSIONS = {
  'business.settings.view': 'View business settings',
  'business.settings.update': 'Update business settings',
  'business.billing.view': 'View billing',
  'business.billing.update': 'Update billing',

  'users.view': 'View users in business',
  'users.invite': 'Invite new users',
  'users.update': 'Update user details',
  'users.disable': 'Disable users',
  'roles.view': 'View roles',
  'roles.create': 'Create custom roles',
  'roles.update': 'Update roles',
  'roles.delete': 'Delete roles',

  'locations.view': 'View locations',
  'locations.create': 'Create locations',
  'locations.update': 'Update locations',
  'locations.delete': 'Delete locations',

  'products.view': 'View products',
  'products.create': 'Create products',
  'products.update': 'Update products',
  'products.delete': 'Delete products',
  'products.cost.view': 'View product cost',
  'categories.manage': 'Manage categories',

  'inventory.view': 'View inventory levels',
  'inventory.adjust': 'Adjust inventory',
  'inventory.receive': 'Receive inventory',
  'inventory.transfer': 'Transfer between locations',

  'vendors.view': 'View vendors',
  'vendors.manage': 'Create / update / delete vendors',
  'vendor_invoices.manage': 'Record vendor invoices, match them to POs, and approve them',

  'purchase_orders.view': 'View purchase orders',
  'purchase_orders.create': 'Create purchase orders',
  'purchase_orders.receive': 'Receive against purchase orders',
  'purchase_orders.cancel': 'Cancel a purchase order',

  'customers.view': 'View customers',
  'customers.create': 'Create customers',
  'customers.update': 'Update customers',
  'customers.delete': 'Delete customers',

  'discounts.view': 'View discount codes',
  'discounts.manage': 'Create / update / delete discount codes',

  'webhooks.view': 'View webhook endpoints + delivery history',
  'webhooks.manage': 'Create / update / delete webhook endpoints',

  'api_keys.view': 'View API keys',
  'api_keys.manage': 'Create / revoke API keys',

  'gift_cards.view': 'View gift cards',
  'gift_cards.issue': 'Issue gift cards',
  'gift_cards.adjust': 'Adjust gift card balance / cancel a gift card',

  'orders.view': 'View sales orders',
  'orders.create': 'Write sales orders',
  'orders.update': 'Update sales orders and their lines',
  'orders.cancel': 'Cancel a sales order',
  'orders.deposit.take': 'Take a deposit or balance payment on an order',
  'orders.complete_with_balance': 'Complete an order that still has a balance due',
  'orders.unlock': 'Unlock an order locked by a delivery-ticket print (typed reason required)',

  'deliveries.view': 'View the delivery calendar and day sheets',
  'deliveries.schedule': 'Schedule / reschedule deliveries',
  'deliveries.complete': 'Mark deliveries delivered or failed',

  'special_orders.manage': 'Manage the to-order queue and PO allocations',

  'payment_plans.view': 'View layaway / in-house payment plans',
  'payment_plans.manage': 'Create plans and take installment payments',

  'commissions.view_own': 'View own commission entries',
  'commissions.view_all': 'View all commission entries',
  'commissions.manage': 'Manage commission plans, approve and mark entries paid',

  'service_orders.view': 'View service orders',
  'service_orders.create': 'Intake service orders',
  'service_orders.update': 'Update service orders, notes and charges',
  'service_orders.complete': 'Complete service orders',

  'serials.view': 'View serial units',
  'serials.manage': 'Create / update serial units',

  'crm.notes.manage': 'Create / update customer notes',
  'crm.tags.manage': 'Manage customer tags',
  'crm.campaigns.manage': 'Create and send email campaigns',
  'crm.automations.manage': 'Manage post-purchase automations',

  'import.run': 'Run the legacy data import (upload, validate, commit)',
  'integrations.manage':
    'Connect, sync, and disconnect external platforms (Shopify, WooCommerce, Wix)',

  'pos.access': 'Access the POS register',
  'pos.transaction.create': 'Create sales',
  'pos.transaction.discount': 'Apply line/order discounts',
  'pos.transaction.void': 'Void open transactions',
  'pos.refund.create': 'Process refunds',
  'pos.refund.approve': 'Approve refunds above limit',
  'pos.cash.open': 'Open cash drawer',
  'pos.cash.reconcile': 'Reconcile cash drawer',
  'sales.view': 'View completed sales and refund history',

  'reports.sales.view': 'View sales reports',
  'reports.inventory.view': 'View inventory reports',
  'reports.financial.view': 'View financial reports (incl. cost/margin)',
  'reports.export': 'Export reports',

  'audit.view': 'View audit log',

  'reason_codes.manage': 'Manage the reason-code registry (add / deactivate / restrict codes)',
  'security_overrides.view': 'View the security-override register',

  // Super-admin only — platform surfaces, never granted to a business role.
  'platform.templates.manage': 'Create and apply business templates (snapshots)',
  'platform.agencies.manage': 'Manage agencies and their business assignments',
} as const;

/**
 * Permissions that only ever belong to a platform super admin. They are
 * excluded from every seeded business role, Owner included — an Owner
 * runs their business, not the platform.
 */
export const SUPER_ADMIN_ONLY_PERMISSIONS = [
  'platform.templates.manage',
  'platform.agencies.manage',
] as const satisfies readonly (keyof typeof PERMISSIONS)[];

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];
