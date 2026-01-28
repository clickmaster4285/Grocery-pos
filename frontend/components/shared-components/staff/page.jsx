'use client';
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  Plus,
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
import { StaffForm } from "./StaffForm";
import { StaffCard } from "./StaffCard";
import { StatsCard } from "./StatsCard";
import { useStaffManagement } from "@/hooks/useStaffManagement";
import { ROLES } from "@/constants/roles";

const AllUsers = () => {
  const router = useRouter();
  const {
    // State
    users,
    filteredUsers,
    stats,
    searchTerm,
    setSearchTerm,
    isDialogOpen,
    setIsDialogOpen,
    deleteConfirmOpen,
    setDeleteConfirmOpen,
    editingUser,
    userToDelete,
    formData,

    // Constants
    ROLES: ROLE_OPTIONS,
    GROUPED_ROLES,
    DEPARTMENTS,

    // Loading & Error
    isLoading,
    error,
    refetch,
    currentUser,

    // Mutations
    createUserMutation,
    updateUserMutation,
    deleteUserMutation,

    // Form handlers
    updateFormField,
    handleSubmit,
    resetForm,
    handleEdit,
    confirmDelete,
    handleDelete,

    // Utility functions
    getStatusBadge,
    getStatusVariant,
    getRoleLabel,
    getRoleGroup,
    getDepartmentLabel
  } = useStaffManagement();

  // Redirect if not admin
  useEffect(() => {
    if (currentUser && currentUser.role !== ROLES.ADMIN) {
      router.push('/unauthorized');
    }
  }, [currentUser, router]);

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
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <Header
        onAddStaff={() => {
          resetForm();
          setIsDialogOpen(true)
        }}
        resetForm={resetForm}
      />

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
        onEdit={handleEdit}
        onDelete={confirmDelete}
        getStatusBadge={getStatusBadge}
        getStatusVariant={getStatusVariant}
        getRoleLabel={getRoleLabel}
        getRoleGroup={getRoleGroup}
        getDepartmentLabel={getDepartmentLabel}
        searchTerm={searchTerm}
        onAddStaff={() => setIsDialogOpen(true)}
      />

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <StaffForm
            key={editingUser ? `edit-${editingUser._id}` : 'create'} 
            formData={formData}
            updateFormField={updateFormField}
            handleSubmit={handleSubmit}
            resetForm={resetForm}
            editingUser={editingUser}
            createUserMutation={createUserMutation}
            updateUserMutation={updateUserMutation}
            ROLES={ROLE_OPTIONS}
            GROUPED_ROLES={GROUPED_ROLES}
            DEPARTMENTS={DEPARTMENTS}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        userToDelete={userToDelete}
        onDelete={handleDelete}
        isLoading={deleteUserMutation.isLoading}
      />
    </div>
  );
};

// Helper Components

const Header = ({ onAddStaff, resetForm }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Staff Management</h1>
      <p className="text-muted-foreground">Manage all staff members and their permissions</p>
    </div>

    <Button onClick={onAddStaff} className="gap-2">
      <UserPlus className="h-4 w-4" /> Add New Staff
    </Button>
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
  getRoleGroup,
  getDepartmentLabel,
  searchTerm,
  onAddStaff
}) => {
  if (users.length === 0) {
    return (
      <EmptyState
        hasSearchTerm={!!searchTerm}
        onAddStaff={onAddStaff}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {users.map((user) => (
        <StaffCard
          key={user._id}
          user={user}
          onEdit={onEdit}
          onDelete={onDelete}
          getStatusBadge={getStatusBadge}
          getStatusVariant={getStatusVariant}
          getRoleLabel={getRoleLabel}
          getRoleGroup={getRoleGroup}
          getDepartmentLabel={getDepartmentLabel}
        />
      ))}
    </div>
  );
};

const EmptyState = ({ hasSearchTerm, onAddStaff }) => (
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
    {!hasSearchTerm && (
      <Button onClick={onAddStaff} className="gap-2">
        <UserPlus className="h-4 w-4" /> Add First Staff
      </Button>
    )}
  </div>
);

const DeleteConfirmationDialog = ({ open, onOpenChange, userToDelete, onDelete, isLoading }) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-[425px]">
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