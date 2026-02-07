'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { DialogFooter } from "@/components/ui/dialog";

export const SupplierForm = ({
  formData,
  updateFormField,
  handleSubmit,
  resetForm,
  isEditMode,
  createSupplierMutation,
  updateSupplierMutation,
}) => {
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Supplier Name *</Label>
        <Input
          id="name"
          placeholder="e.g., Global Foods Inc."
          value={formData.name}
          onChange={(e) => updateFormField('name', e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="A brief description of the supplier (optional)"
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
        <Label htmlFor="isActive">Active Supplier</Label>
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
            createSupplierMutation?.isLoading ||
            updateSupplierMutation?.isLoading
          }
        >
          {isEditMode ?
            (updateSupplierMutation?.isLoading ? "Updating..." : "Update Supplier") :
            (createSupplierMutation?.isLoading ? "Creating..." : "Create Supplier")
          }
        </Button>
      </DialogFooter>
    </form>
  );
};
