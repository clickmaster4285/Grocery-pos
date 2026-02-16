"use client";

import React, { forwardRef } from 'react';
import { Separator } from '@/components/ui/separator';

const ReceiptPrint = forwardRef(({ sale, branch }, ref) => {
  if (!sale) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Helper to format address object
  const formatAddress = (addr) => {
    if (!addr) return 'Address not available';
    if (typeof addr === 'string') return addr;
    const parts = [addr.city, addr.state, addr.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address not available';
  };

  return (
    <div ref={ref} className="p-4 bg-white text-black font-mono text-[12px] leading-tight w-[80mm]">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-black uppercase">SUPERMARKET MS</h1>
        <p className="font-bold">{branch?.branch_name || 'Main Branch'}</p>
        <p className="text-[10px]">{formatAddress(branch?.address)}</p>
        {branch?.phone && <p className="text-[10px]">Tel: {branch.phone}</p>}
      </div>

      <Separator className="bg-black my-2 h-[1.5px]" />

      {/* Sale Info */}
      <div className="space-y-1 mb-3">
        <div className="flex justify-between">
          <span>Bill No:</span>
          <span className="font-bold">{sale.billNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{formatDate(sale.createdAt || Date.now())}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{sale.cashierName || 'Staff'}</span>
        </div>
        <div className="flex justify-between">
          <span>Customer:</span>
          <span>{sale.customerName || 'Walk-in'}</span>
        </div>
      </div>

      <Separator className="bg-black my-2 border-dashed h-px" />

      {/* Items Table */}
      <table className="w-full mb-3">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">Item</th>
            <th className="text-center py-1">Qty</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 divide-dashed">
          {sale.items?.map((item, idx) => (
            <tr key={idx} className="align-top">
              <td className="py-1 pr-2">
                <div className="font-bold">{item.productName}</div>
                <div className="text-[10px]">{item.sku} @ ${item.unitPrice.toFixed(2)}</div>
              </td>
              <td className="py-1 text-center font-bold">{item.quantity}</td>
              <td className="py-1 text-right font-bold">${item.subtotal.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Separator className="bg-black my-2 h-[1.5px]" />

      {/* Totals */}
      <div className="space-y-1.5 font-bold">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${sale.totalAmount?.toFixed(2)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-sm italic">
            <span>Discount:</span>
            <span>-${sale.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base border-t border-black pt-1">
          <span>NET TOTAL:</span>
          <span className="text-lg font-black">${sale.finalAmount?.toFixed(2)}</span>
        </div>
      </div>

      <Separator className="bg-black my-3 border-dashed h-px" />

      {/* Footer */}
      <div className="text-center space-y-1 mt-4">
        <p className="font-bold uppercase tracking-widest">Payment: {sale.paymentMethod}</p>
        <div className="text-[10px] mt-2 italic">
          <p>Thank you for shopping with us!</p>
          <p>Goods once sold are not returnable.</p>
          <p>Please keep this receipt for your records.</p>
        </div>
        <p className="text-[10px] pt-2 border-t mt-2">Powered by Supermarket MS</p>
      </div>
    </div>
  );
});

ReceiptPrint.displayName = 'ReceiptPrint';

export default ReceiptPrint;
