'use client';

import { StaffForm } from '@/components/shared-components/employees/StaffForm';
import { DialogHeader, DialogTitle, DialogDescription, Dialog } from "@/components/ui/dialog";
import { useUsersHook } from '@/hooks/useUsersHook';
import { ROLES } from '@/constants/roles';
import { useGetAllBranches } from '@/features/branch.api';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

import PageHeader from '@/components/shared-components/PageHeader';

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
    <div className='bg-white p-6 rounded-2xl shadow-sm border border-slate-100'>
      <PageHeader 
        title={
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.back()}
              className="rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 h-10 w-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>Add New Employee</span>
          </div>
        }
        description="Fill in the details below to create a new employee account."
      />

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
