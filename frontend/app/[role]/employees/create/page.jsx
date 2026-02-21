'use client';

import { StaffForm } from '@/components/shared-components/employees/StaffForm';
import { DialogHeader, DialogTitle, DialogDescription, Dialog } from "@/components/ui/dialog";
import { useUsersHook } from '@/hooks/useUsersHook';
import { ROLES } from '@/constants/roles';
import { useGetAllBranches } from '@/features/branch.api';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const EmployeeCreatePage = () => {
  const router = useRouter();
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
    <div className='bg-white p-2 rounded-md'>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Add New Employee</h1>
          <p className="text-muted-foreground">
            Fill in the details below to create a new employee account.
          </p>
        </div>
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to List
        </Button>
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
