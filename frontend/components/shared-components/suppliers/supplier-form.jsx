'use client';

import { Mail } from "lucide-react"; // Import Mail for email icon
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PhoneInput } from "@/components/ui/PhoneInput"; // Import PhoneInput
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
  const handlePhoneChange = (phone) => {
    updateFormField('phone', phone);
  };

  const handleAddressChange = (field, value) => {
    updateFormField('address', { ...formData.address, [field]: value });
  };

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
        <Label htmlFor="contactPerson">Contact Person</Label>
        <Input
          id="contactPerson"
          placeholder="e.g., Jane Doe"
          value={formData.contactPerson}
          onChange={(e) => updateFormField('contactPerson', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            className="pl-10"
            value={formData.email}
            onChange={(e) => updateFormField('email', e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <PhoneInput
          value={formData.phone}
          onChange={handlePhoneChange}
          label="Phone Number"
          showValidation={false}
        />
      </div>

      {/* Address Section */}
      <div className="space-y-4 rounded-md border p-4">
        <Label className="text-base font-semibold">Address</Label>
        <div className="space-y-2">
          <Label htmlFor="street" className="text-sm">Street</Label>
          <Input
            id="street"
            placeholder="e.g., 123 Main St"
            value={formData.address.street}
            onChange={(e) => handleAddressChange('street', e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm">City</Label>
            <Input
              id="city"
              placeholder="e.g., Springfield"
              value={formData.address.city}
              onChange={(e) => handleAddressChange('city', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm">State</Label>
            <Input
              id="state"
              placeholder="e.g., IL"
              value={formData.address.state}
              onChange={(e) => handleAddressChange('state', e.target.value)}
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="zip" className="text-sm">Zip Code</Label>
            <Input
              id="zip"
              placeholder="e.g., 62704"
              value={formData.address.zip}
              onChange={(e) => handleAddressChange('zip', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country" className="text-sm">Country</Label>
            <Input
              id="country"
              placeholder="e.g., USA"
              value={formData.address.country}
              onChange={(e) => handleAddressChange('country', e.target.value)}
            />
          </div>
        </div>
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
