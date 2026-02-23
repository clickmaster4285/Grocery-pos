// components/staff/StaffForm.jsx
'use client';

import { StaffCreationWizard } from "./create/StaffCreationWizard";

export const StaffForm = ({
   formData,
   updateFormField,
   handleSubmit,
   resetForm,
   editingUser,
   createUserMutation,
   updateUserMutation,
   allPermissions,
   permissionsLoading,
   ROLES,
   branches,
}) => {
   return (
      <StaffCreationWizard 
         formData={formData}
         updateFormField={updateFormField}
         handleSubmit={handleSubmit}
         resetForm={resetForm}
         allPermissions={allPermissions}
         permissionsLoading={permissionsLoading}
         branches={branches}
         isEditMode={!!editingUser}
      />
   );
};
