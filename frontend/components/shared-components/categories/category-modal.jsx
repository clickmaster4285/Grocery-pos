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
import { CategoryForm } from "./category-form";

const initialFormData = {
  category_code: "",
  name: "",
  description: "",
  category_type: "PHYSICAL",
  isActive: true,
};

const CategoryModal = ({
  isOpen,
  onClose,
  onSave,
  category,
  mode,
  createCategoryMutation,
  updateCategoryMutation,
}) => {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (category && mode === "edit") {
      setFormData({
        category_code: category.category_code || "",
        name: category.name,
        description: category.description || "",
        category_type: category.category_type || "PHYSICAL",
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
    onSave(formData, category?._id);
  };

  const title =
    mode === "add" ? "Add New Category" : "Edit Category";
  const description =
    mode === "add"
      ? "Create a new product category."
      : "Update category details below.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold uppercase tracking-tight text-primary">{title}</DialogTitle>
          <DialogDescription className="font-medium">{description}</DialogDescription>
        </DialogHeader>
        <CategoryForm
          formData={formData}
          updateFormField={updateFormField}
          handleSubmit={handleSubmit}
          resetForm={onClose}
          isEditMode={mode === "edit"}
          createCategoryMutation={createCategoryMutation}
          updateCategoryMutation={updateCategoryMutation}
        />
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;