"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGetBranchStock } from '@/features/stockTransfer.api';
import { useCreateSale } from '@/features/sale.api';
import { useGetAllBranches } from '@/features/branch.api';
import { useValidateCoupon } from '@/features/discount.api';
import { useTerminalHook } from '@/hooks/useTerminalHook';
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
  Box, History, Info, Power, MonitorSmartphone, Monitor
} from 'lucide-react';
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import ReceiptPrint from './ReceiptPrint';
import QRScannerDialog from './QRScannerDialog';
import ShiftModal from './ShiftModal';
import CloseShiftModal from './CloseShiftModal';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from "@/utils/formatters";

import { parseCouponQRPayload } from '@/utils/couponUtils';
import TerminalSearchArea from './components/TerminalSearchArea';
import BillingTable from './components/BillingTable';
import CheckoutSidebar from './components/CheckoutSidebar';

const POS = () => {
  const { user } = useAuth();
  const { isAdmin, pos: posPerms } = usePermissions(); // Changed branch to posPerms to avoid naming conflict

  const canCreateSale = posPerms.transaction.create;
  const canSelectBranch = isAdmin; // Only admins can select branch

  const searchInputRef = useRef(null);
  const receiptRef = useRef(null);
  const searchContainerRef = useRef(null);

  const [activeBranchId, setActiveBranchId] = useState(user?.branch_id?._id || user?.branch_id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Terminal Management
  const {
    terminals,
    isTerminalsLoading,
    openSession,
    closeSession,
    refetch: refetchTerminals
  } = useTerminalHook({ branchId: activeBranchId });

  const activeTerminal = useMemo(() => {
    if (!user?._id) return null;
    return terminals.find(t => {
      const sessionUserId = t.activeSession?.userId?._id || t.activeSession?.userId;
      if (!sessionUserId) return false;
      return sessionUserId.toString() === user._id.toString();
    });
  }, [terminals, user?._id]);

  // Filter terminals based on User's allowedTerminals whitelist
  const availableTerminals = useMemo(() => {
    if (isAdmin || !user?.allowedTerminals?.length) return terminals;
    return terminals.filter(t =>
      user.allowedTerminals.some(at => (at._id || at).toString() === t._id.toString())
    );
  }, [terminals, user?.allowedTerminals, isAdmin]);

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  const { data: stock, isLoading: stockLoading, isFetching: stockFetching } = useGetBranchStock(activeBranchId, debouncedSearch);
  const { data: branches } = useGetAllBranches({ 
    enabled: canSelectBranch || !!user?.branch_id, // Always enabled if not admin, to get user's branch
    filterBranchId: isAdmin ? undefined : (user?.branch_id?._id || user?.branch_id),
  });

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
    // Only open the shift modal if loading is finished, no terminal is active, 
    // and there are terminals available to select from.
    if (!isTerminalsLoading && !activeTerminal && terminals.length > 0 && !isShiftModalOpen) {
      setIsShiftModalOpen(true);
    }
  }, [activeTerminal, terminals, isShiftModalOpen, isTerminalsLoading]);

  useEffect(() => {
    if (searchInputRef.current && activeTerminal) searchInputRef.current.focus();
  }, [activeTerminal]);

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
      setActiveBranchId(user.branch_id?._id || user.branch_id);
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

  const handleOpenShift = async (terminalId, openingFloat) => {
    try {
      await openSession(terminalId, openingFloat);
      await refetchTerminals();
      setIsShiftModalOpen(false);
    } catch (err) { }
  };

  const handleCloseShift = async (actualCash, notes) => {
    try {
      await closeSession(activeTerminal._id, actualCash, notes);
      await refetchTerminals();
      setIsCloseModalOpen(false);
    } catch (err) { }
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
    } catch (err) { }
  };

  const handleCheckout = async (shouldPrint = false) => {
    if (!canCreateSale) return toast.error("You don't have permission to finalize sales");
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!activeBranchId) return toast.error("Please select a branch first");
    if (!activeTerminal) return toast.error("Terminal session is not active");

    try {
      const result = await createSaleMutation.mutateAsync({
        branchId: activeBranchId,
        terminalId: activeTerminal._id,
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
      refetchTerminals(); // Update drawer balance

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

  if (!posPerms.transaction.read) {
    return (
      <div className="p-8 text-center bg-background rounded-lg border border-dashed h-full flex flex-col items-center justify-center">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4 opacity-50" />
        <h2 className="text-lg font-semibold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-sm text-xs">You do not have permission to access the terminal.</p>
      </div>
    );
  }

  const activeBranch = branches?.data?.find(b => b._id === activeBranchId);
  console.log("the activeBranch is ", activeBranch)
  return (
    <>
      <div className="flex flex-col gap-4 h-[calc(100vh-140px)] relative text-slate-600">
        <div style={{ display: 'none' }}>
          <ReceiptPrint ref={receiptRef} sale={lastSaleData} branch={activeBranch} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 overflow-hidden">

          {/* LEFT SECTION: Search & Billing */}
          <div className="lg:col-span-8 flex flex-col gap-4">

            <TerminalSearchArea
              user={user}
              isAdmin={isAdmin}
              canSelectBranch={canSelectBranch}
              activeBranchId={activeBranchId}
              setActiveBranchId={setActiveBranchId}
              handleBranchChange={handleBranchChange}
              activeTerminal={activeTerminal}
              setIsCloseModalOpen={setIsCloseModalOpen}
              branches={branches}
              stock={stock}
              stockLoading={stockLoading}
              stockFetching={stockFetching}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isSearchFocused={isSearchFocused}
              setIsSearchFocused={setIsSearchFocused}
              searchInputRef={searchInputRef}
              searchContainerRef={searchContainerRef}
              addToCart={addToCart}
            />
            {/* Billing Table Container */}
            <BillingTable
              cart={cart}
              setCart={setCart}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
            />
          </div>

          {/* RIGHT SECTION: Checkout Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <CheckoutSidebar
              user={user}
              activeTerminal={activeTerminal}
              customerName={customerName}
              setCustomerName={setCustomerName}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              total={total}
              discount={discount}
              setDiscount={setDiscount}
              appliedCoupon={appliedCoupon}
              setAppliedCoupon={setAppliedCoupon}
              setIsScannerOpen={setIsScannerOpen}
              handleCheckout={handleCheckout}
              canCreateSale={canCreateSale}
              isCreatingSale={createSaleMutation.isLoading}
              cartLength={cart.length}
            />
          </div>
        </div>
      </div>

      <QRScannerDialog
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleCouponScanned}
      />

      <ShiftModal
        isOpen={isShiftModalOpen}
        terminals={terminals}
        onOpenShift={handleOpenShift}
        isLoading={isTerminalsLoading}
        userFirstName={user?.firstName}
      />

      <CloseShiftModal
        isOpen={isCloseModalOpen}
        onClose={() => setIsCloseModalOpen(false)}
        activeSession={activeTerminal?.activeSession}
        onCloseShift={handleCloseShift}
        isLoading={false}
      />
    </>
  );
};

export default POS;
