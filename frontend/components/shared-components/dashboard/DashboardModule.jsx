'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { Users, FolderKanban, Package, AlertTriangle } from 'lucide-react';

// 🔹 Lazy-loaded components
const AdminHeader = dynamic(
  () => import('@/components/shared-components/dashboard/DashboardHeader'),
  {
    loading: () => (
      <div className="h-16 rounded-lg bg-muted animate-pulse mb-4" />
    ),
  }
);

const StatsCards = dynamic(() => import('@/components/shared-components/dashboard/StatsCards'), {
  loading: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 rounded-lg bg-muted animate-pulse" />
      ))}
    </div>
  ),
});

const AnalyticsCharts = dynamic(
  () => import('@/components/shared-components/dashboard/AnalyticsCharts'),
  {
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
        ))}
      </div>
    ),
    // If recharts breaks on SSR, you can enable:
    // ssr: false,
  }
);

const UserManagementSection = dynamic(
  () => import('@/components/shared-components/dashboard/UserManagementSection'),
  {
    loading: () => <div className="h-96 rounded-lg bg-muted animate-pulse" />,
  }
);

// ---- MOCK DATA ----
const initialUsers = [
  {
    id: '1',
    name: 'Ali Khan',
    email: 'ali.khan@matrix.com',
    role: 'admin',
    department: 'IT',
    status: 'active',
    lastLogin: '2024-11-20T08:30:00',
    createdAt: '2024-01-15',
    phone: '+1-555-0101',
  },
  {
    id: '2',
    name: 'Sara Ahmed',
    email: 'sara.ahmed@matrix.com',
    role: 'manager',
    department: 'Operations',
    status: 'active',
    lastLogin: '2024-11-20T09:15:00',
    createdAt: '2024-02-20',
    phone: '+1-555-0102',
  },
  {
    id: '3',
    name: 'Bilal Hussain',
    email: 'bilal.hussain@matrix.com',
    role: 'engineer',
    department: 'Engineering',
    status: 'active',
    lastLogin: '2024-11-19T14:20:00',
    createdAt: '2024-03-10',
    phone: '+1-555-0103',
  },
  {
    id: '4',
    name: 'Guest User',
    email: 'guest@matrix.com',
    role: 'viewer',
    department: 'External',
    status: 'inactive',
    lastLogin: '2024-11-10T11:00:00',
    createdAt: '2024-04-05',
    phone: '+1-555-0104',
  },
];

const initialProjects = [
  {
    id: 'p1',
    name: 'Tower Upgrade',
    description: '4G to 5G upgrade for key sites',
    status: 'active',
    assignedTo: ['1', '3'],
    startDate: '2025-01-10',
    endDate: '2025-03-15',
    progress: 45,
    priority: 'high',
  },
  {
    id: 'p2',
    name: 'Fiber Rollout',
    description: 'Metro fiber expansion phase 2',
    status: 'completed',
    assignedTo: ['2'],
    startDate: '2024-09-01',
    endDate: '2024-12-20',
    progress: 100,
    priority: 'medium',
  },
  {
    id: 'p3',
    name: 'IBS Project',
    description: 'In-building solution for mall',
    status: 'on-hold',
    assignedTo: ['3'],
    startDate: '2025-02-01',
    endDate: '2025-05-30',
    progress: 20,
    priority: 'high',
  },
];

const initialInventory = [
  {
    id: 'i1',
    name: 'RF Antenna',
    category: 'RF Equipment',
    quantity: 15,
    unit: 'pcs',
    minimumStock: 10,
    location: 'Warehouse A',
    lastUpdated: '2025-03-01',
    status: 'in-stock',
  },
  {
    id: 'i2',
    name: 'Fiber Patch Cord',
    category: 'Fiber',
    quantity: 8,
    unit: 'pcs',
    minimumStock: 15,
    location: 'Warehouse B',
    lastUpdated: '2025-03-02',
    status: 'low-stock',
  },
  {
    id: 'i3',
    name: 'Rack Mount Switch',
    category: 'Networking',
    quantity: 4,
    unit: 'pcs',
    minimumStock: 5,
    location: 'Warehouse C',
    lastUpdated: '2025-03-03',
    status: 'critical',
  },
  {
    id: 'i4',
    name: 'Battery Bank',
    category: 'Power',
    quantity: 20,
    unit: 'pcs',
    minimumStock: 10,
    location: 'Warehouse A',
    lastUpdated: '2025-03-04',
    status: 'in-stock',
  },
];

