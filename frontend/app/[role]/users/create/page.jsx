'use client';

import { StaffForm } from '@/components/shared-components/users/StaffForm';
import { DialogHeader, DialogTitle, DialogDescription, Dialog } from "@/components/ui/dialog";
import { useUsersHook } from '@/hooks/useUsersHook';
import { ROLES } from '@/constants/roles'; // Still needed for StaffForm prop

const StaffCreatePage = () => {
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

  if (isUserLoading) {
    return <div>Loading...</div>; 
  }

  return (
    <div className="p-4 md:p-6">
      <Dialog>
        <DialogHeader>
          <DialogTitle>Add New Staff</DialogTitle>
          <DialogDescription>
            Add a new staff member to your organization.
          </DialogDescription>
        </DialogHeader>
      </Dialog>
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
      />
    </div>
  );
};

export default StaffCreatePage;
