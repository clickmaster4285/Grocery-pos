'use client';

import React, { useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Printer, Download, Calendar, Users, Info, MapPin } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import { format } from 'date-fns';
import { generateCouponQRPayload } from '@/utils/couponUtils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

const QRCodeDialog = ({ isOpen, onClose, discount }) => {
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `QR-Code-${discount?.couponCode || discount?.name}`,
  });

  if (!discount) return null;

  const qrPayload = generateCouponQRPayload(discount);

  const downloadQRCode = () => {
    const svg = document.getElementById('coupon-qr-code');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR-${discount.name}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Discount QR Code & Details</DialogTitle>
          <DialogDescription>
            Detailed information and scanner-ready code for this promotion.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border shadow-sm">
            <div ref={printRef} className="p-4 bg-white flex flex-col items-center">
              <QRCodeSVG
                id="coupon-qr-code"
                value={qrPayload}
                size={180}
                level="M"
                includeMargin={true}
              />
              <div className="mt-4 text-center">
                <h3 className="font-bold text-lg text-black leading-tight">{discount.name}</h3>
                <p className="text-sm text-gray-500 font-mono mt-1">
                  {discount.couponCode || 'Auto-Apply'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={downloadQRCode} className="mt-2 text-xs gap-1 opacity-60 hover:opacity-100">
              <Download size={12} /> Save as Image
            </Button>
          </div>

          {/* Details Section */}
          <div className="space-y-4 flex flex-col justify-center">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Info size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Promotion Value</p>
                  <p className="text-sm font-bold">
                    {discount.amountType === 'Percentage' 
                      ? `${discount.amountValue}% Discount` 
                      : `$${discount.amountValue} Fixed Off`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-full">
                  <Calendar size={16} className="text-amber-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Validity Period</p>
                  <p className="text-sm font-medium">
                    {format(new Date(discount.startDate), 'MMM dd, yyyy')} - 
                    {discount.endDate ? format(new Date(discount.endDate), 'MMM dd, yyyy') : ' Open Ended'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Users size={16} className="text-blue-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Usage Status</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium">{discount.usageCount || 0} / {discount.usageLimit || '∞'} used</p>
                    {discount.usageLimit && (
                      <Badge variant="outline" className="text-[9px] h-4">
                        {Math.round(((discount.usageCount || 0) / discount.usageLimit) * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <MapPin size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Availability</p>
                  <p className="text-sm font-medium">
                    {discount.isGlobal ? 'All Branches' : `${discount.applicableBranches?.length || 0} Specific Branches`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter className="flex sm:justify-between gap-2">
          <p className="text-[10px] text-muted-foreground self-center italic hidden sm:block">
            Last updated: {format(new Date(discount.updatedAt), 'MMM dd, HH:mm')}
          </p>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handlePrint} className="gap-2 flex-1 sm:flex-none">
              <Printer size={16} /> Print Label
            </Button>
            <Button onClick={onClose} className="flex-1 sm:flex-none">Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDialog;
