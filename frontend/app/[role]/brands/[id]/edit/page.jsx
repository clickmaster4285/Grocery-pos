'use client';

import { useParams } from 'next/navigation';
import { BrandForm } from '@/components/shared-components/brands/brand-form';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useBrandHook } from '@/hooks/useBrandHook';

const BrandEditPage = () => {
  const params = useParams();
  const { id } = params;

  const {
    formData,
    isBrandLoading,
    updateFormField,
    handleSubmit,
    resetForm,
    createBrandMutation,
    updateBrandMutation,
    isEditMode,
  } = useBrandHook(id);

  if (isBrandLoading) {
    return <div>Loading brand data...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Edit Brand" : "Add New Brand"}</DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Update brand details below."
            : "Create a new product brand."
          }
        </DialogDescription>
      </DialogHeader>
      <BrandForm
        formData={formData}
        updateFormField={updateFormField}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        isEditMode={isEditMode}
        createBrandMutation={createBrandMutation}
        updateBrandMutation={updateBrandMutation}
      />
    </div>
  );
};

export default BrandEditPage;
