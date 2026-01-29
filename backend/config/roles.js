const PERMISSIONS = require('./permissions');

const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CUSTOMER: 'customer',
};

// Maps roles to their granted permissions.
const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.USERS.CREATE,
    PERMISSIONS.USERS.READ,
    PERMISSIONS.USERS.UPDATE,
    PERMISSIONS.USERS.DELETE,
    PERMISSIONS.PRODUCTS.CREATE,
    PERMISSIONS.PRODUCTS.READ,
    PERMISSIONS.PRODUCTS.UPDATE,
    PERMISSIONS.PRODUCTS.DELETE,
  ],
  [ROLES.MANAGER]: [
    PERMISSIONS.DASHBOARD.VIEW,
    PERMISSIONS.PRODUCTS.CREATE,
    PERMISSIONS.PRODUCTS.READ,
    PERMISSIONS.PRODUCTS.UPDATE,
  ],
  [ROLES.CUSTOMER]: [
    PERMISSIONS.PRODUCTS.READ,
  ],
};

const hasPermission = (userRoles, requiredPermission) => {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }
  // Admin has all permissions
  if (userRoles.includes(ROLES.ADMIN)) {
    return true;
  }

  // Check if any of the user's roles have the required permission.
  return userRoles.some(role => {
    const permissions = ROLE_PERMISSIONS[role];
    return permissions && permissions.includes(requiredPermission);
  });
};

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
  hasPermission,
};
