// frontend/components/shared-components/products/ProductDetail.jsx
// This is a placeholder component for displaying the detailed view of a single product.

"use client";

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const ProductDetail = ({ product }) => {
  if (!product) {
    return <Card className="w-full"><CardHeader><CardTitle>Product Not Found</CardTitle></CardHeader></Card>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{product.productName}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Category</p>
            <p>{product.category}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Brand</p>
            <p>{product.brand}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Supplier</p>
            <p>{product.supplier}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Branch</p>
            <p>{product.branch_id?.branch_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm font-medium">Total Stock</p>
            <p>{product.totalStock}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-2">Variants</h3>
          {product.variants && product.variants.length > 0 ? (
            <div className="space-y-4">
              {product.variants.map((variant, index) => (
                <Card key={variant._id || index} className="p-3">
                  <p><strong>Variant:</strong> {variant.name} - {variant.value}</p>
                  <p><strong>SKU:</strong> {variant.sku}</p>
                  <p><strong>Stock:</strong> {variant.stock}</p>
                  {variant.priceHistory && variant.priceHistory.length > 0 && (
                    <p><strong>Current Price:</strong> Buying: ${variant.priceHistory[variant.priceHistory.length - 1].buyingPrice.toFixed(2)}, Selling: ${variant.priceHistory[variant.priceHistory.length - 1].sellingPrice.toFixed(2)}</p>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <p>No variants for this product.</p>
          )}
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-2">Images</h3>
          {product.imageUrls && product.imageUrls.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {product.imageUrls.map((url, index) => (
                <img key={index} src={url} alt={`${product.productName} image ${index + 1}`} className="w-24 h-24 object-cover rounded" />
              ))}
            </div>
          ) : (
            <p>No images for this product.</p>
          )}
        </div>

      </CardContent>
    </Card>
  );
};

export default ProductDetail;