// frontend/hooks/useCategoryHook.js
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from './useAuth'; // Re-introduce useAuth
import {
  useCreateCategory,
  useUpdateCategory,
  useGetCategoryById,
  useDeleteCategory,
} from '@/features/category.api';

// This hook will now be used by the modal/form directly
// It handles its own internal state and mutations
export const useCategoryHook = (initialCategoryData = null) => {
  const { user: currentUser } = useAuth(); // Get current user for permissions
  const isEditMode = !!initialCategoryData?._id;

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory(); // Keep for potential direct use if needed

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // Populate form data when initialCategoryData changes (e.g., when opening edit modal)
  useEffect(() => {
    if (initialCategoryData) {
      setFormData({
        name: initialCategoryData.name,
        description: initialCategoryData.description || '',
        isActive: initialCategoryData.isActive,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        isActive: true,
      });
    }
  }, [initialCategoryData]);

  const updateFormField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async (onSuccessCallback) => {
    const requiredPermission = isEditMode ? 'categories:update' : 'categories:create';
    
    // Frontend permission check
    if (currentUser && !currentUser.permissions.includes(requiredPermission)) {
      toast.error('Permission Denied', {
        description: `You do not have permission to ${isEditMode ? 'update' : 'create'} categories.`,
      });
      return; // Prevent saving
    }

    const toastId = toast.loading(isEditMode ? 'Saving category...' : 'Creating category...');

    try {
      if (isEditMode) {
        await updateCategoryMutation.mutateAsync({ id: initialCategoryData._id, categoryData: formData });
        toast.success('Category updated successfully.', { id: toastId });
      } else {
        await createCategoryMutation.mutateAsync(formData);
        toast.success('Category created successfully.', { id: toastId });
      }
      onSuccessCallback(); // Call success callback from parent (e.g., close modal)
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
      throw err; // Re-throw to allow parent to handle if needed
    }
  }, [isEditMode, formData, initialCategoryData, createCategoryMutation, updateCategoryMutation, currentUser]);

  return {
    formData,
    updateFormField,
    handleSave,
    createCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation, // Still expose delete mutation
    isEditMode,
  };
};