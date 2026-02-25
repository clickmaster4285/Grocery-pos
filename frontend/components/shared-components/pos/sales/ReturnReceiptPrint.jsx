import React, { forwardRef } from 'react';
import { format } from 'date-fns';
import { useGetSettings } from '@/features/settings.api';

const ReturnReceiptPrint = forwardRef(({ returnData, originalSale, branch }, ref) => {
  const { data: settings } = useGetSettings();
  const currency = settings?.currencySymbol || '$';

  if (!returnData || !originalSale) return null;

  const totalReturned = returnData.returnedItems.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
  const totalExchanged = returnData.exchangedItems?.reduce((acc, item) => acc + item.subtotal, 0) || 0;

  return (
    <div ref={ref} className="p-4 bg-white text-black font-mono text-[10px] w-[80mm] mx-auto">
      {/* Header */}
      <div className="text-center space-y-1 mb-4">
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
      <div className="space-y-0.5 mb-4">
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
        <p className="font-bold border-b border-black mb-1 italic">RETURNED ITEMS</p>
        {returnData.returnedItems.map((item, index) => (
          <div key={index} className="space-y-0.5 mb-1">
            <div className="flex justify-between font-bold">
              <span>{item.productName} ({item.condition})</span>
            </div>
            <div className="flex justify-between">
              <span>{item.quantity} x {currency}{item.unitPrice.toFixed(2)}</span>
              <span>-{currency}{(item.quantity * item.unitPrice).toFixed(2)}</span>
            </div>
          </div>
        ))}
        <div className="flex justify-between border-t border-black pt-1 font-bold">
            <span>TOTAL RETURN VALUE:</span>
            <span>-{currency}{totalReturned.toFixed(2)}</span>
        </div>
      </div>

      {/* Exchanged Items (If Exchange) */}
      {returnData.type === 'EXCHANGE' && returnData.exchangedItems?.length > 0 && (
        <div className="mb-4">
          <p className="font-bold border-b border-black mb-1 italic">NEW ITEMS TAKEN</p>
          {returnData.exchangedItems.map((item, index) => (
            <div key={index} className="space-y-0.5 mb-1">
              <div className="flex justify-between font-bold">
                <span>{item.productName}</span>
              </div>
              <div className="flex justify-between">
                <span>{item.quantity} x {currency}{item.unitPrice.toFixed(2)}</span>
                <span>+{currency}{item.subtotal.toFixed(2)}</span>
              </div>
            </div>
          ))}
          <div className="flex justify-between border-t border-black pt-1 font-bold">
              <span>TOTAL EXCHANGE VALUE:</span>
              <span>+{currency}{totalExchanged.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Summary Footer */}
      <div className="border-t border-black pt-2 space-y-1">
        <div className="flex justify-between text-xs font-black">
          <span>
            {returnData.type === 'RETURN' ? 'NET REFUND:' : 'BALANCE ADJ:'}
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
      </div>

      {/* Footer message */}
      <div className="text-center mt-6 space-y-1">
        <p className="italic">Inventory updated successfully.</p>
        <p className="font-bold uppercase tracking-tighter">Verified Audit Trail</p>
        <div className="mt-4 border-t border-black pt-4">
            <p>--- Thank You ---</p>
        </div>
      </div>
    </div>
  );
});

ReturnReceiptPrint.displayName = 'ReturnReceiptPrint';

export default ReturnReceiptPrint;
