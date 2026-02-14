'use client';

import { useParams } from 'next/navigation';
import { useGetBranchById } from '@/features/branch.api';
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronLeft, 
    Store, 
    Calendar, 
    MapPin, 
    Clock, 
    User, 
    ShieldCheck, 
    Fingerprint,
    Globe,
    Activity,
    Info
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const BranchDetailPage = () => {
  const params = useParams();
  const { id } = params;
  const router = useRouter();

  const { data: branchData, isLoading, isError, error } = useGetBranchById(id);
  const branch = branchData?.data;

  if (isLoading) {
    return <div className="p-20 text-center animate-pulse font-semibold text-primary/60 text-lg uppercase tracking-widest italic">Analyzing Branch Node...</div>;
  }

  if (isError) {
    return <div className="p-20 text-center text-destructive font-bold uppercase tracking-tight">System Access Error: {error?.message}</div>;
  }

  if (!branch) {
    return <div className="p-20 text-center text-muted-foreground font-semibold italic">Record identifier not found in active dataset.</div>;
  }

  const formatTime = (time) => {
    if (!time) return "N/A";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in duration-700">
      {/* Dynamic Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="h-11 w-11 rounded-xl border shadow-sm hover:bg-muted transition-all">
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
                <Badge variant="secondary" className="font-mono text-[10px] font-bold tracking-widest bg-primary/5 text-primary border-primary/10">
                    {branch.branch_code || 'UNASSIGNED'}
                </Badge>
                <Badge className={`font-bold text-[10px] uppercase tracking-wider ${branch.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-muted text-muted-foreground'}`} variant="outline">
                    {branch.status}
                </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">{branch.branch_name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Network Status</p>
                <p className="text-xs font-semibold text-emerald-600 flex items-center justify-end gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Verified Active
                </p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: PRIMARY DATA */}
        <div className="lg:col-span-8 space-y-6">
            <Card className="border shadow-sm overflow-hidden rounded-2xl">
                <CardHeader className="bg-muted/30 border-b px-8 py-5">
                    <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 opacity-70" /> Physical Footprint
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <div className="space-y-8">
                            <div className="group">
                                <label className="text-[10px] font-bold uppercase text-primary tracking-widest mb-2 block opacity-70">Street Deployment</label>
                                <p className="text-xl font-semibold text-foreground leading-tight">
                                    {branch.address?.street || 'No street assigned'}
                                </p>
                                <p className="text-base font-medium text-muted-foreground mt-1">
                                    {branch.address?.city}, {branch.address?.state} {branch.address?.zipCode}
                                </p>
                                <div className="flex items-center gap-2 text-primary font-bold uppercase text-[10px] mt-4 tracking-widest">
                                    <MapPin className="h-3.5 w-3.5" />
                                    {branch.address?.country || 'No Country selected'}
                                </div>
                            </div>

                            <Separator className="opacity-50" />

                            <div>
                                <label className="text-[10px] font-bold uppercase text-primary tracking-widest mb-2 block opacity-70 italic">Tax & Legal Jurisdiction</label>
                                <div className="flex items-center gap-3 font-bold text-xl tracking-tight text-foreground">
                                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                                    {branch.tax_region || 'Standard Protocol'}
                                </div>
                            </div>
                        </div>

                        <div className="bg-muted/20 p-8 rounded-3xl border-2 border-dashed border-muted flex flex-col justify-center items-center text-center group hover:border-primary/30 transition-colors">
                            <Clock className="h-10 w-10 text-muted-foreground mb-4 opacity-30 group-hover:text-primary transition-colors" />
                            <h3 className="font-bold uppercase tracking-tight text-lg">Operating Window</h3>
                            <div className="mt-5 space-y-2">
                                <div className="bg-background px-6 py-2 rounded-xl border shadow-sm font-mono text-lg font-semibold">
                                    {formatTime(branch.opening_time)} — {formatTime(branch.closing_time)}
                                </div>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-2 opacity-60">Localized Operational Hours</p>
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
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary italic">System Metadata</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-5">
                        <div className="flex items-start gap-4">
                            <div className="h-9 w-9 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm text-emerald-600">
                                <User className="h-4 w-4" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider mb-0.5">Deployment Lead</label>
                                <p className="font-bold text-foreground text-sm">
                                    {branch.createdBy?.firstName} {branch.createdBy?.lastName}
                                </p>
                                <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                                    {format(new Date(branch.createdAt), 'MMM dd, yyyy · HH:mm')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100 shadow-sm text-sky-600">
                                <Calendar className="h-4 w-4" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider mb-0.5">Last Record Sync</label>
                                <p className="font-bold text-foreground text-sm italic">Integrity Confirmed</p>
                                <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                                    {format(new Date(branch.updatedAt), 'MMM dd, yyyy · HH:mm')}
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
                        <h4 className="text-foreground font-bold uppercase text-[10px] tracking-widest mb-1">Audit Protocol</h4>
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                            Modifications to this node are recorded in the global ledger. Immediate synchronization occurs across all linked POS clusters upon state change.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BranchDetailPage;