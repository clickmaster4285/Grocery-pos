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
import { useStaffList, useDeleteStaff } from "@/features/users/users.api";
import { useAuth } from "@/hooks/useAuth";
import { ROLES } from "@/constants/roles";

const AllUsers = () => {
  const router = useRouter();
  const { data: users = [], isLoading, error, refetch } = useStaffList();
 
  const deleteStaffMutation = useDeleteStaff();

  const { user: currentUser } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    return users.filter(user =>
      user.firstName?.toLowerCase().includes(lowerCaseSearchTerm) ||
      user.lastName?.toLowerCase().includes(lowerCaseSearchTerm) ||
      user.email?.toLowerCase().includes(lowerCaseSearchTerm) ||
      user.phone?.includes(lowerCaseSearchTerm) ||
      user.role?.toLowerCase().includes(lowerCaseSearchTerm)
    );
  }, [users, searchTerm]);

  const stats = useMemo(() => {
    if (!users) return [];
    const activeUsers = users.filter(user => user.isActive).length;
    const inactiveUsers = users.filter(user => !user.isActive).length;
    return [
      { label: 'Total Staff', value: users.length, bg: 'bg-sky-100', iconColor: 'text-sky-600', Icon: Users, border: 'border-sky-500' },
      { label: 'Active Staff', value: activeUsers, bg: 'bg-green-100', iconColor: 'text-green-600', Icon: UserCheck, border: 'border-green-500' },
      { label: 'Inactive Staff', value: inactiveUsers, bg: 'bg-red-100', iconColor: 'text-red-600', Icon: XCircle, border: 'border-red-500' },
    ];
  }, [users]);

  const confirmDelete = useCallback((user) => {
    setUserToDelete(user);
    setDeleteConfirmOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!userToDelete || !currentUser || !currentUser._id) return;
    const toastId = toast.loading('Deleting staff...');
    try {
      await deleteStaffMutation.mutateAsync(userToDelete._id); // Pass only id
      toast.success('Staff deleted successfully.', { id: toastId });
      setDeleteConfirmOpen(false);
      setUserToDelete(null);
    } catch (err) {
      toast.error('Failed to delete staff.', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
    }
  }, [userToDelete, currentUser, deleteStaffMutation]);

  const getStatusBadge = useCallback((user) => (user.isActive ? 'Active' : 'Inactive'), []);
  const getStatusVariant = useCallback((user) => (user.isActive ? 'success' : 'destructive'), []);
  const getRoleLabel = useCallback((roleValue) => {
    const role = ROLES.find(r => r.value === roleValue);
    return role ? role.label : roleValue;
  }, [ROLES]);

  // Redirect if user does not have 'users:read' permission
  useEffect(() => {
    if (currentUser && !currentUser?.permissions?.includes('users:read')) {
      router.push('/unauthorized');
    }
  }, [currentUser, router]);

  // Determine permissions for rendering UI elements
  const canCreateStaff = currentUser?.permissions?.includes('users:create');
  const canUpdateStaff = currentUser?.permissions?.includes('users:update');
  const canDeleteStaff = currentUser?.permissions?.includes('users:delete');

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center space-y-4">
        <div className="text-red-500 text-center">
          <XCircle className="h-12 w-12 mx-auto mb-2" />
          <p className="text-lg font-medium">Error loading users</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
        <Button onClick={() => refetch()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Header onAddStaff={() => router.push(`/${currentUser?.role}/users/create`)} canCreateStaff={canCreateStaff} />

      {/* Stats Cards */}
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

      {/* Search and Filters */}
      <SearchBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filteredCount={filteredUsers.length}
        totalCount={users.length}
      />

      {/* User Cards or Empty State */}
      <UserList
        users={filteredUsers}
        onEdit={(user) => router.push(`/${currentUser?.role}/users/${user._id}/edit`)}
        onDelete={confirmDelete}
        getStatusBadge={getStatusBadge}
        getStatusVariant={getStatusVariant}
        getRoleLabel={getRoleLabel}
        searchTerm={searchTerm}
        onAddStaff={() => router.push(`/${currentUser?.role}/users/create`)}
        canCreateStaff={canCreateStaff}
        canUpdateStaff={canUpdateStaff}
        canDeleteStaff={canDeleteStaff}
        currentUserRole={currentUser?.role}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        userToDelete={userToDelete}
        onDelete={handleDelete}
        isLoading={deleteStaffMutation.isLoading}
      />
    </div>
  );
};

// Helper Components

const Header = ({ onAddStaff, resetForm, canCreateStaff }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Staff Management</h1>
      <p className="text-muted-foreground">Manage all staff members and their permissions</p>
    </div>

    {canCreateStaff && (
      <Button onClick={onAddStaff} className="gap-2">
        <UserPlus className="h-4 w-4" /> Add New Staff
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
      Showing {filteredCount} of {totalCount} staff members
    </div>
  </div>
);

const UserList = ({
  users,
  onEdit,
  onDelete,
  getStatusBadge,
  getStatusVariant,
  getRoleLabel,
  searchTerm,
  onAddStaff,
  canCreateStaff,
  canUpdateStaff, 
  canDeleteStaff
}) => {
  if (users.length === 0) {
    return (
      <EmptyState
        hasSearchTerm={!!searchTerm}
        onAddStaff={onAddStaff}
        canCreateStaff={canCreateStaff}
      />
    );
  }

  return (
    <StaffTable
      users={users}
      onEdit={onEdit}
      onDelete={onDelete}
      getStatusBadge={getStatusBadge}
      getStatusVariant={getStatusVariant}
      getRoleLabel={getRoleLabel}
      canUpdateStaff={canUpdateStaff} 
      canDeleteStaff={canDeleteStaff} 
    />
  );
};

const EmptyState = ({ hasSearchTerm, onAddStaff, canCreateStaff }) => (
  <div className="border-2 border-dashed rounded-lg p-8 text-center">
    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-lg font-medium mb-2">
      {hasSearchTerm ? "No matching staff found" : "No staff members yet"}
    </h3>
    <p className="text-muted-foreground mb-4">
      {hasSearchTerm
        ? "Try adjusting your search terms"
        : "Get started by adding your first staff member"
      }
    </p>
    {!hasSearchTerm && canCreateStaff && (
      <Button onClick={onAddStaff} className="gap-2">
        <UserPlus className="h-4 w-4" /> Add First Staff
      </Button>
    )}
  </div>
);

const DeleteConfirmationDialog = ({ open, onOpenChange, userToDelete, onDelete, isLoading }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-107">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Delete Staff Member</h2>
        <p className="text-muted-foreground">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">{userToDelete?.name}</span>?
          This action cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onDelete}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete Staff"}
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
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-32 rounded-lg" />
      ))}
    </div>

    <Skeleton className="h-10 w-full" />

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map(i => (
        <Skeleton key={i} className="h-64 rounded-lg" />
      ))}
    </div>
  </div>
);

export default AllUsers;