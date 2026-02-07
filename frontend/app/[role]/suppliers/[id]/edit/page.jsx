'use client';

import { useParams } from 'next/navigation';
import { SupplierForm } from '@/components/shared-components/suppliers/supplier-form';
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSupplierHook } from '@/hooks/useSupplierHook';

const SupplierEditPage = () => {
  const params = useParams();
  const { id } = params;

  const {
    formData,
    isSupplierLoading,
    updateFormField,
    handleSubmit,
    resetForm,
    createSupplierMutation,
    updateSupplierMutation,
    isEditMode,
  } = useSupplierHook(id);

  if (isSupplierLoading) {
    return <div>Loading supplier data...</div>;
  }

  return (
    <div className="p-4 md:p-6">
      <DialogHeader>
        <DialogTitle>{isEditMode ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
        <DialogDescription>
          {isEditMode
            ? "Update supplier details below."
            : "Create a new product supplier."
          }
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

export default SupplierEditPage;
