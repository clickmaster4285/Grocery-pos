'use client';

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Hash, Globe, ShieldCheck, Save, Loader2, Info, Link as LinkIcon, Image as ImageIcon, X } from "lucide-react";

export const BrandForm = ({
  formData,
  updateFormField,
  handleSubmit,
  resetForm,
  isEditMode,
  createBrandMutation,
  updateBrandMutation,
}) => {
  const isLoading = createBrandMutation?.isPending || updateBrandMutation?.isPending;
  const [imagePreview, setImagePreview] = useState(formData.logo ? `${process.env.NEXT_PUBLIC_API_URL}/${formData.logo}` : null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateFormField('logo', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    updateFormField('logo', null);
    setImagePreview(null);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Image Upload Section */}
      <div className="space-y-2">
        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Brand Visual Identity</Label>
        <div className="flex items-center gap-6 p-4 rounded-xl border border-dashed border-muted bg-muted/5 group hover:bg-muted/10 transition-all">
          <div className="relative h-24 w-24 rounded-xl bg-background border border-border/50 overflow-hidden flex items-center justify-center shrink-0 shadow-inner">
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="h-full w-full object-contain p-2" />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute top-1 right-1 h-5 w-5 bg-destructive text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </>
            ) : (
              <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
            )}
          </div>
          <div className="space-y-2 flex-1">
            <p className="text-xs font-semibold text-foreground leading-none">Primary Brand Logo</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Recommended: 512x512px. SVG, PNG or WebP.<br />
              Maximum file size: 2MB.
            </p>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[10px] font-bold uppercase tracking-widest px-4 rounded-lg relative overflow-hidden"
              >
                Choose File
                <input
                  type="file"
                  onChange={handleImageChange}
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </Button>
              {imagePreview && (
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">Identity Loaded</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Brand Name</Label>
          <Input
            id="name"
            placeholder="e.g., Nestle"
            value={formData.name}
            onChange={(e) => updateFormField('name', e.target.value)}
            className="h-11 font-semibold rounded-xl bg-muted/5 border-muted focus-visible:bg-background transition-all"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="brand_code" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Protocol Code</Label>
          <div className="relative group">
            <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
            <Input
              id="brand_code"
              placeholder="AUTO-GENERATE"
              value={formData.brand_code || ''}
              onChange={(e) => updateFormField('brand_code', e.target.value.toUpperCase())}
              className="h-11 pl-10 font-mono font-bold tracking-widest rounded-xl bg-muted/5 border-muted focus-visible:bg-background transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="origin" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Origin / Region</Label>
          <div className="relative group">
            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input
              id="origin"
              placeholder="e.g., Switzerland"
              value={formData.origin}
              onChange={(e) => updateFormField('origin', e.target.value)}
              className="h-11 pl-10 font-semibold rounded-xl bg-muted/5 border-muted focus-visible:bg-background transition-all"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="website" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Official Website</Label>
          <div className="relative group">
            <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input
              id="website"
              placeholder="www.brand.com"
              value={formData.website}
              onChange={(e) => updateFormField('website', e.target.value)}
              className="h-11 pl-10 font-semibold rounded-xl bg-muted/5 border-muted focus-visible:bg-background transition-all"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Brand Status</Label>
          <Select
            value={formData.status || 'ACTIVE'}
            onValueChange={(value) => updateFormField('status', value)}
          >
            <SelectTrigger id="status" className="h-11 font-bold rounded-xl bg-muted/5 border-muted focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50 shadow-xl">
              <SelectItem value="ACTIVE" className="font-bold text-emerald-600 py-2.5 text-xs uppercase">Active Brand</SelectItem>
              <SelectItem value="INACTIVE" className="font-bold text-muted-foreground py-2.5 text-xs uppercase">Inactive Entity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Functional Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the market positioning of this brand (optional)"
          value={formData.description}
          onChange={(e) => updateFormField('description', e.target.value)}
          className="min-h-[100px] font-medium rounded-xl bg-muted/5 border-muted focus-visible:bg-background transition-all resize-none p-4 text-sm"
        />
      </div>

      <div className="pt-4 border-t border-border/50 flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={resetForm}
          className="font-bold text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-primary hover:bg-primary/90 font-bold text-[10px] uppercase tracking-widest px-8 h-10 rounded-xl shadow-lg shadow-primary/20 gap-2 transition-all"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {isEditMode ? "Sync Records" : "Deploy Node"}
        </Button>
      </div>
    </form>
  );
};
