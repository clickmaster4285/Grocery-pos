"use client";

import React, { forwardRef } from 'react';
import { Separator } from '@/components/ui/separator';
import { useGetSettings } from '@/features/settings.api';

const ReceiptPrint = forwardRef(({ sale, branch }, ref) => {
  const { data: settings } = useGetSettings();

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
    if (!addr) return null;
    if (typeof addr === 'string') return addr;
    const parts = [addr.street, addr.city, addr.state].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : null;
  };

  return (
    <div ref={ref} className="p-4 bg-white text-black font-mono text-[12px] leading-tight w-[80mm]">
      {/* Header */}
      <div className="text-center mb-4 space-y-1">
        {settings?.logo && (
            <div className="flex justify-center mb-2">
                <img 
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${settings.logo}`} 
                    alt="Logo" 
                    className="h-12 w-auto object-contain grayscale"
                />
            </div>
        )}
        <h1 className="text-lg font-black uppercase">{settings?.companyName || 'SUPERMARKET MS'}</h1>
        <p className="font-bold border-y border-black py-0.5">{branch?.branch_name || 'Main Branch'}</p>
        
        <div className="text-[10px] space-y-0.5 mt-1">
            <p>{formatAddress(branch?.address) || settings?.companyAddress}</p>
            <p>Tel: {branch?.phone || settings?.companyPhone || 'N/A'}</p>
            {settings?.taxNumber && <p>{settings.taxName || 'TAX'} No: {settings.taxNumber}</p>}
        </div>
      </div>

      <Separator className="bg-black my-2 h-[1.5px]" />

      {/* Sale Info */}
      <div className="space-y-1 mb-3 text-[11px]">
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
      <table className="w-full mb-3 text-[11px]">
        <thead>
          <tr className="border-b border-black">
            <th className="text-left py-1">Item</th>
            <th className="text-center py-1">Qty</th>
            <th className="text-right py-1">Total</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 divide-dashed">
          {sale.items?.map((item, idx) => {
            const hasItemDiscount = item.discountPercent > 0;
            return (
              <tr key={idx} className="align-top">
                <td className="py-1 pr-2">
                  <div className="font-bold uppercase">{item.productName}</div>
                  <div className="text-[9px] flex flex-col">
                    <span>{item.sku}</span>
                    <span>
                      {hasItemDiscount && (
                        <span className="line-through mr-1 opacity-50">
                          {settings?.currencySymbol || '$'}{item.originalUnitPrice?.toFixed(2)}
                        </span>
                      )}
                      {settings?.currencySymbol || '$'}{item.unitPrice?.toFixed(2)} 
                      {item.taxRate > 0 && ` (+${item.taxRate}% Tax)`}
                    </span>
                    {hasItemDiscount && (
                      <span className="text-emerald-700 italic font-bold">Disc: {item.discountPercent}%</span>
                    )}
                  </div>
                </td>
                <td className="py-1 text-center font-bold">{item.quantity}</td>
                <td className="py-1 text-right font-bold">
                  {settings?.currencySymbol || '$'}{(item.subtotal + (item.taxAmount || 0)).toFixed(2)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <Separator className="bg-black my-2 h-[1.5px]" />

      {/* Totals */}
      <div className="space-y-1.5 font-bold text-[11px]">
        <div className="flex justify-between">
          <span>Subtotal (Net):</span>
          <span>{settings?.currencySymbol || '$'}{sale.subtotal?.toFixed(2)}</span>
        </div>
        
        {sale.totalTax > 0 && (
          <div className="flex justify-between">
            <span>Total Tax:</span>
            <span>{settings?.currencySymbol || '$'}{sale.totalTax?.toFixed(2)}</span>
          </div>
        )}

        {(sale.globalDiscountAmount > 0 || sale.globalDiscountPercent > 0) && (
          <div className="flex justify-between italic text-emerald-700">
            <span>Global Discount ({sale.globalDiscountPercent}%):</span>
            <span>-{settings?.currencySymbol || '$'}{sale.globalDiscountAmount?.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-base border-t border-black pt-1">
          <span className="font-black">NET TOTAL:</span>
          <span className="text-base font-black">{settings?.currencySymbol || '$'}{sale.finalAmount?.toFixed(2)}</span>
        </div>
      </div>

      <Separator className="bg-black my-3 border-dashed h-px" />

      {/* Footer */}
      <div className="text-center space-y-2 mt-4">
        <p className="font-bold uppercase tracking-widest text-[10px]">Payment: {sale.paymentMethod}</p>
        <div className="text-[10px] space-y-1 italic">
          <p>{settings?.receiptFooterMessage || 'Thank you for shopping with us!'}</p>
          <p className="text-[9px] leading-tight text-gray-600">{settings?.receiptTerms || 'Goods once sold are not returnable.'}</p>
        </div>
        <p className="text-[9px] pt-2 border-t mt-4 opacity-50 font-bold">
            Powered by {settings?.companyName || 'Supermarket POS'}
        </p>
      </div>
    </div>
  );
});

ReceiptPrint.displayName = 'ReceiptPrint';

export default ReceiptPrint;
