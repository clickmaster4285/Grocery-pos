"use client";

import React, { useEffect, useState, useLayoutEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table';
import {
  Loader2, PackageSearch, Plus
} from 'lucide-react'; // Removed Search, XCircle, Input, MapPin as they are in POS.jsx
import { formatCurrency } from "@/utils/formatters";


const SearchDropdown = ({
  stock,
  stockLoading,
  searchQuery,
  isSearchFocused,
  addToCart,
  searchInputRef, // Now passed from POS.jsx
  activeTerminal, // Now passed from POS.jsx
  leftColumnRef, // New prop
  rightColumnRef, // New prop
}) => {
  const [dropdownStyle, setDropdownStyle] = useState({});

  // Calculate and update dropdown position and width
  useLayoutEffect(() => {
    if (!isSearchFocused) {
      // If not focused, ensure dropdown is not visible and prevent calculations
      setDropdownStyle({});
      return;
    }

    const calculateDropdownStyle = () => {
      if (searchInputRef.current && leftColumnRef.current && rightColumnRef.current) {
        const inputRect = searchInputRef.current.getBoundingClientRect();
        const leftColRect = leftColumnRef.current.getBoundingClientRect();
        const rightColRect = rightColumnRef.current.getBoundingClientRect();

        const desiredLeft = leftColRect.left;
        const desiredWidth = rightColRect.right - leftColRect.left;

        setDropdownStyle({
          position: 'fixed', // Use fixed to escape stacking context
          top: inputRect.bottom + 8, // 8px margin below input
          left: desiredLeft,
          width: desiredWidth,
          zIndex: 100 // Ensure it's above other content
        });
      }
    };

    calculateDropdownStyle(); // Initial calculation

    window.addEventListener('resize', calculateDropdownStyle);
    window.addEventListener('scroll', calculateDropdownStyle, true); // Use capture phase for more reliable scroll detection

    return () => {
      window.removeEventListener('resize', calculateDropdownStyle);
      window.removeEventListener('scroll', calculateDropdownStyle, true);
    };
  }, [searchQuery, isSearchFocused, activeTerminal, searchInputRef, leftColumnRef, rightColumnRef]); // Add new refs to dependencies


  return (
    <AnimatePresence>
      {isSearchFocused && (searchQuery.trim().length > 0 || stockLoading) && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.99 }}
          // Apply dynamic style here
          style={dropdownStyle}
          className="bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden" // z-index handled by style prop
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
                            <span className="font-semibold text-sm text-slate-700 group-hover:text-primary transition-colors">{item.product.productName}</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{variant?.sku}</span>
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
                            <span className="font-semibold text-sm text-slate-700">{formatCurrency(price)}</span>
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
  );
};

export default SearchDropdown;