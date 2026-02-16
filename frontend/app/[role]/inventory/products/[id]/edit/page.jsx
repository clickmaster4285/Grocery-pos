"use client";

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import ProductForm from '@/components/shared-components/inventory/products/ProductForm';
import { useGetProductById, useUpdateProduct } from '@/features/product.api';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorCard } from '@/components/ui/error-card';
import { useAuth } from '@/hooks/useAuth';

const EditProductPage = () => {
  const router = useRouter();
  const params = useParams();
  const productId = params.id;
    const { user: currentUser } = useAuth();

  const { data: productData, isLoading, isError, error } = useGetProductById(productId);
  const updateProductMutation = useUpdateProduct();

  const handleSubmit = async (data) => {
    try {
      await updateProductMutation.mutateAsync({ id: productId, ...data });
      toast.success('Product updated successfully!');
      router.push(`/${currentUser.role}/inventory/products`);
    } catch (err) {
      toast.error(err?.message || 'Failed to update product.');
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <Skeleton className="h-10 w-1/2 mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="container mx-auto py-8">
        <ErrorCard title="Error" description={error?.message || 'Failed to load product for editing.'} />
      </div>
    );
  }

  return (
    <div>
      <ProductForm
        initialData={productData}
        onSubmit={handleSubmit}
        isLoading={updateProductMutation.isPending}
        isEditing={true}
      />
    </div>
  );
};

export default EditProductPage;