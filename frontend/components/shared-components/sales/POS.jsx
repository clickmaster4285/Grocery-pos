"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGetBranchStock } from '@/features/stockTransfer.api';
import { useCreateSale } from '@/features/sale.api';
import { useGetAllBranches } from '@/features/branch.api';
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
import { Trash2, Plus, Minus, Search, ShoppingCart, CreditCard, Banknote, Landmark, Store, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const POS = () => {
  const { user } = useAuth();
  const { hasRole } = usePermissions();
  const isAdmin = hasRole('admin');
  const searchInputRef = useRef(null);
  
  // State for the active branch being managed in POS
  const [activeBranchId, setActiveBranchId] = useState(user?.branch_id || '');
  
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: stock, isLoading: stockLoading, isFetching: stockFetching } = useGetBranchStock(activeBranchId, debouncedSearch);
  const { data: branches } = useGetAllBranches();
  const createSaleMutation = useCreateSale();

  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');

  // Auto-focus search input on load
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  // Handle barcode / exact SKU match auto-add
  useEffect(() => {
    if (stock && stock.length === 1 && searchQuery.trim() !== '') {
        const item = stock[0];
        const variant = item.product.variants.find(v => v._id === item.variantId);
        // If exact SKU match, add and clear search
        if (variant && (variant.sku.toLowerCase() === searchQuery.toLowerCase() || variant.barcode === searchQuery)) {
            addToCart(item);
            setSearchQuery('');
        }
    }
  }, [stock]);

  // Update active branch if user data loads late
  useEffect(() => {
    if (!activeBranchId && user?.branch_id) {
      setActiveBranchId(user.branch_id);
    }
  }, [user, activeBranchId]);

  // Reset cart if branch changes
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

  const handleCheckout = async () => {
    if (cart.length === 0) return toast.error("Cart is empty");
    if (!activeBranchId) return toast.error("Please select a branch first");

    try {
      await createSaleMutation.mutateAsync({
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
      setCart([]);
      setCustomerName('');
      setDiscount(0);
      setSearchQuery('');
      if (searchInputRef.current) searchInputRef.current.focus();
    } catch (err) {
      toast.error(err.response?.data?.message || "Checkout failed");
    }
  };

  if (!isAdmin && !user?.branch_id) {
    return (
        <div className="p-8 text-center bg-background rounded-lg border border-dashed h-full flex flex-col items-center justify-center">
            <Store className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
            <h2 className="text-xl font-bold text-destructive mb-2">Branch Assignment Required</h2>
            <p className="text-muted-foreground max-w-sm">Your user account is not assigned to any branch. POS is only available for branch-assigned staff or Administrators.</p>
        </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      {/* Branch Selection Header (Visible to Admins) */}
      <Card className="shrink-0">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-full">
              <Store className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Active Terminal</p>
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <Select value={activeBranchId} onValueChange={handleBranchChange}>
                    <SelectTrigger className="h-8 w-50 font-bold border-none p-0 focus:ring-0">
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.data?.map(b => (
                        <SelectItem key={b._id} value={b._id}>{b.branch_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <h3 className="font-bold">{branches?.data?.find(b => b._id === activeBranchId)?.branch_name || 'My Branch'}</h3>
              )}
            </div>
          </div>

          <div className="relative w-full md:w-96">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              ref={searchInputRef}
              placeholder="Scan Barcode or Type Product/SKU..." 
              className="pl-8 h-9" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
        {/* Product Selection Area */}
        <div className="lg:col-span-2 flex flex-col gap-4 overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader className="py-3 border-b bg-muted/30">
              <div className="flex justify-between items-center">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Search Results</CardTitle>
                {stockFetching && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4">
              {stockLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <p className="text-sm font-medium">Searching Inventory...</p>
                </div>
              ) : stock?.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {stock.map((item) => {
                    const variant = item.product.variants.find(v => v._id === item.variantId);
                    const price = variant?.priceHistory[variant.priceHistory.length - 1]?.sellingPrice;
                    
                    return (
                      <Card key={item._id} className="cursor-pointer hover:border-primary transition-colors group" onClick={() => addToCart(item)}>
                        <CardContent className="p-4 flex flex-col gap-2">
                          <div className="flex justify-between items-start">
                            <Badge variant="outline" className="text-[10px]">{variant?.sku}</Badge>
                            <span className="font-bold text-primary">${price?.toFixed(2)}</span>
                          </div>
                          <h3 className="font-semibold text-sm line-clamp-2 h-10 leading-tight">{item.product.productName}</h3>
                          <div className="flex justify-between items-center mt-2">
                            <span className={`text-[11px] font-medium ${item.quantity < 5 ? 'text-red-500 font-bold' : 'text-muted-foreground'}`}>
                              Stock: {item.quantity}
                            </span>
                            <div className="bg-primary text-primary-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Plus className="h-3 w-3" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                  <Search className="h-12 w-12 opacity-10" />
                  <p className="text-sm">{searchQuery ? "No products found." : "Scan a barcode or type to search products."}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Cart / Billing Area */}
        <div className="flex flex-col gap-4 h-full overflow-hidden">
          <Card className="flex-1 flex flex-col overflow-hidden border-2 border-primary/20 shadow-lg">
            <CardHeader className="bg-primary text-primary-foreground py-3 rounded-t-lg shrink-0">
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2 text-base font-bold">
                  <ShoppingCart className="h-4 w-4" /> Billing
                </CardTitle>
                <Badge variant="secondary" className="bg-white/20 text-white border-none">
                  {cart.reduce((a, b) => a + b.quantity, 0)} items
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-0">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-4 h-9 text-[11px] uppercase tracking-wider font-bold">Item</TableHead>
                    <TableHead className="h-9 text-[11px] uppercase tracking-wider font-bold text-center">Qty</TableHead>
                    <TableHead className="text-right pr-4 h-9 text-[11px] uppercase tracking-wider font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cart.map((item) => (
                    <TableRow key={item.variantId} className="hover:bg-transparent border-b">
                      <TableCell className="pl-4 py-3">
                        <div className="flex flex-col max-w-30">
                          <span className="font-bold text-xs truncate leading-none mb-1">{item.productName}</span>
                          <span className="text-[10px] text-muted-foreground font-medium">{item.sku}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            className="h-5 w-5 flex items-center justify-center rounded-full border hover:bg-muted transition-colors"
                            onClick={() => updateQuantity(item.variantId, -1)}
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                          <button 
                            className="h-5 w-5 flex items-center justify-center rounded-full border hover:bg-muted transition-colors"
                            onClick={() => updateQuantity(item.variantId, 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-4 py-3">
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-bold text-xs">${item.subtotal.toFixed(2)}</span>
                          <button 
                            className="text-[10px] text-destructive hover:underline"
                            onClick={() => removeFromCart(item.variantId)}
                          >
                            Remove
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {cart.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-20 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingCart className="h-8 w-8 opacity-10" />
                          <p className="text-xs font-medium">Cart is empty</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>

            <CardFooter className="flex-col gap-4 border-t bg-muted/5 pt-4 shrink-0">
              <div className="w-full space-y-2">
                <div className="flex justify-between text-[11px] font-bold uppercase text-muted-foreground px-1">
                  <span>Subtotal</span>
                  <span>${total.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 px-1">
                  <Label className="text-[11px] font-bold uppercase text-muted-foreground">Discount</Label>
                  <div className="relative w-24">
                    <span className="absolute left-2 top-1.5 text-[10px] text-muted-foreground">$</span>
                    <Input 
                      type="number" 
                      className="h-7 pl-5 text-right text-xs font-bold focus-visible:ring-primary" 
                      value={discount} 
                      onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
                    />
                  </div>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-lg py-1 px-1">
                  <span className="text-sm uppercase text-muted-foreground self-center">Total</span>
                  <span className="text-primary text-xl font-black">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Customer Name</Label>
                  <Input 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    placeholder="Walk-in Customer" 
                    className="h-8 text-xs focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground ml-1">Payment Method</Label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <Button 
                      variant={paymentMethod === 'CASH' ? 'default' : 'outline'} 
                      className="flex flex-col h-12 gap-0.5"
                      onClick={() => setPaymentMethod('CASH')}
                    >
                      <Banknote className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-bold uppercase">Cash</span>
                    </Button>
                    <Button 
                      variant={paymentMethod === 'CARD' ? 'default' : 'outline'} 
                      className="flex flex-col h-12 gap-0.5"
                      onClick={() => setPaymentMethod('CARD')}
                    >
                      <CreditCard className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-bold uppercase">Card</span>
                    </Button>
                    <Button 
                      variant={paymentMethod === 'ONLINE_TRANSFER' ? 'default' : 'outline'} 
                      className="flex flex-col h-12 gap-0.5"
                      onClick={() => setPaymentMethod('ONLINE_TRANSFER')}
                    >
                      <Landmark className="h-3.5 w-3.5" />
                      <span className="text-[9px] font-bold uppercase">Online</span>
                    </Button>
                  </div>
                </div>

                <Button 
                  className="w-full h-11 text-base font-bold shadow-lg shadow-primary/20 transition-all active:scale-[0.98]" 
                  onClick={handleCheckout}
                  disabled={cart.length === 0 || createSaleMutation.isLoading}
                >
                  {createSaleMutation.isLoading ? "PROCESSING..." : "FINALIZE SALE"}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default POS;
