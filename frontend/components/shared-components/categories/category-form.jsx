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

export const CategoryForm = ({
  formData,
  updateFormField,
  handleSubmit,
  resetForm,
  isEditMode,
  createCategoryMutation,
  updateCategoryMutation,
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="category_code">Category Code</Label>
          <Input
            id="category_code"
            placeholder="e.g. CAT001"
            value={formData.category_code || ''}
            onChange={(e) => updateFormField('category_code', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Category Name *</Label>
          <Input
            id="name"
            placeholder="e.g., Dairy & Cheese"
            value={formData.name}
            onChange={(e) => updateFormField('name', e.target.value)}
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category_type">Category Type</Label>
        <Select
          value={formData.category_type || 'PHYSICAL'}
          onValueChange={(value) => updateFormField('category_type', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="PHYSICAL">Physical Product</SelectItem>
            <SelectItem value="SERVICE">Service</SelectItem>
            <SelectItem value="DIGITAL">Digital Product</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="A brief description of the category (optional)"
          value={formData.description}
          onChange={(e) => updateFormField('description', e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) => updateFormField('isActive', checked)}
        />
        <Label htmlFor="isActive">Active Category</Label>
      </div>

      <DialogFooter className="pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={resetForm}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="font-bold"
          disabled={
            createCategoryMutation?.isLoading ||
            updateCategoryMutation?.isLoading
          }
        >
          {isEditMode ?
            (updateCategoryMutation?.isLoading ? "Updating..." : "Update Category") :
            (createCategoryMutation?.isLoading ? "Creating..." : "Create Category")
          }
        </Button>
      </DialogFooter>
    </form>
  );
};
