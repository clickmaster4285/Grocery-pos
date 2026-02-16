'use client';

import { StaffForm } from '@/components/shared-components/employees/StaffForm';
import { DialogHeader, DialogTitle, DialogDescription, Dialog } from "@/components/ui/dialog";
import { useUsersHook } from '@/hooks/useUsersHook';
import { ROLES } from '@/constants/roles';
import { useGetAllBranches } from '@/features/branch.api';

const EmployeeCreatePage = () => {
  const {
    formData, 
    isUserLoading,
    permissionsLoading,
    transformedAllPermissions,
    updateFormField,
    handleSubmit,
    resetForm,
    createUserMutation,
    updateUserMutation,
    isEditMode,
    currentUser, 
  } = useUsersHook(); 

  const { data: branchesData, isLoading: branchesLoading } = useGetAllBranches();
  const branches = branchesData?.data || [];

  if (isUserLoading || branchesLoading) {
    return <div>Loading...</div>; 
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Add New Employee</h1>
        <p className="text-muted-foreground">
          Fill in the details below to create a new employee account.
        </p>
      </div>
      
      <StaffForm
        formData={formData}
        updateFormField={updateFormField}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        editingUser={null}
        createUserMutation={createUserMutation}
        updateUserMutation={updateUserMutation}
        allPermissions={transformedAllPermissions}
        permissionsLoading={permissionsLoading}
        ROLES={ROLES}
        branches={branches}
      />
    </div>
  );
};

export default EmployeeCreatePage;
