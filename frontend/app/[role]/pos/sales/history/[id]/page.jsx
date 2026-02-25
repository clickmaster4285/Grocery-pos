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
    Package,
    FileText,
    Receipt,
    Hash,
    Clock,
    UserCircle2,
    ShieldCheck
} from 'lucide-react';
import BillLifecycle from '@/components/shared-components/pos/sales/BillLifecycle';
import { format } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import ReceiptPrint from '@/components/shared-components/pos/sales/ReceiptPrint';
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

const SaleDetailPage = () => {
    const { id, role } = useParams();
    const router = useRouter();
    const { data: sale, isLoading } = useGetSaleDetail(id);
    const receiptRef = useRef(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Receipt-${sale?.billNumber}`,
    });

    if (isLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-slate-500 font-semibold uppercase tracking-widest text-[10px]">Loading Transaction Data...</p>
        </div>
    );

    if (!sale) return <div className="p-20 text-center text-red-500 font-bold font-mono">CRITICAL ERROR: SALE_RECORD_NOT_FOUND</div>;

    const stats = [
        { label: 'Bill Number', value: sale.billNumber, icon: Hash },
        { label: 'Date', value: format(new Date(sale.createdAt), 'MMM dd, yyyy'), icon: Calendar },
        { label: 'Time', value: format(new Date(sale.createdAt), 'hh:mm a'), icon: Clock },
        { label: 'Cashier', value: `${sale.cashier?.firstName} ${sale.cashier?.lastName}`, icon: UserCircle2 },
    ];

    return (
        <div className="space-y-6 text-slate-600">
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
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => router.push(`/${role}/pos/sales/history`)}
                        className="rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Transaction Overview</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Terminal History</span>
                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-mono font-bold text-primary uppercase">{sale.billNumber}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button 
                        variant="outline" 
                        className="h-11 px-5 rounded-xl font-semibold gap-2 border-slate-200 text-slate-600 bg-white hover:bg-slate-50 transition-all active:scale-95 shadow-sm" 
                        onClick={() => router.push(`/${role}/pos/sales/history/${id}/return`)}
                    >
                        <RotateCcw className="h-4 w-4 text-amber-500" /> Process Return
                    </Button>
                    <Button 
                        className="h-11 px-6 rounded-xl font-semibold gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95" 
                        onClick={handlePrint}
                    >
                        <Printer className="h-4 w-4" /> Print Copy
                    </Button>
                </div>
            </div>

            {/* Quick Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={i} className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardContent className="p-4 flex items-center gap-4">
                            <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-500">
                                <stat.icon className="h-5 w-5" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{stat.label}</span>
                                <span className="text-sm font-semibold text-slate-700 leading-tight">{stat.value}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT: Sale Summary & Customer */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-primary" />
                                    <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Billing Summary</CardTitle>
                                </div>
                                <Badge className={cn(
                                    "px-2 py-0 h-5 text-[9px] font-bold uppercase tracking-widest rounded-lg border-none shadow-none",
                                    sale.status === 'COMPLETED' ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-red-600"
                                )}>
                                    {sale.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Payment Method</span>
                                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                                        <CreditCard className="h-3.5 w-3.5 opacity-40" />
                                        {sale.paymentMethod}
                                    </div>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium">Branch Terminal</span>
                                    <div className="flex items-center gap-2 text-slate-700 font-semibold">
                                        <Store className="h-3.5 w-3.5 opacity-40" />
                                        {sale.branch?.branch_name}
                                    </div>
                                </div>
                            </div>
                            
                            <Separator className="bg-slate-100" />
                            
                            <div className="space-y-3">
                                <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
                                    <span className="text-slate-500">Net Subtotal</span>
                                    <span className="text-slate-600 tabular-nums">{formatCurrency(sale.subtotal || sale.totalAmount)}</span>
                                </div>
                                {sale.totalTax > 0 && (
                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight">
                                        <span className="text-slate-500">VAT / TAX</span>
                                        <span className="text-slate-600 tabular-nums">+{formatCurrency(sale.totalTax)}</span>
                                    </div>
                                )}
                                {sale.globalDiscountAmount > 0 && (
                                    <div className="flex justify-between text-[11px] font-bold uppercase tracking-tight text-emerald-600 bg-emerald-50/50 p-2 rounded-lg border border-emerald-100/50">
                                        <span>Discount ({sale.globalDiscountPercent}%)</span>
                                        <span className="tabular-nums">-{formatCurrency(sale.globalDiscountAmount)}</span>
                                    </div>
                                )}
                            </div>

                            <div className="bg-slate-900 p-5 rounded-2xl shadow-xl shadow-slate-200 relative overflow-hidden group mt-4">
                                <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-white">
                                    <Receipt className="h-24 w-24" />
                                </div>
                                <div className="relative z-10">
                                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-400">Payable Total</span>
                                    <div className="flex items-baseline gap-1 mt-1">
                                        <span className="text-3xl font-semibold text-white tabular-nums tracking-tight leading-none">{formatCurrency(sale.finalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-primary" />
                                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Customer Metadata</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 border border-slate-200 shadow-inner">
                                    <User className="h-6 w-6" />
                                </div>
                                <div className="flex flex-col">
                                    <p className="font-semibold text-slate-800 text-base leading-tight">{sale.customerName || 'Walk-in Customer'}</p>
                                    <p className="text-[11px] text-slate-500 font-medium mt-1 uppercase tracking-wider">{sale.customerPhone || 'Verified Internal Sale'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT: Items & History */}
                <div className="lg:col-span-8 space-y-6">
                    {/* PURCHASES */}
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-primary" />
                                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Purchased Inventory</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50/30 border-b border-slate-100">
                                        <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-500 h-10">
                                            <th className="text-left px-6">Item Detail</th>
                                            <th className="text-center">Qty</th>
                                            <th className="text-center">Price/Unit</th>
                                            <th className="text-right px-6">Net Line Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {sale.items.map((item, idx) => {
                                            const hasDiscount = item.discountPercent > 0;
                                            return (
                                                <tr key={idx} className="group hover:bg-slate-50/50 transition-colors h-16">
                                                    <td className="px-6">
                                                        <div className="flex flex-col gap-0.5">
                                                            <span className="font-semibold text-slate-700">{item.productName}</span>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] font-mono font-medium text-slate-500 uppercase">{item.sku}</span>
                                                                {item.taxRate > 0 && (
                                                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[8px] h-3 px-1 rounded shadow-none border-none font-bold uppercase">Tax: {item.taxRate}%</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-lg text-xs tabular-nums">{item.quantity}</span>
                                                    </td>
                                                    <td className="text-center">
                                                        <div className="flex flex-col items-center">
                                                            {hasDiscount && (
                                                                <span className="text-[10px] text-slate-500 line-through font-bold tabular-nums">
                                                                    {formatCurrency(item.originalUnitPrice)}
                                                                </span>
                                                            )}
                                                            <span className="font-semibold text-slate-600 tabular-nums">
                                                                {formatCurrency(item.unitPrice)}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-bold text-slate-800 tabular-nums">{formatCurrency(item.subtotal)}</span>
                                                            <div className="flex items-center gap-2">
                                                                {hasDiscount && (
                                                                    <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">-{item.discountPercent}%</span>
                                                                )}
                                                                {item.taxAmount > 0 && (
                                                                    <span className="text-[9px] text-slate-500 font-bold tabular-nums">+{formatCurrency(item.taxAmount)} tax</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* LIFECYCLE */}
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-900 border-b-0 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <HistoryIcon className="h-4 w-4 text-primary" />
                                <CardTitle className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Bill Lifecycle & Audit History</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 bg-slate-50/30">
                            <div className="flex items-center gap-2 mb-6 p-3 bg-white rounded-xl border border-slate-100 shadow-sm shadow-slate-100">
                                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Verified Electronic Journal Audit Trail</p>
                            </div>
                            <BillLifecycle saleId={id} />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default SaleDetailPage;
