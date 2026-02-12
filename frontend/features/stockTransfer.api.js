import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useCreateTransfer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (transferData) => {
      const response = await api.post('/stock-transfers', transferData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['stock-transfers']);
      queryClient.invalidateQueries(['products']);
      queryClient.invalidateQueries(['branch-stock']);
    },
  });
};

export const useGetTransfers = () => {
  return useQuery({
    queryKey: ['stock-transfers'],
    queryFn: async () => {
      const response = await api.get('/stock-transfers');
      return response.data.data;
    },
  });
};

export const useGetBranchStock = (branchId) => {
  return useQuery({
    queryKey: ['branch-stock', branchId],
    queryFn: async () => {
      const response = await api.get(`/stock-transfers/branch/${branchId}`);
      return response.data.data;
    },
    enabled: !!branchId,
  });
};
