"use client";

import React, { useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetSaleDetail } from '@/features/sale.api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
    ChevronLeft,
    Printer,
    RotateCcw,
    History as HistoryIcon,
    User,
    Store,
    Calendar,
    CreditCard,
    ArrowRightLeft,
    Package,
    FileText
} from 'lucide-react';
import BillLifecycle from '@/components/shared-components/pos/sales/BillLifecycle';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import ReceiptPrint from '@/components/shared-components/pos/sales/ReceiptPrint';

const SaleDetailPage = () => {
    const { id, role } = useParams();
    const router = useRouter();
    const { data: sale, isLoading } = useGetSaleDetail(id);
    const receiptRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Receipt-${sale?.billNumber}`,
    });

    if (isLoading) return <div className="p-20 text-center animate-pulse font-black text-primary text-2xl uppercase tracking-widest">Loading Bill Data...</div>;
    if (!sale) return <div className="p-20 text-center text-red-500 font-bold">Sale record not found.</div>;

    return (
        <div className="space-y-6">
            {/* Hidden Receipt Component */}
            <div style={{ display: 'none' }}>
                <ReceiptPrint
                    ref={receiptRef}
                    sale={sale}
                    branch={sale?.branch}
                />
            </div>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.push(`/${role}/sales/history`)}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic text-primary">Bill Details</h1>
                        <p className="text-muted-foreground font-mono text-xs">{sale.billNumber}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="font-bold gap-2" onClick={() => router.push(`/${role}/sales/history/${id}/return`)}>
                        <RotateCcw className="h-4 w-4" /> Process Return
                    </Button>
                    <Button className="font-black gap-2 shadow-lg shadow-primary/20" onClick={handlePrint}>
                        <Printer className="h-4 w-4" /> Print Copy
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Sale Overview */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="shadow-sm border-2 border-primary/10">
                        <CardHeader className="bg-muted/50 pb-4">
                            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-muted-foreground">
                                <FileText className="h-4 w-4" /> Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-muted-foreground uppercase">Status</span>
                                <Badge className="bg-green-500 font-black">{sale.status}</Badge>
                            </div>
                            <Separator />
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Calendar className="h-4 w-4" />
                                        <span>Date</span>
                                    </div>
                                    <span className="font-bold">{format(new Date(sale.createdAt), 'PPP p')}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Store className="h-4 w-4" />
                                        <span>Branch</span>
                                    </div>
                                    <span className="font-bold">{sale.branch?.branch_name}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <User className="h-4 w-4" />
                                        <span>Cashier</span>
                                    </div>
                                    <span className="font-bold">{sale.cashier?.firstName} {sale.cashier?.lastName}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <CreditCard className="h-4 w-4" />
                                        <span>Payment</span>
                                    </div>
                                    <Badge variant="secondary" className="font-black">{sale.paymentMethod}</Badge>
                                </div>
                            </div>
                            <Separator />
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/10">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-xs font-bold uppercase text-primary">Final Amount</span>
                                    <span className="text-2xl font-black text-primary">${sale.finalAmount.toFixed(2)}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground text-right italic">Includes tax & discounts</p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-2">
                        <CardHeader>
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <User className="h-4 w-4" /> Customer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-1">
                            <p className="font-black text-lg">{sale.customerName || 'Anonymous Customer'}</p>
                            <p className="text-sm text-muted-foreground font-medium">{sale.customerPhone || 'No contact provided'}</p>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT: Items & History */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="shadow-sm overflow-hidden border-2">
                        <CardHeader className="bg-primary text-primary-foreground border-b-0">
                            <CardTitle className="text-lg font-black uppercase tracking-tighter flex items-center gap-2">
                                <HistoryIcon className="h-5 w-5" /> Bill lifecycle & History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <BillLifecycle saleId={id} />
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm border-2">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                <Package className="h-4 w-4" /> Purchased Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {sale.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg border border-muted group hover:border-primary/30 transition-colors">
                                        <div className="flex gap-4 items-center">
                                            <div className="h-10 w-10 bg-background rounded-md flex items-center justify-center font-black text-primary border shadow-sm">
                                                {item.quantity}
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm">{item.productName}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground uppercase">{item.sku}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-sm">${item.subtotal.toFixed(2)}</p>
                                            <p className="text-[10px] text-muted-foreground font-bold italic">${item.unitPrice} / unit</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SaleDetailPage;
