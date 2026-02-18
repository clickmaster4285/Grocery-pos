import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const discountAPI = {
  getAllDiscounts: (params) => api.get('/discounts', { params }),
  getDiscountById: (id) => api.get(`/discounts/${id}`),
  createDiscount: (discountData) => api.post('/discounts', discountData),
  updateDiscount: (id, discountData) => api.put(`/discounts/${id}`, discountData),
  deleteDiscount: (id) => api.delete(`/discounts/${id}`),
  validateCoupon: (validationData) => api.post('/discounts/validate', validationData),
};

const discountKeys = {
  all: ['discounts'],
  lists: () => [...discountKeys.all, 'list'],
  list: (params) => [...discountKeys.lists(), { params }],
  details: () => [...discountKeys.all, 'detail'],
  detail: (id) => [...discountKeys.details(), id],
};

export const useGetAllDiscounts = (params) => {
  return useQuery({
    queryKey: discountKeys.list(params),
    queryFn: async () => {
      const response = await discountAPI.getAllDiscounts(params);
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useGetDiscountById = (id) => {
  return useQuery({
    queryKey: discountKeys.detail(id),
    queryFn: async () => {
      const response = await discountAPI.getDiscountById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: discountAPI.createDiscount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
      toast.success('Promotion created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create promotion.');
    },
  });
};

export const useUpdateDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, discountData }) => discountAPI.updateDiscount(id, discountData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
      queryClient.invalidateQueries({ queryKey: discountKeys.detail(variables.id) });
      toast.success('Promotion updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update promotion.');
    },
  });
};

export const useDeleteDiscount = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => discountAPI.deleteDiscount(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: discountKeys.all });
      toast.success('Promotion deleted successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete promotion.');
    },
  });
};

export const useValidateCoupon = () => {
  return useMutation({
    mutationFn: discountAPI.validateCoupon,
    onSuccess: (data) => {
      toast.success('Coupon is valid!');
      return data;
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Coupon validation failed.');
    },
  });
};
