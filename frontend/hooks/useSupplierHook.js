// frontend/hooks/useSupplierHook.js
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import {
  useCreateSupplier,
  useUpdateSupplier,
  useGetSupplierById,
  useDeleteSupplier,
} from '@/features/supplier.api';

export const useSupplierHook = (supplierId = null) => {
  const router = useRouter();
  const params = useParams();
  const { user: currentUser } = useAuth();

  const isEditMode = !!supplierId;

  const { data: supplierData, isLoading: isSupplierLoading } = useGetSupplierById(supplierId, { enabled: isEditMode });

  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (isEditMode && supplierData) {
      setFormData({
        name: supplierData.name,
        description: supplierData.description || '',
        isActive: supplierData.isActive,
      });
    }
  }, [isEditMode, supplierData]);

  // Permission checks - assuming current user needs appropriate permission
  useEffect(() => {
    const requiredPermission = isEditMode ? 'suppliers:update' : 'suppliers:create';
    if (currentUser && !currentUser.permissions.includes(requiredPermission)) {
      router.push(`/${params.role}/forbidden`);
    }
  }, [currentUser, isEditMode, router, params.role]);

  const updateFormField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    const toastId = toast.loading(isEditMode ? 'Saving supplier...' : 'Creating supplier...');

    try {
      if (isEditMode) {
        await updateSupplierMutation.mutateAsync({ id: supplierId, supplierData: formData });
        toast.success('Supplier updated successfully.', { id: toastId });
      } else {
        await createSupplierMutation.mutateAsync(formData);
        toast.success('Supplier created successfully.', { id: toastId });
      }
      router.push(`/${params.role}/suppliers`);
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
    }
  }, [isEditMode, formData, supplierId, router, params.role, createSupplierMutation, updateSupplierMutation]);

  const handleDelete = useCallback(async (idToDelete) => {
    if (!idToDelete) return;
    const toastId = toast.loading('Deleting supplier...');
    try {
      await deleteSupplierMutation.mutateAsync(idToDelete);
      toast.success('Supplier deleted successfully.', { id: toastId });
      router.push(`/${params.role}/suppliers`);
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
    }
  }, [router, params.role, deleteSupplierMutation]);

  const resetForm = useCallback(() => {
    router.back();
  }, [router]);


  return {
    formData,
    isSupplierLoading,
    updateFormField,
    handleSubmit,
    handleDelete,
    resetForm,
    createSupplierMutation,
    updateSupplierMutation,
    isEditMode,
  };
};
