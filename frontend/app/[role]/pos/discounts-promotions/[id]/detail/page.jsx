import DiscountDetail from '@/components/shared-components/pos/discounts-promotions/DiscountDetail';

const DiscountDetailPage = async (props) => {
  const params = await props.params;
  return <DiscountDetail id={params.id} role={params.role} />;
};

export default DiscountDetailPage;
