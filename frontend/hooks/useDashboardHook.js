import { 
    useGetDashboardSummary, 
    useGetSalesChartData, 
    useGetPaymentMethodData, 
    useGetTopSellingProducts, 
    useGetLowStockAlerts, 
    useGetActivePromotions 
} from '@/features/dashboard.api';

export const useDashboardHook = (period = 'today', topProductsLimit = 4, lowStockLimit = 3) => {
    const summaryQuery = useGetDashboardSummary(period);
    const salesChartQuery = useGetSalesChartData(period);
    const paymentMethodsQuery = useGetPaymentMethodData(period);
    const topProductsQuery = useGetTopSellingProducts(period, topProductsLimit);
    const lowStockAlertsQuery = useGetLowStockAlerts(lowStockLimit);
    const activePromotionsQuery = useGetActivePromotions();

    return {
        summaryQuery,
        salesChartQuery,
        paymentMethodsQuery,
        topProductsQuery,
        lowStockAlertsQuery,
        activePromotionsQuery
    };
};
