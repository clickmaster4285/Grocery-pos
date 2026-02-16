import ProductsPage from '@/components/shared-components/inventory/products/products';

const ProductsListPage = async props => {
  const params = await props.params;
  return <ProductsPage role={params.role} />;
};

export default ProductsListPage;