import api from '@/lib/api';
import { useQuery } from '@tanstack/react-query';

export const useGetDashboardSummary = (period = 'today') => {
    return useQuery({
        queryKey: ['dashboard-summary', period],
        queryFn: async () => {
            const response = await api.get('/dashboard/summary', { params: { period } });
            return response.data.data;
        },
    });
};

export const useGetSalesChartData = (period = 'today') => {
    return useQuery({
        queryKey: ['dashboard-sales-chart', period],
        queryFn: async () => {
            const response = await api.get('/dashboard/sales-chart', { params: { period } });
            return response.data.data;
        },
    });
};

export const useGetPaymentMethodData = (period = 'today') => {
    return useQuery({
        queryKey: ['dashboard-payment-methods', period],
        queryFn: async () => {
            const response = await api.get('/dashboard/payment-methods', { params: { period } });
            return response.data.data;
        },
    });
};

export const useGetTopSellingProducts = (period = 'today', limit = 4) => {
    return useQuery({
        queryKey: ['dashboard-top-products', period, limit],
        queryFn: async () => {
            const response = await api.get('/dashboard/top-products', { params: { period, limit } });
            return response.data.data;
        },
    });
};

export const useGetLowStockAlerts = (limit = 3) => {
    return useQuery({
        queryKey: ['dashboard-low-stock', limit],
        queryFn: async () => {
            const response = await api.get('/dashboard/low-stock', { params: { limit } });
            return response.data.data;
        },
    });
};

export const useGetActivePromotions = () => {
    return useQuery({
        queryKey: ['dashboard-active-promotions'],
        queryFn: async () => {
            const response = await api.get('/dashboard/active-promotions');
            return response.data.data;
        },
    });
};
