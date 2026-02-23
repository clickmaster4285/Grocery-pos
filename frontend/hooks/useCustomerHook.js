// frontend/hooks/useCustomerHook.js
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { usePermissions } from './usePermissions';
import {
  useCreateCustomer,
  useUpdateCustomer,
  useDeleteCustomer,
} from '@/features/customer.api';

export const useCustomerHook = (initialCustomerData = null) => {
  const { customerManagement } = usePermissions();
  const isEditMode = !!initialCustomerData?._id;

  const createCustomerMutation = useCreateCustomer();
  const updateCustomerMutation = useUpdateCustomer();
  const deleteCustomerMutation = useDeleteCustomer();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phonePrimary: '',
    phoneAlternate: '',
    email: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    customerGroup: 'Regular',
    loyaltyProgram: 'Standard',
    communicationEmail: true,
    communicationSms: false,
    communicationPush: false,
    preferences: '',
    isActive: true,
  });

  useEffect(() => {
    if (initialCustomerData) {
      setFormData({
        firstName: initialCustomerData.firstName || '',
        lastName: initialCustomerData.lastName || '',
        phonePrimary: initialCustomerData.phonePrimary || '',
        phoneAlternate: initialCustomerData.phoneAlternate || '',
        email: initialCustomerData.email || '',
        streetAddress: initialCustomerData.streetAddress || '',
        city: initialCustomerData.city || '',
        state: initialCustomerData.state || '',
        zip: initialCustomerData.zip || '',
        customerGroup: initialCustomerData.customerGroup || 'Regular',
        loyaltyProgram: initialCustomerData.loyaltyProgram || 'Standard',
        communicationEmail: initialCustomerData.communicationEmail ?? true,
        communicationSms: initialCustomerData.communicationSms ?? false,
        communicationPush: initialCustomerData.communicationPush ?? false,
        preferences: initialCustomerData.preferences || '',
        isActive: initialCustomerData.isActive ?? true,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        phonePrimary: '',
        phoneAlternate: '',
        email: '',
        streetAddress: '',
        city: '',
        state: '',
        zip: '',
        customerGroup: 'Regular',
        loyaltyProgram: 'Standard',
        communicationEmail: true,
        communicationSms: false,
        communicationPush: false,
        preferences: '',
        isActive: true,
      });
    }
  }, [initialCustomerData]);

  const updateFormField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async (onSuccessCallback) => {
    const hasPermission = isEditMode ? customerManagement.database.update : customerManagement.database.create;
    
    if (!hasPermission) {
      toast.error('Permission Denied', {
        description: `You do not have permission to ${isEditMode ? 'update' : 'create'} customers.`,
      });
      return;
    }

    const toastId = toast.loading(isEditMode ? 'Saving customer...' : 'Creating customer...');

    try {
      if (isEditMode) {
        await updateCustomerMutation.mutateAsync({ id: initialCustomerData._id, customerData: formData });
        toast.success('Customer updated successfully.', { id: toastId });
      } else {
        await createCustomerMutation.mutateAsync(formData);
        toast.success('Customer created successfully.', { id: toastId });
      }
      if (onSuccessCallback) onSuccessCallback();
    } catch (err) {
      toast.error('Operation Failed', {
        id: toastId,
        description: err.response?.data?.message || err.message || 'An unexpected error occurred.',
      });
      throw err;
    }
  }, [isEditMode, formData, initialCustomerData, createCustomerMutation, updateCustomerMutation, customerManagement.database]);

  return {
    formData,
    updateFormField,
    handleSave,
    createCustomerMutation,
    updateCustomerMutation,
    deleteCustomerMutation,
    isEditMode,
  };
};
