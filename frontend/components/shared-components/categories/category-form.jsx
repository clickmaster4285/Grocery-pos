'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog"; // Assuming it might be used in a dialog/modal context, though we're moving to pages

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

      <DialogFooter className="pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={resetForm}
        >
          Cancel
        </Button>
        <Button
          type="submit"
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
