// backend/config/permissions.js
const SYSTEM_HIERARCHY = [
  {
    module: 'Dashboard',
    icons: 'LayoutDashboard',
    menus: ['Main Dashboard'],
  },
  {
    module: 'Point of Sale',
    icons: 'ShoppingCart',
    menus: [
      'Transaction',
      'Payment Processing',
      'Customer Information',
      'Discounts & Promotions',
      'Special Items',
      'Returns & Exchanges',
      'Receipt Management',
    ],
  },
  {
    module: 'Inventory',
    icons: 'Package',
    menus: [
      'Product Database',
      'Stock Management',
      'Purchase Orders',
      'Vendor Management',
      'Categories & Departments',
      'Brands',
    ],
  },
  {
    module: 'Branch', 
    icons: 'Store',
    menus: ['Branch Management'],
  },
  {
    module: 'Customer Management',
    icons: 'Users',
    menus: [
      'Customer Database',
      'Loyalty Program',
      'Customer Groups',
      'Customer Communications',
    ],
  },
  {
    module: 'Employee',
    icons: 'UserCircle',
    menus: [
      'Employee Database',
      'Shift Management',
      'Payroll Integration',
      'Performance Management',
    ],
  },
  {
    module: 'Reporting & Analytics',
    icons: 'BarChart3',
    menus: [
      'Sales Reports',
      'Inventory Reports',
      'Customer Reports',
      'Financial Reports',
      'Employee Reports',
      'Custom Reports',
    ],
  },
  {
    module: 'Promotions',
    icons: 'Megaphone',
    menus: [
      'Promotions Management',
      'Coupon Management',
      'Loyalty Program Management',
      'Gift Card Management',
    ],
  },
  {
    module: 'Cash Management',
    icons: 'Banknote',
    menus: [
      'Cash Drawer Operations',
      'Safe Management',
      'Cash Counting',
    ],
  },
  {
    module: 'Settings',
    icons: 'Settings',
    menus: [
      'Store Settings',
      'Hardware Configuration',
      'User Management',
      'Integration Settings',
      'Security Settings',
    ],
  },
  {
    module: 'Self-Checkout',
    icons: 'ScanLine',
    menus: ['Self-Checkout Interface'],
  },
];

const permissionTypes = ['create', 'read', 'update', 'delete'];

const PERMISSIONS = [];
const PERMISSIONS_OBJECT = {};

/**
 * Generate Permissions
 * ID Format: "module_slug:menu_slug:action"
 */
SYSTEM_HIERARCHY.forEach((m) => {
  const moduleSlug = m.module.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_').replace(/-/g, '_');
  const moduleKey = moduleSlug.toUpperCase();
  
  PERMISSIONS_OBJECT[moduleKey] = {
    _MODULE_NAME: m.module,
  };

  m.menus.forEach((menuName) => {
    const menuSlug = menuName.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_').replace(/-/g, '_');
    const menuKey = menuSlug.toUpperCase();

    PERMISSIONS_OBJECT[moduleKey][menuKey] = {};

    permissionTypes.forEach((type) => {
      const permissionId = `${moduleSlug}:${menuSlug}:${type}`;
      const actionKey = type.toUpperCase();

      const permissionRecord = {
        id: permissionId,
        name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${menuName} (${m.module})`,
        module: m.module,
        menu: menuName,
        action: type,
      };

      PERMISSIONS.push(permissionRecord);
      PERMISSIONS_OBJECT[moduleKey][menuKey][actionKey] = permissionId;
    });
  });
});

module.exports = {
  SYSTEM_HIERARCHY,
  PERMISSIONS,
  PERMISSIONS_OBJECT,
};
