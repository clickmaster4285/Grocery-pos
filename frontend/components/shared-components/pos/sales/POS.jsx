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
  MapPin, XCircle, Sparkles, User, Wallet, CheckCircle2
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

  // Handle outside click for search dropdown
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
            setSearchQuery('');
            setIsSearchFocused(false);
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
            <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground max-w-sm text-sm">You do not have permission to access the Point of Sale terminal.</p>
        </div>
    );
  }

  if (!isAdmin && !user?.branch_id) {
    return (
        <div className="p-8 text-center bg-background rounded-lg border border-dashed h-full flex flex-col items-center justify-center">
            <Store className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-xl font-semibold text-destructive mb-2">Branch Assignment Required</h2>
            <p className="text-muted-foreground max-w-sm text-sm">Your user account is not assigned to any branch. POS is only available for branch-assigned staff or Administrators.</p>
        </div>
    );
  }

  const activeBranch = branches?.data?.find(b => b._id === activeBranchId);

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)] relative">
      <div style={{ display: 'none' }}>
        <ReceiptPrint ref={receiptRef} sale={lastSaleData} branch={activeBranch} />
      </div>

      {/* Top Header & Search Bar Combined */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 shrink-0">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Terminal</p>
            {canSelectBranch ? (
              <Select value={activeBranchId} onValueChange={handleBranchChange}>
                <SelectTrigger className="h-6 w-auto min-w-32 font-semibold text-xs border-none p-0 focus:ring-0 shadow-none hover:text-primary transition-colors">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.data?.map(b => (
                    <SelectItem key={b._id} value={b._id} className="text-xs font-medium">{b.branch_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <h3 className="font-semibold text-xs">{activeBranch?.branch_name || 'My Branch'}</h3>
            )}
          </div>
        </div>

        {/* Global Search with Floating Dropdown */}
        <div className="relative flex-1 group" ref={searchContainerRef}>
          <div className={cn(
            "flex items-center gap-3 px-4 h-12 bg-white rounded-xl shadow-sm border transition-all duration-200",
            isSearchFocused ? "ring-2 ring-primary/10 border-primary/30" : "border-slate-100"
          )}>
            <Search className={cn("h-5 w-5 transition-colors", isSearchFocused ? "text-primary" : "text-muted-foreground")} />
            <input 
              ref={searchInputRef}
              type="text"
              placeholder="Scan barcode or type product name (e.g. 'Apple', 'SKU-123')..." 
              className="flex-1 bg-transparent border-none focus:outline-none text-sm font-medium placeholder:text-muted-foreground/60"
              value={searchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (!isSearchFocused) setIsSearchFocused(true);
              }}
            />
            {stockFetching && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
            {searchQuery && (
                <button 
                    onClick={() => { setSearchQuery(''); setIsSearchFocused(false); }}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors"
                >
                    <XCircle className="h-4 w-4 text-muted-foreground" />
                </button>
            )}
          </div>

          {/* Search Dropdown Table */}
          <AnimatePresence>
            {isSearchFocused && (searchQuery.trim().length > 0 || stockLoading) && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="absolute top-14 left-0 right-0 z-50 bg-white rounded-xl shadow-2xl border border-slate-100 overflow-hidden max-h-100 flex flex-col"
              >
                <div className="overflow-y-auto scrollbar-thin">
                  {stockLoading ? (
                    <div className="p-8 text-center flex flex-col items-center gap-3">
                      <Loader2 className="h-8 w-8 animate-spin text-primary/40" />
                      <p className="text-xs font-medium text-muted-foreground">Searching inventory...</p>
                    </div>
                  ) : stock?.length > 0 ? (
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent border-none h-10">
                          <TableHead className="text-[10px] font-semibold uppercase pl-6">Product</TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase text-center">Location</TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase text-center">Stock</TableHead>
                          <TableHead className="text-[10px] font-semibold uppercase text-right pr-6">Price</TableHead>
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
                                "cursor-pointer transition-colors group",
                                isOutOfStock ? "opacity-50 grayscale cursor-not-allowed bg-slate-50/50" : "hover:bg-primary/3"
                              )}
                              onClick={() => !isOutOfStock && addToCart(item)}
                            >
                              <TableCell className="pl-6 py-3">
                                <div className="flex flex-col">
                                  <span className="font-semibold text-sm group-hover:text-primary transition-colors">{item.product.productName}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase">{variant?.sku}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-center">
                                <Badge variant="secondary" className="text-[9px] font-medium uppercase bg-slate-100 text-slate-600 border-none px-1.5 py-0">
                                  {item.locationDisplay !== 'NAN' ? item.locationDisplay : 'No Loc'}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={cn("text-xs font-bold", item.quantity < 5 ? "text-orange-600" : "text-slate-600")}>
                                  {item.quantity}
                                </span>
                              </TableCell>
                              <TableCell className="text-right pr-6">
                                <div className="flex items-center justify-end gap-3">
                                  <span className="font-bold text-sm text-primary">${price?.toFixed(2)}</span>
                                  {!isOutOfStock && <Plus className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground flex flex-col items-center gap-2">
                      <PackageSearch className="h-8 w-8 opacity-20" />
                      <p className="text-xs font-medium">No items match your search.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">
        {/* Left Section: Active Billing Table (70% wide on large) */}
        <Card className="lg:col-span-8 flex flex-col overflow-hidden border-none shadow-sm bg-white">
          <CardHeader className="py-4 border-b px-6 flex flex-row items-center justify-between bg-white/50 backdrop-blur-sm sticky top-0 z-20">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-1.5 rounded-lg">
                <ShoppingCart className="h-4 w-4 text-primary" />
              </div>
              <CardTitle className="text-sm font-semibold text-slate-700">Active Bill</CardTitle>
            </div>
            <div className="flex items-center gap-3">
                <AnimatePresence>
                    {cart.length > 0 && (
                        <motion.button 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            onClick={() => setCart([])}
                            className="text-[10px] font-semibold text-muted-foreground hover:text-destructive flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-100 hover:border-destructive/20 hover:bg-destructive/5 transition-all"
                        >
                            <Trash2 className="h-3 w-3" />
                            Clear All
                        </motion.button>
                    )}
                </AnimatePresence>
                <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[10px] px-2 py-0.5">
                  {cart.reduce((a, b) => a + b.quantity, 0)} ITEMS
                </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-0 scrollbar-thin">
            <Table>
              <TableHeader className="bg-slate-50/50 sticky top-0 z-10 h-10">
                <TableRow className="hover:bg-transparent border-none">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider pl-6">Product Details</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center">Unit Price</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-center">Quantity</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider text-right pr-6">Line Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <AnimatePresence mode="popLayout">
                    {cart.map((item) => (
                    <motion.tr 
                        layout
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        key={item.variantId} 
                        className="hover:bg-slate-50/50 border-b border-slate-100 transition-colors"
                    >
                        <TableCell className="pl-6 py-4">
                          <div className="flex flex-col gap-0.5">
                              <span className="font-semibold text-sm text-slate-700">{item.productName}</span>
                              <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tight">{item.sku}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium text-slate-600 text-sm">
                          ${item.price.toFixed(2)}
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center justify-center gap-3">
                              <button 
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:text-destructive transition-all active:scale-90"
                                onClick={() => updateQuantity(item.variantId, -1)}
                              >
                                <Minus className="h-3 w-3" />
                              </button>
                              <span className="text-sm font-bold w-6 text-center tabular-nums text-slate-700">{item.quantity}</span>
                              <button 
                                className="h-7 w-7 flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 hover:text-primary transition-all active:scale-90"
                                onClick={() => updateQuantity(item.variantId, 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </button>
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-6 py-4">
                          <div className="flex flex-col items-end gap-1">
                              <span className="font-bold text-sm text-slate-800 tabular-nums">${item.subtotal.toFixed(2)}</span>
                              <button 
                                className="text-[10px] font-semibold text-muted-foreground hover:text-destructive transition-colors uppercase tracking-tight"
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
                    <TableCell colSpan={4} className="text-center py-32 text-muted-foreground/40">
                      <div className="flex flex-col items-center gap-4">
                        <div className="p-5 bg-slate-50 rounded-full border border-slate-100 shadow-inner">
                          <ShoppingCart className="h-10 w-10 stroke-[1.5px]" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest">Cart is empty</p>
                          <p className="text-[11px] font-medium mt-1">Start by scanning a product or using the search bar above.</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Right Section: Actions & Checkout (Sidebar) */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <CardHeader className="bg-slate-50/80 border-b py-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-lg">
                  <User className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-sm font-semibold text-slate-700">Checkout Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-5">
              {/* Customer Input */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">Customer Information</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <Input 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    placeholder="Walk-in Customer" 
                    className="pl-10 h-10 text-sm font-medium bg-slate-50 border-none focus-visible:ring-primary/20 rounded-xl"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-1">Payment Method</Label>
                <div className="grid grid-cols-3 gap-2">
                  <button 
                    onClick={() => setPaymentMethod('CASH')}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border transition-all duration-200",
                      paymentMethod === 'CASH' 
                        ? "bg-primary/5 border-primary text-primary shadow-sm" 
                        : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <Banknote className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Cash</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('CARD')}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border transition-all duration-200",
                      paymentMethod === 'CARD' 
                        ? "bg-primary/5 border-primary text-primary shadow-sm" 
                        : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <CreditCard className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Card</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('ONLINE_TRANSFER')}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1.5 h-16 rounded-xl border transition-all duration-200",
                      paymentMethod === 'ONLINE_TRANSFER' 
                        ? "bg-primary/5 border-primary text-primary shadow-sm" 
                        : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                    )}
                  >
                    <Landmark className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tight">Online</span>
                  </button>
                </div>
              </div>

              <Separator className="bg-slate-100" />

              {/* Financial Summary */}
              <div className="space-y-3 px-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Subtotal</span>
                  <span className="text-sm font-bold text-slate-700">${total.toFixed(2)}</span>
                </div>
                
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <Tag className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Discount</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-24">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-primary">$</span>
                      <Input 
                        type="number" 
                        className="h-8 pl-6 pr-2 text-right text-xs font-bold bg-slate-50 border-none focus-visible:ring-primary/20 rounded-lg" 
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
                      className="h-8 w-8 bg-white border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm rounded-lg"
                      onClick={() => setIsScannerOpen(true)}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {appliedCoupon && (
                  <div className="px-2 py-1.5 bg-emerald-50 rounded-lg flex justify-between items-center ring-1 ring-emerald-100">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[8px] font-bold uppercase bg-emerald-600 border-none px-1 h-3.5">COUPON</Badge>
                      <span className="text-[10px] font-semibold text-emerald-800">{appliedCoupon.name}</span>
                    </div>
                    <button 
                      className="p-1 text-emerald-800/40 hover:text-destructive transition-colors"
                      onClick={() => { setDiscount(0); setAppliedCoupon(null); }}
                    >
                      <XCircle className="h-3 w-3" />
                    </button>
                  </div>
                )}
                
                <div className="pt-2">
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 flex justify-between items-center">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Payable Amount</span>
                      <span className="text-2xl font-bold text-primary tabular-nums tracking-tight leading-none mt-1">${finalTotal.toFixed(2)}</span>
                    </div>
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Wallet className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="p-5 pt-0 flex flex-col gap-3">
              <Button 
                variant="outline"
                className="w-full h-12 font-bold text-xs uppercase tracking-widest border-2 border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all rounded-xl active:scale-[0.98]" 
                onClick={() => handleCheckout(false)}
                disabled={cart.length === 0 || createSaleMutation.isLoading || !canCreateSale}
              >
                {createSaleMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4 mr-2" /> Finish & Save</>}
              </Button>
              <Button 
                className="w-full h-14 font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 transition-all rounded-xl active:scale-[0.98] gap-2" 
                onClick={() => handleCheckout(true)}
                disabled={cart.length === 0 || createSaleMutation.isLoading || !canCreateSale}
              >
                {createSaleMutation.isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Printer className="h-4 w-4" /> Finish & Print Bill</>}
              </Button>
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
