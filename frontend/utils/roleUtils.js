// utils/roleUtils.js
export const checkRoles = (user, allowedRoles = []) => {
   if (!user || !user.user_role) return false;
   if (!allowedRoles.length) return true; // No roles specified = allow all authenticated users

   return allowedRoles.includes(user.user_role);
};

export const hasPermission = (user, requiredPermissions = []) => {
   if (!user || !requiredPermissions.length) return true;

   // You can integrate this with your ROLE_PERMISSIONS if needed
   const userPermissions = []; // Get from user object or role mapping
   return requiredPermissions.every(permission =>
      userPermissions.includes(permission)
   );
};