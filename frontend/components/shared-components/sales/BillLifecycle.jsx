import React, { useRef, useState, useEffect } from 'react';
import { useSaleReturnHook } from '@/hooks/useSaleReturnHook';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
    Clock, 
    ArrowRightLeft, 
    RotateCcw, 
    CheckCircle2, 
    User, 
    Calendar,
    AlertCircle,
    Package,
    Printer
} from 'lucide-react';
import { format, isValid } from 'date-fns';
import { useReactToPrint } from 'react-to-print';
import ReturnReceiptPrint from './ReturnReceiptPrint';

const BillLifecycle = ({ saleId }) => {
    const { getSaleHistoryQuery } = useSaleReturnHook(saleId);
    const { data: history, isLoading } = getSaleHistoryQuery;
    
    const receiptRef = useRef(null);
    const [selectedActivity, setSelectedActivity] = useState(null);

    // Helper to safely format dates
    const safeFormat = (dateStr, formatStr = 'PPP p') => {
        if (!dateStr) return 'Date N/A';
        const date = new Date(dateStr);
        if (!isValid(date)) return 'Date N/A';
        return format(date, formatStr);
    };

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `ReturnReceipt-${selectedActivity?.returnNumber}`,
    });

    const triggerPrint = (activity) => {
        setSelectedActivity(activity);
    };

    useEffect(() => {
        if (selectedActivity) {
            handlePrint();
            setSelectedActivity(null);
        }
    }, [selectedActivity, handlePrint]);

    if (isLoading) return <div className="p-8 text-center animate-pulse text-muted-foreground font-medium">Loading history...</div>;
    if (!history) return <div className="p-8 text-center text-muted-foreground">No history available for this bill.</div>;

    const { originalSale, activityLog } = history;

    return (
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {/* Hidden Receipt Component */}
            <div style={{ display: 'none' }}>
                <ReturnReceiptPrint 
                    ref={receiptRef}
                    returnData={selectedActivity}
                    originalSale={originalSale}
                    branch={originalSale?.branch}
                />
            </div>

            {/* 1. Original Sale Event */}
            <div className="relative pl-8 pb-8 border-l-2 border-primary/20 last:border-0 last:pb-0">
                <div className="absolute -left-2.75 top-0 bg-primary text-primary-foreground rounded-full p-1.5 shadow-lg shadow-primary/20">
                    <CheckCircle2 className="h-4 w-4" />
                </div>
                
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <h4 className="font-black text-primary uppercase tracking-tighter text-lg">Original Purchase</h4>
                        <Badge variant="outline" className="font-mono text-[10px]">{originalSale?.billNumber}</Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground bg-muted/50 p-2 rounded-md">
                        <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            {safeFormat(originalSale?.createdAt)}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5" />
                            By: {originalSale?.cashier?.firstName} {originalSale?.cashier?.lastName}
                        </div>
                    </div>

                    <Card className="mt-2 border-dashed border-primary/30 shadow-none">
                        <CardContent className="p-3">
                            <div className="space-y-2">
                                {originalSale?.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between text-xs items-start">
                                        <div className="flex gap-2">
                                            <span className="bg-primary/10 text-primary font-black px-1.5 rounded">{item.quantity}x</span>
                                            <div>
                                                <p className="font-bold">{item.productName}</p>
                                                <p className="text-[10px] opacity-60 font-mono">{item.sku}</p>
                                            </div>
                                        </div>
                                        <p className="font-black">${item.subtotal?.toFixed(2)}</p>
                                    </div>
                                ))}
                                <Separator className="my-2" />
                                <div className="flex justify-between font-black text-sm pt-1">
                                    <span>Total Amount Paid</span>
                                    <span className="text-primary">${originalSale?.finalAmount?.toFixed(2)}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* 2. Subsequent Activity (Returns/Exchanges) */}
            {activityLog?.map((activity, index) => (
                <div key={activity._id} className="relative pl-8 pb-8 border-l-2 border-primary/20 last:border-0 last:pb-0">
                    <div className={`absolute -left-2.75 top-0 rounded-full p-1.5 shadow-lg ${
                        activity.type === 'RETURN' 
                        ? 'bg-red-500 text-white shadow-red-500/20' 
                        : 'bg-amber-500 text-white shadow-amber-500/20'
                    }`}>
                        {activity.type === 'RETURN' ? <RotateCcw className="h-4 w-4" /> : <ArrowRightLeft className="h-4 w-4" />}
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <h4 className={`font-black uppercase tracking-tighter text-lg ${
                                    activity.type === 'RETURN' ? 'text-red-600' : 'text-amber-600'
                                }`}>
                                    {activity.type === 'RETURN' ? 'Item Return' : 'Item Exchange'}
                                </h4>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-6 w-6 text-muted-foreground hover:text-primary"
                                    onClick={() => triggerPrint(activity)}
                                >
                                    <Printer className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                            <Badge variant="secondary" className="font-mono text-[10px]">{activity.returnNumber}</Badge>
                        </div>

                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground bg-muted/50 p-2 rounded-md">
                            <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                {safeFormat(activity.createdAt)}
                            </div>
                            <div className="flex items-center gap-1.5">
                                <User className="h-3.5 w-3.5" />
                                Handled By: {activity.performedBy?.firstName} {activity.performedBy?.lastName}
                            </div>
                        </div>

                        {/* Returned Items Section */}
                        <div className="mt-2 space-y-3">
                            <div className="space-y-1">
                                <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                    <RotateCcw className="h-3 w-3" /> Items Handed Back
                                </p>
                                <div className="space-y-1">
                                    {activity.returnedItems.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-red-50/50 p-2 rounded border border-red-100">
                                            <div className="flex gap-2 items-center">
                                                <span className="bg-red-500 text-white font-black px-1.5 rounded text-[10px]">{item.quantity}x</span>
                                                <div>
                                                    <p className="font-bold text-xs">{item.productName}</p>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant={item.condition === 'GOOD' ? 'success' : 'destructive'} className="text-[8px] h-3 px-1">
                                                            {item.condition}
                                                        </Badge>
                                                        {item.reason && <span className="text-[10px] opacity-70 italic">"{item.reason}"</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="font-black text-xs text-red-600">-${(item.unitPrice * item.quantity).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Exchanged Items Section (Only for Exchange) */}
                            {activity.type === 'EXCHANGE' && activity.exchangedItems?.length > 0 && (
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-1">
                                        <Package className="h-3 w-3" /> New Items Taken
                                    </p>
                                    <div className="space-y-1">
                                        {activity.exchangedItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center bg-amber-50/50 p-2 rounded border border-amber-100">
                                                <div className="flex gap-3 items-center">
                                                    <span className="bg-amber-500 text-white font-black px-1.5 rounded text-[10px]">{item.quantity}x</span>
                                                    <div>
                                                        <p className="font-bold text-xs">{item.productName}</p>
                                                        <p className="text-[9px] opacity-60 font-mono text-uppercase">{item.sku}</p>
                                                    </div>
                                                </div>
                                                <p className="font-black text-xs text-amber-600">+${item.subtotal?.toFixed(2)}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Final Financial Adjustment */}
                            <div className="flex justify-end pt-1">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">
                                        {activity.type === 'RETURN' ? 'Total Refund Given' : 'Exchange Difference'}
                                    </p>
                                    <p className={`font-black text-lg ${
                                        activity.totalRefundAmount > 0 || activity.totalExchangeDifference < 0 
                                        ? 'text-red-600' 
                                        : 'text-green-600'
                                    }`}>
                                        {activity.type === 'RETURN' 
                                            ? `-$${activity.totalRefundAmount?.toFixed(2)}` 
                                            : activity.totalExchangeDifference > 0 
                                                ? `+$${activity.totalExchangeDifference?.toFixed(2)}`
                                                : `-$${Math.abs(activity.totalExchangeDifference)?.toFixed(2)}`
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default BillLifecycle;
