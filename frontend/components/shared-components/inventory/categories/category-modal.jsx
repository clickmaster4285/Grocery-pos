"use client";

import React, { useState, useEffect } from "react";
import { X, Tag } from "lucide-react";
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
    mode === "add" ? "Register Category" : "Configure Category";
  const description =
    mode === "add"
      ? "Initialize a new architectural node for product classification."
      : "Update classification parameters for this category node.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-card border-border shadow-2xl rounded-2xl overflow-hidden p-0">
        <DialogHeader className="px-6 py-5 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <Tag className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="space-y-0.5">
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">{title}</DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6">
            <CategoryForm
                formData={formData}
                updateFormField={updateFormField}
                handleSubmit={handleSubmit}
                resetForm={onClose}
                isEditMode={mode === "edit"}
                createCategoryMutation={createCategoryMutation}
                updateCategoryMutation={updateCategoryMutation}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryModal;