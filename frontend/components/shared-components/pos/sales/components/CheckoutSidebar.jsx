"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, Banknote, Landmark, QrCode, Tag, Receipt,
  Sparkles, User, Wallet, CheckCircle2, History, Loader2,
  Printer, ShieldAlert, XCircle
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";

const CheckoutSidebar = ({
  user,
  activeTerminal,
  customerName,
  setCustomerName,
  paymentMethod,
  setPaymentMethod,
  total,
  discount,
  setDiscount,
  appliedCoupon,
  setAppliedCoupon,
  setIsScannerOpen,
  handleCheckout,
  canCreateSale,
  isCreatingSale, // Renamed from createSaleMutation.isLoading
  cartLength, // Renamed from cart.length
}) => {
  const finalTotal = Math.max(0, total - discount);

  return (
    <Card className="flex-1 flex flex-col border-none shadow-sm bg-white overflow-hidden">
      <CardHeader className="bg-slate-50/80 border-b py-4 px-6 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold text-slate-700">Checkout</CardTitle>
        </div>
        <Badge variant="outline" className="text-[10px] font-medium text-slate-600 border-slate-300 uppercase tracking-widest">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Badge>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin">
        {/* Customer Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer Info</Label>
            <History className="h-3 w-3 text-slate-300 hover:text-primary cursor-pointer transition-colors" />
          </div>
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
            <Input 
              value={customerName} 
              onChange={(e) => setCustomerName(e.target.value)} 
              placeholder="Search or add customer..." 
              className="pl-10 h-11 text-sm font-medium bg-slate-50/50 border-slate-100 focus-visible:ring-primary/10 rounded-xl"
              disabled={!activeTerminal}
            />
          </div>
        </div>

        {/* Payment Method Selector */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-1">Payment Method</Label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'CASH', icon: Banknote, label: 'Cash' },
              { id: 'CARD', icon: CreditCard, label: 'Card' },
              { id: 'ONLINE_TRANSFER', icon: Landmark, label: 'Online' }
            ].map((method) => (
              <button 
                key={method.id}
                onClick={() => setPaymentMethod(method.id)}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 h-16 rounded-xl border transition-all duration-200",
                  paymentMethod === method.id 
                    ? "bg-primary/5 border-primary/40 text-primary shadow-sm ring-4 ring-primary/5" 
                    : "bg-white border-slate-100 text-slate-600 hover:bg-slate-50"
                )}
                disabled={!activeTerminal}
              >
                <method.icon className="h-5 w-5" />
                <span className="text-[9px] font-bold uppercase tracking-widest">{method.label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-slate-100/80" />

        {/* Totals & Discounts */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs font-medium px-1">
            <span className="text-slate-500 uppercase tracking-widest text-[11px] font-bold">Net Subtotal</span>
            <span className="text-slate-600 font-bold tabular-nums">{formatCurrency(total)}</span>
          </div>
          
          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-500">Discount</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-24">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/60">Rs.</span>
                <Input 
                  type="number" 
                  className="h-8 pl-8 pr-2 text-right text-[13px] font-bold bg-slate-50/50 border-slate-100 focus-visible:ring-primary/10 rounded-lg tabular-nums" 
                  value={discount} 
                  onChange={(e) => {
                      setDiscount(parseFloat(e.target.value) || 0);
                      setAppliedCoupon(null);
                  }} 
                  disabled={!activeTerminal}
                />
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-8 w-8 border-slate-100 text-slate-500 hover:text-primary hover:bg-primary/5 transition-all shadow-none rounded-lg"
                onClick={() => setIsScannerOpen(true)}
                disabled={!activeTerminal}
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {appliedCoupon && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-3 py-2 bg-emerald-50 rounded-xl flex justify-between items-center ring-1 ring-emerald-100 border border-emerald-200/50 shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-3 w-3 text-emerald-500" />
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">{appliedCoupon.name}</span>
              </div>
              <XCircle 
                className="h-4 w-4 text-emerald-300 hover:text-destructive cursor-pointer transition-colors"
                onClick={() => { setDiscount(0); setAppliedCoupon(null); }}
              />
            </motion.div>
          )}
          
          {/* Final Amount Display */}
          <div className="pt-2">
            <div className="bg-slate-900 p-5 rounded-2xl shadow-xl shadow-slate-200 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-white">
                <Receipt className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Grand Total</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white tabular-nums tracking-tight leading-none">{formatCurrency(finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Actions */}
      <CardFooter className="p-4 bg-slate-50/50 border-t flex flex-col gap-2">
        <Button 
          variant="outline"
          className="w-full h-12 font-bold text-xs uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-white hover:text-slate-700 transition-all rounded-xl shadow-sm active:scale-[0.98]" 
          onClick={() => handleCheckout(false)}
          disabled={cartLength === 0 || isCreatingSale || !canCreateSale || !activeTerminal}
        >
          {isCreatingSale ? <Loader2 className="h-4 w-4 mr-2" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Finish Sale Only</>}
        </Button>
        <Button 
          className="w-full h-14 font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all rounded-xl active:scale-[0.98] gap-2" 
          onClick={() => handleCheckout(true)}
          disabled={cartLength === 0 || isCreatingSale || !canCreateSale || !activeTerminal}
        >
          {isCreatingSale ? <Loader2 className="h-4 w-4 mr-2" /> : <><Printer className="h-4 w-4" /> Finalize & Print</>}
        </Button>
        {!activeTerminal && (
          <div className="flex items-center justify-center gap-1.5 text-rose-500 animate-pulse">
            <ShieldAlert className="h-3 w-3" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Session Inactive - Open Shift to Begin</span>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default CheckoutSidebar;