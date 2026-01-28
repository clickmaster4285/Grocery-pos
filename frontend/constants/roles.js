// Centralized Role Definitions
export const ROLES = {
   // Core roles from your system
   ADMIN: 'admin',
   MANAGER: 'manager',

   // New roles from your employee list
};

// Role display names
export const ROLE_LABELS = {
   [ROLES.ADMIN]: 'Admin',
   [ROLES.MANAGER]: 'Manager',
};

// Allowed roles for protected routes (all roles that can access the dashboard)
export const ALLOWED_ROLES = Object.values(ROLES);
