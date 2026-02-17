'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Card, CardContent } from "@/components/ui/card";
import { User, MapPin, PhoneCall } from "lucide-react";

export const PersonalDetails = ({ formData, updateFormField }) => {
  return (
    <div className="space-y-6">
      {/* Basic Identity */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
          <User className="h-4 w-4" />
          <span>Basic Identity</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={(e) => updateFormField('firstName', e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={(e) => updateFormField('lastName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <PhoneInput
              value={formData.phone}
              onChange={(val) => updateFormField('phone', val)}
              label="Phone Number"
              placeholder="Enter phone number"
            />
          </div>
        </div>
      </section>

      {/* Address */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
          <MapPin className="h-4 w-4" />
          <span>Residential Address</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label>Street Address</Label>
            <Input
              placeholder="123 Main St"
              value={formData.address.street}
              onChange={(e) => updateFormField('address.street', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input
              placeholder="City"
              value={formData.address.city}
              onChange={(e) => updateFormField('address.city', e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>State</Label>
              <Input
                placeholder="State"
                value={formData.address.state}
                onChange={(e) => updateFormField('address.state', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Zip Code</Label>
              <Input
                placeholder="Zip"
                value={formData.address.zip}
                onChange={(e) => updateFormField('address.zip', e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
          <PhoneCall className="h-4 w-4" />
          <span>Emergency Contact</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Contact Name</Label>
            <Input
              placeholder="Full Name"
              value={formData.emergencyContact.name}
              onChange={(e) => updateFormField('emergencyContact.name', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Input
              placeholder="e.g. Spouse, Parent"
              value={formData.emergencyContact.relationship}
              onChange={(e) => updateFormField('emergencyContact.relationship', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Contact Phone</Label>
            <Input
              placeholder="Phone Number"
              value={formData.emergencyContact.phone}
              onChange={(e) => updateFormField('emergencyContact.phone', e.target.value)}
            />
          </div>
        </div>
      </section>
    </div>
  );
};
