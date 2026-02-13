import { useProcessReturn, useGetSaleHistory } from '@/features/saleReturn.api';

export const useSaleReturnHook = (saleId) => {
    const processReturnMutation = useProcessReturn();
    const getSaleHistoryQuery = useGetSaleHistory(saleId);

    return {
        processReturnMutation,
        getSaleHistoryQuery,
    };
};
