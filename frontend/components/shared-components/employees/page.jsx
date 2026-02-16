'use client';
import { useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react"; 
import { toast } from 'sonner'; 
import {
  Search,
  Users,
  UserPlus,
  UserCheck,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StaffTable } from "./StaffTable";
import { StatsCard } from "./StatsCard";
import { useStaffList, useDeleteStaff } from "@/features/users.api";
import { usePermissions } from "@/hooks/usePermissions";
import { ROLES } from "@/constants/roles";

const AllEmployees = () => {
  const router = useRouter();
  const { employee, currentUserRole } = usePermissions();
  
  const canReadEmployees = employee.database.read;
  const canCreateEmployees = employee.database.create;

  const { data: users = [], isLoading, error, refetch } = useStaffList({
    enabled: canReadEmployees,
  });

  const deleteEmployeeMutation = useDeleteStaff(); 
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);

  const filteredEmployees = useMemo(() => {
    if (!users || !canReadEmployees) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return users.filter(user =>
      user.firstName?.toLowerCase().includes(lowerCaseSearchTerm) ||
      user.lastName?.toLowerCase().includes(lowerCaseSearchTerm) ||
      user.email?.toLowerCase().includes(lowerCaseSearchTerm) ||
      user.phone?.includes(lowerCaseSearchTerm) ||
      user.role?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [users, searchTerm, canReadEmployees]);

  const stats = useMemo(() => {
    if (!users || !canReadEmployees) return [];
    const activeUsers = users.filter(user => user.isActive).length;
    const inactiveUsers = users.filter(user => !user.isActive).length;
    return [
      { label: 'Total Employees', value: users.length, bg: 'bg-sky-100', iconColor: 'text-sky-600', Icon: Users, border: 'border-sky-500' },
      { label: 'Active Employees', value: activeUsers, bg: 'bg-green-100', iconColor: 'text-green-600', Icon: UserCheck, border: 'border-green-500' },
      { label: 'Inactive Employees', value: inactiveUsers, bg: 'bg-red-100', iconColor: 'text-red-600', Icon: XCircle, border: 'border-red-500' },
    ];
  }, [users, canReadEmployees]);

  const confirmDelete = useCallback((employee) => {
    setEmployeeToDelete(employee);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!employeeToDelete || !employeeToDelete._id) return;
    const toastId = toast.loading('Deleting employee...');
    try {
      await deleteEmployeeMutation.mutateAsync(employeeToDelete._id);
      toast.success('Employee deleted successfully.', { id: toastId });
      setDeleteConfirmOpen(false);
      setEmployeeToDelete(null);
    } catch (err) {
      toast.error('Failed to delete employee.', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
    }
  }, [employeeToDelete, deleteEmployeeMutation]);

  const getStatusBadge = useCallback((user) => (user.isActive ? 'Active' : 'Inactive'), []);
  const getStatusVariant = useCallback((user) => (user.isActive ? 'success' : 'destructive'), []);
  const getRoleLabel = useCallback((roleValue) => {
    const role = ROLES.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }, []);

  if (isLoading) return <LoadingSkeleton />;

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center space-y-4">
        <div className="text-red-500 text-center">
          <XCircle className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Error loading employees</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => refetch()}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Header 
        onAddEmployee={() => router.push(`/${currentUserRole}/employees/create`)} 
        canCreateEmployees={canCreateEmployees} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            label={stat.label}
            value={stat.value}
            border={stat.border}
            bg={stat.bg}
            iconColor={stat.iconColor}
            Icon={stat.Icon}
          />
        ))}
      </div>

      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredCount={filteredEmployees.length}
        totalCount={users.length}
      />

      {canReadEmployees ? (
        <EmployeeList
          employees={filteredEmployees}
          onEdit={(user) => router.push(`/${currentUserRole}/employees/${user._id}/edit`)}
          onDelete={confirmDelete}
          getStatusBadge={getStatusBadge}
          getStatusVariant={getStatusVariant}
          getRoleLabel={getRoleLabel}
          searchTerm={searchTerm}
          onAddEmployee={() => router.push(`/${currentUserRole}/employees/create`)}
          canCreateEmployees={canCreateEmployees}
          currentUserRole={currentUserRole}
        />
      ) : (
        <PermissionErrorState />
      )}

      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        employeeToDelete={employeeToDelete}
        onDelete={handleDelete}
        isLoading={deleteEmployeeMutation.isLoading}
      />
    </div>
  );
};

// Helper Components
const Header = ({ onAddEmployee, canCreateEmployees }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Employee Management</h1>
      <p className="text-muted-foreground">Manage all staff members and their permissions</p>
    </div>

    {canCreateEmployees && (
      <Button onClick={onAddEmployee} className="gap-2">
        <UserPlus className="h-4 w-4" /> Add New Employee
      </Button>
    )}
  </div>
);

const SearchBar = ({ searchTerm, setSearchTerm, filteredCount, totalCount }) => (
  <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
    <div className="relative flex-1 max-w-md w-full">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Search by name, email, phone, or role..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="pl-10"
      />
    </div>

    <div className="text-sm text-muted-foreground">
      Showing {filteredCount} of {totalCount} employees
    </div>
  </div>
);

const EmployeeList = ({
  employees,
  onEdit,
  onDelete,
  getStatusBadge,
  getStatusVariant,
  getRoleLabel,
  searchTerm,
  onAddEmployee,
  canCreateEmployees,
}) => {
  if (employees.length === 0) {
    return (
      <EmptyState
        hasSearchTerm={!!searchTerm}
        onAddEmployee={onAddEmployee}
        canCreateEmployees={canCreateEmployees}
      />
    );
  }

  return (
    <StaffTable
      users={employees}
      onEdit={onEdit}
      onDelete={onDelete}
      getStatusBadge={getStatusBadge}
      getStatusVariant={getStatusVariant}
      getRoleLabel={getRoleLabel}
    />
  );
};

const EmptyState = ({ hasSearchTerm, onAddEmployee, canCreateEmployees }) => (
  <div className="border-2 border-dashed rounded-lg p-8 text-center">
    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-lg font-medium mb-2">
      {hasSearchTerm ? "No matching employees found" : "No employees yet"}
    </h3>
    <p className="text-muted-foreground mb-4">
      {hasSearchTerm
        ? "Try adjusting your search terms"
        : "Get started by adding your first employee"
      }
    </p>
    {!hasSearchTerm && canCreateEmployees && (
      <Button onClick={onAddEmployee} className="gap-2">
        <UserPlus className="h-4 w-4" /> Add First Employee
      </Button>
    )}
  </div>
);

const PermissionErrorState = () => (
  <div className="p-6 flex flex-col items-center justify-center space-y-4 text-center">
    <XCircle className="h-12 w-12 text-red-500 mx-auto" />
    <h3 className="text-xl font-semibold text-red-600">Access Denied</h3>
    <p className="text-muted-foreground">
      You do not have permission to view employees.
      <br />
      Please contact your administrator for assistance.
    </p>
  </div>
);

const DeleteConfirmationDialog = ({ open, onOpenChange, employeeToDelete, onDelete, isLoading }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-107">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Delete Employee</h2>
        <p className="text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{employeeToDelete?.firstName} {employeeToDelete?.lastName}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" variant="destructive" onClick={onDelete} disabled={isLoading}>
            {isLoading ? "Deleting..." : "Delete Employee"}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
);

const LoadingSkeleton = () => (
  <div className="p-6 space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-lg" />)}
    </div>
    <Skeleton className="h-10 w-full" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-64 rounded-lg" />)}
    </div>
  </div>
);

export default AllEmployees;