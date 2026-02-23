'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { ComboBox } from "@/components/ui/combobox";
import { User, MapPin, PhoneCall, Globe, Building2, Landmark } from "lucide-react";
import { Country, State, City } from 'country-state-city';
import { useMemo } from "react";

export const PersonalDetails = ({ formData, updateFormField }) => {
  
  // Memoized lists for location selection
  const countries = useMemo(() => 
    Country.getAllCountries().map(c => ({ label: c.name, value: c.isoCode })), []);
  
  const states = useMemo(() => 
    formData.address.country ? State.getStatesOfCountry(formData.address.country).map(s => ({ label: s.name, value: s.isoCode })) : [], 
    [formData.address.country]);

  const cities = useMemo(() => 
    (formData.address.country && formData.address.state) ? City.getCitiesOfState(formData.address.country, formData.address.state).map(c => ({ label: c.name, value: c.name })) : [], 
    [formData.address.country, formData.address.state]);

  const relationshipOptions = [
    { label: 'Spouse', value: 'Spouse' },
    { label: 'Parent', value: 'Parent' },
    { label: 'Sibling', value: 'Sibling' },
    { label: 'Friend', value: 'Friend' },
    { label: 'Other', value: 'Other' },
  ];

  return (
    <div className="space-y-8">
      {/* Basic Identity */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold border-b pb-2 text-sm uppercase tracking-wider">
          <User className="h-4 w-4" />
          <span>Basic Identity</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-xs font-semibold">First Name *</Label>
            <Input
              id="firstName"
              placeholder="Enter first name"
              value={formData.firstName}
              onChange={(e) => updateFormField('firstName', e.target.value)}
              required
              className="bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-xs font-semibold">Last Name</Label>
            <Input
              id="lastName"
              placeholder="Enter last name"
              value={formData.lastName}
              onChange={(e) => updateFormField('lastName', e.target.value)}
              className="bg-white"
            />
          </div>
          <div className="md:col-span-2">
            <PhoneInput
              value={formData.phone}
              onChange={(val) => updateFormField('phone', val)}
              label="Primary Phone Number"
              placeholder="Enter phone number"
              required={false}
            />
          </div>
        </div>
      </section>

      {/* Address */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold border-b pb-2 text-sm uppercase tracking-wider">
          <MapPin className="h-4 w-4" />
          <span>Residential Address</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Globe className="h-3 w-3" /> Country
            </Label>
            <ComboBox
              items={countries}
              value={formData.address.country}
              onValueChange={(val) => {
                updateFormField('address.country', val);
                updateFormField('address.state', '');
                updateFormField('address.city', '');
              }}
              placeholder="Select Country"
              searchPlaceholder="Search countries..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Landmark className="h-3 w-3" /> State / Province
            </Label>
            <ComboBox
              items={states}
              value={formData.address.state}
              onValueChange={(val) => {
                updateFormField('address.state', val);
                updateFormField('address.city', '');
              }}
              placeholder={formData.address.country ? "Select State" : "Select Country first"}
              disabled={!formData.address.country}
              searchPlaceholder="Search states..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold flex items-center gap-1">
              <Building2 className="h-3 w-3" /> City
            </Label>
            <ComboBox
              items={cities}
              value={formData.address.city}
              onValueChange={(val) => updateFormField('address.city', val)}
              placeholder={formData.address.state ? "Select City" : "Select State first"}
              disabled={!formData.address.state}
              searchPlaceholder="Search cities..."
              custom // Allow custom city name if not in library
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip" className="text-xs font-semibold tracking-wide">Zip / Postal Code</Label>
            <Input
              id="zip"
              placeholder="Zip Code"
              value={formData.address.zip}
              onChange={(e) => updateFormField('address.zip', e.target.value)}
              className="bg-white"
            />
          </div>

          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="street" className="text-xs font-semibold">Street Address</Label>
            <Input
              id="street"
              placeholder="Apartment, suite, unit, building, floor, etc."
              value={formData.address.street}
              onChange={(e) => updateFormField('address.street', e.target.value)}
              className="bg-white"
            />
          </div>
        </div>
      </section>

      {/* Emergency Contact */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-bold border-b pb-2 text-sm uppercase tracking-wider">
          <PhoneCall className="h-4 w-4" />
          <span>Emergency Contact</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Contact Full Name</Label>
            <Input
              placeholder="Emergency contact name"
              value={formData.emergencyContact.name}
              onChange={(e) => updateFormField('emergencyContact.name', e.target.value)}
              className="bg-white"
            />
          </div>
          
          <div className="space-y-2">
            <Label className="text-xs font-semibold">Relationship</Label>
            <ComboBox
              items={relationshipOptions}
              value={formData.emergencyContact.relationship}
              onValueChange={(val) => updateFormField('emergencyContact.relationship', val)}
              placeholder="Select Relationship"
              searchPlaceholder="Search or type..."
              custom // Allow custom relationships
            />
          </div>

          <div className="md:col-span-2">
            <PhoneInput
              value={formData.emergencyContact.phone}
              onChange={(val) => updateFormField('emergencyContact.phone', val)}
              label="Emergency Contact Phone"
              placeholder="Enter phone number"
              required={false}
            />
          </div>
        </div>
      </section>
    </div>
  );
};

