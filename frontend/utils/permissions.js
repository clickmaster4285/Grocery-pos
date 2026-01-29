// frontend/utils/permissions.js

// This map defines what roles are required for a given permission on the frontend.
// This is an interim solution until the backend's 'getMe' API provides explicit
// granular permissions (e.g., user.permissions = ['users:create']).
// The permission keys should match the backend's defined permission keys (e.g., 'users:read').
const FRONTEND_PERMISSIONS_MAP = {
  'user_management.view': ['admin', 'manager'],
  'user_management.create': ['admin', 'manager'],
  'user_management.edit': ['admin', 'manager'],
  'user_management.delete': ['admin'],
  'staff.view': ['admin', 'manager'],
  'staff.create': ['admin', 'manager'],
  // Add other granular permissions here as needed, mapping them to required roles.
};

export const userHasRole = (userRoles, role) => {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }
  return userRoles.includes(role);
};

export const hasPermission = (userRoles, requiredPermission) => {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // Admin role automatically has all permissions
  if (userRoles.includes('admin')) {
    return true;
  }

  // Check if the requiredPermission is defined in our frontend map
  const requiredRolesForPermission = FRONTEND_PERMISSIONS_MAP[requiredPermission];

  if (!requiredRolesForPermission) {
    // If permission is not defined in the map, default to deny for non-admins
    console.warn(`Permission '${requiredPermission}' not defined in FRONTEND_PERMISSIONS_MAP. Denying access.`);
    return false;
  }

  // Check if the user has any of the required roles for this permission
  return userRoles.some(role => requiredRolesForPermission.includes(role));
};
