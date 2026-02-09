import { useGetAllProducts, useGetProductById, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/features/product.api';

export const useProductHook = (id) => {
  const getAllProductsQuery = useGetAllProducts();
  const getProductByIdQuery = useGetProductById(id);
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  return {
    getAllProductsQuery,
    getProductByIdQuery,
    createProductMutation,
    updateProductMutation,
    deleteProductMutation,
  };
};