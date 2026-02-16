"use client";

import React from 'react';
import ProductForm from '@/components/shared-components/inventory/products/ProductForm';
import { useCreateProduct } from '@/features/product.api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const CreateProductPage = () => {
  const router = useRouter();
  const createProductMutation = useCreateProduct();
 const { user: currentUser } = useAuth();

  const handleSubmit = async (data) => {
    try {
      await createProductMutation.mutateAsync(data);
      toast.success('Product created successfully!');
      router.push(`/${currentUser.role}/inventory/products`); // Navigate back to the product list
    } catch (error) {
      toast.error(error?.message || 'Failed to create product.');
    }
  };

  return (
    <div>
      <ProductForm
        onSubmit={handleSubmit}
        isLoading={createProductMutation.isPending}
        isEditing={false}
      />
    </div>
  );
};

export default CreateProductPage;