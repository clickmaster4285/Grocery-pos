import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Shield,
  BarChart3,
  Package as PackageIcon,
  TrendingUp,
} from 'lucide-react';

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const AnalyticsCharts = ({
  roleDistribution,
  projectStatusData,
  inventoryByCategory,
  systemHealthData,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Role Distribution */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            User Role Distribution
          </CardTitle>
          <CardDescription>Breakdown of users by access level</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} (${(percent * 100).toFixed(0)}%)`
                }
                outerRadius={100}
                innerRadius={60}
                dataKey="value"
              >
                {roleDistribution.map((entry, index) => (
                  <Cell key={`role-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Project Status */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600" />
            Project Status Overview
          </CardTitle>
          <CardDescription>Current state of all projects</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={projectStatusData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {projectStatusData.map((entry, index) => (
                  <Cell key={`proj-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Inventory by Category */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <PackageIcon className="h-5 w-5 text-purple-600" />
            Inventory by Category
          </CardTitle>
          <CardDescription>Stock levels across categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={inventoryByCategory} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#64748b" />
              <YAxis
                dataKey="category"
                type="category"
                stroke="#64748b"
                width={80}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
                {inventoryByCategory.map((entry, index) => (
                  <Cell key={`inv-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* System Health */}
      <Card className="bg-white shadow-sm border-slate-200">
        <CardHeader className="pb-4">
          <CardTitle className="text-slate-800 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            System Health Monitor
          </CardTitle>
          <CardDescription>Overall system performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemHealthData.map((item) => (
              <div key={item.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {item.name}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {item.value.toFixed(1)}%
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all`}
                    style={{
                      width: `${item.value}%`,
                      background:
                        item.value >= 80
                          ? 'rgb(34 197 94)'
                          : item.value >= 60
                          ? 'rgb(234 179 8)'
                          : 'rgb(239 68 68)',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsCharts;
