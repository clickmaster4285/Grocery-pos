"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useGetSaleDetail } from '@/features/sale.api';
import { useSaleReturnHook } from '@/hooks/useSaleReturnHook';
import { useGetAllProducts } from '@/features/product.api';
import { useDebounce } from '@/hooks/useDebounce';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    ChevronLeft, 
    RotateCcw, 
    ArrowRightLeft, 
    Search, 
    Plus, 
    Trash2, 
    Package,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Printer
} from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import ReturnReceiptPrint from '@/components/shared-components/sales/ReturnReceiptPrint';

const ProcessReturnPage = () => {
    const { id, role } = useParams();
    const router = useRouter();
    
    const { getSaleHistoryQuery, processReturnMutation } = useSaleReturnHook(id);
    const { data: historyData, isLoading: isSaleLoading } = getSaleHistoryQuery;
    
    const sale = historyData?.originalSale;
    
    const [type, setType] = useState('RETURN');
    const [returnedItems, setReturnedItems] = useState([]);
    const [exchangeSearch, setExchangeSearch] = useState('');
    const debouncedExchangeSearch = useDebounce(exchangeSearch, 300);
    const [exchangedItems, setExchangedItems] = useState([]);

    // Printing States
    const receiptRef = useRef(null);
    const [printAfterSync, setPrintAfterSync] = useState(false);
    const [newReturnData, setNewReturnData] = useState(null);

    const { data: productsData } = useGetAllProducts({ search: debouncedExchangeSearch, limit: 5 });

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `ReturnReceipt-${newReturnData?.returnNumber}`,
        onAfterPrint: () => router.push(`/${role}/sales/history/${id}`)
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

    // Exchange Logic
    const addExchangeItem = (product, variant) => {
        const latestPrice = variant.priceHistory[variant.priceHistory.length - 1].sellingPrice;
        setExchangedItems([...exchangedItems, {
            product: product._id,
            variantId: variant._id,
            productName: product.productName,
            sku: variant.sku,
            quantity: 1,
            unitPrice: latestPrice,
            subtotal: latestPrice
        }]);
        setExchangeSearch('');
    };

    // Financials
    const refundTotal = returnedItems.reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);
    const exchangeTotal = exchangedItems.reduce((acc, curr) => acc + curr.subtotal, 0);
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
                    router.push(`/${role}/sales/history/${id}`);
                }
            }
        });
    };

    if (isSaleLoading) return <div className="p-20 text-center animate-pulse font-black text-primary text-2xl uppercase italic">Calculating Return Eligibility...</div>;

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase italic text-primary flex items-center gap-2">
                            {type === 'RETURN' ? <RotateCcw className="h-6 w-6" /> : <ArrowRightLeft className="h-6 w-6" />}
                            Return Management
                        </h1>
                        <p className="text-muted-foreground font-medium">Processing return for bill <span className="text-primary font-mono font-bold">{sale?.billNumber}</span></p>
                    </div>
                </div>
                <div className="flex bg-muted p-1 rounded-xl border-2">
                    <Button 
                        variant={type === 'RETURN' ? 'default' : 'ghost'} 
                        className="font-bold px-6"
                        onClick={() => setType('RETURN')}
                    >Standard Return</Button>
                    <Button 
                        variant={type === 'EXCHANGE' ? 'default' : 'ghost'} 
                        className="font-bold px-6"
                        onClick={() => setType('EXCHANGE')}
                    >Item Exchange</Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* 1. SELECT ITEMS (Left) */}
                <div className="lg:col-span-4 space-y-4">
                    <Card className="shadow-sm border-2">
                        <CardHeader className="border-b bg-muted/30">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">1. Eligible Items</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {sale?.items.map((item) => {
                                const isSelected = returnedItems.some(i => i.variantId === item.variantId);
                                const isFullyReturned = item.remainingQty <= 0;

                                return (
                                    <div 
                                        key={item.variantId} 
                                        onClick={() => !isFullyReturned && toggleReturnItem(item)}
                                        className={`p-4 rounded-xl border-2 transition-all cursor-pointer group relative overflow-hidden ${
                                            isFullyReturned 
                                            ? 'opacity-50 grayscale cursor-not-allowed border-dashed bg-muted/10' 
                                            : isSelected 
                                                ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                                                : 'border-muted bg-background hover:border-primary/30'
                                        }`}
                                    >
                                        {isFullyReturned && (
                                            <div className="absolute inset-0 bg-muted/20 flex items-center justify-center z-10">
                                                <Badge variant="destructive" className="font-black gap-1 uppercase text-[8px]">
                                                    <XCircle className="h-3 w-3" /> Fully Returned
                                                </Badge>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className={`font-black text-sm ${isSelected ? 'text-primary' : ''}`}>{item.productName}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground uppercase">{item.sku}</p>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <Badge variant={isSelected ? 'default' : 'outline'} className="font-black">
                                                    Rem: {item.remainingQty} / {item.quantity}
                                                </Badge>
                                                <p className="text-xs font-bold text-muted-foreground">${item.unitPrice}</p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                </div>

                {/* 2. RETURN DETAILS (Middle) */}
                <div className="lg:col-span-5 space-y-4">
                    <Card className="shadow-sm border-2 min-h-100">
                        <CardHeader className="border-b bg-muted/30 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">2. Return Configuration</CardTitle>
                            <Badge className="font-black bg-primary">{returnedItems.length} Items</Badge>
                        </CardHeader>
                        <CardContent className="p-6">
                            {returnedItems.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-75 text-muted-foreground opacity-30 gap-4">
                                    <RotateCcw className="h-16 w-16" />
                                    <p className="font-black uppercase tracking-tighter">Select items from the left to start</p>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {returnedItems.map((item) => (
                                        <div key={item.variantId} className="bg-muted/40 p-4 rounded-xl border border-muted space-y-4 animate-in fade-in slide-in-from-left-2">
                                            <div className="flex justify-between items-center">
                                                <p className="font-black text-sm text-primary">{item.productName}</p>
                                                <div className="flex items-center gap-3">
                                                    <Label className="text-[10px] font-black uppercase">Qty:</Label>
                                                    <div className="flex items-center gap-1">
                                                        <Input 
                                                            type="number" 
                                                            className="w-16 h-9 text-center font-black"
                                                            value={item.quantity}
                                                            onChange={(e) => updateReturnQty(item.variantId, parseInt(e.target.value))}
                                                        />
                                                        <span className="text-[10px] font-bold text-muted-foreground">/ {item.maxQuantity}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Item Condition</Label>
                                                    <Select value={item.condition} onValueChange={(val) => setReturnedItems(items => items.map(i => i.variantId === item.variantId ? { ...i, condition: val } : i))}>
                                                        <SelectTrigger className="h-10 font-bold uppercase text-xs">
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="GOOD">Resellable (Good)</SelectItem>
                                                            <SelectItem value="DAMAGED">Damaged / Waste</SelectItem>
                                                            <SelectItem value="EXPIRED">Expired</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest opacity-60">Return Reason</Label>
                                                    <Input 
                                                        placeholder="Reason..." 
                                                        className="h-10 text-xs font-medium"
                                                        value={item.reason}
                                                        onChange={(e) => setReturnedItems(items => items.map(i => i.variantId === item.variantId ? { ...i, reason: e.target.value } : i))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* EXCHANGE SEARCH */}
                    {type === 'EXCHANGE' && (
                        <Card className="shadow-lg border-2 border-amber-500/30">
                            <CardHeader className="border-b bg-amber-500/10">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-amber-700">3. Select Exchange Items</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search for new items..." 
                                        className="pl-10 h-11 font-bold"
                                        value={exchangeSearch}
                                        onChange={(e) => setExchangeSearch(e.target.value)}
                                    />
                                    {exchangeSearch && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-background border-2 rounded-xl shadow-2xl z-50 overflow-hidden">
                                            {productsData?.data.map(p => (
                                                <div key={p._id} className="p-2 border-b last:border-0 bg-muted/20">
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground px-3 py-1">{p.productName}</p>
                                                    {p.variants.map(v => (
                                                        <div 
                                                            key={v._id} 
                                                            className="flex justify-between items-center p-3 hover:bg-primary/5 cursor-pointer rounded-lg m-1 transition-colors"
                                                            onClick={() => addExchangeItem(p, v)}
                                                        >
                                                            <div className="text-xs font-bold flex flex-col">
                                                                <span className="font-mono">{v.sku}</span>
                                                                <span className="text-[10px] text-muted-foreground">Stock: {v.stock}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-black text-primary">${v.priceHistory[v.priceHistory.length-1].sellingPrice}</span>
                                                                <Plus className="h-4 w-4" />
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {exchangedItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-amber-50/50 p-3 rounded-xl border border-amber-200 animate-in zoom-in-95">
                                            <div className="flex gap-3 items-center">
                                                <div className="bg-amber-500 text-white font-black h-8 w-8 flex items-center justify-center rounded-md text-xs">
                                                    {item.quantity}x
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xs">{item.productName}</p>
                                                    <p className="text-[10px] font-mono opacity-50 uppercase">{item.sku}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <p className="font-black text-sm text-amber-700">${item.subtotal.toFixed(2)}</p>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => setExchangedItems(ex => ex.filter((_, i) => i !== idx))}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* 3. FINAL SUMMARY (Right) */}
                <div className="lg:col-span-3 space-y-6 sticky top-6">
                    <Card className="shadow-2xl border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-lg font-black uppercase tracking-tighter text-primary">Settlement Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <div className="flex justify-between items-center text-sm font-bold">
                                    <span className="text-muted-foreground">Return Value</span>
                                    <span className="text-red-600">-${refundTotal.toFixed(2)}</span>
                                </div>
                                {type === 'EXCHANGE' && (
                                    <div className="flex justify-between items-center text-sm font-bold">
                                        <span className="text-muted-foreground">Exchange Value</span>
                                        <span className="text-amber-600">+${exchangeTotal.toFixed(2)}</span>
                                    </div>
                                )}
                            </div>
                            
                            <Separator className="bg-primary/20" />

                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest text-primary">
                                    {type === 'RETURN' ? 'Total Refund to Customer' : 'Final Balance Adjustment'}
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black text-primary">
                                        ${type === 'RETURN' ? refundTotal.toFixed(2) : Math.abs(difference).toFixed(2)}
                                    </span>
                                    {type === 'EXCHANGE' && (
                                        <span className={`text-sm font-black uppercase ${difference > 0 ? 'text-amber-600' : 'text-green-600'}`}>
                                            {difference > 0 ? 'Payable' : 'Refundable'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-4">
                                <Button 
                                    className="w-full h-14 font-black text-lg uppercase tracking-tighter gap-3 shadow-lg shadow-primary/20"
                                    disabled={returnedItems.length === 0 || processReturnMutation.isPending}
                                    onClick={() => handleSubmit(true)}
                                >
                                    {processReturnMutation.isPending ? 'Syncing...' : `Confirm & Print`}
                                    <Printer className="h-5 w-5" />
                                </Button>
                                <Button 
                                    variant="outline"
                                    className="w-full h-10 font-bold uppercase text-xs gap-2"
                                    disabled={returnedItems.length === 0 || processReturnMutation.isPending}
                                    onClick={() => handleSubmit(false)}
                                >
                                    Confirm Without Printing
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-muted/50 p-4 rounded-xl border border-dashed border-muted-foreground/30">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase tracking-widest">Audit Note</p>
                                <p className="text-[10px] text-muted-foreground leading-relaxed font-medium">
                                    This transaction will be logged as a separate activity linked to Bill #{sale?.billNumber}. Stock updates will occur immediately upon confirmation.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProcessReturnPage;
