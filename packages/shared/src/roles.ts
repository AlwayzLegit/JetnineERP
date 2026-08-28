import { ALL_PERMISSIONS, SUPER_ADMIN_ONLY_PERMISSIONS, type Permission } from './permissions.js';

export type SystemRoleName = 'Owner' | 'Manager' | 'Cashier' | 'Inventory Clerk' | 'Bookkeeper';

export interface SystemRoleDefinition {
  name: SystemRoleName;
  description: string;
  permissions: Permission[];
}

// Platform surfaces (templates, agencies) belong to the super admin, not
// to any business role — not even Owner.
const superAdminOnly = new Set<Permission>(SUPER_ADMIN_ONLY_PERMISSIONS);

const businessPermissions: Permission[] = ALL_PERMISSIONS.filter((p) => !superAdminOnly.has(p));

const ownerPermissions: Permission[] = [...businessPermissions];

const managerExclusions = new Set<Permission>([
  'business.billing.view',
  'business.billing.update',
  'roles.delete',
  'users.disable',
]);

const managerPermissions: Permission[] = businessPermissions.filter(
  (p) => !managerExclusions.has(p),
);

const cashierPermissions: Permission[] = [
  'pos.access',
  'pos.transaction.create',
  'pos.transaction.discount',
  'pos.cash.open',
  'pos.cash.reconcile',
  'sales.view',
  'customers.view',
  'customers.create',
  'products.view',
  'inventory.view',
  'discounts.view',
  'gift_cards.view',
  // Cutover: a cashier writes orders and takes money on them, but does
  // not reschedule deliveries or cancel someone else's order.
  'orders.view',
  'orders.create',
  'orders.update',
  'orders.deposit.take',
  'deliveries.view',
  'commissions.view_own',
  'service_orders.view',
  'service_orders.create',
];

const inventoryClerkPermissions: Permission[] = [
  'products.view',
  'inventory.view',
  'inventory.adjust',
  'inventory.receive',
  'inventory.transfer',
  'vendors.view',
  'vendors.manage',
  'purchase_orders.view',
  'purchase_orders.create',
  'purchase_orders.receive',
  // Cutover: the clerk works the special-order queue, the serial book,
  // and loads the trucks.
  'orders.view',
  'special_orders.manage',
  'serials.view',
  'serials.manage',
  'deliveries.view',
  'deliveries.schedule',
  'deliveries.complete',
];

const bookkeeperPermissions: Permission[] = [
  'reports.sales.view',
  'reports.inventory.view',
  'reports.financial.view',
  'reports.export',
  'reports.builder.run',
  'reports.builder.author',
  'reports.cost.view',
  'sales.view',
  'audit.view',
  // Gap sprint §0.3: the books read the override/exception register.
  'security_overrides.view',
  // §6: the books record and approve vendor invoices against POs.
  'vendor_invoices.manage',
  'purchase_orders.view',
  // Cutover: the books need order revenue, receivables, and the
  // commission run — read-only.
  'orders.view',
  'deliveries.view',
  'payment_plans.view',
  'commissions.view_all',
  'service_orders.view',
];

export const SYSTEM_ROLES: SystemRoleDefinition[] = [
  { name: 'Owner', description: 'Full control of the business', permissions: ownerPermissions },
  {
    name: 'Manager',
    description: 'Manages day-to-day operations except billing and destructive role/user actions',
    permissions: managerPermissions,
  },
  {
    name: 'Cashier',
    description: 'Operates the POS register and serves customers',
    permissions: cashierPermissions,
  },
  {
    name: 'Inventory Clerk',
    description: 'Manages products and inventory',
    permissions: inventoryClerkPermissions,
  },
  {
    name: 'Bookkeeper',
    description: 'Read-only access to reports and audit trails',
    permissions: bookkeeperPermissions,
  },
];
