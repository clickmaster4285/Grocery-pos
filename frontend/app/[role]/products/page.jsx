import ProductsPage from '@/components/shared-components/products/products';

const ProductsListPage = ({ params }) => {
  return <ProductsPage role={params.role} />;
};

export default ProductsListPage;