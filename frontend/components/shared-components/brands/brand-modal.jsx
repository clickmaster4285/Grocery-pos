"use client";

import React, { useState, useEffect } from "react";
import { X, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { BrandForm } from "./brand-form";

const initialFormData = {
  brand_code: "",
  name: "",
  description: "",
  logo: "",
  website: "",
  origin: "",
  status: "ACTIVE",
};

const BrandModal = ({
  isOpen,
  onClose,
  onSave,
  brand,
  mode,
  createBrandMutation,
  updateBrandMutation,
}) => {
  const [formData, setFormData] = useState(initialFormData);

  useEffect(() => {
    if (brand && mode === "edit") {
      setFormData({
        brand_code: brand.brand_code || "",
        name: brand.name || "",
        description: brand.description || "",
        logo: brand.logo || "",
        website: brand.website || "",
        origin: brand.origin || "",
        status: brand.status || "ACTIVE",
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
    onSave(formData, brand?._id);
  };

  const title =
    mode === "add" ? "Register Brand" : "Configure Brand";
  const description =
    mode === "add"
      ? "Initialize a new architectural node for brand classification."
      : "Update parameters for this brand entity.";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl bg-card border-border shadow-2xl rounded-2xl overflow-hidden p-0">
        <DialogHeader className="px-6 py-5 border-b bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <ShieldCheck className="h-4.5 w-4.5 text-primary" />
            </div>
            <div className="space-y-0.5">
                <DialogTitle className="text-xl font-bold tracking-tight text-foreground">{title}</DialogTitle>
                <DialogDescription className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="p-6">
            <BrandForm
                formData={formData}
                updateFormField={updateFormField}
                handleSubmit={handleSubmit}
                resetForm={onClose}
                isEditMode={mode === "edit"}
                createBrandMutation={createBrandMutation}
                updateBrandMutation={updateBrandMutation}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BrandModal;