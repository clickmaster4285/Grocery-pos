// frontend/hooks/useBrandHook.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import {
  useCreateBrand,
  useUpdateBrand,
  useGetBrandById,
  useDeleteBrand,
} from '@/features/brand.api';

export const useBrandHook = (brandId = null) => {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuth();

  const isEditMode = !!brandId;

  const { data: brandData, isLoading: isBrandLoading } = useGetBrandById(brandId, { enabled: isEditMode });

  const createBrandMutation = useCreateBrand();
  const updateBrandMutation = useUpdateBrand();
  const deleteBrandMutation = useDeleteBrand();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (isEditMode && brandData) {
      setFormData({
        name: brandData.name,
        description: brandData.description || '',
        isActive: brandData.isActive,
      });
    }
  }, [isEditMode, brandData]);

  // Permission checks - assuming current user needs appropriate permission
  useEffect(() => {
    const requiredPermission = isEditMode ? 'brands:update' : 'brands:create';
    if (currentUser && !currentUser.permissions.includes(requiredPermission)) {
      router.push(`/${params.role}/forbidden`);
    }
  }, [currentUser, isEditMode, router, params.role]);

  const updateFormField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const toastId = toast.loading(isEditMode ? 'Saving brand...' : 'Creating brand...');

    try {
      if (isEditMode) {
        await updateBrandMutation.mutateAsync({ id: brandId, brandData: formData });
        toast.success('Brand updated successfully.', { id: toastId });
      } else {
        await createBrandMutation.mutateAsync(formData);
        toast.success('Brand created successfully.', { id: toastId });
      }
      router.push(`/${params.role}/brands`);
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
    }
  }, [isEditMode, formData, brandId, router, params.role, createBrandMutation, updateBrandMutation]);

  const handleDelete = useCallback(async (idToDelete) => {
    if (!idToDelete) return;
    const toastId = toast.loading('Deleting brand...');
    try {
      await deleteBrandMutation.mutateAsync(idToDelete);
      toast.success('Brand deleted successfully.', { id: toastId });
      router.push(`/${params.role}/brands`);
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
    }
  }, [router, params.role, deleteBrandMutation]);

  const resetForm = useCallback(() => {
    router.back();
  }, [router]);


  return {
    formData,
    isBrandLoading,
    updateFormField,
    handleSubmit,
    handleDelete,
    resetForm,
    createBrandMutation,
    updateBrandMutation,
    isEditMode,
  };
};
