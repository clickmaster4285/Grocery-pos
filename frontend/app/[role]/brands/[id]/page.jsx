'use client';

import { useParams, useRouter } from 'next/navigation';
import { useGetBrandById } from '@/features/brand.api';
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
    ChevronLeft, 
    ShieldCheck, 
    Calendar, 
    Clock, 
    User, 
    Hash,
    Globe,
    Activity,
    Info,
    Pencil,
    Link as LinkIcon,
    ExternalLink
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

const BrandDetailPage = () => {
  const params = useParams();
  const { id, role } = params;
  const router = useRouter();

  const { data: brandData, isLoading, isError, error } = useGetBrandById(id);
  const brand = brandData?.data;

  if (isLoading) {
    return (
        <div className="flex h-[70vh] items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Analyzing Brand Node</p>
            </div>
        </div>
    );
  }

  if (isError) {
    return <div className="p-20 text-center text-destructive font-bold uppercase tracking-tight">System Access Error: {error?.message}</div>;
  }

  if (!brand) {
    return <div className="p-20 text-center text-muted-foreground font-semibold italic">Brand identifier not found in active dataset.</div>;
  }

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
                <Badge variant="secondary" className="font-mono text-[10px] font-bold tracking-widest bg-primary/5 text-primary border-primary/10 uppercase">
                    {brand.brand_code || 'UNASSIGNED'}
                </Badge>
                <Badge className={`font-bold text-[10px] uppercase tracking-wider ${brand.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-200' : 'bg-muted text-muted-foreground'}`} variant="outline">
                    {brand.status}
                </Badge>
                <Badge variant="outline" className="font-bold text-[10px] uppercase tracking-wider border-blue-200 text-blue-600 bg-blue-50/50">
                    {brand.origin || 'Global'}
                </Badge>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground uppercase tracking-tight">{brand.name}</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
            <Button 
                onClick={() => router.push(`/${role}/brands/${id}/edit`)}
                className="gap-2 font-bold text-[10px] uppercase tracking-widest px-6 h-11 rounded-xl shadow-lg shadow-primary/20"
            >
                <Pencil className="h-3.5 w-3.5" />
                Modify Entity
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: PRIMARY DATA */}
        <div className="lg:col-span-8 space-y-8">
            {/* 1. Identity & Description */}
            <Card className="border shadow-sm overflow-hidden rounded-2xl">
                <CardHeader className="bg-muted/30 border-b px-8 py-5">
                    <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 opacity-70" /> Brand intelligence
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="group">
                        <label className="text-[10px] font-bold uppercase text-primary tracking-widest mb-3 block opacity-70">Functional Description</label>
                        <p className="text-lg font-medium text-foreground leading-relaxed italic border-l-4 border-primary/20 pl-6 py-2 bg-primary/5 rounded-r-xl">
                            {brand.description || 'No descriptive metadata provided for this brand node.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="bg-muted/20 p-6 rounded-2xl border border-border/50 flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                <Globe className="h-3 w-3 text-blue-500" /> Geographical Origin
                            </div>
                            <div className="space-y-1">
                                <p className="text-xl font-bold text-foreground">{brand.origin || 'Global Standard'}</p>
                                <p className="text-xs text-muted-foreground font-medium">Verified regional manufacturing and distribution base.</p>
                            </div>
                        </div>

                        <div className="bg-muted/20 p-6 rounded-2xl border border-border/50 flex flex-col gap-4">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase text-muted-foreground tracking-widest">
                                <LinkIcon className="h-3 w-3 text-emerald-500" /> Digital Presence
                            </div>
                            <div className="space-y-1">
                                {brand.website ? (
                                    <a href={brand.website} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-primary flex items-center gap-2 hover:underline">
                                        Visit Website <ExternalLink className="h-4 w-4" />
                                    </a>
                                ) : (
                                    <p className="text-xl font-bold text-muted-foreground italic tracking-tight opacity-50">Offline Entity</p>
                                )}
                                <p className="text-xs text-muted-foreground font-medium">Primary digital registry for brand documentation.</p>
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
                                <label className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider mb-0.5">Architect</label>
                                <p className="font-bold text-foreground text-sm">
                                    {brand.createdBy?.firstName} {brand.createdBy?.lastName || 'System'}
                                </p>
                                <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                                    {format(new Date(brand.createdAt), 'MMM dd, yyyy · HH:mm')}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4">
                            <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center border border-sky-100 shadow-sm text-sky-600">
                                <Clock className="h-4 w-4" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold uppercase text-muted-foreground block tracking-wider mb-0.5">Last Record Sync</label>
                                <p className="font-bold text-foreground text-sm italic">Synchronized</p>
                                <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">
                                    {format(new Date(brand.updatedAt), 'MMM dd, yyyy · HH:mm')}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="bg-muted/30 p-6 rounded-2xl border border-border shadow-inner">
                <div className="flex items-start gap-3">
                    <Info className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                        <h4 className="text-foreground font-bold uppercase text-[10px] tracking-widest mb-1">Index Protocol</h4>
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                            Modifications to this brand node will propagate across all linked product variants instantly. Ensure digital registry alignment.
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDetailPage;