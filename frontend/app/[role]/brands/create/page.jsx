'use client';

import { BrandForm } from '@/components/shared-components/brands/brand-form';
import { Dialog , DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useBrandHook } from '@/hooks/useBrandHook';

const BrandCreatePage = () => {
  const {
    formData,
    updateFormField,
    handleSubmit,
    resetForm,
    createBrandMutation,
    updateBrandMutation,
    isEditMode,
  } = useBrandHook();

  return (
    <div className="p-4 md:p-6">
      <Dialog>
        <DialogHeader>
          <DialogTitle>Add New Brand</DialogTitle>
          <DialogDescription>
            Create a new product brand.
          </DialogDescription>
        </DialogHeader>
      </Dialog>
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

export default BrandCreatePage;
