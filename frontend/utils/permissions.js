// frontend/utils/permissions.js
export const userCan = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions) || userPermissions.length === 0) {
    return false;
  }
  return userPermissions.includes(requiredPermission);
};

export const userHasRole = (userRole, roleName) => {
  if (!userRole) {
    return false;
  }
  return userRole === roleName;
};
