'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
    ChevronLeft, 
    Building2, 
    Hash, 
    MapPin, 
    Clock, 
    Globe, 
    ShieldCheck, 
    Save, 
    X,
    LayoutDashboard,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
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
import { useCreateBranch, useUpdateBranch, useGetBranchById } from '@/features/branch.api';

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

const BranchFormPage = () => {
    const router = useRouter();
    const params = useParams();
    const { id, role } = params;
    const isEditMode = !!id;

    const [formData, setFormData] = useState(initialFormData);
    const [states, setStates] = useState([]);
    const [cities, setCities] = useState([]);

    const { data: branchData, isLoading: isBranchLoading } = useGetBranchById(id);
    const createBranchMutation = useCreateBranch();
    const updateBranchMutation = useUpdateBranch();

    const countries = Country.getAllCountries().map(c => ({
        label: c.name,
        value: c.isoCode
    }));

    useEffect(() => {
        if (isEditMode && branchData?.data) {
            const branch = branchData.data;
            setFormData({
                branch_code: branch.branch_code || "",
                branch_name: branch.branch_name || "",
                tax_region: branch.tax_region || "",
                opening_time: branch.opening_time || "",
                closing_time: branch.closing_time || "",
                status: branch.status || "ACTIVE",
                address: {
                    city: branch.address?.city || "",
                    state: branch.address?.state || "",
                    country: branch.address?.country || "",
                    street: branch.address?.street || "",
                    zipCode: branch.address?.zipCode || "",
                },
            });
        }
    }, [isEditMode, branchData]);

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
        const toastId = toast.loading(isEditMode ? 'Synchronizing branch data...' : 'Registering new branch Branch...');
        
        try {
            if (isEditMode) {
                await updateBranchMutation.mutateAsync({ id, branchData: formData });
                toast.success("Branch record successfully updated.", { id: toastId });
            } else {
                await createBranchMutation.mutateAsync(formData);
                toast.success("New branch Branch deployed successfully.", { id: toastId });
            }
            router.push(`/${role}/branches`);
        } catch (error) {
            toast.error("Operation failed", {
                id: toastId,
                description: error?.response?.data?.message || "An unexpected error occurred during database commit.",
            });
        }
    };

    if (isEditMode && isBranchLoading) {
        return (
            <div className="flex h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Retrieving Branch Configuration</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-3 rounded-lg space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border/50 pb-8">
                <div className="space-y-4">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => router.back()} 
                        className="group -ml-2 text-muted-foreground hover:text-foreground transition-all px-2"
                    >
                        <ChevronLeft className="mr-1 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span className="text-xs font-bold uppercase tracking-widest">Back to Network</span>
                    </Button>
                   <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground">
                                {isEditMode ? 'Configure Branch' : 'Register New Branch'}
                            </h1>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground max-w-md ml-13">
                            {isEditMode 
                                ? `Updating configuration for ${formData.branch_name}. Changes will propagate instantly across the grid.` 
                                : 'Initialize a new storefront location with global identification and regional logistics parameters.'}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" oClick={() => router.back()} className="font-semibold text-xs tracking-widest rounded-md">
                        Cancel
                    </Button>
                   <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90 font-semibold text-xs tracking-widest rounded-md shadow-lg shadow-primary/20 gap-2">
                        <Save className="h-4 w-4" />
                        {isEditMode ? 'Sync Records' : 'Deploy Branch'}
                    </Button>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Left: Configuration Form */}
                <div className="lg:col-span-8 space-y-4">
                    {/* Identity Section */}
                    <section>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-primary/30 text-primary text-[10px] font-bold">1</Badge>
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Core Identity</h2>
                        </div>
                        
                        <Card className="border-none shadow-none bg-muted/20 rounded-2xl">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Branch Name</Label>
                                    <div className="relative group">
                                        <Input
                                            value={formData.branch_name}
                                            onChange={(e) => setFormData({ ...formData, branch_name: e.target.value })}
                                            placeholder="e.g., Central Plaza Hub"  
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Unique Protocol Code</Label>
                                    <div className="relative group">
                                        <Input
                                            value={formData.branch_code}
                                            onChange={(e) => setFormData({ ...formData, branch_code: e.target.value.toUpperCase() })}
                                            placeholder="AUTO-GENERATE"
                                        />
                                    </div>
                                    <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tight ml-1">Leave empty for automatic generation</p>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Tax Jurisdiction</Label>
                                    <div className="relative group">
                                        <Input
                                            value={formData.tax_region}
                                            onChange={(e) => setFormData({ ...formData, tax_region: e.target.value })}
                                            placeholder="e.g., Sindh Revenue Board"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Branch Status</Label>
                                    <Select
                                        value={formData.status}
                                        onValueChange={(value) => setFormData({ ...formData, status: vaue })}
                                    >
                                        <SelectTrigger className="h-12  border-border/50 font-bold rounded-md px-4">
                                            <SelectValue />
                                       </SelectTrigger>
                                        <SelectContent className="rounded-md border-border/50 shadow-xl">
                                            <SelectItem value="ACTIVE" className="font-bold text-emerald-600 focus:text-emerald-700 py-3 cursor-pointer">ACTIVE Branch</SelectItem>
                                            <SelectItem value="INACTIVE" className="font-bold text-muted-foreground focus:text-foreground py-3 cursor-pointer">INACTIVE Branch</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* Geography Section */}
                    <section>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-primary/30 text-primary text-[10px] font-bold">2</Badge>
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Geographical Positioning</h2>
                        </div>
                        
                        <Card className="border-none shadow-none bg-muted/20 rounded-2xl p-4 space-y-4">
                            <div className="space-y-2.5">
                                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Street Deployment</Label>
                                <div className="relative group">
                                    <Input
                                        value={formData.address.street}
                                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                                        placeholder="Plot # / Street / Sector"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Country</Label>
                                    <ComboBox
                                        items={countries}
                                        value={Country.getAllCountries().find(c => c.name === formData.address.country)?.isoCode || ""}
                                        onValueChange={handleCountryChange}
                                        placeholder="Select Deployment Country"
                                        searchPlaceholder="Search grid..."
                                    />
                                </div>
                                <div className="space-y-2.5">
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
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">City Branch</Label>
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
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Postal Registry</Label>
                                    <Input
                                        value={formData.address.zipCode}
                                        onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
                                        placeholder="ZIP Code"
                                    />
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* Operational Hours Section */}
                    <section>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="h-6 w-6 rounded-full p-0 flex items-center justify-center border-primary/30 text-primary text-[10px] font-bold">3</Badge>
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground">Operational Dynamics</h2>
                        </div>
                        
                        <Card className="border-none shadow-none bg-muted/20 rounded-2xl p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Window Open</Label>
                                    <div className="relative group">
                                        <Input
                                            type="time"
                                            value={formData.opening_time}
                                            onChange={(e) => setFormData({ ...formData, opening_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Window Close</Label>
                                    <div className="relative group">
                                        <Input
                                            type="time"
                                            value={formData.closing_time}
                                            onChange={(e) => setFormData({ ...formData, closing_time: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </Card>
                    </section>
                </div>

                {/* Right: Informational Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border shadow-xl rounded-2xl overflow-hidden border-primary/10 sticky top-6">
                        <div className="bg-primary/5 p-6 space-y-6">
                            <div className="flex items-center gap-2">
                                <LayoutDashboard className="h-4 w-4 text-primary" />
                                <h3 className="text-xs font-bold uppercase tracking-widest text-primary italic">Live Branch Preview</h3>
                            </div>
                            
                            <div className="space-y-6">
                                <div className=" rounded-2xl p-6 border border-border/50 shadow-sm space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{formData.branch_code || 'PROTOCOL-000'}</p>
                                            <h4 className="text-lg font-bold text-foreground leading-tight">{formData.branch_name || 'Unnamed Branch'}</h4>
                                        </div>
                                        <Badge className={`text-[9px] font-bold uppercase px-2 py-0 ${formData.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-muted text-muted-foreground'}`} variant="outline">
                                            {formData.status}
                                        </Badge>
                                    </div>
                                    
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                            <MapPin className="h-3.5 w-3.5 opacity-50" />
                                            {formData.address.city || 'Undetermined City'}, {formData.address.state || 'State'}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                                            <Globe className="h-3.5 w-3.5 opacity-50" />
                                            {formData.address.country || 'Select Country'}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 p-2">
                                    <div className="flex items-start gap-3">
                                        <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                            Branch registration requires unique identification. Ensure geographical positioning is accurate for tax calculation and supply chain routing.
                                        </p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <ShieldCheck className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                                            Regional tax jurisdiction settings govern fiscal reporting compliance for this storefront Branch.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>
            </form>
        </div>
    );
};

// Helper Icon for Info
const Info = ({ className }) => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4" />
        <path d="M12 8h.01" />
    </svg>
);

export default BranchFormPage;