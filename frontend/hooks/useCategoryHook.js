// frontend/hooks/useCategoryHook.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from './useAuth'; // Assuming useAuth is still relevant for general permissions
import {
  useCreateCategory,
  useUpdateCategory,
  useGetCategoryById,
  useDeleteCategory,
} from '@/features/category.api';

export const useCategoryHook = (categoryId = null) => {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuth(); // Current logged-in user

  const isEditMode = !!categoryId;

  // Fetching category data for edit mode
  const { data: categoryData, isLoading: isCategoryLoading } = useGetCategoryById(categoryId, { enabled: isEditMode });

  const createCategoryMutation = useCreateCategory();
  const updateCategoryMutation = useUpdateCategory();
  const deleteCategoryMutation = useDeleteCategory();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  // Populate form data for edit mode
  useEffect(() => {
    if (isEditMode && categoryData) {
      setFormData({
        name: categoryData.name,
        description: categoryData.description || '',
        isActive: categoryData.isActive,
      });
    }
  }, [isEditMode, categoryData]);

  // Permission checks - assuming current user needs appropriate permission
  useEffect(() => {
    const requiredPermission = isEditMode ? 'categories:update' : 'categories:create';
    if (currentUser && !currentUser.permissions.includes(requiredPermission)) {
      router.push(`/${params.role}/forbidden`);
    }
  }, [currentUser, isEditMode, router, params.role]);

  const updateFormField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const toastId = toast.loading(isEditMode ? 'Saving category...' : 'Creating category...');

    try {
      if (isEditMode) {
        await updateCategoryMutation.mutateAsync({ id: categoryId, categoryData: formData });
        toast.success('Category updated successfully.', { id: toastId });
      } else {
        await createCategoryMutation.mutateAsync(formData);
        toast.success('Category created successfully.', { id: toastId });
      }
      router.push(`/${params.role}/categories`);
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
    }
  }, [isEditMode, formData, categoryId, router, params.role, createCategoryMutation, updateCategoryMutation]);

  const handleDelete = useCallback(async () => {
    if (!categoryId) return;
    const toastId = toast.loading('Deleting category...');
    try {
      await deleteCategoryMutation.mutateAsync(categoryId);
      toast.success('Category deleted successfully.', { id: toastId });
      router.push(`/${params.role}/categories`);
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
    }
  }, [categoryId, router, params.role, deleteCategoryMutation]);

  const resetForm = useCallback(() => {
    router.back();
  }, [router]);


  return {
    formData,
    isCategoryLoading,
    updateFormField,
    handleSubmit,
    handleDelete,
    resetForm,
    createCategoryMutation,
    updateCategoryMutation,
    isEditMode,
  };
};
