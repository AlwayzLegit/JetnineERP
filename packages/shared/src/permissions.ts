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
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];
