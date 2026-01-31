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
    </div>
  );
};

export default AnalyticsCharts;
