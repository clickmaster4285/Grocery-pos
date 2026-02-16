// frontend/hooks/useCategoryHook.js
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { usePermissions } from './usePermissions';
import {
  useCreateCategory,
  useUpdateCategory,
  useGetCategoryById,
  useDeleteCategory,
} from '@/features/category.api';

export const useCategoryHook = (initialCategoryData = null) => {
  const { inventory } = usePermissions();
  const isEditMode = !!initialCategoryData?._id;

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

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
    const hasPermission = isEditMode ? inventory.categories.update : inventory.categories.create;
    
    if (!hasPermission) {
      toast.error('Permission Denied', {
        description: `You do not have permission to ${isEditMode ? 'update' : 'create'} categories.`,
      });
      return;
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
      onSuccessCallback();
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
      throw err;
    }
  }, [isEditMode, formData, initialCategoryData, createCategoryMutation, updateCategoryMutation, inventory.categories]);

  return {
    formData,
    updateFormField,
    handleSave,
    createCategoryMutation,
    updateCategoryMutation,
    deleteCategoryMutation,
    isEditMode,
  };
};