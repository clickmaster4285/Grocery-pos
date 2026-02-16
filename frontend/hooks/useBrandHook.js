// frontend/hooks/useBrandHook.js
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { usePermissions } from './usePermissions';
import {
  useCreateBrand,
  useUpdateBrand,
  useGetBrandById,
  useDeleteBrand,
} from '@/features/brand.api';

export const useBrandHook = (initialBrandData = null) => {
  const { inventory } = usePermissions();
  const isEditMode = !!initialBrandData?._id;

  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();
  const deleteBrandMutation = useDeleteBrand();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

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
    const hasPermission = isEditMode ? inventory.brands.update : inventory.brands.create;
    
    if (!hasPermission) {
      toast.error('Permission Denied', {
        description: `You do not have permission to ${isEditMode ? 'update' : 'create'} brands.`,
      });
      return;
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
      onSuccessCallback();
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
      throw err;
    }
  }, [isEditMode, formData, initialBrandData, createBrandMutation, updateBrandMutation, inventory.brands]);

  return {
    formData,
    updateFormField,
    handleSave,
    createBrandMutation,
    updateBrandMutation,
    deleteBrandMutation,
    isEditMode,
  };
};