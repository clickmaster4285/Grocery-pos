'use client';

import React from 'react';
import { useCustomerHook } from '@/hooks/useCustomerHook';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Loader2, User, Phone, Mail, MapPin } from 'lucide-react';

const CustomerForm = ({ isOpen, onClose, customerData = null }) => {
  const {
    formData,
    updateFormField,
    handleSave,
    isEditMode,
    createCustomerMutation,
    updateCustomerMutation,
  } = useCustomerHook(customerData);

  const isPending = createCustomerMutation.isPending || updateCustomerMutation.isPending;

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSave(onClose);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-150 max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="p-2 bg-primary/10 rounded-full">
              <User className="h-5 w-5 text-primary" />
            </div>
            {isEditMode ? 'Edit Customer Profile' : 'Register New Customer'}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update the customer's contact information and loyalty status." 
              : "Fill in the details below to add a new customer to the database."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Basic Info Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <User size={14} /> Personal Information
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  placeholder="e.g. John"
                  value={formData.firstName}
                  onChange={(e) => updateFormField('firstName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Doe"
                  value={formData.lastName}
                  onChange={(e) => updateFormField('lastName', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Info Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Phone size={14} /> Contact Details
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phonePrimary">Primary Phone *</Label>
                <Input
                  id="phonePrimary"
                  placeholder="+1 234 567 890"
                  value={formData.phonePrimary}
                  onChange={(e) => updateFormField('phonePrimary', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneAlternate">Alternate Phone</Label>
                <Input
                  id="phoneAlternate"
                  placeholder="Optional"
                  value={formData.phoneAlternate}
                  onChange={(e) => updateFormField('phoneAlternate', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  className="pl-9"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={(e) => updateFormField('email', e.target.value)}
                  // required
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Address Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MapPin size={14} /> Location / Address
            </h4>
            <div className="space-y-2">
              <Label htmlFor="streetAddress">Street Address</Label>
              <Input
                id="streetAddress"
                placeholder="123 Main St, Apt 4B"
                value={formData.streetAddress}
                onChange={(e) => updateFormField('streetAddress', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={formData.city}
                  onChange={(e) => updateFormField('city', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  placeholder="State"
                  value={formData.state}
                  onChange={(e) => updateFormField('state', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input
                  id="zip"
                  placeholder="ZIP"
                  value={formData.zip}
                  onChange={(e) => updateFormField('zip', e.target.value)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Group & Preferences Section */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Loyalty & Preferences</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Group</Label>
                <Select
                  value={formData.customerGroup}
                  onValueChange={(val) => updateFormField('customerGroup', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Regular">Regular</SelectItem>
                    <SelectItem value="Silver">Silver</SelectItem>
                    <SelectItem value="Gold">Gold</SelectItem>
                    <SelectItem value="Platinum">Platinum</SelectItem>
                    <SelectItem value="Staff">Staff</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Loyalty Program</Label>
                <Input
                  placeholder="Standard"
                  value={formData.loyaltyProgram}
                  onChange={(e) => updateFormField('loyaltyProgram', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-sm font-bold">Marketing Consent</Label>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="comm-email"
                    checked={formData.communicationEmail}
                    onCheckedChange={(val) => updateFormField('communicationEmail', val)}
                  />
                  <Label htmlFor="comm-email" className="text-xs">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="comm-sms"
                    checked={formData.communicationSms}
                    onCheckedChange={(val) => updateFormField('communicationSms', val)}
                  />
                  <Label htmlFor="comm-sms" className="text-xs">SMS</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="comm-push"
                    checked={formData.communicationPush}
                    onCheckedChange={(val) => updateFormField('communicationPush', val)}
                  />
                  <Label htmlFor="comm-push" className="text-xs">Push</Label>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="preferences">Special Preferences / Notes</Label>
              <Textarea
                id="preferences"
                placeholder="Allergies, preferred items, etc."
                className="h-20"
                value={formData.preferences}
                onChange={(e) => updateFormField('preferences', e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(val) => updateFormField('isActive', val)}
              />
              <Label htmlFor="isActive">Account Active</Label>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 pt-4 border-t">
            <Button variant="outline" type="button" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending} className="min-w-30">
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                isEditMode ? 'Update Customer' : 'Register Customer'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CustomerForm;
