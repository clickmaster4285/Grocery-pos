// frontend/hooks/useSupplierHook.js
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth'; // Get current user for permissions
import {
  useCreateSupplier,
  useUpdateSupplier,
  useGetSupplierById,
  useDeleteSupplier,
} from '@/features/supplier.api';

// This hook will now be used by the modal/form directly
// It handles its own internal state and mutations
export const useSupplierHook = (initialSupplierData = null) => {
  const { user: currentUser } = useAuth(); // Get current user for permissions
  const isEditMode = !!initialSupplierData?._id;

  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();
  const deleteSupplierMutation = useDeleteSupplier(); // Keep for potential direct use if needed

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
      country: '',
    },
    isActive: true,
  });

  // Populate form data when initialSupplierData changes (e.g., when opening edit modal)
  useEffect(() => {
    if (initialSupplierData) {
      setFormData({
        name: initialSupplierData.name || '',
        contactPerson: initialSupplierData.contactPerson || '',
        email: initialSupplierData.email || '',
        phone: initialSupplierData.phone || '',
        address: {
          street: initialSupplierData.address?.street || '',
          city: initialSupplierData.address?.city || '',
          state: initialSupplierData.address?.state || '',
          zip: initialSupplierData.address?.zip || '',
          country: initialSupplierData.address?.country || '',
        },
        isActive: initialSupplierData.isActive,
      });
    } else {
      setFormData({
        name: '',
        contactPerson: '',
        email: '',
        phone: '',
        address: {
          street: '',
          city: '',
          state: '',
          zip: '',
          country: '',
        },
        isActive: true,
      });
    }
  }, [initialSupplierData]);

  const updateFormField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async (onSuccessCallback) => {
    const requiredPermission = isEditMode ? 'suppliers:update' : 'suppliers:create';
    
    // Frontend permission check
    if (currentUser && !currentUser.permissions.includes(requiredPermission)) {
      toast.error('Permission Denied', {
        description: `You do not have permission to ${isEditMode ? 'update' : 'create'} suppliers.`,
      });
      return; // Prevent saving
    }

    const toastId = toast.loading(isEditMode ? 'Saving supplier...' : 'Creating supplier...');

    try {
      const dataToSubmit = { ...formData };
      
      // Preprocess address object: remove if all fields are empty
      const isAddressEmpty = Object.values(dataToSubmit.address).every(value => !value);
      if (isAddressEmpty) {
        delete dataToSubmit.address;
      }

      if (isEditMode) {
        await updateSupplierMutation.mutateAsync({ id: initialSupplierData._id, supplierData: dataToSubmit });
        toast.success('Supplier updated successfully.', { id: toastId });
      } else {
        await createSupplierMutation.mutateAsync(dataToSubmit);
        toast.success('Supplier created successfully.', { id: toastId });
      }
      onSuccessCallback(); // Call success callback from parent (e.g., close modal)
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
      throw err; // Re-throw to allow parent to handle if needed
    }
  }, [isEditMode, formData, initialSupplierData, createSupplierMutation, updateSupplierMutation, currentUser]);

  return {
    formData,
    updateFormField,
    handleSave,
    createSupplierMutation,
    updateSupplierMutation,
    deleteSupplierMutation, // Still expose delete mutation
    isEditMode,
  };
};