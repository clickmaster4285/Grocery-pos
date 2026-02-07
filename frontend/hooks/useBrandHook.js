// frontend/hooks/useBrandHook.js
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth'; // Get current user for permissions
import {
  useCreateBrand,
  useUpdateBrand,
  useGetBrandById,
  useDeleteBrand,
} from '@/features/brand.api';

// This hook will now be used by the modal/form directly
// It handles its own internal state and mutations
export const useBrandHook = (initialBrandData = null) => {
  const { user: currentUser } = useAuth(); // Get current user for permissions
  const isEditMode = !!initialBrandData?._id;

  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();
  const deleteBrandMutation = useDeleteBrand(); // Keep for potential direct use if needed

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // Populate form data when initialBrandData changes (e.g., when opening edit modal)
  useEffect(() => {
    if (initialBrandData) {
      setFormData({
        name: initialBrandData.name,
        description: initialBrandData.description || '',
        isActive: initialBrandData.isActive,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        isActive: true,
      });
    }
  }, [initialBrandData]);

  const updateFormField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async (onSuccessCallback) => {
    const requiredPermission = isEditMode ? 'brands:update' : 'brands:create';
    
    // Frontend permission check
    if (currentUser && !currentUser.permissions.includes(requiredPermission)) {
      toast.error('Permission Denied', {
        description: `You do not have permission to ${isEditMode ? 'update' : 'create'} brands.`,
      });
      return; // Prevent saving
    }

    const toastId = toast.loading(isEditMode ? 'Saving brand...' : 'Creating brand...');

    try {
      if (isEditMode) {
        await updateBrandMutation.mutateAsync({ id: initialBrandData._id, brandData: formData });
        toast.success('Brand updated successfully.', { id: toastId });
      } else {
        await createBrandMutation.mutateAsync(formData);
        toast.success('Brand created successfully.', { id: toastId });
      }
      onSuccessCallback(); // Call success callback from parent (e.g., close modal)
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
      throw err; // Re-throw to allow parent to handle if needed
    }
  }, [isEditMode, formData, initialBrandData, createBrandMutation, updateBrandMutation, currentUser]);

  return {
    formData,
    updateFormField,
    handleSave,
    createBrandMutation,
    updateBrandMutation,
    deleteBrandMutation, // Still expose delete mutation
    isEditMode,
  };
};