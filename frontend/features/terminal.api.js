import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const terminalAPI = {
  getAllTerminals: (params) => api.get('/terminals', { params }),
  getTerminalById: (id) => api.get(`/terminals/${id}`),
  createTerminal: (data) => api.post('/terminals', data),
  updateTerminal: (id, data) => api.put(`/terminals/${id}`, data),
  deleteTerminal: (id) => api.delete(`/terminals/${id}`),
  openSession: (id, data) => api.put(`/terminals/${id}/open`, data),
  closeSession: (id, data) => api.put(`/terminals/${id}/close`, data),
};

const terminalKeys = {
  all: ['terminals'],
  lists: () => [...terminalKeys.all, 'list'],
  list: (params) => [...terminalKeys.lists(), params],
  details: () => [...terminalKeys.all, 'detail'],
  detail: (id) => [...terminalKeys.details(), id],
};

export const useGetTerminals = (params, options) => {
  return useQuery({
    queryKey: terminalKeys.list(params),
    queryFn: async () => {
      const response = await terminalAPI.getAllTerminals(params);
      return response.data;
    },
    staleTime: 30 * 1000,
    ...options,
  });
};

export const useGetTerminalById = (id, options) => {
  return useQuery({
    queryKey: terminalKeys.detail(id),
    queryFn: async () => {
      const response = await terminalAPI.getTerminalById(id);
      return response.data;
    },
    enabled: !!id,
    ...options,
  });
};

export const useCreateTerminal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: terminalAPI.createTerminal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['branches'] }); // Branches track terminal references
    },
  });
};

export const useUpdateTerminal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => terminalAPI.updateTerminal(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: terminalKeys.detail(variables.id) });
    },
  });
};

export const useDeleteTerminal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => terminalAPI.deleteTerminal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['branches'] });
    },
  });
};

export const useOpenTerminalSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => terminalAPI.openSession(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: terminalKeys.detail(variables.id) });
    },
  });
};

export const useCloseTerminalSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => terminalAPI.closeSession(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: terminalKeys.lists() });
      queryClient.invalidateQueries({ queryKey: terminalKeys.detail(variables.id) });
    },
  });
};
