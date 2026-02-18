'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDiscountHook } from '@/hooks/useDiscountHook';
import DiscountForm from './DiscountForm';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const DiscountFormContainer = ({ id, role }) => {
  const router = useRouter();
  const isEditing = !!id;
  
  const { 
    getDiscountByIdQuery, 
    createDiscountMutation, 
    updateDiscountMutation 
  } = useDiscountHook(id);

  const handleSubmit = async (data) => {
    try {
      if (isEditing) {
        await updateDiscountMutation.mutateAsync({ id, discountData: data });
      } else {
        await createDiscountMutation.mutateAsync(data);
      }
      router.push(`/${role}/pos/discounts-promotions`);
    } catch (error) {
      console.error('Error saving discount:', error);
    }
  };

  if (isEditing && getDiscountByIdQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-150" />
          <Skeleton className="h-100" />
        </div>
      </div>
    );
  }

  return (
    <DiscountForm
      initialData={getDiscountByIdQuery.data?.data}
      onSubmit={handleSubmit}
      isLoading={createDiscountMutation.isPending || updateDiscountMutation.isPending}
      isEditing={isEditing}
    />
  );
};

export default DiscountFormContainer;
