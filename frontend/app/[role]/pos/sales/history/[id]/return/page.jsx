"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetSaleDetail } from '@/features/sale.api';
import { useSaleReturnHook } from '@/hooks/useSaleReturnHook';
import { useGetBranchStock } from '@/features/stockTransfer.api'; // Reuse branch stock search
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    ChevronLeft,
    RotateCcw,
    ArrowRightLeft,
    Search,
    Plus,
    Trash2,
    AlertCircle,
    XCircle,
    Printer,
    Receipt,
    History,
    CheckCircle2,
    Info,
    Undo2,
    PackageSearch,
    ShoppingCart
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import ReturnReceiptPrint from '@/components/shared-components/pos/sales/ReturnReceiptPrint';
import SearchDropdown from '@/components/shared-components/pos/sales/components/SearchDropdown';
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

const ProcessReturnPage = () => {
    const { id, role } = useParams();
    const router = useRouter();

    const { getSaleHistoryQuery, processReturnMutation } = useSaleReturnHook(id);
    const { data: historyData, isLoading: isSaleLoading } = getSaleHistoryQuery;

    const sale = historyData?.originalSale;

    const [type, setType] = useState('RETURN');
    const [returnedItems, setReturnedItems] = useState([]);
    
    // Exchange Search States
    const [exchangeSearch, setExchangeSearch] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const debouncedExchangeSearch = useDebounce(exchangeSearch, 300);
    const [exchangedItems, setExchangedItems] = useState([]);

    const exchangeInputRef = useRef(null);
    const anchorRef = useRef(null); // Anchor for the dropdown width

    // Fetch Branch Stock for Exchange
    const { data: stock, isLoading: stockLoading } = useGetBranchStock(sale?.branch?._id || sale?.branch, debouncedExchangeSearch);

    // Printing States
    const receiptRef = useRef(null);
    const [printAfterSync, setPrintAfterSync] = useState(false);
    const [newReturnData, setNewReturnData] = useState(null);

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `ReturnReceipt-${newReturnData?.returnNumber}`,
        onAfterPrint: () => router.push(`/${role}/pos/sales/history/${id}`)
    });

    useEffect(() => {
        if (newReturnData && printAfterSync) {
            handlePrint();
        }
    }, [newReturnData, printAfterSync]);

    // Return Selection Logic
    const toggleReturnItem = (item) => {
        if (item.remainingQty <= 0) return;

        const exists = returnedItems.find(i => i.variantId === item.variantId);
        if (exists) {
            setReturnedItems(returnedItems.filter(i => i.variantId !== item.variantId));
        } else {
            setReturnedItems([...returnedItems, {
                product: item.product,
                variantId: item.variantId,
                productName: item.productName,
                sku: item.sku,
                quantity: 1,
                maxQuantity: item.remainingQty,
                unitPrice: item.unitPrice,
                condition: 'GOOD',
                reason: ''
            }]);
        }
    };

    const updateReturnQty = (variantId, qty) => {
        setReturnedItems(items => items.map(i =>
            i.variantId === variantId ? { ...i, quantity: Math.min(i.maxQuantity, Math.max(1, qty)) } : i
        ));
    };

    // Exchange Logic - Reusing POS Dropdown logic
    const addExchangeItemFromSearch = (stockItem) => {
        const variant = stockItem.product.variants.find(v => v._id === stockItem.variantId);
        const latestPrice = variant.priceHistory[variant.priceHistory.length - 1].sellingPrice;
        const autoDiscountPercent = stockItem.autoDiscountPercent || 0;
        const taxRate = stockItem.product.taxRate || 0;

        const discountAmount = (latestPrice * autoDiscountPercent) / 100;
        const unitPrice = latestPrice - discountAmount;
        const subtotal = unitPrice * 1; // initial qty is 1
        const taxAmount = (subtotal * taxRate) / 100;
        
        setExchangedItems([...exchangedItems, {
            product: stockItem.product._id,
            variantId: stockItem.variantId,
            productName: stockItem.product.productName,
            sku: variant.sku,
            quantity: 1,
            originalUnitPrice: latestPrice,
            discountPercent: autoDiscountPercent,
            unitPrice: unitPrice,
            taxRate: taxRate,
            taxAmount: taxAmount,
            subtotal: subtotal
        }]);
        setExchangeSearch('');
        setIsSearchFocused(false);
    };

    // Financials
    // 1. Calculate Credit from Returns (Original Price Paid + Original Tax)
    const refundTotal = useMemo(() => {
        return returnedItems.reduce((acc, curr) => {
            const originalItem = sale?.items.find(i => i.variantId === curr.variantId);
            const taxRate = originalItem?.taxRate || 0;
            const itemTotal = curr.unitPrice * curr.quantity;
            const taxTotal = (itemTotal * taxRate) / 100;
            return acc + (itemTotal + taxTotal);
        }, 0);
    }, [returnedItems, sale]);

    // 2. Calculate Debt from Exchanges (New Unit Price + New Tax)
    const exchangeTotal = useMemo(() => {
        return exchangedItems.reduce((acc, curr) => {
            return acc + (curr.subtotal + (curr.taxAmount || 0));
        }, 0);
    }, [exchangedItems]);

    const difference = exchangeTotal - refundTotal;

    const handleSubmit = (shouldPrint = false) => {
        if (returnedItems.length === 0) return;
        setPrintAfterSync(shouldPrint);

        processReturnMutation.mutate({
            saleId: id,
            type,
            returnedItems: returnedItems.map(({ maxQuantity, ...rest }) => rest),
            exchangedItems: type === 'EXCHANGE' ? exchangedItems : []
        }, {
            onSuccess: (res) => {
                if (shouldPrint) {
                    setNewReturnData(res.data);
                } else {
                    router.push(`/${role}/pos/sales/history/${id}`);
                }
            }
        });
    };

    if (isSaleLoading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Verifying Eligibility...</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-400 mx-auto text-slate-600 pb-10">
            {/* Hidden Receipt Component */}
            <div style={{ display: 'none' }}>
                <ReturnReceiptPrint
                    ref={receiptRef}
                    returnData={newReturnData}
                    originalSale={sale}
                    branch={sale?.branch}
                />
            </div>

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => router.back()} 
                        className="rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">Return Workspace</h1>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Inventory Reversal</span>
                            <div className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-mono font-bold text-primary uppercase">BILL #{sale?.billNumber}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-slate-100/80 p-1 rounded-xl flex items-center gap-1 border border-slate-200/50">
                    <button
                        onClick={() => setType('RETURN')}
                        className={cn(
                            "px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                            type === 'RETURN' ? "bg-white text-primary shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >Standard Return</button>
                    <button
                        onClick={() => setType('EXCHANGE')}
                        className={cn(
                            "px-6 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                            type === 'EXCHANGE' ? "bg-white text-amber-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                        )}
                    >Item Exchange</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 1. ELIGIBLE ITEMS (Left) */}
                <div className="lg:col-span-4 space-y-4">
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <History className="h-4 w-4 text-primary" />
                                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-500">1. Original Invoice Items</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2 max-h-150 overflow-y-auto scrollbar-thin">
                            {sale?.items.map((item) => {
                                const isSelected = returnedItems.some(i => i.variantId === item.variantId);
                                const isFullyReturned = item.remainingQty <= 0;

                                return (
                                    <motion.div
                                        whileTap={!isFullyReturned ? { scale: 0.98 } : {}}
                                        key={item.variantId}
                                        onClick={() => !isFullyReturned && toggleReturnItem(item)}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all cursor-pointer group relative overflow-hidden",
                                            isFullyReturned ? "opacity-50 grayscale cursor-not-allowed bg-slate-50 border-dashed" :
                                            isSelected ? "border-primary bg-primary/2 ring-2 ring-primary/10 shadow-sm" :
                                            "border-slate-100 bg-white hover:border-slate-300"
                                        )}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 pr-4">
                                                <p className={cn("font-semibold text-sm leading-tight", isSelected ? "text-primary" : "text-slate-700")}>{item.productName}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-mono font-medium text-slate-400 uppercase">{item.sku}</span>
                                                    {isFullyReturned && <Badge variant="destructive" className="h-4 px-1.5 text-[8px] font-bold rounded shadow-none border-none">CLOSED</Badge>}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1.5">
                                                <div className={cn(
                                                    "text-[10px] font-bold px-2 py-0.5 rounded-lg border",
                                                    isSelected ? "bg-primary text-white border-primary" : "bg-slate-50 text-slate-500 border-slate-100"
                                                )}>
                                                    REM: {item.remainingQty}
                                                </div>
                                                <span className="text-xs font-semibold text-slate-400 tabular-nums">{formatCurrency(item.unitPrice)}</span>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-primary" />
                                        )}
                                    </motion.div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* 2. MIDDLE COLUMN */}
                <div className="lg:col-span-5 space-y-6" ref={anchorRef}>
                    {/* EXCHANGE ENGINE */}
                    {type === 'EXCHANGE' && (
                        <Card className="border-none shadow-xl bg-white rounded-2xl overflow-visible ring-4 ring-amber-50">
                            <CardHeader className="bg-amber-50/50 border-b border-amber-100 py-4 px-6">
                                <div className="flex items-center gap-2">
                                    <PackageSearch className="h-4 w-4 text-amber-600" />
                                    <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-amber-700">Exchange Inventory Search</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-5 overflow-visible">
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
                                    <Input
                                        ref={exchangeInputRef}
                                        placeholder="Find replacement products..."
                                        className="pl-11 h-12 font-semibold rounded-xl border-slate-200 bg-slate-50/50 focus-visible:ring-amber-500/20"
                                        value={exchangeSearch}
                                        onFocus={() => setIsSearchFocused(true)}
                                        onChange={(e) => setExchangeSearch(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-2">
                                    {exchangedItems.map((item, idx) => {
                                        const hasDiscount = item.discountPercent > 0;
                                        return (
                                            <div key={idx} className="flex justify-between items-center bg-amber-50/30 p-4 rounded-2xl border border-amber-100 transition-all hover:border-amber-300">
                                                <div className="flex gap-4 items-center">
                                                    <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-amber-200">
                                                        {item.quantity}x
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-xs text-slate-700 uppercase tracking-tight">{item.productName}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[9px] font-mono text-amber-600 font-bold opacity-70 uppercase">{item.sku}</span>
                                                            {item.taxRate > 0 && (
                                                                <span className="text-[8px] bg-amber-100 text-amber-700 px-1 rounded font-black uppercase">Tax: {item.taxRate}%</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-5">
                                                    <div className="text-right flex flex-col">
                                                        {hasDiscount && (
                                                            <span className="text-[9px] text-slate-400 line-through font-bold tabular-nums">
                                                                {formatCurrency(item.originalUnitPrice)}
                                                            </span>
                                                        )}
                                                        <span className="font-bold text-sm text-slate-800 tabular-nums">{formatCurrency(item.subtotal)}</span>
                                                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                                                            {hasDiscount && (
                                                                <span className="text-[8px] font-black text-emerald-600 uppercase">-{item.discountPercent}%</span>
                                                            )}
                                                            {item.taxAmount > 0 && (
                                                                <span className="text-[8px] text-slate-400 font-bold tabular-nums">+{formatCurrency(item.taxAmount)} tax</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button onClick={() => setExchangedItems(ex => ex.filter((_, i) => i !== idx))} className="h-8 w-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* RETURN CONFIGURATION */}
                    <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden min-h-100">
                        <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="h-4 w-4 text-primary" />
                                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Return Parameters</CardTitle>
                            </div>
                            <Badge className="font-bold bg-slate-400 rounded-lg h-5 text-[9px] uppercase tracking-widest">{returnedItems.length} Selection</Badge>
                        </CardHeader>
                        <CardContent className="p-6">
                            {returnedItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-75 text-slate-300 gap-4 opacity-50">
                                    <Undo2 className="h-16 w-16 stroke-[1.5px]" />
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-center max-w-50">Select items to configure return conditions</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <AnimatePresence mode="popLayout">
                                        {returnedItems.map((item) => (
                                            <motion.div 
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 10 }}
                                                key={item.variantId} 
                                                className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-5"
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                        </div>
                                                        <p className="font-semibold text-sm text-slate-800">{item.productName}</p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Label className="text-[10px] font-bold uppercase text-slate-400">Quantity</Label>
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                className="w-16 h-9 text-center font-bold rounded-xl border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                                value={item.quantity}
                                                                onChange={(e) => updateReturnQty(item.variantId, parseInt(e.target.value))}
                                                            />
                                                            <span className="text-[10px] font-bold text-slate-300">/ {item.maxQuantity}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Condition</Label>
                                                        <Select value={item.condition} onValueChange={(val) => setReturnedItems(items => items.map(i => i.variantId === item.variantId ? { ...i, condition: val } : i))}>
                                                            <SelectTrigger className="h-10 font-semibold text-xs rounded-xl border-slate-200 bg-white">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="rounded-xl">
                                                                <SelectItem value="GOOD" className="text-xs">Resellable (Good)</SelectItem>
                                                                <SelectItem value="DAMAGED" className="text-xs">Damaged / Waste</SelectItem>
                                                                <SelectItem value="EXPIRED" className="text-xs">Expired</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Reason</Label>
                                                        <Input
                                                            placeholder="Why is it being returned?"
                                                            className="h-10 text-xs font-medium rounded-xl border-slate-200 bg-white"
                                                            value={item.reason}
                                                            onChange={(e) => setReturnedItems(items => items.map(i => i.variantId === item.variantId ? { ...i, reason: e.target.value } : i))}
                                                        />
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* 3. SETTLEMENT SUMMARY (Right) */}
                <div className="lg:col-span-3 space-y-6 sticky top-6">
                    <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-2xl overflow-hidden">
                        <CardHeader className="bg-white/5 border-b border-white/10 py-4 px-6">
                            <div className="flex items-center gap-2">
                                <Receipt className="h-4 w-4 text-primary" />
                                <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-white/70">Settlement Ledger</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-white/40 font-bold uppercase tracking-widest">Return Credit</span>
                                    <span className="text-rose-400 font-bold tabular-nums">-{formatCurrency(refundTotal)}</span>
                                </div>
                                {type === 'EXCHANGE' && (
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="text-white/40 font-bold uppercase tracking-widest">Exchange Debt</span>
                                        <span className="text-amber-400 font-bold tabular-nums">+{formatCurrency(exchangeTotal)}</span>
                                    </div>
                                )}
                            </div>

                            <Separator className="bg-white/10" />

                            <div className="space-y-2">
                                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-primary/60">
                                    {type === 'RETURN' ? 'Total Customer Refund' : 'Final Balance Adjustment'}
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-bold text-white tabular-nums tracking-tighter">
                                        {formatCurrency(type === 'RETURN' ? refundTotal : Math.abs(difference))}
                                    </span>
                                    {type === 'EXCHANGE' && (
                                        <Badge className={cn(
                                            "h-5 px-2 text-[8px] font-black uppercase border-none",
                                            difference > 0 ? "bg-amber-500/20 text-amber-400" : "bg-emerald-500/20 text-emerald-400"
                                        )}>
                                            {difference > 0 ? 'PAYABLE' : 'REFUNDABLE'}
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3 pt-4">
                                <Button
                                    className="w-full h-14 font-bold text-xs uppercase tracking-[0.2em] gap-3 shadow-xl shadow-primary/20 rounded-xl transition-all active:scale-95"
                                    disabled={returnedItems.length === 0 || processReturnMutation.isPending}
                                    onClick={() => handleSubmit(true)}
                                >
                                    {processReturnMutation.isPending ? 'Syncing Journal...' : `Authorize & Print`}
                                    <Printer className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full h-11 font-bold uppercase text-[9px] tracking-widest gap-2 bg-transparent border-white/10 text-white/40 hover:bg-white/5 hover:text-white rounded-xl transition-all"
                                    disabled={returnedItems.length === 0 || processReturnMutation.isPending}
                                    onClick={() => handleSubmit(false)}
                                >
                                    Commit Without Slip
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-200 flex gap-4">
                        <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Inventory Notice</p>
                            <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                                Confirming this return will immediately restore items to branch backroom and adjust financial records for Bill #{sale?.billNumber}.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reused Search Dropdown - anchored to the middle column */}
            <SearchDropdown 
                stock={stock}
                stockLoading={stockLoading}
                searchQuery={exchangeSearch}
                isSearchFocused={isSearchFocused && type === 'EXCHANGE'}
                addToCart={addExchangeItemFromSearch}
                searchInputRef={exchangeInputRef}
                anchorRef={anchorRef}
                setIsSearchFocused={setIsSearchFocused}
            />
        </div>
    );
};

export default ProcessReturnPage;
