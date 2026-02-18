import DiscountFormContainer from '@/components/shared-components/pos/discounts-promotions/DiscountFormContainer';

const CreateDiscountPage = async (props) => {
  const params = await props.params;
  return <DiscountFormContainer role={params.role} />;
};

export default CreateDiscountPage;
