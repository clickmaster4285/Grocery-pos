'use client';

import { CategoryForm } from '@/components/shared-components/categories/category-form';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"; // Using Dialog components for styling purposes
import { useCategoryHook } from '@/hooks/useCategoryHook';

const CategoryCreatePage = () => {
  const {
    formData,
    updateFormField,
    handleSubmit,
    resetForm,
    createCategoryMutation,
    updateCategoryMutation, // This won't be used in create mode, but passed for consistency
    isEditMode,
  } = useCategoryHook();

  return (
    <div className="p-4 md:p-6">
      <DialogHeader>
        <DialogTitle>Add New Category</DialogTitle>
        <DialogDescription>
          Create a new product category.
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

export default CategoryCreatePage;