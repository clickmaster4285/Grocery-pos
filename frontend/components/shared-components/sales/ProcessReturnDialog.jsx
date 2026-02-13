import React, { useState, useMemo } from 'react';
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    RotateCcw, 
    ArrowRightLeft, 
    Trash2, 
    Plus, 
    Search,
    AlertCircle,
    Package
} from 'lucide-react';
import { useSaleReturnHook } from '@/hooks/useSaleReturnHook';
import { useGetAllProducts } from '@/features/product.api';
import { useDebounce } from '@/hooks/useDebounce';

const ProcessReturnDialog = ({ open, onOpenChange, sale }) => {
    const [type, setType] = useState('RETURN'); // 'RETURN' or 'EXCHANGE'
    const [returnedItems, setReturnedItems] = useState([]);
    const [exchangeSearch, setExchangeSearch] = useState('');
    const debouncedExchangeSearch = useDebounce(exchangeSearch, 300);
    const [exchangedItems, setExchangedItems] = useState([]);

    const { processReturnMutation } = useSaleReturnHook();
    const { data: productsData } = useGetAllProducts({ search: debouncedExchangeSearch, limit: 5 });

    // 1. Logic to add/remove return items
    const toggleReturnItem = (item) => {
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
                maxQuantity: item.quantity,
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

    const updateReturnCondition = (variantId, condition) => {
        setReturnedItems(items => items.map(i => 
            i.variantId === variantId ? { ...i, condition } : i
        ));
    };

    // 2. Exchange Logic
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

    const removeExchangeItem = (index) => {
        setExchangedItems(items => items.filter((_, i) => i !== index));
    };

    // 3. Financial Calculations
    const refundTotal = returnedItems.reduce((acc, curr) => acc + (curr.unitPrice * curr.quantity), 0);
    const exchangeTotal = exchangedItems.reduce((acc, curr) => acc + curr.subtotal, 0);
    const difference = exchangeTotal - refundTotal;

    const handleSubmit = () => {
        if (returnedItems.length === 0) return;

        processReturnMutation.mutate({
            saleId: sale._id,
            type,
            returnedItems: returnedItems.map(({ maxQuantity, ...rest }) => rest),
            exchangedItems: type === 'EXCHANGE' ? exchangedItems : []
        }, {
            onSuccess: () => onOpenChange(false)
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <DialogTitle className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-2">
                                {type === 'RETURN' ? <RotateCcw className="h-6 w-6 text-red-600" /> : <ArrowRightLeft className="h-6 w-6 text-amber-600" />}
                                Process {type === 'RETURN' ? 'Return' : 'Exchange'}
                            </DialogTitle>
                            <DialogDescription className="font-medium">
                                Handling Bill: <span className="text-primary font-mono font-bold">{sale?.billNumber}</span>
                            </DialogDescription>
                        </div>
                        <div className="flex bg-muted p-1 rounded-lg">
                            <Button 
                                variant={type === 'RETURN' ? 'default' : 'ghost'} 
                                size="sm" 
                                className="h-8 font-bold"
                                onClick={() => setType('RETURN')}
                            >Return Only</Button>
                            <Button 
                                variant={type === 'EXCHANGE' ? 'default' : 'ghost'} 
                                size="sm" 
                                className="h-8 font-bold"
                                onClick={() => setType('EXCHANGE')}
                            >Exchange</Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-6 py-4 grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* LEFT SIDE: SELECT ITEMS TO RETURN */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">1. Select Items to Return</h3>
                            <Badge variant="secondary" className="font-bold">{returnedItems.length} selected</Badge>
                        </div>
                        
                        <div className="space-y-2">
                            {sale?.items.map((item) => {
                                const isSelected = returnedItems.some(i => i.variantId === item.variantId);
                                return (
                                    <div 
                                        key={item.variantId} 
                                        onClick={() => toggleReturnItem(item)}
                                        className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${
                                            isSelected 
                                            ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' 
                                            : 'border-muted bg-background hover:border-primary/30'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-black text-sm">{item.productName}</p>
                                                <p className="text-[10px] font-mono text-muted-foreground uppercase">{item.sku}</p>
                                            </div>
                                            <Badge className="font-black">Qty: {item.quantity}</Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {returnedItems.length > 0 && (
                            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2">
                                <Separator />
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Return Details</h3>
                                {returnedItems.map((item) => (
                                    <div key={item.variantId} className="bg-muted/40 p-3 rounded-lg border border-muted space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-xs">{item.productName}</p>
                                            <div className="flex items-center gap-2">
                                                <Label className="text-[10px] font-bold">Qty:</Label>
                                                <Input 
                                                    type="number" 
                                                    className="w-16 h-7 text-center font-bold"
                                                    value={item.quantity}
                                                    onChange={(e) => updateReturnQty(item.variantId, parseInt(e.target.value))}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Select value={item.condition} onValueChange={(val) => updateReturnCondition(item.variantId, val)}>
                                                <SelectTrigger className="h-8 text-[10px] font-bold uppercase">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="GOOD">Resellable (Good)</SelectItem>
                                                    <SelectItem value="DAMAGED">Damaged (Waste)</SelectItem>
                                                    <SelectItem value="EXPIRED">Expired</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <Input 
                                                placeholder="Reason..." 
                                                className="h-8 text-[10px]"
                                                value={item.reason}
                                                onChange={(e) => setReturnedItems(items => items.map(i => i.variantId === item.variantId ? { ...i, reason: e.target.value } : i))}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* RIGHT SIDE: EXCHANGE LOGIC OR SUMMARY */}
                    <div className="space-y-4">
                        {type === 'EXCHANGE' ? (
                            <>
                                <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">2. Select New Items</h3>
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search products for exchange..." 
                                        className="pl-8"
                                        value={exchangeSearch}
                                        onChange={(e) => setExchangeSearch(e.target.value)}
                                    />
                                    {exchangeSearch && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-lg shadow-xl z-50 overflow-hidden">
                                            {productsData?.data.map(p => (
                                                <div key={p._id} className="p-2 border-b last:border-0">
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground px-2 pb-1">{p.productName}</p>
                                                    {p.variants.map(v => (
                                                        <div 
                                                            key={v._id} 
                                                            className="flex justify-between items-center p-2 hover:bg-muted cursor-pointer rounded"
                                                            onClick={() => addExchangeItem(p, v)}
                                                        >
                                                            <div className="text-[11px] font-bold">
                                                                {v.sku} <span className="opacity-50">(${v.priceHistory[v.priceHistory.length-1].sellingPrice})</span>
                                                            </div>
                                                            <Plus className="h-3 w-3" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <ScrollArea className="h-64 border rounded-xl p-4 bg-muted/20">
                                    {exchangedItems.length > 0 ? (
                                        <div className="space-y-2">
                                            {exchangedItems.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center bg-background p-2 rounded border shadow-sm">
                                                    <div className="flex gap-2 items-center">
                                                        <Package className="h-4 w-4 text-amber-500" />
                                                        <div>
                                                            <p className="font-bold text-xs">{item.productName}</p>
                                                            <p className="text-[10px] font-mono opacity-50">{item.sku}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <p className="font-black text-xs">${item.subtotal.toFixed(2)}</p>
                                                        <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeExchangeItem(idx)}>
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="h-full flex flex-col items-center justify-center opacity-30 gap-2">
                                            <ArrowRightLeft className="h-10 w-10" />
                                            <p className="text-xs font-black uppercase">No exchange items added</p>
                                        </div>
                                    )}
                                </ScrollArea>
                            </>
                        ) : (
                            <div className="h-full bg-red-50/50 rounded-2xl border border-red-100 p-6 flex flex-col items-center justify-center text-center space-y-3">
                                <RotateCcw className="h-12 w-12 text-red-200" />
                                <h4 className="font-black uppercase tracking-tighter text-red-600">Standard Return Mode</h4>
                                <p className="text-xs font-medium text-red-800/60">
                                    Funds will be returned to the original payment method or given as cash. Stock will be adjusted based on item condition.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-muted/30 p-6 mt-auto border-t">
                    <div className="grid grid-cols-3 gap-6 mb-6">
                        <div className="bg-background p-4 rounded-xl border shadow-sm">
                            <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Items Value</p>
                            <p className="text-xl font-black text-red-600">-${refundTotal.toFixed(2)}</p>
                        </div>
                        {type === 'EXCHANGE' && (
                            <div className="bg-background p-4 rounded-xl border shadow-sm">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">New Selection</p>
                                <p className="text-xl font-black text-amber-600">+${exchangeTotal.toFixed(2)}</p>
                            </div>
                        )}
                        <div className="bg-primary/10 p-4 rounded-xl border border-primary/20 shadow-sm">
                            <p className="text-[10px] font-black uppercase text-primary mb-1">
                                {type === 'RETURN' ? 'Final Refund Amount' : 'Balance Adjustment'}
                            </p>
                            <p className="text-xl font-black">
                                {type === 'RETURN' 
                                    ? `$${refundTotal.toFixed(2)}` 
                                    : difference > 0 ? `Pay +$${difference.toFixed(2)}` : `Refund -$${Math.abs(difference).toFixed(2)}`}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" className="font-bold px-8" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button 
                            className="font-black px-12 gap-2" 
                            disabled={returnedItems.length === 0 || processReturnMutation.isPending}
                            onClick={handleSubmit}
                        >
                            {processReturnMutation.isPending ? 'Processing...' : `Confirm ${type}`}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ProcessReturnDialog;
