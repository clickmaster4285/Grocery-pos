import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export const useGetDashboardSummary = (period = 'today', branchId = null) => {
    return useQuery({
        queryKey: ['dashboard-summary', period, branchId],
        queryFn: async () => {
            const params = { period };
            if (branchId) params.branchId = branchId;
            const response = await api.get('/dashboard/summary', { params });
            return response.data.data;
        },
    });
};

export const useGetSalesChartData = (period = 'today', branchId = null) => {
    return useQuery({
        queryKey: ['dashboard-sales-chart', period, branchId],
        queryFn: async () => {
            const params = { period };
            if (branchId) params.branchId = branchId;
            const response = await api.get('/dashboard/sales-chart', { params });
            return response.data.data;
        },
    });
};

export const useGetPaymentMethodData = (period = 'today', branchId = null) => {
    return useQuery({
        queryKey: ['dashboard-payment-methods', period, branchId],
        queryFn: async () => {
            const params = { period };
            if (branchId) params.branchId = branchId;
            const response = await api.get('/dashboard/payment-methods', { params });
            return response.data.data;
        },
    });
};

export const useGetTopSellingProducts = (period = 'today', limit = 4, branchId = null) => {
    return useQuery({
        queryKey: ['dashboard-top-products', period, limit, branchId],
        queryFn: async () => {
            const params = { period, limit };
            if (branchId) params.branchId = branchId;
            const response = await api.get('/dashboard/top-products', { params });
            return response.data.data;
        },
    });
};

export const useGetLowStockAlerts = (limit = 3, branchId = null) => {
    return useQuery({
        queryKey: ['dashboard-low-stock', limit, branchId],
        queryFn: async () => {
            const params = { limit };
            if (branchId) params.branchId = branchId;
            const response = await api.get('/dashboard/low-stock', { params });
            return response.data.data;
        },
    });
};

export const useGetActivePromotions = (branchId = null) => {
    return useQuery({
        queryKey: ['dashboard-active-promotions', branchId],
        queryFn: async () => {
            const params = {};
            if (branchId) params.branchId = branchId;
            const response = await api.get('/dashboard/active-promotions', { params });
            return response.data.data;
        },
    });
};
