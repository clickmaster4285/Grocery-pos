'use client';

import { useParams } from 'next/navigation';
import { CategoryForm } from '@/components/shared-components/inventory/categories/category-form';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // Using Dialog components for styling purposes
import { useCategoryHook } from '@/hooks/useCategoryHook';

const CategoryEditPage = () => {
  const params = useParams();
  const { id } = params; // Extract the category ID from the URL

  const {
    formData,
    isCategoryLoading,
    updateFormField,
    handleSubmit,
    resetForm,
    createCategoryMutation, // This won't be used in edit mode, but passed for consistency
    updateCategoryMutation,
    isEditMode,
  } = useCategoryHook(id); // Pass the ID to the hook to fetch category data

  if (isCategoryLoading) {
    return <div>Loading category data...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Edit Category" : "Add New Category"}</DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Update category details below."
            : "Create a new product category."
          }
        </DialogDescription>
      </DialogHeader>
      <CategoryForm
        formData={formData}
        updateFormField={updateFormField}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        isEditMode={isEditMode}
        createCategoryMutation={createCategoryMutation}
        updateCategoryMutation={updateCategoryMutation}
      />
    </div>
  );
};

export default CategoryEditPage;