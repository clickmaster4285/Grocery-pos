"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGetBranchStock } from '@/features/stockTransfer.api';
import { useCreateSale } from '@/features/sale.api';
import { useGetAllBranches } from '@/features/branch.api';
import { useValidateCoupon } from '@/features/discount.api';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  Trash2, Plus, Minus, Search, ShoppingCart, CreditCard, 
  Banknote, Landmark, Store, Loader2, Printer, 
  ShieldAlert, QrCode, PackageSearch, Tag, Receipt,
  MapPin, XCircle, Sparkles, User, Wallet, CheckCircle2,
  Box, History, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import ReceiptPrint from './ReceiptPrint';
import QRScannerDialog from './QRScannerDialog';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';

import { parseCouponQRPayload } from '@/utils/couponUtils';

const POS = () => {
  const { user } = useAuth();
  const { pos, isAdmin, branch: branchPerms } = usePermissions();
  
  const canCreateSale = pos.transaction.create;
  const canSelectBranch = isAdmin || branchPerms.read; 

  const searchInputRef = useRef(null);
  const receiptRef = useRef(null);
  const searchContainerRef = useRef(null);
  
  const [activeBranchId, setActiveBranchId] = useState(user?.branch_id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: stock, isLoading: stockLoading, isFetching: stockFetching } = useGetBranchStock(activeBranchId, debouncedSearch);
  const { data: branches } = useGetAllBranches({ enabled: canSelectBranch });
  const createSaleMutation = useCreateSale();
  const validateCouponMutation = useValidateCoupon();

  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [lastSaleData, setLastSaleData] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Print function
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${lastSaleData?.billNumber}`,
  });

  useEffect(() => {
    if (lastSaleData) {
        handlePrint();
        setLastSaleData(null); 
    }
  }, [lastSaleData, handlePrint]);

  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (stock && stock.length === 1 && searchQuery.trim() !== '') {
        const item = stock[0];
        const variant = item.product.variants.find(v => v._id === item.variantId);
        if (variant && (variant.sku.toLowerCase() === searchQuery.toLowerCase() || variant.barcode === searchQuery)) {
            addToCart(item);
        }
    }
  }, [stock]);

  useEffect(() => {
    if (!activeBranchId && user?.branch_id) {
      setActiveBranchId(user.branch_id);
    }
  }, [user, activeBranchId]);

  const handleBranchChange = (branchId) => {
    if (cart.length > 0) {
      if (window.confirm("Changing branch will clear your current cart. Continue?")) {
        setActiveBranchId(branchId);
        setCart([]);
      }
    } else {
      setActiveBranchId(branchId);
    }
  };

  const addToCart = (stockItem) => {
    const variant = stockItem.product.variants.find(v => v._id === stockItem.variantId);
    const existingItem = cart.find(item => item.variantId === stockItem.variantId);

    if (existingItem) {
      if (existingItem.quantity + 1 > stockItem.quantity) {
        return toast.error("Cannot exceed available branch stock");
      }
      setCart(cart.map(item => 
        item.variantId === stockItem.variantId 
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      ));
    } else {
      const price = variant.priceHistory[variant.priceHistory.length - 1].sellingPrice;
      setCart([...cart, {
        productId: stockItem.product._id,
        variantId: stockItem.variantId,
        productName: stockItem.product.productName,
        sku: variant.sku,
        quantity: 1,
        price: price,
        subtotal: price,
        maxStock: stockItem.quantity
      }]);
    }
    setSearchQuery('');
    setIsSearchFocused(false);
    if (searchInputRef.current) searchInputRef.current.focus();
  };

  const updateQuantity = (variantId, delta) => {
    setCart(cart.map(item => {
      if (item.variantId === variantId) {
        const newQty = Math.max(1, Math.min(item.quantity + delta, item.maxStock));
        if (delta > 0 && item.quantity >= item.maxStock) {
            toast.error("Reached maximum available stock");
        }
        return { ...item, quantity: newQty, subtotal: newQty * item.price };
      }
      return item;
    }));
  };

  const removeFromCart = (variantId) => {
    setCart(cart.filter(item => item.variantId !== variantId));
  };

  const total = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const finalTotal = Math.max(0, total - discount);

  const handleCouponScanned = async (scannedText) => {
    if (!activeBranchId) return toast.error("Please select a branch first");
    if (cart.length === 0) return toast.error("Please add items to cart before scanning a coupon");

    const couponInfo = parseCouponQRPayload(scannedText);
    const codeToValidate = couponInfo.code || couponInfo.id;

    if (!codeToValidate) {
      return toast.error("Invalid QR code format");
    }

    try {
      const response = await validateCouponMutation.mutateAsync({
        code: codeToValidate,
        branchId: activeBranchId,
        cartTotal: total,
        cartItems: cart.map(item => ({
            product: item.productId,
            variant: item.variantId,
            quantity: item.quantity,
            price: item.price
        }))
      });

      const couponData = response.data;
      
      let calculatedDiscount = 0;
      if (couponData.amountType === 'Percentage') {
        calculatedDiscount = (total * couponData.amountValue) / 100;
      } else if (couponData.amountType === 'Fixed') {
        calculatedDiscount = couponData.amountValue;
      }

      setDiscount(calculatedDiscount);
      setAppliedCoupon(couponData);
      toast.success(`Coupon "${couponData.name}" applied successfully!`);
    } catch (err) {}
  };

  const handleCheckout = async (shouldPrint = false) => {
    if (!canCreateSale) return toast.error("You don't have permission to finalize sales");
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!activeBranchId) return toast.error("Please select a branch first");

    try {
      const result = await createSaleMutation.mutateAsync({
        branchId: activeBranchId,
        items: cart.map(item => ({
          product: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        })),
        discount,
        paymentMethod,
        customerName
      });
      
      toast.success("Sale completed successfully!");
      
      if (shouldPrint) {
        setLastSaleData({
            ...result.data,
            cashierName: `${user.firstName} ${user.lastName}`
        });
      }

      setCart([]);
      setCustomerName('');
      setDiscount(0);
      setAppliedCoupon(null);
      setSearchQuery('');
      if (searchInputRef.current) searchInputRef.current.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
    }
  };

  if (!pos.transaction.read) {
    return (
        <div className="p-8 text-center bg-background rounded-lg border border-dashed h-full flex flex-col items-center justify-center">
            <ShieldAlert className="h-12 w-12 text-destructive mb-4 opacity-50" />
            <h2 className="text-lg font-semibold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground max-w-sm text-xs">You do not have permission to access the terminal.</p>
        </div>
    );
  }

  const activeBranch = branches?.data?.find(b => b._id === activeBranchId);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-140px)] relative text-slate-600">
      <div style={{ display: 'none' }}>
        <ReceiptPrint ref={receiptRef} sale={lastSaleData} branch={activeBranch} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        
        {/* LEFT SECTION: Search & Billing */}
        <div className="lg:col-span-8 flex flex-col gap-4 overflow-hidden">
          
          {/* Combined Terminal & Search Area */}
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
              <Store className="h-4 w-4 text-primary" />
              {canSelectBranch ? (
                <Select value={activeBranchId} onValueChange={handleBranchChange}>
                  <SelectTrigger className="h-5 w-auto min-w-28 font-semibold text-[11px] border-none p-0 focus:ring-0 shadow-none hover:text-primary transition-colors">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.data?.map(b => (
                      <SelectItem key={b._id} value={b._id} className="text-[11px] font-medium">{b.branch_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="font-semibold text-[11px] uppercase tracking-tight">{activeBranch?.branch_name || 'My Branch'}</span>
              )}
            </div>

            {/* Search Input with Popover Table */}
            <div className="relative flex-1" ref={searchContainerRef}>
              <div className={cn(
                "flex items-center gap-3 px-4 h-11 bg-white rounded-xl shadow-sm border transition-all duration-200",
                isSearchFocused ? "ring-2 ring-primary/10 border-primary/30" : "border-slate-100"
              )}>
                <Search className={cn("h-4 w-4 transition-colors", isSearchFocused ? "text-primary" : "text-muted-foreground/60")} />
                <input 
                  ref={searchInputRef}
                  type="text"
                  placeholder="Scan or type to search products..." 
                  className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium placeholder:text-muted-foreground/40"
                  value={searchQuery}
                  onFocus={() => setIsSearchFocused(true)}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (!isSearchFocused) setIsSearchFocused(true);
                  }}
                />
                <AnimatePresence>
                  {searchQuery && (
                    <motion.button 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      onClick={() => { setSearchQuery(''); setIsSearchFocused(false); }}
                      className="p-1 hover:bg-slate-50 rounded-full transition-colors"
                    >
                      <XCircle className="h-4 w-4 text-muted-foreground/40 hover:text-destructive" />
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>

              {/* FLOATING SEARCH RESULTS (TABLE FORMAT) */}
              <AnimatePresence>
                {isSearchFocused && (searchQuery.trim().length > 0 || stockLoading) && (
                  <motion.div 
                    initial={{ opacity: 0, y: 8, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.99 }}
                    className="absolute top-13 left-0 right-0 z-50 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden"
                  >
                    <div className="max-h-87.5 overflow-y-auto scrollbar-thin">
                      {stockLoading ? (
                        <div className="p-10 text-center flex flex-col items-center gap-3">
                          <Loader2 className="h-6 w-6 animate-spin text-primary/30" />
                          <p className="text-[11px] font-medium text-muted-foreground">Searching Live Inventory...</p>
                        </div>
                      ) : stock?.length > 0 ? (
                        <Table>
                          <TableHeader className="bg-slate-50 sticky top-0 z-10 h-9">
                            <TableRow className="hover:bg-transparent border-none">
                              <TableHead className="text-[9px] font-semibold uppercase pl-6 py-0">Item Description</TableHead>
                              <TableHead className="text-[9px] font-semibold uppercase text-center py-0">Loc</TableHead>
                              <TableHead className="text-[9px] font-semibold uppercase text-center py-0">Qty</TableHead>
                              <TableHead className="text-[9px] font-semibold uppercase text-right pr-6 py-0">Price</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {stock.map((item) => {
                              const variant = item.product.variants.find(v => v._id === item.variantId);
                              const price = variant?.priceHistory[variant.priceHistory.length - 1]?.sellingPrice;
                              const isOutOfStock = item.quantity <= 0;
                              
                              return (
                                <TableRow 
                                  key={item._id} 
                                  className={cn(
                                    "cursor-pointer transition-colors group h-12",
                                    isOutOfStock ? "opacity-40 grayscale-[0.8] cursor-not-allowed bg-slate-50/50" : "hover:bg-primary/2"
                                  )}
                                  onClick={() => !isOutOfStock && addToCart(item)}
                                >
                                  <TableCell className="pl-6 py-2">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-[13px] text-slate-700 group-hover:text-primary transition-colors">{item.product.productName}</span>
                                      <span className="text-[9px] text-muted-foreground uppercase tracking-tight">{variant?.sku}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className="text-[9px] font-medium text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                                      {item.locationDisplay !== 'NAN' ? item.locationDisplay.split(',')[0] : '--'}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <span className={cn("text-[11px] font-semibold", item.quantity < 5 ? "text-orange-500" : "text-slate-500")}>
                                      {item.quantity}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right pr-6">
                                    <div className="flex items-center justify-end gap-2">
                                      <span className="font-semibold text-sm text-slate-700">${price?.toFixed(2)}</span>
                                      {!isOutOfStock && <Plus className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
                                    </div>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      ) : (
                        <div className="p-10 text-center text-muted-foreground flex flex-col items-center gap-2">
                          <PackageSearch className="h-6 w-6 opacity-20" />
                          <p className="text-[11px] font-medium">No results found for "{searchQuery}"</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Billing Table Container */}
          <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-sm bg-white">
            <CardHeader className="py-3 border-b px-6 flex flex-row items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-2">
                <div className="bg-slate-100 p-1.5 rounded-lg">
                  <ShoppingCart className="h-4 w-4 text-slate-500" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-600">Cart Items</CardTitle>
              </div>
              <AnimatePresence>
                {cart.length > 0 && (
                  <motion.button 
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onClick={() => setCart([])}
                    className="text-[10px] font-medium text-slate-400 hover:text-destructive flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" /> Clear Cart
                  </motion.button>
                )}
              </AnimatePresence>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 h-10">
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest pl-6">Product Details</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-center">Unit</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-center">Qty</TableHead>
                    <TableHead className="text-[10px] font-semibold uppercase tracking-widest text-right pr-6">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {cart.map((item) => (
                      <motion.tr 
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, x: -20 }}
                        key={item.variantId} 
                        className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors h-16"
                      >
                        <TableCell className="pl-6 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold text-[13px] text-slate-700 leading-tight">{item.productName}</span>
                            <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">{item.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-slate-500 text-[13px]">
                          ${item.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center justify-center gap-3">
                            <button 
                              className="h-6 w-6 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 hover:text-destructive transition-all active:scale-90 shadow-sm"
                              onClick={() => updateQuantity(item.variantId, -1)}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="text-sm font-semibold w-5 text-center tabular-nums text-slate-700">{item.quantity}</span>
                            <button 
                              className="h-6 w-6 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 hover:text-primary transition-all active:scale-90 shadow-sm"
                              onClick={() => updateQuantity(item.variantId, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6 py-3">
                          <div className="flex flex-col items-end gap-0.5">
                            <span className="font-semibold text-sm text-slate-800 tabular-nums">${item.subtotal.toFixed(2)}</span>
                            <button 
                              className="text-[9px] font-medium text-slate-400 hover:text-destructive transition-colors uppercase tracking-widest"
                              onClick={() => removeFromCart(item.variantId)}
                            >
                              Remove
                            </button>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                  {cart.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-36">
                        <div className="flex flex-col items-center gap-4 opacity-30">
                          <div className="p-6 bg-slate-100 rounded-full">
                            <ShoppingCart className="h-12 w-12 stroke-[1px]" />
                          </div>
                          <div className="text-center max-w-50">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em]">Cart is empty</p>
                            <p className="text-[10px] font-medium mt-1">Start by scanning a product or using the search bar above.</p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT SECTION: Checkout Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="flex-1 flex flex-col border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b py-4 px-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm font-semibold text-slate-700">Checkout</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-medium text-slate-400 border-slate-200">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Badge>
            </CardHeader>
            
            <CardContent className="flex-1 p-6 space-y-6 overflow-y-auto scrollbar-thin">
              {/* Customer Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">Customer Info</Label>
                  <History className="h-3 w-3 text-slate-300 hover:text-primary cursor-pointer transition-colors" />
                </div>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/40 group-focus-within:text-primary transition-colors" />
                  <Input 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    placeholder="Search or add customer..." 
                    className="pl-10 h-11 text-sm font-medium bg-slate-50/50 border-slate-100 focus-visible:ring-primary/10 rounded-xl"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-1">Payment Method</Label>
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
                          : "bg-white border-slate-100 text-slate-400 hover:bg-slate-50"
                      )}
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
                  <span className="text-slate-400 uppercase tracking-widest text-[10px]">Net Subtotal</span>
                  <span className="text-slate-600 font-semibold">${total.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between gap-4 px-1">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-primary/60" />
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">Discount</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-24">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary/60">$</span>
                      <Input 
                        type="number" 
                        className="h-8 pl-6 pr-2 text-right text-[13px] font-semibold bg-slate-50/50 border-slate-100 focus-visible:ring-primary/10 rounded-lg" 
                        value={discount} 
                        onChange={(e) => {
                            setDiscount(parseFloat(e.target.value) || 0);
                            setAppliedCoupon(null);
                        }} 
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="h-8 w-8 border-slate-100 text-slate-400 hover:text-primary hover:bg-primary/5 transition-all shadow-none rounded-lg"
                      onClick={() => setIsScannerOpen(true)}
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
                      <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-tight">{appliedCoupon.name}</span>
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
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                      <Receipt className="h-24 w-24 text-white" />
                    </div>
                    <div className="relative z-10">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">Final Balance</span>
                      <div className="flex items-baseline gap-1 mt-1">
                        <span className="text-3xl font-semibold text-white tabular-nums tracking-tight leading-none">${finalTotal.toFixed(2)}</span>
                        <span className="text-xs font-medium text-slate-500">USD</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            {/* Actions */}
            <CardFooter className="p-6 bg-slate-50/50 border-t flex flex-col gap-3">
              <Button 
                variant="outline"
                className="w-full h-12 font-bold text-[11px] uppercase tracking-widest border-slate-200 text-slate-500 hover:bg-white hover:text-slate-700 transition-all rounded-xl shadow-sm active:scale-[0.98]" 
                onClick={() => handleCheckout(false)}
                disabled={cart.length === 0 || createSaleMutation.isLoading || !canCreateSale}
              >
                {createSaleMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Finish Sale Only</>}
              </Button>
              <Button 
                className="w-full h-14 font-bold text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all rounded-xl active:scale-[0.98] gap-2" 
                onClick={() => handleCheckout(true)}
                disabled={cart.length === 0 || createSaleMutation.isLoading || !canCreateSale}
              >
                {createSaleMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Printer className="h-4 w-4" /> Finalize & Print</>}
              </Button>
              <div className="flex items-center justify-center gap-1.5 opacity-40">
                <Info className="h-3 w-3" />
                <span className="text-[9px] font-medium">Verify cart items before final checkout</span>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      <QRScannerDialog 
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleCouponScanned}
      />
    </div>
  );
};

export default POS;
