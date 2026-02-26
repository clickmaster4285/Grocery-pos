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
import { ShieldAlert, Search, XCircle } from 'lucide-react'; // Added Search and XCircle
import { toast } from 'sonner';
import { useReactToPrint } from 'react-to-print';
import ReceiptPrint from './ReceiptPrint';
import QRScannerDialog from './QRScannerDialog';
import ShiftModal from './ShiftModal';
import CloseShiftModal from './CloseShiftModal';
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { formatCurrency } from "@/utils/formatters";
import { Input } from '@/components/ui/input'; // Added Input component

import { parseCouponQRPayload } from '@/utils/couponUtils';
import TerminalSearchArea from './components/TerminalSearchArea';
import BillingTable from './components/BillingTable';
import CheckoutSidebar from './components/CheckoutSidebar';
import SearchDropdown from './components/SearchDropdown'; // Make sure this is imported

const POS = () => {
  const { user } = useAuth();
  const { isAdmin, pos: posPerms } = usePermissions(); // Changed branch to posPerms to avoid naming conflict

  const canCreateSale = posPerms.transaction.create;
  const canSelectBranch = isAdmin; // Only admins can select branch

  const searchInputRef = useRef(null);
  const receiptRef = useRef(null);
  const searchContainerRef = useRef(null); // Ref for the top row containing branch select and search input
  const leftColumnRef = useRef(null); // Ref for the left column (BillingTable)
  const rightColumnRef = useRef(null); // Ref for the right column (CheckoutSidebar)
  const [activeBranchId, setActiveBranchId] = useState(user?.branch?._id || user?.branch || '');
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

  const handleBranchChange = (branchId) => {
    setActiveBranchId(branchId);
    setCart([]);
    setSelectedCustomer(null);
    setDiscount(0);
    setAppliedCoupon(null);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  const handleOpenShift = async (terminalId, openingFloat) => {
    try {
      await openSession(terminalId, openingFloat);
      setIsShiftModalOpen(false);
      refetchTerminals();
    } catch (error) {
      // Error handled in hook toast
    }
  };

  const handleCloseShift = async (actualCash, notes) => {
    if (!activeTerminal) return;
    try {
      await closeSession(activeTerminal._id, actualCash, notes);
      setIsCloseModalOpen(false);
      refetchTerminals();
    } catch (error) {
      // Error handled in hook toast
    }
  };

  const { data: stock, isLoading: stockLoading, isFetching: stockFetching } = useGetBranchStock(activeBranchId, debouncedSearch);
  const { data: branches } = useGetAllBranches({
    enabled: canSelectBranch || !!user?.branch, // Always enabled if not admin, to get user's branch
    filterBranchId: isAdmin ? undefined : (user?.branch?._id || user?.branch),
  });

  const createSaleMutation = useCreateSale();
  const validateCouponMutation = useValidateCoupon();

  const [cart, setCart] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null); // New: Store the full customer object
  const [discount, setDiscount] = useState(0); // This is now globalDiscountPercent
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
    if (!activeBranchId && user?.branch) {
      setActiveBranchId(user.branch?._id || user.branch);
    }
  }, [user, activeBranchId]);

  // Function to add item to cart
  const addToCart = (stockItem) => {
    const variant = stockItem.product.variants.find(v => v._id === stockItem.variantId);
    const existingItem = cart.find(item => item.variantId === stockItem.variantId);

    const originalPrice = variant.priceHistory[variant.priceHistory.length - 1].sellingPrice;
    const autoDiscountPercent = stockItem.autoDiscountPercent || 0;
    const taxRate = stockItem.product.taxRate || 0;

    if (existingItem) {
      if (existingItem.quantity + 1 > stockItem.quantity) {
        return toast.error("Cannot exceed available branch stock");
      }
      setCart(cart.map(item =>
        item.variantId === stockItem.variantId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        productId: stockItem.product._id,
        variantId: stockItem.variantId,
        productName: stockItem.product.productName,
        sku: variant.sku,
        quantity: 1,
        originalPrice: originalPrice,
        autoDiscountPercent: autoDiscountPercent,
        manualDiscountPercent: 0,
        taxRate: taxRate,
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
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const updateManualDiscount = (variantId, percent) => {
    const maxLimit = user?.transactionLimits?.maxDiscountPercent || 0;
    if (percent > maxLimit) {
      toast.error(`Your discount limit is ${maxLimit}%`);
      return;
    }
    setCart(cart.map(item => 
      item.variantId === variantId ? { ...item, manualDiscountPercent: percent } : item
    ));
  };

  const removeFromCart = (variantId) => {
    setCart(cart.filter(item => item.variantId !== variantId));
  };

  // Advanced Total Calculation
  const cartTotals = useMemo(() => {
    let subtotal = 0;
    let totalTax = 0;
    
    const processedItems = cart.map(item => {
      const totalItemDiscount = item.autoDiscountPercent + item.manualDiscountPercent;
      const unitPrice = item.originalPrice * (1 - totalItemDiscount / 100);
      const itemSubtotal = unitPrice * item.quantity;
      const itemTax = (itemSubtotal * item.taxRate) / 100;
      
      subtotal += itemSubtotal;
      totalTax += itemTax;
      
      return { ...item, unitPrice, itemSubtotal, itemTax };
    });

    const totalBeforeGlobal = subtotal + totalTax;
    const globalDiscountAmount = (subtotal * discount) / 100;
    const finalTotal = totalBeforeGlobal - globalDiscountAmount;

    return {
      items: processedItems,
      subtotal,
      totalTax,
      totalBeforeGlobal,
      globalDiscountAmount,
      finalTotal
    };
  }, [cart, discount]);

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
        customerGroup: selectedCustomer?.customerGroup || 'Regular', // Send group if available
        cartTotal: cartTotals.subtotal,
        cartItems: cart.map(item => ({
          product: item.productId,
          variant: item.variantId,
          quantity: item.quantity,
          price: item.originalPrice
        }))
      });

      const couponData = response.data;

      let calculatedPercent = 0;
      if (couponData.amountType === 'Percentage') {
        calculatedPercent = couponData.amountValue;
      } else if (couponData.amountType === 'Fixed') {
        calculatedPercent = (couponData.amountValue / cartTotals.subtotal) * 100;
      }

      const maxLimit = user?.transactionLimits?.maxDiscountPercent || 0;
      if (calculatedPercent > maxLimit) {
        toast.error(`This coupon exceeds your ${maxLimit}% discount limit`);
        return;
      }

      setDiscount(calculatedPercent);
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
          quantity: item.quantity,
          manualDiscountPercent: item.manualDiscountPercent
        })),
        globalDiscountPercent: discount,
        paymentMethod,
        customer: selectedCustomer?._id, // Send customer ID
        customerName: selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : 'Walk-in Customer',
        customerPhone: selectedCustomer?.phonePrimary
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
      setSelectedCustomer(null); // Reset customer
      setDiscount(0);
      setAppliedCoupon(null);
      setSearchQuery(''); 
      setIsSearchFocused(false); 
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
  return (
    <>
      <div className="flex flex-col gap-4 h-[calc(100vh-140px)] relative text-slate-600">
        <div style={{ display: 'none' }}>
          <ReceiptPrint ref={receiptRef} sale={lastSaleData} branch={activeBranch} />
        </div>

        {/* Top Row: Branch, Terminal, Search Input */}
        <div className="flex gap-3 items-center" ref={searchContainerRef}>
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
          />
          {/* Search Input for Products */}
          <div className="relative flex-1">
            <div className={cn(
              "flex items-center gap-3 px-4 h-11 bg-white rounded-xl shadow-sm border transition-all duration-200",
              isSearchFocused ? "ring-2 ring-primary/10 border-primary/30" : "border-slate-100"
            )}>
              <Search className={cn("h-4 w-4 transition-colors", isSearchFocused ? "text-primary" : "text-muted-foreground/60")} />
              <Input
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
                disabled={!activeTerminal}
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
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
          {/* LEFT SECTION: Billing */}
          <div className="lg:col-span-8 flex flex-col gap-4" ref={leftColumnRef}>
            <BillingTable
              cart={cartTotals.items}
              setCart={setCart}
              updateQuantity={updateQuantity}
              updateManualDiscount={updateManualDiscount}
              removeFromCart={removeFromCart}
            />
          </div>

          {/* RIGHT SECTION: Checkout Sidebar */}
          <div className="lg:col-span-4 flex flex-col gap-4" ref={rightColumnRef}>
            <CheckoutSidebar
              user={user}
              activeTerminal={activeTerminal}
              selectedCustomer={selectedCustomer}
              setSelectedCustomer={setSelectedCustomer}
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              totals={cartTotals}
              discount={discount}
              setDiscount={setDiscount}
              appliedCoupon={appliedCoupon}
              setAppliedCoupon={setAppliedCoupon}
              setIsScannerOpen={setIsScannerOpen}
              handleCheckout={handleCheckout}
              canCreateSale={canCreateSale}
              isCreatingSale={createSaleMutation.isPending}
              cartLength={cart.length}
            />
          </div>
        </div>
      </div>

      {/* Search Dropdown - rendered globally */}
      <SearchDropdown
        searchInputRef={searchInputRef}
        searchContainerRef={searchContainerRef}
        searchQuery={searchQuery}
        isSearchFocused={isSearchFocused}
        stock={stock}
        stockLoading={stockLoading}
        addToCart={addToCart}
        setSearchQuery={setSearchQuery}
        setIsSearchFocused={setIsSearchFocused}
        activeTerminal={activeTerminal}
        leftColumnRef={leftColumnRef}
        rightColumnRef={rightColumnRef}
      />

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
