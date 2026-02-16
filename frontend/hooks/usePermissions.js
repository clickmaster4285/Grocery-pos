// frontend/hooks/usePermissions.js
import { useAuth } from './useAuth';
import { useCallback, useMemo } from 'react';

/**
 * usePermissions Hook
 * Provides a centralized, pre-configured way to check permissions across the system.
 */
export const usePermissions = () => {
  const { user } = useAuth();
  const userPermissions = useMemo(() => user?.permissions || [], [user]);
  const currentUserRole = useMemo(() => user?.role?.toLowerCase() || '', [user]);

  /**
   * can: Core checker
   */
  const can = useCallback((permissionId) => {
    if (!userPermissions || userPermissions.length === 0) return false;
    return userPermissions.includes(permissionId);
  }, [userPermissions]);

  /**
   * getMenuPermissions: Helper to generate a CRUD permission set for a specific menu
   */
  const getMenuPermissions = useCallback((moduleSlug, menuSlug) => {
    return {
      create: can(`${moduleSlug}:${menuSlug}:create`),
      read: can(`${moduleSlug}:${menuSlug}:read`),
      update: can(`${moduleSlug}:${menuSlug}:update`),
      delete: can(`${moduleSlug}:${menuSlug}:delete`),
      // Returns true if the user has ANY of the permissions for this menu
      any: can(`${moduleSlug}:${menuSlug}:create`) || 
           can(`${moduleSlug}:${menuSlug}:read`) || 
           can(`${moduleSlug}:${menuSlug}:update`) || 
           can(`${moduleSlug}:${menuSlug}:delete`)
    };
  }, [can]);

  /**
   * PRE-DEFINED PERMISSIONS
   * Maps backend SYSTEM_HIERARCHY to simple objects
   */
  const perms = useMemo(() => ({
    dashboard: getMenuPermissions('dashboard', 'main_dashboard'),

    // Module: Point of Sale
    pos: {
      transaction: getMenuPermissions('point_of_sale', 'transaction'),
      payment: getMenuPermissions('point_of_sale', 'payment_processing'),
      customers: getMenuPermissions('point_of_sale', 'customer_information'),
      promotions: getMenuPermissions('point_of_sale', 'discounts_promotions'),
      special: getMenuPermissions('point_of_sale', 'special_items'),
      returns: getMenuPermissions('point_of_sale', 'returns_exchanges'),
      receipts: getMenuPermissions('point_of_sale', 'receipt_management'),
    },

    // Module: Inventory
    inventory: {
      products: getMenuPermissions('inventory', 'product_database'),
      stock: getMenuPermissions('inventory', 'stock_management'),
      po: getMenuPermissions('inventory', 'purchase_orders'),
      suppliers: getMenuPermissions('inventory', 'vendor_management'),
      categories: getMenuPermissions('inventory', 'categories_departments'),
      brands: getMenuPermissions('inventory', 'brands'),
    },

    // Module: Branch
    branch: getMenuPermissions('branch', 'branch_management'),

    // Module: Customer Management
    customerManagement: {
      database: getMenuPermissions('customer_management', 'customer_database'),
      loyalty: getMenuPermissions('customer_management', 'loyalty_program'),
      groups: getMenuPermissions('customer_management', 'customer_groups'),
      comms: getMenuPermissions('customer_management', 'customer_communications'),
    },

    // Module: Employee
    employee: {
      database: getMenuPermissions('employee', 'employee_database'),
      shifts: getMenuPermissions('employee', 'shift_management'),
      payroll: getMenuPermissions('employee', 'payroll_integration'),
      performance: getMenuPermissions('employee', 'performance_management'),
    },

    // Module: Reporting
    reports: {
      sales: getMenuPermissions('reporting_analytics', 'sales_reports'),
      inventory: getMenuPermissions('reporting_analytics', 'inventory_reports'),
      customers: getMenuPermissions('reporting_analytics', 'customer_reports'),
      finance: getMenuPermissions('reporting_analytics', 'financial_reports'),
      employees: getMenuPermissions('reporting_analytics', 'employee_reports'),
      custom: getMenuPermissions('reporting_analytics', 'custom_reports'),
    },

    // Module: Promotions
    promotions: {
      management: getMenuPermissions('promotions', 'promotions_management'),
      coupons: getMenuPermissions('promotions', 'coupon_management'),
      loyalty: getMenuPermissions('promotions', 'loyalty_program_management'),
      giftcards: getMenuPermissions('promotions', 'gift_card_management'),
    },

    // Module: Cash Management
    cash: {
      drawer: getMenuPermissions('cash_management', 'cash_drawer_operations'),
      safe: getMenuPermissions('cash_management', 'safe_management'),
      counting: getMenuPermissions('cash_management', 'cash_counting'),
    },

    // Module: Settings
    settings: {
      store: getMenuPermissions('settings', 'store_settings'),
      hardware: getMenuPermissions('settings', 'hardware_configuration'),
      users: getMenuPermissions('settings', 'user_management'),
      integration: getMenuPermissions('settings', 'integration_settings'),
      security: getMenuPermissions('settings', 'security_settings'),
    },

    // Module: Self-Checkout
    selfCheckout: getMenuPermissions('self_checkout', 'self_checkout_interface'),
  }), [getMenuPermissions]);

  /**
   * Global Helpers
   */
  const isAdmin = useMemo(() => currentUserRole === 'admin', [currentUserRole]);

  return { 
    ...perms,       // Spread all pre-defined objects
    can,            // Raw checker for custom cases
    getMenuPermissions, 
    isAdmin,
    currentUserRole,
    userPermissions
  };
};
