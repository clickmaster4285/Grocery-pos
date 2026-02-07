import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

const brandAPI = {
  getAllBrands: () => api.get('/brands'),
  getBrandById: (id) => api.get(`/brands/${id}`),
  createBrand: (brandData) => api.post('/brands', brandData),
  updateBrand: (id, brandData) => api.put(`/brands/${id}`, brandData),
  deleteBrand: (id) => api.delete(`/brands/${id}`), // Soft delete
};

const brandKeys = {
  all: ['brands'],
  lists: () => [...brandKeys.all, 'list'],
  details: () => [...brandKeys.all, 'detail'],
  detail: (id) => [...brandKeys.details(), id],
};


export const useGetAllBrands = (options) => {
  return useQuery({
    queryKey: brandKeys.lists(),
    queryFn: async () => {
      const response = await brandAPI.getAllBrands();
      return response.data;
    },
    staleTime: 60 * 1000,
    ...options,
  });
};

export const useGetBrandById = (id) => {
  return useQuery({
    queryKey: brandKeys.detail(id),
    queryFn: async () => {
      const response = await brandAPI.getBrandById(id);
      return response.data;
    },
    staleTime: 60 * 1000,
    enabled: !!id,
  });
};

export const useCreateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: brandAPI.createBrand,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
    },
  });
};

export const useUpdateBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, brandData }) => brandAPI.updateBrand(id, brandData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(variables.id) });
    },
  });
};

export const useDeleteBrand = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => brandAPI.deleteBrand(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: brandKeys.lists() });
      queryClient.invalidateQueries({ queryKey: brandKeys.detail(id) });
    },
  });
};