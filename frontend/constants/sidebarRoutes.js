import {
  LayoutDashboard,
  Users,
  UserCog,
  FolderTree,
  MapPin,
  ClipboardList,
  Factory,
  Building2,
  Settings,
  HelpCircle,
} from 'lucide-react';
import { ROLES } from './roles';

// Permission-based configuration
export const PERMISSIONS = {
  [ROLES.ADMIN]: {
  },
  [ROLES.MANAGER]: {
  },
  // Default for all other roles
  default: {
  }
};

// Helper function to get permission
const getPermission = (role, permissionKey) => {
  return PERMISSIONS[role]?.[permissionKey] ?? PERMISSIONS.default[permissionKey];
};

// Define all possible route sections
export const ROUTE_SECTIONS = {
  DASHBOARD: {
    name: 'Dashboard',
    path: '/[role]/dashboard',
    icon: <LayoutDashboard size={18} />,
    permission: () => true, // Everyone can see dashboard
  },
  VENDORS: {
    name: 'Vendors',
    path: '/[role]/vendors',
    icon: <Factory size={18} />,
    permission: (role) => getPermission(role, ''),
  },
  INVENTORY: {
    name: 'Inventory',
    path: '/[role]/inventory',
    icon: <Building2 size={18} />,
    permission: (role) => getPermission(role, ''),
  },
  STAFF_MANAGEMENT: {
    name: 'Staff Management',
    path: '/[role]/staff',
    icon: <UserCog size={18} />,
    permission: (role) => role === ROLES.ADMIN, // Only admin
  },
};

// Bottom section items (common for all)
export const BOTTOM_SECTIONS = [
  {
    name: 'Settings',
    path: '/[role]/settings',
    icon: <Settings size={18} />,
  },
  {
    name: 'Help & Support',
    path: '/[role]/help-support',
    icon: <HelpCircle size={18} />,
  },
];

// Build sidebar sections based on role
export const buildSidebarSections = (role) => {
  // Filter visible items for this role
  const getVisibleItems = (items) => {
    return items.filter(item => {
      if (typeof item.permission === 'function') {
        return item.permission(role);
      }
      return true;
    });
  };

  // Build main sections
  const mainSections = [];

  // Main Menu Section
  const mainMenuItems = getVisibleItems([ROUTE_SECTIONS.DASHBOARD]);
  if (mainMenuItems.length > 0) {
    mainSections.push({
      title: 'Main Menu',
      items: mainMenuItems,
    });
  }


  // Inventory Management Section
  const inventoryItems = getVisibleItems([
    ROUTE_SECTIONS.VENDORS,
    ROUTE_SECTIONS.INVENTORY,
  ]);
  if (inventoryItems.length > 0) {
    mainSections.push({
      title: 'Inventory Management',
      items: inventoryItems,
    });
  }

  // Role-specific sections
  const roleSpecificItems = [];
  // Add staff management only for admin
  if (ROUTE_SECTIONS.STAFF_MANAGEMENT.permission(role)) {
    roleSpecificItems.push(ROUTE_SECTIONS.STAFF_MANAGEMENT);
  }

  if (roleSpecificItems.length > 0) {
    mainSections.push({
      title: `${role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')} Tools`,
      items: roleSpecificItems,
    });
  }

  return {
    mainSections,
    bottomSection: { items: BOTTOM_SECTIONS },
  };
};

// Pre-computed routes for all roles
export const SIDEBAR_ROUTES = Object.fromEntries(
  Object.values(ROLES).map(role => [role, buildSidebarSections(role)])
);