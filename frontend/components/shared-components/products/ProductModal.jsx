"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import ProductForm from './ProductForm';
import { useGetProductById, useCreateProduct, useUpdateProduct } from '@/features/product.api';
import { toast } from 'sonner';

const ProductModal = ({ isOpen, onClose, productId, onSuccess }) => {
  const { data: productData, isLoading: isLoadingProduct, isError: isErrorProduct, error: productError } = useGetProductById(productId);
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const isEditing = !!productId;
  const isLoading = isLoadingProduct || createMutation.isPending || updateMutation.isPending;

  const handleSubmit = async (formData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: productId, ...formData });
        toast.success('Product updated successfully!');
      } else {
        await createMutation.mutateAsync(formData);
        toast.success('Product created successfully!');
      }
      onSuccess?.(); // Call onSuccess prop if provided
      onClose();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred.';
      toast.error(errorMessage);
    }
  };

  if (isErrorProduct && productId) {
    toast.error(productError?.message || 'Failed to load product for editing.');
    return null; // Or render an error state in the modal
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Create New Product'}</DialogTitle>
        </DialogHeader>
        <ProductForm
          initialData={isEditing ? productData : undefined}
          onSubmit={handleSubmit}
          isLoading={isLoading}
          isEditing={isEditing}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
