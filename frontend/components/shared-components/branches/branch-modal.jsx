"use client";

import React from 'react'
import { useState, useEffect } from "react";
import { X, MapPin, Clock, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Country, State, City } from "country-state-city";
import { ComboBox } from "@/components/ui/combobox";

const initialFormData = {
    branch_code: "",
    branch_name: "",
    tax_region: "",
    opening_time: "",
    closing_time: "",
    status: "ACTIVE",
    address: {
        city: "",
        state: "",
        country: "",
        street: "",
        zipCode: "",
    },
};

const BranchModal = ({
    isOpen,
    onClose,
    onSave,
    branch,
    mode,
}) => {
    const [formData, setFormData] = useState(initialFormData);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    const countries = Country.getAllCountries().map(c => ({
        label: c.name,
        value: c.isoCode
    }));

    useEffect(() => {
        if (branch && (mode === "edit" || mode === "view")) {
            setFormData({
                branch_code: branch.branch_code || "",
                branch_name: branch.branch_name,
                tax_region: branch.tax_region || "",
                opening_time: branch.opening_time || "",
                closing_time: branch.closing_time || "",
                status: branch.status,
                address: {
                    city: branch.address?.city || "",
                    state: branch.address?.state || "",
                    country: branch.address?.country || "",
                    street: branch.address?.street || "",
                    zipCode: branch.address?.zipCode || "",
                },
            });
        } else {
            setFormData(initialFormData);
        }
    }, [branch, mode, isOpen]);

    useEffect(() => {
        const countryObj = Country.getAllCountries().find(c => c.name === formData.address.country);
        if (countryObj) {
            const countryStates = State.getStatesOfCountry(countryObj.isoCode).map(s => ({
                label: s.name,
                value: s.isoCode
            }));
            setStates(countryStates);
        } else {
            setStates([]);
        }
    }, [formData.address.country]);

    useEffect(() => {
        const countryObj = Country.getAllCountries().find(c => c.name === formData.address.country);
        if (countryObj) {
            const stateObj = State.getStatesOfCountry(countryObj.isoCode).find(s => s.name === formData.address.state);
            if (stateObj) {
                const stateCities = City.getCitiesOfState(countryObj.isoCode, stateObj.isoCode).map(c => ({
                    label: c.name,
                    value: c.name
                }));
                setCities(stateCities);
            } else {
                setCities([]);
            }
        } else {
            setCities([]);
        }
    }, [formData.address.country, formData.address.state]);

    const handleCountryChange = (isoCode) => {
        const name = Country.getCountryByCode(isoCode)?.name || "";
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                country: name,
                state: "",
                city: ""
            }
        }));
    };

    const handleStateChange = (stateIsoCode) => {
        const countryObj = Country.getAllCountries().find(c => c.name === formData.address.country);
        const name = State.getStateByCodeAndCountry(stateIsoCode, countryObj?.isoCode)?.name || "";
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                state: name,
                city: ""
            }
        }));
    };

    const handleCityChange = (cityName) => {
        setFormData(prev => ({
            ...prev,
            address: {
                ...prev.address,
                city: cityName
            }
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    const isViewMode = mode === "view";
    const title =
        mode === "add"
            ? "Register New Branch"
            : mode === "edit"
                ? "Configure Branch"
                : "Branch Intelligence";

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-background/80 backdrop-blur-sm"
                onClick={onClose}
                aria-hidden="true"
            />

            {/* Modal */}
            <div className="relative z-10 w-full max-w-xl rounded-2xl bg-card shadow-2xl border border-border overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="px-6 py-5 border-b bg-muted/30 flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Storefront Node Configuration</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="rounded-full h-9 w-9"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Basic Info Group */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                            Core Identity
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="branch_code" className="text-xs font-semibold text-muted-foreground uppercase">Unique Code</Label>
                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                                    <Input
                                        id="branch_code"
                                        value={formData.branch_code}
                                        onChange={(e) => setFormData({ ...formData, branch_code: e.target.value.toUpperCase() })}
                                        placeholder="BR-001"
                                        className="pl-9 h-10 font-mono text-sm border-muted bg-muted/10 focus-visible:bg-background"
                                        disabled={isViewMode}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="branch_name" className="text-xs font-semibold text-muted-foreground uppercase">Branch Name *</Label>
                                <Input
                                    id="branch_name"
                                    value={formData.branch_name}
                                    onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                    placeholder="Lahore Central"
                                    className="h-10 font-semibold border-muted bg-muted/10 focus-visible:bg-background"
                                    disabled={isViewMode}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="tax_region" className="text-xs font-semibold text-muted-foreground uppercase">Tax Region</Label>
                                <Input
                                    id="tax_region"
                                    value={formData.tax_region}
                                    onChange={(e) => setFormData({ ...formData, tax_region: e.target.value })}
                                    placeholder="Pakistan"
                                    className="h-10 font-medium border-muted bg-muted/10 focus-visible:bg-background"
                                    disabled={isViewMode}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status" className="text-xs font-semibold text-muted-foreground uppercase">Initial Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                                    disabled={isViewMode}
                                >
                                    <SelectTrigger className="h-10 font-bold border-muted bg-muted/10">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ACTIVE" className="font-bold text-emerald-600">Active</SelectItem>
                                        <SelectItem value="INACTIVE" className="font-bold text-muted-foreground">Inactive</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    <Separator className="opacity-50" />

                    {/* Logistics Group */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                            <Clock className="h-3.5 w-3.5" />
                            Operational Hours
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="opening_time" className="text-xs font-semibold text-muted-foreground uppercase">Opens At</Label>
                                <Input
                                    id="opening_time"
                                    type="time"
                                    value={formData.opening_time}
                                    onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                                    className="h-10 font-medium border-muted bg-muted/10 focus-visible:bg-background"
                                    disabled={isViewMode}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="closing_time" className="text-xs font-semibold text-muted-foreground uppercase">Closes At</Label>
                                <Input
                                    id="closing_time"
                                    type="time"
                                    value={formData.closing_time}
                                    onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                                    className="h-10 font-medium border-muted bg-muted/10 focus-visible:bg-background"
                                    disabled={isViewMode}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator className="opacity-50" />

                    {/* Geography Group */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                            <MapPin className="h-3.5 w-3.5" />
                            Geographical Positioning
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="street" className="text-xs font-semibold text-muted-foreground uppercase">Street Address</Label>
                            <Input
                                id="street"
                                value={formData.address.street}
                                onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                placeholder="Plot 42, Main Boulevard"
                                className="h-10 font-medium border-muted bg-muted/10 focus-visible:bg-background"
                                disabled={isViewMode}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-xs font-semibold text-muted-foreground uppercase">Country</Label>
                                <ComboBox
                                    items={countries}
                                    value={Country.getAllCountries().find(c => c.name === formData.address.country)?.isoCode || ""}
                                    onValueChange={handleCountryChange}
                                    placeholder="Select Country"
                                    searchPlaceholder="Search country..."
                                    disabled={isViewMode}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state" className="text-xs font-semibold text-muted-foreground uppercase">State / Prov</Label>
                                <ComboBox
                                    items={states}
                                    value={states.find(s => s.label === formData.address.state)?.value || ""}
                                    onValueChange={handleStateChange}
                                    placeholder="Select State"
                                    searchPlaceholder="Search state..."
                                    disabled={isViewMode || !formData.address.country}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-xs font-semibold text-muted-foreground uppercase">City</Label>
                                <ComboBox
                                    items={cities}
                                    value={formData.address.city}
                                    onValueChange={handleCityChange}
                                    placeholder="Select City"
                                    searchPlaceholder="Search city..."
                                    disabled={isViewMode || !formData.address.state}
                                    custom={true}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="zipCode" className="text-xs font-semibold text-muted-foreground uppercase">Zip Code</Label>
                                <Input
                                    id="zipCode"
                                    value={formData.address.zipCode}
                                    onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
                                    placeholder="54000"
                                    className="h-10 font-medium border-muted bg-muted/10 focus-visible:bg-background"
                                    disabled={isViewMode}
                                />
                            </div>
                        </div>
                    </div>
                </form>

                {/* Footer Actions */}
                <div className="px-6 py-4 border-t bg-muted/30 flex justify-end gap-3">
                    <Button 
                        type="button" 
                        variant="outline" 
                        onClick={onClose}
                        className="font-semibold px-6 border-muted bg-background hover:bg-muted"
                    >
                        {isViewMode ? "Close Intelligence" : "Cancel"}
                    </Button>
                    {!isViewMode && (
                        <Button 
                            type="submit" 
                            onClick={handleSubmit}
                            className="bg-primary hover:bg-primary/90 font-bold px-8 shadow-lg shadow-primary/20"
                        >
                            {mode === "add" ? "Register Node" : "Update Records"}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
export default BranchModal;