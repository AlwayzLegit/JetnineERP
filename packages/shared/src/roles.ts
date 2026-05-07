import { ALL_PERMISSIONS, type Permission } from './permissions.js';

export type SystemRoleName = 'Owner' | 'Manager' | 'Cashier' | 'Inventory Clerk' | 'Bookkeeper';

export interface SystemRoleDefinition {
  name: SystemRoleName;
  description: string;
  permissions: Permission[];
}

const ownerPermissions: Permission[] = [...ALL_PERMISSIONS];

const managerExclusions = new Set<Permission>([
  'business.billing.view',
  'business.billing.update',
  'roles.delete',
  'users.disable',
]);

const managerPermissions: Permission[] = ALL_PERMISSIONS.filter((p) => !managerExclusions.has(p));

const cashierPermissions: Permission[] = [
  'pos.access',
  'pos.transaction.create',
  'pos.transaction.discount',
  'sales.view',
  'customers.view',
  'customers.create',
  'products.view',
  'inventory.view',
];

const inventoryClerkPermissions: Permission[] = [
  'products.view',
  'inventory.view',
  'inventory.adjust',
  'inventory.receive',
  'inventory.transfer',
];

const bookkeeperPermissions: Permission[] = [
  'reports.sales.view',
  'reports.inventory.view',
  'reports.financial.view',
  'reports.export',
  'sales.view',
  'audit.view',
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
