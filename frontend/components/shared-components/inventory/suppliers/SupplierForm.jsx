'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
    ChevronLeft, 
    Truck, 
    Hash, 
    User, 
    Mail, 
    Phone, 
    MapPin, 
    ShieldCheck, 
    CreditCard, 
    Save, 
    LayoutDashboard,
    Loader2,
    Info,
    Building2,
    Banknote,
    Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Country, State, City } from "country-state-city";
import { ComboBox } from "@/components/ui/combobox";
import { toast } from 'sonner';
import { useCreateSupplier, useUpdateSupplier, useGetSupplierById } from '@/features/supplier.api';

const initialFormData = {
    supplier_code: "",
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: {
        street: "",
        city: "",
        state: "",
        zipCode: "",
        country: "",
    },
    tax_id: "",
    registration_number: "",
    bank_details: {
        bank_name: "",
        account_number: "",
        account_holder_name: "",
        branch_name: "",
        iban: ""
    },
    payment_terms: "CASH",
    status: "ACTIVE",
};

const SupplierFormView = () => {
    const router = useRouter();
    const params = useParams();
    const { id, role } = params;
    const isEditMode = !!id;

    const [formData, setFormData] = useState(initialFormData);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    const { data: supplierData, isLoading: isSupplierLoading } = useGetSupplierById(id);
    const createSupplierMutation = useCreateSupplier();
    const updateSupplierMutation = useUpdateSupplier();

    const countries = Country.getAllCountries().map(c => ({
        label: c.name,
        value: c.isoCode
    }));

    useEffect(() => {
        if (isEditMode && supplierData?.data) {
            const supplier = supplierData.data;
            setFormData({
                supplier_code: supplier.supplier_code || "",
                name: supplier.name || "",
                contactPerson: supplier.contactPerson || "",
                email: supplier.email || "",
                phone: supplier.phone || "",
                address: {
                    street: supplier.address?.street || "",
                    city: supplier.address?.city || "",
                    state: supplier.address?.state || "",
                    zipCode: supplier.address?.zipCode || "",
                    country: supplier.address?.country || "",
                },
                tax_id: supplier.tax_id || "",
                registration_number: supplier.registration_number || "",
                bank_details: {
                    bank_name: supplier.bank_details?.bank_name || "",
                    account_number: supplier.bank_details?.account_number || "",
                    account_holder_name: supplier.bank_details?.account_holder_name || "",
                    branch_name: supplier.bank_details?.branch_name || "",
                    iban: supplier.bank_details?.iban || ""
                },
                payment_terms: supplier.payment_terms || "CASH",
                status: supplier.status || "ACTIVE",
            });
        }
    }, [isEditMode, supplierData]);

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
            address: { ...prev.address, country: name, state: "", city: "" }
        }));
    };

    const handleStateChange = (stateIsoCode) => {
        const countryObj = Country.getAllCountries().find(c => c.name === formData.address.country);
        const name = State.getStateByCodeAndCountry(stateIsoCode, countryObj?.isoCode)?.name || "";
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, state: name, city: "" }
        }));
    };

    const handleCityChange = (cityName) => {
        setFormData(prev => ({
            ...prev,
            address: { ...prev.address, city: cityName }
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const toastId = toast.loading(isEditMode ? 'Synchronizing supplier records...' : 'Registering new supplier node...');
        
        try {
            if (isEditMode) {
                await updateSupplierMutation.mutateAsync({ id, supplierData: formData });
                toast.success("Supplier records successfully updated.", { id: toastId });
            } else {
                await createSupplierMutation.mutateAsync(formData);
                toast.success("New supplier node deployed successfully.", { id: toastId });
            }
            router.push(`/${role}/inventory/suppliers`);
        } catch (error) {
            toast.error("Operation failed", {
                id: toastId,
                description: error?.response?.data?.message || "An unexpected error occurred during database commit.",
            });
        }
    };

    if (isEditMode && isSupplierLoading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Retrieving Node Configuration</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border/50 pb-6">
                <div className="space-y-3">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.back()} 
                        className="group -ml-2 text-muted-foreground hover:text-foreground h-8 px-2"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Back to Network</span>
                    </Button>
                   <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Truck className="h-4.5 w-4.5 text-primary" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-foreground">
                                {isEditMode ? 'Configure Supplier' : 'Register New Supplier'}
                            </h1>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground max-w-md ml-12">
                            {isEditMode 
                                ? `Update node parameters for ${formData.name}.` 
                                : 'Initialize a new supply chain node with global identification.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={() => router.back()} className="font-bold text-[10px] uppercase tracking-widest px-5 h-10 rounded-xl transition-all">
                        Cancel
                    </Button>
                   <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 font-bold text-[10px] uppercase tracking-widest px-6 h-10 rounded-xl shadow-lg shadow-primary/20 gap-2 transition-all">
                        <Save className="h-4 w-4" />
                        {isEditMode ? 'Sync Records' : 'Create Records'}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                {/* Left Form Column */}
                <div className="lg:col-span-8">
                    
                    {/* 1. Core Identity */}
                    <section>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center border-primary/30 text-primary text-[9px] font-bold">1</Badge>
                            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Core Identity</h2>
                        </div>
                        
                        <Card className="border-none shadow-none bg-muted/30 rounded-2xl overflow-hidden">
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Company Name</Label>
                                        <Input
                                            id="name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g., Global Logistics Corp"
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="supplier_code" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Protocol Code</Label>
                                        <div className="relative group">
                                            <Input
                                                id="supplier_code"
                                                value={formData.supplier_code}
                                                onChange={(e) => setFormData({ ...formData, supplier_code: e.target.value.toUpperCase() })}
                                                placeholder="AUTO-GENERATE"
                                            />
                                        </div>
                                        <p className="text-[9px] font-bold text-muted-foreground/50 uppercase tracking-tight ml-1">Leave empty for automatic generation</p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="contactPerson" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Contact Person</Label>
                                        <div className="relative group">                                          
                                            <Input
                                                id="contactPerson"
                                                value={formData.contactPerson}
                                                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                                                placeholder="Full Name"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Registry Status</Label>
                                        <Select
                                            value={formData.status}
                                            onValueChange={(value) => setFormData({ ...formData, status: value })}
                                        >
                                            <SelectTrigger id="status">
                                                <SelectValue />
                                           </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border/50 shadow-xl">
                                                <SelectItem value="ACTIVE">Active Supplier</SelectItem>
                                                <SelectItem value="INACTIVE" >Inactive Node</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* 2. Communication Channels */}
                    <section >
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center border-primary/30 text-primary text-[9px] font-bold">2</Badge>
                            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Communication Channels</h2>
                        </div>
                        
                        <Card className="border-none shadow-none bg-muted/30 rounded-2xl overflow-hidden">
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Registry</Label>
                                        <div className="relative group">
                                            <Input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="supplier@domain.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="phone" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Primary Phone</Label>
                                        <div className="relative group">
                                            <Input
                                                id="phone"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* 3. Geographical Deployment */}
                    <section >
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center border-primary/30 text-primary text-[9px] font-bold">3</Badge>
                            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Geographical Deployment</h2>
                        </div>
                        
                        <Card className="border-none shadow-none bg-muted/30 rounded-2xl overflow-hidden">
                            <CardContent className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="street" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Street Address</Label>
                                    <div className="relative group">
                                        <Input
                                            id="street"
                                            value={formData.address.street}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                            placeholder="Warehouse / Office Location"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Country</Label>
                                        <ComboBox
                                            items={countries}
                                            value={Country.getAllCountries().find(c => c.name === formData.address.country)?.isoCode || ""}
                                            onValueChange={handleCountryChange}
                                            placeholder="Select Country"
                                            searchPlaceholder="Search grid..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">State / Province</Label>
                                        <ComboBox
                                            items={states}
                                            value={states.find(s => s.label === formData.address.state)?.value || ""}
                                            onValueChange={handleStateChange}
                                            placeholder="Select State"
                                            searchPlaceholder="Search states..."
                                            disabled={!formData.address.country}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">City Node</Label>
                                        <ComboBox
                                            items={cities}
                                            value={formData.address.city}
                                            onValueChange={handleCityChange}
                                            placeholder="Select City"
                                            searchPlaceholder="Search cities..."
                                            disabled={!formData.address.state}
                                            custom={true}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="zipCode" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Postal Registry</Label>
                                        <Input
                                            id="zipCode"
                                            value={formData.address.zipCode}
                                            onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
                                            placeholder="ZIP Code"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>

                    {/* 4. Fiscal & Financial Logic */}
                    <section >
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-5 w-5 rounded-full p-0 flex items-center justify-center border-primary/30 text-primary text-[9px] font-bold">4</Badge>
                            <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">Fiscal & Financial Logic</h2>
                        </div>
                        
                        <Card className="border-none shadow-none bg-muted/30 rounded-2xl overflow-hidden">
                            <CardContent className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="tax_id" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tax ID / NTN</Label>
                                        <Input
                                            id="tax_id"
                                            value={formData.tax_id}
                                            onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                                            placeholder="Tax Identification"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="payment_terms">Settlement Protocol</Label>
                                        <Select
                                            value={formData.payment_terms}
                                            onValueChange={(value) => setFormData({ ...formData, payment_terms: value })}
                                        >
                                            <SelectTrigger id="payment_terms">
                                                <SelectValue />
                                           </SelectTrigger>
                                            <SelectContent className="rounded-xl border-border/50 shadow-xl">
                                                <SelectItem value="CASH">Direct Cash</SelectItem>
                                                <SelectItem value="CREDIT">Open Credit</SelectItem>
                                                <SelectItem value="NET_30">Net 30 Protocol</SelectItem>
                                                <SelectItem value="NET_60">Net 60 Protocol</SelectItem>
                                                <SelectItem value="DUE_ON_RECEIPT">Due on Receipt</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                                        <Banknote className="h-3 w-3" /> Banking Parameters
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label htmlFor="bank_name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Financial Institution</Label>
                                            <Input
                                                id="bank_name"
                                                value={formData.bank_details.bank_name}
                                                onChange={(e) => setFormData({ ...formData, bank_details: { ...formData.bank_details, bank_name: e.target.value } })}
                                                placeholder="Bank Name"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="account_number" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Account Index</Label>
                                            <Input
                                                id="account_number"
                                                value={formData.bank_details.account_number}
                                                onChange={(e) => setFormData({ ...formData, bank_details: { ...formData.bank_details, account_number: e.target.value } })}
                                                placeholder="Account Number"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="account_holder_name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Legal Title</Label>
                                            <Input
                                                id="account_holder_name"
                                                value={formData.bank_details.account_holder_name}
                                                onChange={(e) => setFormData({ ...formData, bank_details: { ...formData.bank_details, account_holder_name: e.target.value } })}
                                                placeholder="Account Holder Name"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>

                {/* Right Sidebar Column */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border shadow-lg rounded-2xl overflow-hidden border-primary/10 sticky top-6">
                        <CardContent >
                            <div className="bg-primary/5 p-5 space-y-6">
                                <div className="flex items-center gap-2">
                                    <LayoutDashboard className="h-3.5 w-3.5 text-primary" />
                                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-primary italic">Live Node Preview</h3>
                                </div>
                                
                                <div className="space-y-5">
                                    {/* Preview Card */}
                                    <div className="bg-background rounded-2xl p-5 border border-border/50 shadow-sm space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1">
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">{formData.supplier_code || 'PROTOCOL-000'}</p>
                                                <h4 className="text-base font-bold text-foreground leading-tight uppercase">{formData.name || 'Unnamed Supplier'}</h4>
                                            </div>
                                            <Badge className={`text-[8px] font-bold uppercase px-2 py-0 h-4 ${formData.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-muted text-muted-foreground'}`} variant="outline">
                                                {formData.status}
                                            </Badge>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                                                <User className="h-3 w-3 opacity-50" />
                                                {formData.contactPerson || 'No Contact Assigned'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground">
                                                <MapPin className="h-3 w-3 opacity-50" />
                                                {formData.address.city || 'City'}, {formData.address.country || 'Country'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] font-bold text-primary uppercase tracking-wider">
                                                <CreditCard className="h-3 w-3 opacity-50" />
                                                {formData.payment_terms} Protocol
                                            </div>
                                        </div>
                                    </div>

                                    {/* Info Panel */}
                                    <div className="space-y-4 px-1">
                                        <div className="flex items-start gap-3">
                                            <Info className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                                            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                                                Supplier nodes are foundational for procurement and accounts payable automation.
                                            </p>
                                        </div>
                                        <div className="flex items-start gap-3">
                                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                            <p className="text-[10px] font-medium text-muted-foreground leading-relaxed">
                                                Tax ID and Banking parameters are validated before electronic settlement dispatch.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </form>
        </div>
    );
};

export default SupplierFormView;