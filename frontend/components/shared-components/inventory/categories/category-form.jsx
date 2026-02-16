'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Hash, Layers, ShieldCheck, Save, Loader2, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const CategoryForm = ({
  formData,
  updateFormField,
  handleSubmit,
  resetForm,
  isEditMode,
  createCategoryMutation,
  updateCategoryMutation,
}) => {
  const isLoading = createCategoryMutation?.isPending || updateCategoryMutation?.isPending;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Category Name</Label>
          <Input
            id="name"
            placeholder="e.g., Dairy & Cheese"
            value={formData.name}
            onChange={(e) => updateFormField('name', e.target.value)}           
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category_code" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Protocol Code</Label>
          <div className="relative group">
            <Input
              id="category_code"
              placeholder="AUTO-GENERATE"
              value={formData.category_code || ''}
              onChange={(e) => updateFormField('category_code', e.target.value.toUpperCase())}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="category_type" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Classification Type</Label>
          <Select
            value={formData.category_type || 'PHYSICAL'}
            onValueChange={(value) => updateFormField('category_type', value)}
          >
            <SelectTrigger className="h-11 font-bold rounded-xl bg-muted/5 border-muted focus:ring-1 focus:ring-primary/20">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border/50 shadow-xl">
              <SelectItem value="PHYSICAL" className="font-bold text-blue-600 py-2.5 text-xs uppercase">Physical Product</SelectItem>
              <SelectItem value="SERVICE" className="font-bold text-purple-600 py-2.5 text-xs uppercase">Service Asset</SelectItem>
              <SelectItem value="DIGITAL" className="font-bold text-amber-600 py-2.5 text-xs uppercase">Digital Product</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="isActive" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Catergory Status</Label>
          <div className="h-11 flex items-center justify-between px-4 rounded-xl border border-muted bg-muted/5">
            <span className="text-xs font-bold text-foreground">Active for Production</span>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => updateFormField('isActive', checked)}
              className="scale-90"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Functional Description</Label>
        <Textarea
          id="description"
          placeholder="Describe the logical scope of this category Catergory (optional)"
          value={formData.description}
          onChange={(e) => updateFormField('description', e.target.value)}
          className="min-h-25 font-medium rounded-xl bg-muted/5 border-muted focus-visible:bg-background transition-all resize-none p-4 text-sm"
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
          className="bg-primary hover:bg-primary/90 font-semibold tracking-wide px-8 h-10 rounded-xl shadow-lg shadow-primary/20 gap-2 transition-all"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {isEditMode ? "Sync Records" : "Create Catergory"}
        </Button>
      </div>
    </form>
  );
};
