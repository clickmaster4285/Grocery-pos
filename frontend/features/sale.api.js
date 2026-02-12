import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useCreateSale = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (saleData) => {
      const response = await api.post('/sales', saleData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sales']);
      queryClient.invalidateQueries(['branch-stock']);
    },
  });
};

export const useGetBranchSales = (branchId) => {
  return useQuery({
    queryKey: ['sales', branchId],
    queryFn: async () => {
      const response = await api.get(`/sales/branch/${branchId}`);
      return response.data.data;
    },
    enabled: !!branchId,
  });
};

export const useGetSaleDetail = (saleId) => {
  return useQuery({
    queryKey: ['sale', saleId],
    queryFn: async () => {
      const response = await api.get(`/sales/${saleId}`);
      return response.data.data;
    },
    enabled: !!saleId,
  });
};
