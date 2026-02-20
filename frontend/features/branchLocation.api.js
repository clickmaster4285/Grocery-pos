import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const branchLocationAPI = {
  getBranchLocations: (branchId) => api.get(`/branch-locations/branch/${branchId}`),
  getBranchLocationById: (id) => api.get(`/branch-locations/${id}`),
  createBranchLocation: (locationData) => api.post('/branch-locations', locationData),
  updateBranchLocation: (id, locationData) => api.put(`/branch-locations/${id}`, locationData),
  deleteBranchLocation: (id) => api.delete(`/branch-locations/${id}`),
};

const branchLocationKeys = {
  all: ['branchLocations'],
  lists: (branchId) => [...branchLocationKeys.all, 'list', branchId],
  details: () => [...branchLocationKeys.all, 'detail'],
  detail: (id) => [...branchLocationKeys.details(), id],
};

export const useGetBranchLocations = (branchId, options) => {
  return useQuery({
    queryKey: branchLocationKeys.lists(branchId),
    queryFn: async () => {
      const response = await branchLocationAPI.getBranchLocations(branchId);
      return response.data;
    },
    staleTime: 60 * 1000,
    enabled: !!branchId,
    ...options,
  });
};

export const useGetBranchLocationById = (id) => {
  return useQuery({
    queryKey: branchLocationKeys.detail(id),
    queryFn: async () => {
      const response = await branchLocationAPI.getBranchLocationById(id);
      return response.data;
    },
    staleTime: 60 * 1000,
    enabled: !!id,
  });
};

export const useCreateBranchLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: branchLocationAPI.createBranchLocation,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: branchLocationKeys.lists(data.branch) });
    },
  });
};

export const useUpdateBranchLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, locationData }) => branchLocationAPI.updateBranchLocation(id, locationData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: branchLocationKeys.lists(data.branch) });
      queryClient.invalidateQueries({ queryKey: branchLocationKeys.detail(variables.id) });
    },
  });
};

export const useDeleteBranchLocation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => branchLocationAPI.deleteBranchLocation(id),
    onSuccess: () => {
      // Invalidate all branch location lists as we don't know which branch it belonged to here easily
      queryClient.invalidateQueries({ queryKey: branchLocationKeys.all });
    },
  });
};