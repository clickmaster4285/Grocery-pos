import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const supplierAPI = {
  getAllSuppliers: () => api.get('/suppliers'),
  getSupplierById: (id) => api.get(`/suppliers/${id}`),
  createSupplier: (supplierData) => api.post('/suppliers', supplierData),
  updateSupplier: (id, supplierData) => api.put(`/suppliers/${id}`, supplierData),
  deleteSupplier: (id) => api.delete(`/suppliers/${id}`), // Soft delete
};

const supplierKeys = {
  all: ['suppliers'],
  lists: () => [...supplierKeys.all, 'list'],
  details: () => [...supplierKeys.all, 'detail'],
  detail: (id) => [...supplierKeys.details(), id],
};


export const useGetAllSuppliers = (options) => {
  return useQuery({
    queryKey: supplierKeys.lists(),
    queryFn: async () => {
      const response = await supplierAPI.getAllSuppliers();
      return response.data;
    },
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useGetSupplierById = (id) => {
  return useQuery({
    queryKey: supplierKeys.detail(id),
    queryFn: async () => {
      const response = await supplierAPI.getSupplierById(id);
      return response.data;
    },
    staleTime: 60 * 1000,
    enabled: !!id,
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: supplierAPI.createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, supplierData }) => supplierAPI.updateSupplier(id, supplierData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(variables.id) });
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => supplierAPI.deleteSupplier(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: supplierKeys.lists() });
      queryClient.invalidateQueries({ queryKey: supplierKeys.detail(id) });
    },
  });
};