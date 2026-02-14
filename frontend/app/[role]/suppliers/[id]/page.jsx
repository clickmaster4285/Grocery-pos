'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetSupplierById } from '@/features/supplier.api';
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronLeft, 
    Truck, 
    Calendar, 
    Clock, 
    User, 
    ShieldCheck, 
    Hash,
    Layers,
    Activity,
    Info,
    Pencil,
    Mail,
    Phone,
    MapPin,
    CreditCard,
    Banknote,
    Building2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

const SupplierDetailPage = () => {
  const params = useParams();
  const { id, role } = params;
  const router = useRouter();

  const { data: supplierData, isLoading, isError, error } = useGetSupplierById(id);
  const supplier = supplierData?.data;

  if (isLoading) {
    return (
        <div className="flex h-[70vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Analyzing Supplier Node</p>
            </div>
        </div>
    );
  }

  if (isError) {
    return <div className="p-20 text-center text-destructive font-bold uppercase tracking-tight">System Access Error: {error?.message}</div>;
  }

  if (!supplier) {
    return <div className="p-20 text-center text-muted-foreground font-semibold italic">Supplier identifier not found in active dataset.</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-11 w-11 rounded-xl border shadow-sm hover:bg-muted transition-all">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="font-mono text-[10px] font-bold tracking-widest bg-primary/5 text-primary border-primary/10 uppercase">
                    {supplier.supplier_code || 'UNASSIGNED'}
                </Badge>
                <Badge className={`font-bold text-[10px] uppercase tracking-wider ${supplier.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-muted text-muted-foreground'}`} variant="outline">
                    {supplier.status}
                </Badge>
                <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider border-blue-200 text-blue-600 bg-blue-50/50">
                    {supplier.payment_terms} TERMS
                </Badge>
            </div>
            <h1 className="text-3xl font-bold text-foreground uppercase tracking-tight">{supplier.name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <Button 
                onClick={() => router.push(`/${role}/suppliers/${id}/edit`)}
                className="gap-2 font-bold text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl shadow-lg shadow-primary/20"
            >
                <Pencil className="h-3.5 w-3.5" />
                Modify Partner
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: PRIMARY DATA */}
        <div className="lg:col-span-8 space-y-8">
            {/* 1. Contact & Communication */}
            <Card className="border shadow-sm overflow-hidden rounded-2xl">
                <CardHeader className="bg-muted/30 border-b px-8 py-5">
                    <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <User className="h-3.5 w-3.5 opacity-70" /> Communication Channels
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-primary tracking-widest block opacity-70">Primary Contact</label>
                            <p className="text-lg font-bold text-foreground">{supplier.contactPerson || 'N/A'}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-primary tracking-widest block opacity-70">Email Registry</label>
                            <div className="flex items-center gap-2 text-foreground font-semibold">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                {supplier.email || 'No email registered'}
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-primary tracking-widest block opacity-70">Direct Line</label>
                            <div className="flex items-center gap-2 text-foreground font-semibold">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {supplier.phone || 'No phone registered'}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Geographical Deployment */}
            <Card className="border shadow-sm overflow-hidden rounded-2xl">
                <CardHeader className="bg-muted/30 border-b px-8 py-5">
                    <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 opacity-70" /> Physical Footprint
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-6">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-primary tracking-widest block opacity-70">Street Address</label>
                                <p className="text-xl font-semibold text-foreground leading-tight">
                                    {supplier.address?.street || 'No street assigned'}
                                </p>
                            </div>
                            <div className="flex gap-10">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block opacity-70">City</label>
                                    <p className="font-bold text-foreground">{supplier.address?.city || 'N/A'}</p>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block opacity-70">Country</label>
                                    <p className="font-bold text-foreground uppercase tracking-wider text-sm">{supplier.address?.country || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-muted/20 p-6 rounded-2xl border-2 border-dashed border-muted flex flex-col justify-center items-center text-center">
                            <Building2 className="h-8 w-8 text-muted-foreground/30 mb-2" />
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Operational Hub</p>
                            <p className="text-xs font-semibold mt-1 italic text-muted-foreground/60">Verified Facility Location</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Financial & Fiscal Logic */}
            <Card className="border shadow-sm overflow-hidden rounded-2xl">
                <CardHeader className="bg-muted/30 border-b px-8 py-5">
                    <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <CreditCard className="h-3.5 w-3.5 opacity-70" /> Fiscal & Settlement Intelligence
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-primary tracking-widest block opacity-70">Tax ID / NTN</label>
                            <p className="text-lg font-mono font-bold text-foreground tracking-widest">{supplier.tax_id || 'NOT_REGISTERED'}</p>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold uppercase text-primary tracking-widest block opacity-70">Registration Number</label>
                            <p className="text-lg font-mono font-bold text-foreground tracking-widest">{supplier.registration_number || 'N/A'}</p>
                        </div>
                    </div>

                    <Separator className="opacity-50" />

                    <div className="space-y-6">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest">
                            <Banknote className="h-3.5 w-3.5" /> Banking Parameters
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-muted/10 p-6 rounded-2xl border border-border/50">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block opacity-70">Institution</label>
                                <p className="font-bold text-foreground">{supplier.bank_details?.bank_name || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block opacity-70">Account Index</label>
                                <p className="font-mono font-bold text-foreground text-sm tracking-wider">{supplier.bank_details?.account_number || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block opacity-70">Legal Title</label>
                                <p className="font-bold text-foreground text-sm uppercase">{supplier.bank_details?.account_holder_name || 'N/A'}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest block opacity-70">IBAN / Global Index</label>
                                <p className="font-mono font-bold text-foreground text-xs tracking-tighter">{supplier.bank_details?.iban || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* RIGHT COLUMN: AUDIT & META */}
        <div className="lg:col-span-4 space-y-6">
            <Card className="border shadow-xl rounded-2xl overflow-hidden border-primary/10">
                <CardHeader className="border-b bg-muted/30 px-6 py-4">
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary italic">Registry Metadata</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm text-emerald-600">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider mb-0.5">Registry Lead</label>
                                <p className="font-bold text-foreground text-sm">
                                    {supplier.createdBy?.firstName} {supplier.createdBy?.lastName || 'System'}
                                </p>
                                <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                                    {format(new Date(supplier.createdAt), 'MMM dd, yyyy · HH:mm')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100 shadow-sm text-sky-600">
                                <Clock className="h-4 w-4" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider mb-0.5">Record Sync</label>
                                <p className="font-bold text-foreground text-sm italic">Synchronized</p>
                                <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                                    {format(new Date(supplier.updatedAt), 'MMM dd, yyyy · HH:mm')}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-muted/30 p-6 rounded-2xl border border-border shadow-inner">
                <div className="flex items-start gap-3">
                    <ShieldCheck className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-foreground font-bold uppercase text-[10px] tracking-widest mb-1">Fiscal Compliance</h4>
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                            This node is subject to procurement audit protocols. Ensure all tax identification records are synchronized with local regional authorities.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SupplierDetailPage;