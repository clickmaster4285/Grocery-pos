import { 
    useGetDashboardSummary, 
    useGetSalesChartData, 
    useGetPaymentMethodData, 
    useGetTopSellingProducts, 
    useGetLowStockAlerts, 
    useGetActivePromotions 
} from '@/features/dashboard.api';

export const useDashboardHook = (period = 'today', branchId = null, topProductsLimit = 4, lowStockLimit = 3) => {
    const summaryQuery = useGetDashboardSummary(period, branchId);
    const salesChartQuery = useGetSalesChartData(period, branchId);
    const paymentMethodsQuery = useGetPaymentMethodData(period, branchId);
    const topProductsQuery = useGetTopSellingProducts(period, topProductsLimit, branchId);
    const lowStockAlertsQuery = useGetLowStockAlerts(lowStockLimit, branchId);
    const activePromotionsQuery = useGetActivePromotions(branchId);

    return {
        summaryQuery,
        salesChartQuery,
        paymentMethodsQuery,
        topProductsQuery,
        lowStockAlertsQuery,
        activePromotionsQuery
    };
};
