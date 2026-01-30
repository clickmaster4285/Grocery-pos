'use client';

import { useParams, useRouter } from 'next/navigation';
import { StaffForm } from '@/components/shared-components/staff/StaffForm';
import { useGetUserById, useCreateUser, useUpdateUser } from '@/features/users/users.hooks';
import { ROLES } from '@/constants/roles';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

import { Dialog, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

import { useGetPermissions } from '@/features/users/users.hooks';

const StaffFormPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;

  const isEditMode = !!id;

  const { data: user, isLoading: isUserLoading } = useGetUserById(id, {
    enabled: isEditMode,
  });

  const { data: allPermissions = [], isLoading: permissionsLoading } = useGetPermissions();

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

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
    if (isEditMode && user) {
      setFormData({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || '',
        role: user.role,
        permissions: user.permissions || [],
        isActive: user.isActive,
        password: '',
      });
    }
  }, [isEditMode, user]);

  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const toastId = toast.loading(isEditMode ? 'Updating staff...' : 'Creating staff...');

    const userData = { ...formData };
    if (!userData.password) {
      delete userData.password;
    }

    try {
      if (isEditMode) {
        await updateUserMutation.mutateAsync({ id, userData });
        toast.success('Staff updated successfully.', { id: toastId });
      } else {
        await createUserMutation.mutateAsync(userData);
        toast.success('Staff created successfully.', { id: toastId });
      }
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

  if (isUserLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <DialogHeader>
        <Dialog>
        <DialogTitle>{isEditMode ? "Edit Staff Member" : "Add New Staff"}</DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Update staff member details below."
            : "Add a new staff member to your organization."
          }
        </DialogDescription>
          </Dialog >
      </DialogHeader>
      <StaffForm
        formData={formData}
        updateFormField={updateFormField}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        editingUser={isEditMode ? user : null}
        createUserMutation={createUserMutation}
        updateUserMutation={updateUserMutation}
        allPermissions={allPermissions}
        permissionsLoading={permissionsLoading}
        ROLES={ROLES}
      />
    </div>
  );
};

export default StaffFormPage;
