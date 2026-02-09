"use client";

import React from 'react';
import ProductForm from '@/components/shared-components/products/ProductForm';
import { useCreateProduct } from '@/features/product.api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

const CreateProductPage = () => {
  const router = useRouter();
  const createProductMutation = useCreateProduct();

  const handleSubmit = async (data) => {
    try {
      await createProductMutation.mutateAsync(data);
      toast.success('Product created successfully!');
      router.push('../products'); // Navigate back to the product list
    } catch (error) {
      toast.error(error?.message || 'Failed to create product.');
    }
  };

  return (
    <div className="container mx-auto py-8">
      <ProductForm
        onSubmit={handleSubmit}
        isLoading={createProductMutation.isPending}
        isEditing={false}
      />
    </div>
  );
};

export default CreateProductPage;