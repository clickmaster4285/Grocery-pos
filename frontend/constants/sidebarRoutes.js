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

// Define all possible route sections with their required permission keys
export const ROUTE_SECTIONS = {
  DASHBOARD: {
    name: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={18} />,
    permissionKey: 'user_management.view', 
  },

  STAFF_MANAGEMENT: {
    name: 'Staff Management',
    path: '/staff',
    icon: <UserCog size={18} />,
    permissionKey: 'user_management.view', // Permission to view staff list
  },
};

// Bottom section items (common for all, permissions handled by individual pages if needed)
export const BOTTOM_SECTIONS = [
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings size={18} />,
    permissionKey: 'settings.view', // Placeholder
  },
  {
    name: 'Help & Support',
    path: '/help-support',
    icon: <HelpCircle size={18} />,
    permissionKey: 'help.view', // Placeholder
  },
];

// Build sidebar sections dynamically based on user permissions
export const buildSidebarSections = (canUserAccess) => {
  const mainSections = [];

  // Main Menu Section
  const mainMenuItems = [
    { ...ROUTE_SECTIONS.DASHBOARD, path: '' } // Dashboard is usually root of a role path
  ].filter(item => canUserAccess(item.permissionKey));

  if (mainMenuItems.length > 0) {
    mainSections.push({
      title: 'Main Menu',
      items: mainMenuItems,
    });
  }

  // Management Section (User, Staff)
  const managementItems = [
    ROUTE_SECTIONS.USERS_MANAGEMENT,
    ROUTE_SECTIONS.STAFF_MANAGEMENT,
  ].filter(item => canUserAccess(item.permissionKey));

  if (managementItems.length > 0) {
    mainSections.push({
      title: 'Management',
      items: managementItems,
    });
  }

  // Other sections can be added here
  const otherItems = [
    ROUTE_SECTIONS.VENDORS,
    ROUTE_SECTIONS.INVENTORY,
    ROUTE_SECTIONS.PROJECTS,
    ROUTE_SECTIONS.LOCATIONS,
    ROUTE_SECTIONS.REPORTS,
  ].filter(item => canUserAccess(item.permissionKey));

  if (otherItems.length > 0) {
    mainSections.push({
      title: 'Operations',
      items: otherItems,
    });
  }


  return {
    mainSections,
    bottomSection: {
      items: BOTTOM_SECTIONS.filter(item => canUserAccess(item.permissionKey))
    },
  };
};