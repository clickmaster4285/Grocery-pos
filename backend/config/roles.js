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

/**
 * Checks if a user's roles grant them a specific permission.
 * @param {string[]} userRoles - An array of roles the user has (e.g., ['admin']).
 * @param {string} requiredPermission - The permission to check for (e.g., 'users:create').
 * @returns {boolean} - True if the user has the permission, false otherwise.
 */
const hasPermission = (userRoles, requiredPermission) => {
  if (!userRoles || userRoles.length === 0) {
    return false;
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
