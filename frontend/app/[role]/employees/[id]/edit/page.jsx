'use client';

import { useParams, useRouter } from 'next/navigation';
import { StaffForm } from '@/components/shared-components/employees/StaffForm';
import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useUsersHook } from '@/hooks/useUsersHook';
import { ROLES } from '@/constants/roles';
import { useGetAllBranches } from '@/features/branch.api';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

import PageHeader from '@/components/shared-components/PageHeader';

const EmployeeEditPage = () => {
  const params = useParams();
  const router = useRouter();
  const { id } = params;

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
  } = useUsersHook(id);

  const { data: branchesData, isLoading: branchesLoading } = useGetAllBranches();
  const branches = branchesData?.data || [];

  if (isUserLoading || branchesLoading) {
    return <div>Loading employee data...</div>;
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
            <span>Edit Employee</span>
          </div>
        }
        description="Update the employee's details and permissions below."
      />

      <StaffForm
        formData={formData}
        updateFormField={updateFormField}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        editingUser={isEditMode ? { id } : null}
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

export default EmployeeEditPage;
