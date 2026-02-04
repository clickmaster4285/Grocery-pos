"use client";

import React from 'react';
import ProductForm from '@/components/shared-components/products/ProductForm';
import { useCreateProduct } from '@/features/product/product.api';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

const CreateProductPage = ({ params }) => {
  const router = useRouter();
  const { role } = params;
  const createProductMutation = useCreateProduct();

  const handleSubmit = async (formData) => {
    try {
      await createProductMutation.mutateAsync(formData);
      toast.success('Product created successfully!');
      router.push(`/${role}/products`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create product.');
    }
  };

  return (
    <>
      <ProductForm
        onSubmit={handleSubmit}
        isLoading={createProductMutation.isPending}
        isEditing={false}
      />
    </>
  );
};

export default CreateProductPage;