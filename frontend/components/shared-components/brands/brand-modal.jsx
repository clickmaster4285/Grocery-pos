"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BrandForm } from "./brand-form"; // Import the separate form component

const initialFormData = {
  name: "",
  description: "",
  isActive: true,
};

const BrandModal = ({
  isOpen,
  onClose,
  onSave,
  brand, // The brand object if in edit mode
  mode, // "add" or "edit"
  createBrandMutation, // Pass these directly to the form
  updateBrandMutation,
}) => {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (brand && mode === "edit") {
      setFormData({
        name: brand.name,
        description: brand.description || "",
        isActive: brand.isActive,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [brand, mode, isOpen]);

  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, brand?._id); // Pass the ID if in edit mode
  };

  const title =
    mode === "add" ? "Add New Brand" : "Edit Brand";
  const description =
    mode === "add"
      ? "Create a new product brand."
      : "Update brand details below.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <BrandForm
          formData={formData}
          updateFormField={updateFormField}
          handleSubmit={handleSubmit}
          resetForm={onClose} // Close modal on cancel
          isEditMode={mode === "edit"}
          createBrandMutation={createBrandMutation}
          updateBrandMutation={updateBrandMutation}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BrandModal;