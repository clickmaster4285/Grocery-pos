"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { formatCurrency } from "@/utils/formatters";
import { toast } from 'sonner';

const BillingTable = ({ cart, setCart, updateQuantity, removeFromCart }) => {
  return (
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
              className="text-sm font-medium text-slate-400 border p-1 rounded-md hover:text-destructive flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="h-4 w-4" /> Clear Cart
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
                      <span className="font-bold text-sm text-slate-700 leading-tight">{item.productName}</span>
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">{item.sku}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium text-slate-500 text-sm tabular-nums">
                    {formatCurrency(item.price)}
                  </TableCell>
                  <TableCell className="py-3">
                    <div className="flex items-center justify-center gap-3">
                      <button
                        className="h-6 w-6 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 hover:text-destructive transition-all active:scale-90 shadow-sm"
                        onClick={() => updateQuantity(item.variantId, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="text-base font-semibold w-5 text-center tabular-nums text-slate-700">{item.quantity}</span>
                      <button
                        className="h-6 w-6 flex items-center justify-center rounded-md border border-slate-200 bg-white hover:bg-slate-50 hover:text-primary transition-all active:scale-90 shadow-sm"
                        onClick={() => updateQuantity(item.variantId, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-6 lg:pr-0 py-3">
                    <div className="flex flex-col lg:flex-row items-end lg:space-x-1 lg:items-center gap-0.5">
                      <span className="font-semibold text-base text-slate-800 tabular-nums">{formatCurrency(item.subtotal)}</span>
                      <button
                        className="text-[9px] font-medium text-slate-400 hover:text-destructive transition-colors uppercase tracking-widest"
                        onClick={() => removeFromCart(item.variantId)}
                      >
                        <Trash2 className="h-4 w-4" />
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
  );
};

export default BillingTable;