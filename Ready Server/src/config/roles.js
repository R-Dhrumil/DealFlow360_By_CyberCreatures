/**
 * Dynamic Hackathon Role Registry & RBAC Permissions
 * Customized for: Ready Server
 */

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  USER: 'USER',
  SALE_MANAGER: 'SALE_MANAGER',
  FINANCE: 'FINANCE',
  SALES_PERSON: 'SALES_PERSON',
};

export const ALL_ROLES = Object.values(ROLES);

export const ROLE_PERMISSIONS = {
  [ROLES.SUPER_ADMIN]: ['read:super_admin_data', 'write:super_admin_data'],
  [ROLES.ADMIN]: ['*'],
  [ROLES.USER]: ['read:own_profile'],
  [ROLES.SALE_MANAGER]: ['read:sale_manager_data', 'write:sale_manager_data'],
  [ROLES.FINANCE]: ['read:finance_data', 'write:finance_data'],
  [ROLES.SALES_PERSON]: ['read:sales_person_data', 'write:sales_person_data'],
};

export const hasPermission = (userRole, permission) => {
  const permissions = ROLE_PERMISSIONS[userRole] || [];
  return permissions.includes('*') || permissions.includes(permission);
};
