import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { useGetSettings } from '@/features/settings.api';

const ReturnReceiptPrint = forwardRef(({ returnData, originalSale, branch }, ref) => {
  const { data: settings } = useGetSettings();
  const currency = settings?.currencySymbol || '$';

  if (!returnData || !originalSale) return null;

  // Total Return Credit (What we owe the customer for handing back items)
  const totalReturnCredit = returnData.returnedItems.reduce((acc, item) => {
    const itemSubtotal = item.unitPrice * item.quantity;
    // We assume the stored unitPrice is the post-discount price from original sale
    // We need to account for the tax that was paid on these items
    const originalItem = originalSale.items.find(i => i.variantId.toString() === item.variantId.toString());
    const taxAmount = (itemSubtotal * (originalItem?.taxRate || 0)) / 100;
    return acc + itemSubtotal + taxAmount;
  }, 0);

  // Total Exchange Debt (What the customer owes for new items)
  const totalExchangeDebt = returnData.exchangedItems?.reduce((acc, item) => {
    return acc + (item.subtotal + (item.taxAmount || 0));
  }, 0) || 0;

  return (
    <div ref={ref} className="p-4 bg-white text-black font-mono text-[10px] w-[80mm] mx-auto">
      {/* Header */}
      <div className="text-center space-y-1 mb-4">
        {settings?.logo && (
            <div className="flex justify-center mb-2">
                <img 
                    src={`${process.env.NEXT_PUBLIC_BACKEND_URL}/${settings.logo}`} 
                    alt="Logo" 
                    className="h-10 w-auto object-contain grayscale"
                />
            </div>
        )}
        <h2 className="text-sm font-bold uppercase">{branch?.branch_name || settings?.companyName || 'Supermarket'}</h2>
        <p>{branch?.address?.street || branch?.address || settings?.companyAddress || 'Main Branch'}</p>
        <p>Tel: {branch?.phone || settings?.companyPhone || '000-000-0000'}</p>
        <div className="border-y border-black border-dashed py-1 my-2">
            <p className="text-xs font-black uppercase tracking-widest">
                {returnData.type === 'RETURN' ? 'RETURN RECEIPT' : 'EXCHANGE RECEIPT'}
            </p>
        </div>
      </div>

      {/* Info Section */}
      <div className="space-y-0.5 mb-4 border-b border-black pb-2">
        <div className="flex justify-between">
          <span>Return No:</span>
          <span className="font-bold">{returnData.returnNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Orig Bill:</span>
          <span>{originalSale.billNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Date:</span>
          <span>{format(new Date(returnData.createdAt), 'dd/MM/yyyy HH:mm')}</span>
        </div>
        <div className="flex justify-between">
          <span>Cashier:</span>
          <span>{returnData.performedBy?.firstName || 'Staff'}</span>
        </div>
      </div>

      {/* Returned Items */}
      <div className="mb-4">
        <p className="font-bold border-b border-black mb-1 italic uppercase">1. Items Returned (Credit)</p>
        {returnData.returnedItems.map((item, index) => {
          const originalItem = originalSale.items.find(i => i.variantId.toString() === item.variantId.toString());
          const itemSubtotal = item.unitPrice * item.quantity;
          const itemTax = (itemSubtotal * (originalItem?.taxRate || 0)) / 100;
          return (
            <div key={index} className="space-y-0.5 mb-2 border-b border-gray-100 pb-1">
              <div className="flex justify-between font-bold">
                <span>{item.productName} ({item.condition})</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span>{item.quantity} x {currency}{item.unitPrice.toFixed(2)}</span>
                <span>-{currency}{itemSubtotal.toFixed(2)}</span>
              </div>
              {itemTax > 0 && (
                <div className="flex justify-between text-[8px] italic opacity-70">
                  <span>Tax Credit ({originalItem?.taxRate}%)</span>
                  <span>-{currency}{itemTax.toFixed(2)}</span>
                </div>
              )}
            </div>
          );
        })}
        <div className="flex justify-between border-t border-black pt-1 font-bold">
            <span>TOTAL RETURN CREDIT:</span>
            <span>-{currency}{totalReturnCredit.toFixed(2)}</span>
        </div>
      </div>

      {/* Exchanged Items (If Exchange) */}
      {returnData.type === 'EXCHANGE' && returnData.exchangedItems?.length > 0 && (
        <div className="mb-4">
          <p className="font-bold border-b border-black mb-1 italic uppercase">2. Replacement Items (Debt)</p>
          {returnData.exchangedItems.map((item, index) => (
            <div key={index} className="space-y-0.5 mb-2 border-b border-gray-100 pb-1">
              <div className="flex justify-between font-bold">
                <span>{item.productName}</span>
              </div>
              <div className="flex justify-between text-[9px]">
                <span>{item.quantity} x {currency}{item.unitPrice.toFixed(2)}</span>
                <span>+{currency}{item.subtotal.toFixed(2)}</span>
              </div>
              {item.taxAmount > 0 && (
                <div className="flex justify-between text-[8px] italic opacity-70">
                  <span>Tax Amount ({item.taxRate}%)</span>
                  <span>+{currency}{item.taxAmount.toFixed(2)}</span>
                </div>
              )}
              {item.discountPercent > 0 && (
                <div className="flex justify-between text-[8px] text-emerald-700 font-bold">
                  <span>Auto-Discount (-{item.discountPercent}%)</span>
                  <span>-{currency}{item.discountAmount?.toFixed(2) || (item.originalUnitPrice * item.discountPercent / 100).toFixed(2)}</span>
                </div>
              )}
            </div>
          ))}
          <div className="flex justify-between border-t border-black pt-1 font-bold">
              <span>TOTAL EXCHANGE DEBT:</span>
              <span>+{currency}{totalExchangeDebt.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="border-t-2 border-black pt-2 space-y-1.5">
        <div className="flex justify-between text-[11px] font-black uppercase">
          <span>
            {returnData.type === 'RETURN' ? 'NET REFUND AMOUNT:' : 'FINAL SETTLEMENT:'}
          </span>
          <span>
            {returnData.type === 'RETURN' 
                ? `${currency}${returnData.totalRefundAmount.toFixed(2)}` 
                : returnData.totalExchangeDifference > 0 
                    ? `PAY +${currency}${returnData.totalExchangeDifference.toFixed(2)}`
                    : `REFUND -${currency}${Math.abs(returnData.totalExchangeDifference).toFixed(2)}`
            }
          </span>
        </div>
        
        {returnData.type === 'EXCHANGE' && (
            <p className="text-[8px] text-center italic border-t border-gray-200 pt-1">
                Balance calculation: Debt ({currency}{totalExchangeDebt.toFixed(2)}) - Credit ({currency}{totalReturnCredit.toFixed(2)})
            </p>
        )}
      </div>

      {/* Footer message */}
      <div className="text-center mt-6 space-y-1">
        <p className="italic text-[9px]">{settings?.receiptFooterMessage || 'Thank you for choosing us!'}</p>
        <p className="font-bold uppercase tracking-tighter text-[8px]">Inventory Audit Trail Verified</p>
        <div className="mt-4 border-t border-black pt-4">
            <p>--- Customer Copy ---</p>
        </div>
      </div>
    </div>
  );
});

ReturnReceiptPrint.displayName = 'ReturnReceiptPrint';

export default ReturnReceiptPrint;
