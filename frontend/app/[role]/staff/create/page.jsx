'use client';

import { useParams, useRouter } from 'next/navigation';
import { StaffForm } from '@/components/shared-components/staff/StaffForm';
import { useCreateUser } from '@/features/users/users.api';
import { ROLES } from '@/constants/roles';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { DialogHeader, DialogTitle, DialogDescription, Dialog } from "@/components/ui/dialog";
import { useGetPermissions } from '@/features/users/users.api';
import { useAuth } from '@/hooks/useAuth'; // Import useAuth
import { usePermissions } from '@/hooks/usePermissions'; // Import usePermissions

const StaffCreatePage = () => {
  const router = useRouter();
  const params = useParams();

  const { data: allPermissions = [], isLoading: permissionsLoading } = useGetPermissions();

  const createUserMutation = useCreateUser();

  const { user: currentUser } = useAuth(); // Get currentUser
  const { can } = usePermissions(); // Get permission check function

  // Redirect if user does not have 'users:create' permission
  useEffect(() => {
    if (currentUser && !can('users:create')) {
      router.push(`/${params.role}/forbidden`);
    }
  }, [currentUser, can, router, params.role]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: ROLES[0]?.value || '',
    password: '',
    permissions: [],
    isActive: true,
  });

  useEffect(() => {
    // For create mode, initialize permissions with all available permissions
    if (allPermissions.length > 0) {
      const flattenedPermissions = allPermissions.flatMap(module =>
        module.permissions.map(p => p.key)
      );
      setFormData((prev) => ({
        ...prev,
        permissions: flattenedPermissions,
      }));
    }
  }, [allPermissions]);

  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Creating staff...');

    const userData = { ...formData };
    if (!userData.password) {
      toast.error('Validation Error', {
        id: toastId,
        description: 'Password is required for new users.',
      });
      return;
    }

    try {
      await createUserMutation.mutateAsync(userData);
      toast.success('Staff created successfully.', { id: toastId });
      router.push(`/${params.role}/staff`);
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
    }
  };

  const resetForm = () => {
    router.back();
  };


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
        editingUser={null} // Always null for create page
        createUserMutation={createUserMutation}
        updateUserMutation={null} // Not used in create mode
        allPermissions={allPermissions}
        permissionsLoading={permissionsLoading}
        ROLES={ROLES}
      />
    </div>
  );
};

export default StaffCreatePage;
