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
import { CategoryForm } from "./category-form"; // Import the separate form component

const initialFormData = {
  name: "",
  description: "",
  isActive: true,
};

const CategoryModal = ({
  isOpen,
  onClose,
  onSave,
  category, // The category object if in edit mode
  mode, // "add" or "edit"
  createCategoryMutation, // Pass these directly to the form
  updateCategoryMutation,
}) => {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (category && mode === "edit") {
      setFormData({
        name: category.name,
        description: category.description || "",
        isActive: category.isActive,
      });
    } else {
      setFormData(initialFormData);
    }
  }, [category, mode, isOpen]);

  const updateFormField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData, category?._id); // Pass the ID if in edit mode
  };

  const title =
    mode === "add" ? "Add New Category" : "Edit Category";
  const description =
    mode === "add"
      ? "Create a new product category."
      : "Update category details below.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <CategoryForm
          formData={formData}
          updateFormField={updateFormField}
          handleSubmit={handleSubmit}
          resetForm={onClose} // Close modal on cancel
          isEditMode={mode === "edit"}
          createCategoryMutation={createCategoryMutation}
          updateCategoryMutation={updateCategoryMutation}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;