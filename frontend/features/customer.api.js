import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const customerAPI = {
  getAllCustomers: (params) => api.get('/customers', { params }),
  getCustomerById: (id) => api.get(`/customers/${id}`),
  createCustomer: (customerData) => api.post('/customers', customerData),
  updateCustomer: (id, customerData) => api.put(`/customers/${id}`, customerData),
  deleteCustomer: (id) => api.delete(`/customers/${id}`),
};

const customerKeys = {
  all: ['customers'],
  lists: () => [...customerKeys.all, 'list'],
  list: (params) => [...customerKeys.lists(), { params }],
  details: () => [...customerKeys.all, 'detail'],
  detail: (id) => [...customerKeys.details(), id],
};

export const useGetAllCustomers = (params) => {
  return useQuery({
    queryKey: customerKeys.list(params),
    queryFn: async () => {
      const response = await customerAPI.getAllCustomers(params);
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
};

export const useGetCustomerById = (id) => {
  return useQuery({
    queryKey: customerKeys.detail(id),
    queryFn: async () => {
      const response = await customerAPI.getCustomerById(id);
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: customerAPI.createCustomer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success('Customer created successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create customer.');
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, customerData }) => customerAPI.updateCustomer(id, customerData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      queryClient.invalidateQueries({ queryKey: customerKeys.detail(variables.id) });
      toast.success('Customer updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update customer.');
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => customerAPI.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: customerKeys.all });
      toast.success('Customer deactivated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to deactivate customer.');
    },
  });
};
