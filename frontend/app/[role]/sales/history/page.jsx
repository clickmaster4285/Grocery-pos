"use client";

import React, { useRef, useState, useEffect } from 'react';
import { useGetSalesHistory } from '@/features/sale.api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Eye, Store, Printer } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import ReceiptPrint from '@/components/shared-components/sales/ReceiptPrint';

const SalesHistory = () => {
  const { user } = useAuth();
  const { role } = useParams();
  const router = useRouter();
  const receiptRef = useRef(null);
  
  const [selectedSale, setSelectedSale] = useState(null);
  const { data: sales, isLoading } = useGetSalesHistory();

  // Print Logic
  const handlePrint = useReactToPrint({
    contentRef: receiptRef,
    documentTitle: `Receipt-${selectedSale?.billNumber}`,
  });

  const triggerPrint = (sale) => {
    setSelectedSale({
        ...sale,
        cashierName: `${sale.cashier?.firstName} ${sale.cashier?.lastName}`
    });
  };

  useEffect(() => {
    if (selectedSale) {
        handlePrint();
        setSelectedSale(null);
    }
  }, [selectedSale, handlePrint]);

  return (
    <div className="space-y-6">
      {/* Hidden Receipt Component for Reusability */}
      <div style={{ display: 'none' }}>
        <ReceiptPrint 
            ref={receiptRef} 
            sale={selectedSale} 
            branch={selectedSale?.branch} 
        />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push(`/${role}/sales`)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bill Number</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    Loading sales history...
                  </TableCell>
                </TableRow>
              ) : sales?.map((sale) => (
                <TableRow key={sale._id}>
                  <TableCell className="font-mono font-medium">{sale.billNumber}</TableCell>
                  <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Store className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{sale.branch?.branch_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{sale.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell className="font-bold">${sale.finalAmount.toFixed(2)}</TableCell>
                  <TableCell>{sale.cashier?.firstName} {sale.cashier?.lastName}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-primary"
                            onClick={() => triggerPrint(sale)}
                            title="Print Receipt"
                        >
                            <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!isLoading && sales?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No sales found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesHistory;
