import { useState, useCallback, useMemo, useEffect } from 'react';
import { toast } from 'sonner';
import {
  useGetTerminals,
  useCreateTerminal,
  useUpdateTerminal,
  useDeleteTerminal,
  useOpenTerminalSession,
  useCloseTerminalSession,
} from '@/features/terminal.api';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';

export const useTerminalHook = (filters = {}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTerminal, setEditingLocation] = useState(null); // Following pattern
  const [selectedBranchId, setSelectedBranchId] = useState(null);

  const { pos, isAdmin } = usePermissions();
  const canCreate = pos?.terminal_management?.create;
  const canRead = pos?.terminal_management?.read;
  const canUpdate = pos?.terminal_management?.update;
  const canDelete = pos?.terminal_management?.delete;

  const { user } = useAuth();
  const userBranchId = user?.branch_id?._id || user?.branch_id;

  // Sync selectedBranchId with userBranchId for non-admins
  useEffect(() => {
    if (!isAdmin && userBranchId && selectedBranchId !== userBranchId) {
      setSelectedBranchId(userBranchId);
    }
  }, [isAdmin, userBranchId, selectedBranchId]);

  const effectiveBranchId = isAdmin ? (selectedBranchId || filters.branchId) : userBranchId;

  const queryParams = useMemo(() => ({
    branchId: effectiveBranchId,
    status: filters.status,
    ...filters
  }), [effectiveBranchId, filters]);

  const { data: terminalsResponse, isLoading: isTerminalsLoading, refetch } = useGetTerminals(queryParams, {
    enabled: !!canRead,
  });

  const terminals = useMemo(() => terminalsResponse?.data || [], [terminalsResponse]);

  const createMutation = useCreateTerminal();
  const updateMutation = useUpdateTerminal();
  const deleteMutation = useDeleteTerminal();
  const openSessionMutation = useOpenTerminalSession();
  const closeSessionMutation = useCloseTerminalSession();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const handleOpenForm = useCallback((terminal = null) => {
    setEditingLocation(terminal);
    setIsFormOpen(true);
  }, []);

  const handleCloseForm = useCallback(() => {
    setEditingLocation(null);
    setIsFormOpen(false);
  }, []);

  const handleSubmit = useCallback(async (formData) => {
    try {
      if (editingTerminal) {
        await updateMutation.mutateAsync({
          id: editingTerminal._id,
          data: formData
        });
        toast.success('Terminal updated successfully!');
      } else {
        await createMutation.mutateAsync({
          ...formData,
          branch: effectiveBranchId
        });
        toast.success('Terminal created successfully!');
      }
      handleCloseForm();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save terminal.');
    }
  }, [editingTerminal, updateMutation, createMutation, handleCloseForm, effectiveBranchId]);

  const handleDelete = useCallback(async (id) => {
    if (!canDelete) {
      toast.error('You do not have permission to delete terminals.');
      return;
    }
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Terminal deleted successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete terminal.');
    }
  }, [canDelete, deleteMutation]);

  const openSession = useCallback(async (id, openingFloat) => {
    try {
      await openSessionMutation.mutateAsync({ id, data: { openingFloat } });
      toast.success('Terminal session opened successfully!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to open session.');
      throw error;
    }
  }, [openSessionMutation]);

  const closeSession = useCallback(async (id, actualCash, notes) => {
    try {
      const response = await closeSessionMutation.mutateAsync({ id, data: { actualCash, notes } });
      toast.success('Terminal session closed successfully!');
      return response.data; // Return report data
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to close session.');
      throw error;
    }
  }, [closeSessionMutation]);

  return {
    terminals,
    isTerminalsLoading,
    isFormOpen,
    editingTerminal,
    handleOpenForm,
    handleCloseForm,
    handleSubmit,
    isSubmitting,
    handleDelete,
    openSession,
    closeSession,
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
