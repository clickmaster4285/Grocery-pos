import { useState, useEffect, useCallback, useMemo } from 'react';
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
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const { inventory, isAdmin } = usePermissions(); 
  const canCreate = inventory?.location?.create;
  const canRead = inventory?.location?.read;
  const canUpdate = inventory?.location?.update;
  const canDelete = inventory?.location?.delete;

  const { user } = useAuth();
  const userBranchId = user?.branch_id;

  // Sync selectedBranchId with userBranchId for non-admins
  useEffect(() => {
    if (!isAdmin && userBranchId && selectedBranchId !== userBranchId) {
      setSelectedBranchId(userBranchId);
    }
  }, [isAdmin, userBranchId, selectedBranchId]);

  const effectiveBranchId = isAdmin ? selectedBranchId : userBranchId;

  const { data: locationsResponse, isLoading: isLocationsLoading, refetch } = useGetBranchLocations(effectiveBranchId, {
    enabled: !!effectiveBranchId && canRead,
  });

  const locations = useMemo(() => locationsResponse?.data || [], [locationsResponse]);

  const createMutation = useCreateBranchLocation();
  const updateMutation = useUpdateBranchLocation();
  const deleteMutation = useDeleteBranchLocation();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleOpenForm = useCallback((location = null) => {
    setEditingLocation(location);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setEditingLocation(null);
    setIsFormOpen(false);
  }, []);

  const handleSubmit = useCallback(async (formData) => {
    try {
      if (editingLocation) {
        await updateMutation.mutateAsync({ 
          id: editingLocation._id, 
          locationData: formData // Correct structure for API
        });
        toast.success('Location updated successfully!');
      } else {
        await createMutation.mutateAsync({
          ...formData,
          branch: effectiveBranchId // Ensure branch ID is sent
        });
        toast.success('Location created successfully!');
      }
      refetch();
      handleCloseForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save location.');
    }
  }, [editingLocation, updateMutation, createMutation, refetch, handleCloseForm, effectiveBranchId]);

  const handleDelete = useCallback(async (id) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete locations.');
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Location deleted successfully!');
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete location.');
    }
  }, [canDelete, deleteMutation, refetch]);

  return {
    locations,
    isLocationsLoading,
    isFormOpen,
    editingLocation,
    handleOpenForm,
    handleCloseForm,
    handleSubmit,
    isSubmitting,
    handleDelete,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    isAdmin,
    selectedBranchId,
    setSelectedBranchId,
    refetch
  };
};
