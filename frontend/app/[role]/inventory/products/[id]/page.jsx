"use client";

import React, { use } from 'react';
import { useGetProductById } from '@/features/product.api';
import ProductDetail from '@/components/shared-components/inventory/products/ProductDetail';
import ProductDetailSkeleton from '@/components/shared-components/inventory/products/ProductDetailSkeleton';
import { toast } from 'sonner';

const ProductDetailPage = props => {
  const params = use(props.params);
  const { id, role } = params; // Product ID and role from the URL

  const { data: product, isLoading, isError, error } = useGetProductById(id);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <ProductDetailSkeleton />
      </div>
    );
  }

  if (isError) {
    toast.error(error?.message || 'Failed to load product details.');
    return <div className="container mx-auto p-4 text-red-500">Error: {error?.message || 'Failed to load product details.'}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <ProductDetail product={product} role={role} />
    </div>
  );
};

export default ProductDetailPage;