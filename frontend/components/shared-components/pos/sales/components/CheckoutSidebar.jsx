"use client";

import React, { useState, useEffect, useRef } from 'react';
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
  Printer, ShieldAlert, XCircle, Percent, Search, Plus, UserPlus
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/formatters";
import { toast } from 'sonner';
import { useGetAllCustomers } from '@/features/customer.api';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import CustomerForm from '@/components/shared-components/pos/customers/CustomerForm';

const CheckoutSidebar = ({
  user,
  activeTerminal,
  selectedCustomer,
  setSelectedCustomer,
  paymentMethod,
  setPaymentMethod,
  totals,
  discount,
  setDiscount,
  appliedCoupon,
  setAppliedCoupon,
  setIsScannerOpen,
  handleCheckout,
  canCreateSale,
  isCreatingSale,
  cartLength,
}) => {
  const { pos } = usePermissions();
  const canAddCustomer = pos?.customers?.create;

  const [customerSearch, setCustomerSearch] = useState('');
  const debouncedSearch = useDebounce(customerSearch, 300);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const searchRef = useRef(null);

  const { data: customerData, isLoading: isCustomersLoading } = useGetAllCustomers({
    search: debouncedSearch,
    limit: 5,
    isActive: 'true'
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDiscountChange = (val) => {
    const numVal = parseFloat(val) || 0;
    const maxLimit = user?.transactionLimits?.maxDiscountPercent || 0;
    
    if (numVal > maxLimit) {
      toast.error(`Your discount limit is ${maxLimit}%`);
      return;
    }

    if (numVal < 0) {
      toast.error("Discount cannot be negative");
      return;
    }
    
    setDiscount(Math.max(0, numVal));
    setAppliedCoupon(null);
  };

  const selectCustomer = (customer) => {
    setSelectedCustomer(customer);
    setCustomerSearch('');
    setIsSearchOpen(false);
  };

  return (
    <Card className="flex-1 flex flex-col border-none shadow-sm bg-white overflow-visible">
      <CardHeader className="bg-slate-50/80 border-b py-4 px-6 flex flex-row items-center justify-between rounded-t-2xl">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          <CardTitle className="text-sm font-semibold text-slate-700">Checkout</CardTitle>
        </div>
        <Badge variant="outline" className="text-[10px] font-medium text-slate-600 border-slate-300 uppercase tracking-widest">
          {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Badge>
      </CardHeader>
      
      <CardContent className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin overflow-x-visible">
        {/* Customer Input */}
        <div className="space-y-2 relative" ref={searchRef}>
          <div className="flex items-center justify-between px-1">
            <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Customer Selection</Label>
            {canAddCustomer && (
                <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(true)}
                    className="text-[10px] font-bold text-primary flex items-center gap-1 hover:underline"
                >
                    <Plus className="h-3 w-3" /> New
                </button>
            )}
          </div>

          {selectedCustomer ? (
            <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl flex items-center justify-between group animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{selectedCustomer.firstName} {selectedCustomer.lastName}</span>
                        <span className="text-[10px] font-medium text-slate-400 font-mono">{selectedCustomer.phonePrimary}</span>
                    </div>
                </div>
                <button 
                    type="button"
                    onClick={() => setSelectedCustomer(null)}
                    className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-lg transition-colors"
                >
                    <XCircle className="h-4 w-4" />
                </button>
            </div>
          ) : (
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 group-focus-within:text-primary transition-colors" />
                <Input 
                    value={customerSearch} 
                    onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setIsSearchOpen(true);
                    }} 
                    onFocus={() => setIsSearchOpen(true)}
                    placeholder="Search phone or name..." 
                    className="pl-10 h-11 text-sm font-medium bg-slate-50/50 border-slate-100 focus-visible:ring-primary/10 rounded-xl"
                    disabled={!activeTerminal}
                />

                {/* Dropdown Results */}
                <AnimatePresence>
                    {isSearchOpen && (customerSearch.trim().length > 0 || isCustomersLoading) && (
                        <motion.div 
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-50 overflow-hidden min-w-70"
                        >
                            {isCustomersLoading ? (
                                <div className="p-4 text-center">
                                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-primary/40" />
                                </div>
                            ) : customerData?.data?.length > 0 ? (
                                <div className="max-h-60 overflow-y-auto py-1">
                                    {customerData.data.map(customer => (
                                        <button
                                            type="button"
                                            key={customer._id}
                                            onClick={() => selectCustomer(customer)}
                                            className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between group transition-colors border-b border-slate-50 last:border-0"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                    <User className="h-4 w-4" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-slate-700">{customer.firstName} {customer.lastName}</span>
                                                    <span className="text-[10px] font-medium text-slate-400 font-mono tracking-tighter">{customer.phonePrimary}</span>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-[8px] font-black uppercase opacity-0 group-hover:opacity-100 transition-opacity">Select</Badge>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-6 text-center">
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No customer found</p>
                                    {canAddCustomer && (
                                        <Button 
                                            type="button"
                                            variant="link" 
                                            className="mt-1 h-auto p-0 text-primary font-black uppercase text-[10px] tracking-tighter"
                                            onClick={() => {
                                                setIsAddModalOpen(true);
                                                setIsSearchOpen(false);
                                            }}
                                        >
                                            Create New Customer?
                                        </Button>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
          )}
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
                type="button"
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
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Subtotal (Net)</span>
            <span className="text-slate-600 font-bold tabular-nums text-sm">{formatCurrency(totals.subtotal)}</span>
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-slate-500 uppercase tracking-widest text-[10px] font-bold">Total Tax</span>
            <span className="text-slate-600 font-bold tabular-nums text-sm">{formatCurrency(totals.totalTax)}</span>
          </div>
          
          <div className="flex items-center justify-between gap-4 px-1">
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-primary/60" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Global Disc%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative w-24">
                <Percent className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary/60" />
                <Input 
                  type="number" 
                  className="h-8 pl-3 pr-8 text-right text-[13px] font-bold bg-slate-50/50 border-slate-100 focus-visible:ring-primary/10 rounded-lg tabular-nums" 
                  value={discount || ''} 
                  placeholder="0"
                  onChange={(e) => handleDiscountChange(e.target.value)} 
                  disabled={!activeTerminal}
                />
              </div>
              <Button 
                type="button"
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

          {totals.globalDiscountAmount > 0 && (
             <div className="flex justify-between items-center px-1 text-[10px] text-emerald-600 font-bold uppercase tracking-wider italic">
                <span>Discount Amount</span>
                <span>-{formatCurrency(totals.globalDiscountAmount)}</span>
             </div>
          )}
          
          {/* Final Amount Display */}
          <div className="pt-2">
            <div className="bg-slate-900 p-5 rounded-2xl shadow-xl shadow-slate-200 relative overflow-hidden group">
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500 text-white">
                <Receipt className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Payable Amount</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white tabular-nums tracking-tight leading-none">{formatCurrency(totals.finalTotal)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
      
      {/* Actions */}
      <CardFooter className="p-4 bg-slate-50/50 border-t flex flex-col gap-2 rounded-b-2xl">
        <Button 
          type="button"
          variant="outline"
          className="w-full h-12 font-bold text-xs uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-white hover:text-slate-700 transition-all rounded-xl shadow-sm active:scale-[0.98]" 
          onClick={() => handleCheckout(false)}
          disabled={cartLength === 0 || isCreatingSale || !canCreateSale || !activeTerminal}
        >
          {isCreatingSale ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Finish Sale Only</>}
        </Button>
        <Button 
          type="button"
          className="w-full h-14 font-bold text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all rounded-xl active:scale-[0.98] gap-2" 
          onClick={() => handleCheckout(true)}
          disabled={cartLength === 0 || isCreatingSale || !canCreateSale || !activeTerminal}
        >
          {isCreatingSale ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <><Printer className="h-4 w-4" /> Finalize & Print</>}
        </Button>
        {!activeTerminal && (
          <div className="flex items-center justify-center gap-1.5 text-rose-500 animate-pulse">
            <ShieldAlert className="h-3 w-3" />
            <span className="text-[9px] font-bold uppercase tracking-wider">Session Inactive - Open Shift to Begin</span>
          </div>
        )}
      </CardFooter>

      <CustomerForm 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={(newCustomer) => {
            selectCustomer(newCustomer);
        }}
      />
    </Card>
  );
};

export default CheckoutSidebar;
