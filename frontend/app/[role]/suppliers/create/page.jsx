'use client';

import { SupplierForm } from '@/components/shared-components/suppliers/supplier-form';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSupplierHook } from '@/hooks/useSupplierHook';

const SupplierCreatePage = () => {
  const {
    formData,
    updateFormField,
    handleSubmit,
    resetForm,
    createSupplierMutation,
    updateSupplierMutation,
    isEditMode,
  } = useSupplierHook();

  return (
    <div className="p-4 md:p-6">
      <DialogHeader>
        <DialogTitle>Add New Supplier</DialogTitle>
        <DialogDescription>
          Create a new product supplier.
        </DialogDescription>
      </DialogHeader>
      <SupplierForm
        formData={formData}
        updateFormField={updateFormField}
        handleSubmit={handleSubmit}
        resetForm={resetForm}
        isEditMode={isEditMode}
        createSupplierMutation={createSupplierMutation}
        updateSupplierMutation={updateSupplierMutation}
      />
    </div>
  );
};

export default SupplierCreatePage;