function getCategoryColor(category) {
  const colors = {
    'RF Equipment': '#8b5cf6',
    Fiber: '#06b6d4',
    Networking: '#f59e0b',
    Power: '#ef4444',
  };
  return colors[category] || '#6b7280';
}

const UserManagementPage = () => {
  const [users, setUsers] = useState(initialUsers);
  const [projects] = useState(initialProjects);
  const [inventory] = useState(initialInventory);

  // ---- derived values ----
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const activeProjects = projects.filter((p) => p.status === 'active').length;
  const lowStockItems = inventory.filter(
    (item) => item.quantity <= item.minimumStock
  ).length;

  const inventoryByCategory = inventory.reduce((acc, item) => {
    const existing = acc.find((i) => i.category === item.category);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      acc.push({
        category: item.category,
        quantity: item.quantity,
        color: getCategoryColor(item.category),
      });
    }
    return acc;
  }, []);

  const roleDistribution = [
    {
      name: 'Admin',
      value: users.filter((u) => u.role === 'admin').length,
      color: '#ef4444',
    },
    {
      name: 'Manager',
      value: users.filter((u) => u.role === 'manager').length,
      color: '#3b82f6',
    },
    {
      name: 'Engineer',
      value: users.filter((u) => u.role === 'engineer').length,
      color: '#10b981',
    },
    {
      name: 'Viewer',
      value: users.filter((u) => u.role === 'viewer').length,
      color: '#6b7280',
    },
  ];

  const projectStatusData = [
    {
      name: 'Active',
      value: projects.filter((p) => p.status === 'active').length,
      color: '#10b981',
    },
    {
      name: 'Completed',
      value: projects.filter((p) => p.status === 'completed').length,
      color: '#3b82f6',
    },
    {
      name: 'On Hold',
      value: projects.filter((p) => p.status === 'on-hold').length,
      color: '#f59e0b',
    },
  ];

  const systemHealthData = [
    { name: 'Users', value: (activeUsers / users.length) * 100 },
    { name: 'Projects', value: (activeProjects / projects.length) * 100 },
    {
      name: 'Inventory',
      value: ((inventory.length - lowStockItems) / inventory.length) * 100,
    },
  ];

  // ---- handlers ----
  const handleAddUser = (payload) => {
    const userToAdd = {
      ...payload,
      id: Date.now().toString(),
      status: 'active',
      lastLogin: new Date().toISOString(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setUsers((prev) => [...prev, userToAdd]);

    toast.success('User Added Successfully', {
      description: `${payload.name} has been added to the system.`,
    });
  };

  const handleDeleteUser = (id, name) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast.info('User Removed', {
      description: `${name} has been removed from the system.`,
    });
  };

  return (
    <div className="min-h-screen p-6 space-y-6 animate-fade-in">
      <AdminHeader onAddUser={handleAddUser} />

      <StatsCards
        usersCount={users.length}
        activeUsers={activeUsers}
        projectsCount={projects.length}
        activeProjects={activeProjects}
        inventoryCount={inventory.length}
        categoryCount={inventoryByCategory.length}
        lowStockItems={lowStockItems}
      />

      <AnalyticsCharts
        roleDistribution={roleDistribution}
        projectStatusData={projectStatusData}
        inventoryByCategory={inventoryByCategory}
        systemHealthData={systemHealthData}
      />

      <UserManagementSection users={users} onDeleteUser={handleDeleteUser} />
    </div>
  );
};

export default UserManagementPage;
