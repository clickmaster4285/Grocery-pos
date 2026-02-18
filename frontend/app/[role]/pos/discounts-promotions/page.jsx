import DiscountPromotionList from '@/components/shared-components/pos/discounts-promotions/DiscountPromotionList';

const DiscountsPromotionsPage = async (props) => {
  const params = await props.params;
  return <DiscountPromotionList role={params.role} />;
};

export default DiscountsPromotionsPage;
