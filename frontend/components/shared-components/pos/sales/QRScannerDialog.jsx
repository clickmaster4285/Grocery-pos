'use client';

import React, { useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { QrCode, X } from 'lucide-react';

const QRScannerDialog = ({ isOpen, onClose, onScanSuccess }) => {
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      // Delay scanner initialization to ensure DOM is ready
      const timer = setTimeout(() => {
        const scanner = new Html5QrcodeScanner(
          'qr-reader',
          { 
            fps: 10, 
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0
          },
          false
        );

        const onScan = (decodedText) => {
          scanner.clear();
          onScanSuccess(decodedText);
          onClose();
        };

        const onError = (err) => {
          // Errors happen frequently during scanning (no QR found in frame), we can mostly ignore them
          console.debug(err);
        };

        scanner.render(onScan, onError);
        scannerRef.current = scanner;
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current) {
          scannerRef.current.clear().catch(e => console.error("Scanner cleanup failed", e));
        }
      };
    }
  }, [isOpen, onScanSuccess, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-primary" />
            Scan Discount Coupon
          </DialogTitle>
          <DialogDescription>
            Position the QR code within the frame to scan.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center bg-muted/30 rounded-lg overflow-hidden border">
          <div id="qr-reader" className="w-full"></div>
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose} className="gap-2">
            <X size={16} /> Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRScannerDialog;
