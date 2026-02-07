"use client";

import React from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { SupplierForm } from "./supplier-form";
import { useSupplierHook } from "@/hooks/useSupplierHook"; // Import the hook

const SupplierModal = ({
  isOpen,
  onClose,
  supplier, // The supplier object if in edit mode
  mode, // "add" or "edit"
}) => {
  // Initialize the hook with the supplier data for edit mode
  const {
    formData,
    updateFormField,
    handleSave,
    createSupplierMutation,
    updateSupplierMutation,
  } = useSupplierHook(supplier);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await handleSave(onClose); // Pass onClose as the success callback
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const title =
    mode === "add" ? "Add New Supplier" : "Edit Supplier";
  const description =
    mode === "add"
      ? "Create a new product supplier."
      : "Update supplier details below.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-106">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <SupplierForm
          formData={formData}
          updateFormField={updateFormField}
          handleSubmit={handleSubmit}
          resetForm={onClose} // Close modal on cancel
          isEditMode={mode === "edit"}
          createSupplierMutation={createSupplierMutation} // Pass hook's mutations
          updateSupplierMutation={updateSupplierMutation} // Pass hook's mutations
        />
      </DialogContent>
    </Dialog>
  );
};

export default SupplierModal;