import { useState } from 'react';
import { toast } from 'sonner';
import {
  useGetBranchLocations,
  useCreateBranchLocation,
  useUpdateBranchLocation,
  useDeleteBranchLocation,
} from '@/features/branchLocation.api';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';

export const useBranchLocationHook = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState(null);

  const { inventory } = usePermissions();
  const canCreate = inventory.location.create;
  const canRead = inventory.location.read;
  const canUpdate = inventory.location.update;
  const canDelete = inventory.location.delete;

  const { user } = useAuth();
  const currentBranchId = user?.branch_id;

  const { data: locations, isLoading: isLocationsLoading, refetch } = useGetBranchLocations(currentBranchId, {
    enabled: !!currentBranchId && canRead, // Enable only if branchId exists and user has read permission
  });
  const createMutation = useCreateBranchLocation();
  const updateMutation = useUpdateBranchLocation();
  const deleteMutation = useDeleteBranchLocation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleOpenForm = (location = null) => {
    setEditingLocation(location);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setEditingLocation(null);
    setIsFormOpen(false);
  };

  const handleSubmit = async (formData) => {
    try {
      if (editingLocation) {
        await updateMutation.mutateAsync({ id: editingLocation._id, ...formData });
        toast.success('Location updated successfully!');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Location created successfully!');
      }
      refetch();
      handleCloseForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save location.');
    }
  };

  const handleDelete = async (id) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete locations.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this location?')) {
      try {
        await deleteMutation.mutateAsync(id);
        toast.success('Location deleted successfully!');
        refetch();
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete location.');
      }
    }
  };

  return {
    // Data
    locations: locations?.data || [],
    isLocationsLoading,
    
    // Form management
    isFormOpen,
    editingLocation,
    handleOpenForm,
    handleCloseForm,
    handleSubmit,
    isSubmitting,

    // Actions
    handleDelete,

    // Permissions
    canCreate,
    canRead,
    canUpdate,
    canDelete,
  };
};
