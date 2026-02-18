import DiscountFormContainer from '@/components/shared-components/pos/discounts-promotions/DiscountFormContainer';

const EditDiscountPage = async (props) => {
  const params = await props.params;
  return <DiscountFormContainer id={params.id} role={params.role} />;
};

export default EditDiscountPage;
