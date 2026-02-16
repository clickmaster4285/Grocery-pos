// frontend/hooks/useSupplierHook.js
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { usePermissions } from './usePermissions';
import {
  useCreateSupplier,
  useUpdateSupplier,
  useGetSupplierById,
  useDeleteSupplier,
} from '@/features/supplier.api';

export const useSupplierHook = (initialSupplierData = null) => {
  const { inventory } = usePermissions();
  const isEditMode = !!initialSupplierData?._id;

  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();
  const deleteSupplierMutation = useDeleteSupplier();

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
    const hasPermission = isEditMode ? inventory.suppliers.update : inventory.suppliers.create;
    
    if (!hasPermission) {
      toast.error('Permission Denied', {
        description: `You do not have permission to ${isEditMode ? 'update' : 'create'} suppliers.`,
      });
      return;
    }

    const toastId = toast.loading(isEditMode ? 'Saving supplier...' : 'Creating supplier...');

    try {
      const dataToSubmit = { ...formData };
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
      onSuccessCallback();
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
      throw err;
    }
  }, [isEditMode, formData, initialSupplierData, createSupplierMutation, updateSupplierMutation, inventory.suppliers]);

  return {
    formData,
    updateFormField,
    handleSave,
    createSupplierMutation,
    updateSupplierMutation,
    deleteSupplierMutation,
    isEditMode,
  };
};