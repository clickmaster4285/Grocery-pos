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


export const ROUTE_SECTIONS = {
  DASHBOARD: {
    name: 'Dashboard',
    path: '/dashboard',
    icon: <LayoutDashboard size={18} />,
    permissionKey: 'dashboard:view',
  },
  STAFF_MANAGEMENT: {
    name: 'Staff Management',
    path: '/staff',
    icon: <UserCog size={18} />,
    permissionKey: 'users:read', // Assuming staff are a subset of users and require 'users:read'
  },
};

export const BOTTOM_SECTIONS = [
  {
    name: 'Settings',
    path: '/settings',
    icon: <Settings size={18} />,
    permissionKey: 'settings:view',
  },
  {
    name: 'Help & Support',
    path: '/help-support',
    icon: <HelpCircle size={18} />,
    permissionKey: 'help:view',
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
    ROUTE_SECTIONS.STAFF_MANAGEMENT,
  ].filter(item => item && canUserAccess(item.permissionKey));

  if (managementItems.length > 0) {
    mainSections.push({
      title: 'Management',
      items: managementItems,
    });
  }
  
  return {
    mainSections,
    bottomSection: {
      items: BOTTOM_SECTIONS.filter(item => canUserAccess(item.permissionKey))
    },
  };
};