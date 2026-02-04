// frontend/components/shared-components/products/ProductCard.jsx
// This is a placeholder component for displaying a single product in a card format.

"use client";

import React from 'react';

const ProductCard = ({ product }) => {
  return (
    <div className="border rounded-lg p-4 shadow-sm">
      <h3 className="text-lg font-semibold">{product?.productName || 'Product Name'}</h3>
      <p className="text-gray-600">{product?.category || 'Category'}</p>
      <p className="text-gray-800 font-bold mt-2">
        {/* Displaying price of first variant for simplicity, real logic would vary */}
        Price: ${product?.variants?.[0]?.priceHistory?.[product.variants[0].priceHistory.length - 1]?.sellingPrice?.toFixed(2) || '0.00'}
      </p>
      {/* Add image, stock, etc. */}
      <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
        View Details
      </button>
    </div>
  );
};

export default ProductCard;