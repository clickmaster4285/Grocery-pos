import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Store,
  Users,
  UserCircle,
  BarChart3,
  Megaphone,
  Banknote,
  Settings,
  ScanLine,
  Building2,
  ShieldCheck,
  Zap,
  RotateCcw,
  History,
  CreditCard,
  Percent,
  Star,
  Receipt,
  Boxes,
  Truck,
  Tags,
  MapPin,
  List,
  TrendingUp,
  UserPlus,
  Calendar,
  Wallet,
  Award,
  FileText,
  PieChart,
  ClipboardList,
  DollarSign,
  Briefcase,
  Wrench,
  Key,
  Database,
  Globe,
  Lock,
  Cpu,
} from 'lucide-react';

/**
 * MODULE_ICONS mapping
 * Link the string icon name from backend to the Lucide component
 */
export const MODULE_ICONS = {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Store,
  Users,
  UserCircle,
  BarChart3,
  Megaphone,
  Banknote,
  Settings,
  ScanLine,
  Building2,
  ShieldCheck,
  Zap,
};

/**
 * MENU_METADATA
 * Mapping slugs to their frontend paths and optional icons.
 * This is the ONLY place you need to update when adding new pages.
 */
export const MENU_METADATA = {
  // Module: Dashboard
  'main_dashboard': { path: '/dashboard', icon: LayoutDashboard },

  // Module: Point of Sale
  'transaction_screen': { path: '/sales', icon: ShoppingCart },
  'payment_processing': { path: '/pos/payment', icon: CreditCard },
  'customer_information': { path: '/customers', icon: Users },
  'discounts_promotions': { path: '/promotions', icon: Percent },
  'special_items': { path: '/pos/special', icon: Star },
  'returns_exchanges': { path: '/returns', icon: RotateCcw },
  'receipt_management': { path: '/pos/receipts', icon: Receipt },

  // Module: Inventory Management
  'product_database': { path: '/products', icon: Package },
  'stock_management': { path: '/stock', icon: Boxes },
  'purchase_orders': { path: '/inventory/po', icon: ClipboardList },
  'vendor_management': { path: '/suppliers', icon: Truck },
  'categories_departments': { path: '/categories', icon: Tags },
  'brands': { path: '/brands', icon: Building2 },

  // Module: Branch Management
  'branch_list': { path: '/branches', icon: List },
  'store_locator': { path: '/branches/map', icon: MapPin },
  'branch_performance': { path: '/branches/stats', icon: TrendingUp },

  // Module: Customer Management
  'customer_database': { path: '/customers', icon: UserPlus },
  'loyalty_program': { path: '/customers/loyalty', icon: Award },
  'customer_groups': { path: '/customers/groups', icon: Users },
  'customer_communications': { path: '/customers/comms', icon: Globe },

  // Module: Employee Management
  'employee_database': { path: '/employees', icon: UserCircle },
  'shift_management': { path: '/employees/shifts', icon: Calendar },
  'payroll_integration': { path: '/employees/payroll', icon: Wallet },
  'performance_management': { path: '/employees/performance', icon: TrendingUp },

  // Module: Reporting
  'sales_reports': { path: '/reports/sales', icon: BarChart3 },
  'inventory_reports': { path: '/reports/inventory', icon: PieChart },
  'financial_reports': { path: '/reports/finance', icon: DollarSign },

  // Module: Settings
  'store_settings': { path: '/settings', icon: Settings },
  'hardware_configuration': { path: '/settings/hardware', icon: Cpu },
  'user_management': { path: '/settings/users', icon: Key },
  'security_settings': { path: '/settings/security', icon: Lock },
};
