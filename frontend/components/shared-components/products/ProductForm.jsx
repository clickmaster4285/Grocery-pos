// frontend/components/shared-components/products/ProductForm.jsx
// This is a placeholder component for a product form.

"use client";

import React from 'react';

const ProductForm = ({ initialData, onSubmit, isLoading, isEditing }) => {
  // Placeholder for form state and logic
  // const [formData, setFormData] = useState(initialData || {});

  const handleSubmit = (e) => {
    e.preventDefault();
    // onSubmit(formData);
    console.log('Form submitted!');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold">
        {isEditing ? 'Edit Product' : 'Create New Product'}
      </h2>
      <p>This is a placeholder for the Product Form component.</p>
      {/* Actual form fields will go here */}
      <div className="flex justify-end space-x-2">
        <button type="button" className="btn btn-outline">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </form>
  );
};

export default ProductForm;