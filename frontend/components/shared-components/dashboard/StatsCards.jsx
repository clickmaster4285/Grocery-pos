import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, FolderKanban, Package, AlertTriangle } from 'lucide-react';

const StatsCards = ({
  usersCount,
  activeUsers,
  projectsCount,
  activeProjects,
  inventoryCount,
  categoryCount,
  lowStockItems,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
      <Card className="bg-white border-l-4 border-l-primary shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {usersCount}
              </div>
              <div className="text-sm text-slate-600">Total Users</div>
              <Badge
                variant="outline"
                className="bg-emerald-50 text-emerald-700 border-emerald-200 mt-1"
              >
                {activeUsers} active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 rounded-xl">
              <FolderKanban className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {projectsCount}
              </div>
              <div className="text-sm text-slate-600">Total Projects</div>
              <Badge
                variant="outline"
                className="bg-sky-50 text-sky-700 border-sky-200 mt-1"
              >
                {activeProjects} active
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 rounded-xl">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {inventoryCount}
              </div>
              <div className="text-sm text-slate-600">Inventory Items</div>
              <Badge
                variant="outline"
                className="bg-purple-50 text-purple-700 border-purple-200 mt-1"
              >
                {categoryCount} categories
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-all duration-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-xl">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-800">
                {lowStockItems}
              </div>
              <div className="text-sm text-slate-600">Low Stock Alerts</div>
              <Badge
                variant="outline"
                className="bg-red-50 text-red-700 border-red-200 mt-1"
              >
                Needs attention
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StatsCards;
