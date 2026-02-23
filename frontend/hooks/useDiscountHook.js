import { 
  useGetAllDiscounts, 
  useGetDiscountById, 
  useCreateDiscount, 
  useUpdateDiscount, 
  useDeleteDiscount,
  useValidateCoupon 
} from '@/features/discount.api';

export const useDiscountHook = (id, params = {}) => {
  const getAllDiscountsQuery = useGetAllDiscounts(params);
  const getDiscountByIdQuery = useGetDiscountById(id);
  const createDiscountMutation = useCreateDiscount();
  const updateDiscountMutation = useUpdateDiscount();
  const deleteDiscountMutation = useDeleteDiscount();
  const validateCouponMutation = useValidateCoupon();

  return {
    getAllDiscountsQuery,
    getDiscountByIdQuery,
    createDiscountMutation,
    updateDiscountMutation,
    deleteDiscountMutation,
    validateCouponMutation
  };
};
