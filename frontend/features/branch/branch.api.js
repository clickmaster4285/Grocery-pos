import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

const branchAPI = {
  getAllBranches: () => api.get('/branches'),
  getBranchById: (id) => api.get(`/branches/${id}`),
  createBranch: (branchData) => api.post('/branches', branchData),
  updateBranch: (id, branchData) => api.put(`/branches/${id}`, branchData),
  toggleBranchStatus: (id) => api.delete(`/branches/${id}`),
};

const branchKeys = {
  all: ['branches'],
  lists: () => [...branchKeys.all, 'list'],
  details: () => [...branchKeys.all, 'detail'],
  detail: (id) => [...branchKeys.details(), id],
};


export const useGetAllBranches = (options) => {
  return useQuery({
    queryKey: branchKeys.lists(),
    queryFn: async () => {
      const response = await branchAPI.getAllBranches();
      return response.data;
    },
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useGetBranchById = (id) => {
  return useQuery({
    queryKey: branchKeys.detail(id),
    queryFn: async () => {
      const response = await branchAPI.getBranchById(id);
      return response.data;
    },
    staleTime: 60 * 1000,
    enabled: !!id,
  });
};

export const useCreateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: branchAPI.createBranch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
    },
  });
};

export const useUpdateBranch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, branchData }) => branchAPI.updateBranch(id, branchData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: branchKeys.detail(variables.id) });
    },
  });
};

export const useToggleBranchStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => branchAPI.toggleBranchStatus(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: branchKeys.lists() });
      queryClient.invalidateQueries({ queryKey: branchKeys.detail(id) });
    },
  });
};
