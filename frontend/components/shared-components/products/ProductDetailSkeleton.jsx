// frontend/components/shared-components/products/ProductDetailSkeleton.jsx
// This is a placeholder for a skeleton loader for the product detail page.

"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const ProductDetailSkeleton = () => {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-8 w-3/4" />
        </CardTitle>
        <Skeleton className="h-4 w-full mt-2" />
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div>
            <Skeleton className="h-4 w-20 mb-1" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>

        <Skeleton className="h-px w-full" /> {/* Separator */}

        <div>
          <Skeleton className="h-6 w-24 mb-2" />
          <div className="space-y-4">
            <Card className="p-3">
              <Skeleton className="h-4 w-40 mb-1" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-4 w-48" />
            </Card>
            <Card className="p-3">
              <Skeleton className="h-4 w-40 mb-1" />
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-4 w-24 mb-1" />
              <Skeleton className="h-4 w-48" />
            </Card>
          </div>
        </div>

        <Skeleton className="h-px w-full" /> {/* Separator */}

        <div>
          <Skeleton className="h-6 w-24 mb-2" />
          <div className="flex flex-wrap gap-2">
            <Skeleton className="w-24 h-24 rounded" />
            <Skeleton className="w-24 h-24 rounded" />
            <Skeleton className="w-24 h-24 rounded" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductDetailSkeleton;