"use client";

import React, { use } from 'react';
import ProductForm from '@/components/shared-components/products/ProductForm';
import { useGetProductById, useUpdateProduct } from '@/features/product/product.api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import ProductDetailSkeleton from '@/components/shared-components/products/ProductDetailSkeleton';

const EditProductPage = props => {
  const params = use(props.params);
  const { id, role } = params; // Product ID and role from the URL
  const router = useRouter();

  const { data: product, isLoading, isError, error } = useGetProductById(id);
  const updateProductMutation = useUpdateProduct();

  const handleSubmit = async (formData) => {
    try {
      await updateProductMutation.mutateAsync({ id, ...formData });
      toast.success('Product updated successfully!');
      router.push(`/${role}/products/${id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update product.');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (isError) {
    toast.error(error?.message || 'Failed to load product for editing.');
    return <div className="container mx-auto p-4 text-red-500">Error: {error?.message || 'Failed to load product.'}</div>;
  }

  return (
    <>
      <ProductForm
        initialData={product}
        onSubmit={handleSubmit}
        isLoading={updateProductMutation.isPending}
        isEditing={true}
      />
    </>
  );
};

export default EditProductPage;