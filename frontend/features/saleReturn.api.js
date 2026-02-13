import api from '@/lib/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const useProcessReturn = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data) => {
            const response = await api.post('/sale-returns/process', data);
            return response.data;
        },
        onSuccess: (data, variables) => {
            // Invalidate original sale and sales history
            queryClient.invalidateQueries(['sale', variables.saleId]);
            queryClient.invalidateQueries(['sales']);
            queryClient.invalidateQueries(['branch-stock']);
            queryClient.invalidateQueries(['sale-history', variables.saleId]);
            queryClient.invalidateQueries(['returns']);
            toast.success('Return/Exchange processed successfully');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to process return/exchange');
        }
    });
};

export const useGetSaleHistory = (saleId) => {
    return useQuery({
        queryKey: ['sale-history', saleId],
        queryFn: async () => {
            const response = await api.get(`/sale-returns/history/${saleId}`);
            return response.data.data;
        },
        enabled: !!saleId,
    });
};

export const useGetAllReturns = () => {
    return useQuery({
        queryKey: ['returns'],
        queryFn: async () => {
            const response = await api.get('/sale-returns/all');
            return response?.data;
        }
    });
};
