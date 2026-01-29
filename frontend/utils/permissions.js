// frontend/utils/permissions.js
export const userHasRole = (userRoles, role) => {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }
  return userRoles.includes(role);
};

export const hasPermission = (userRoles, requiredPermission) => {
    if (userRoles.includes('admin')) {
        return true;
    }

    console.warn(`Frontend hasPermission check is simplified. Backend 'getMe' needs to provide granular permissions for '${requiredPermission}' to be fully effective.`);
    return false; 
};
