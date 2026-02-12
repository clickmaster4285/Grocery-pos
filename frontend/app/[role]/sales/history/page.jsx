"use client";

import React from 'react';
import { useGetBranchSales } from '@/features/sale.api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Eye } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

const SalesHistory = () => {
  const { user } = useAuth();
  const { role } = useParams();
  const router = useRouter();
  const branchId = user?.branch_id || '';
  
  const { data: sales, isLoading } = useGetBranchSales(branchId);

  return (
    <div className="space-y-6">
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
                <TableHead>Customer</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Cashier</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales?.map((sale) => (
                <TableRow key={sale._id}>
                  <TableCell className="font-mono font-medium">{sale.billNumber}</TableCell>
                  <TableCell>{new Date(sale.createdAt).toLocaleString()}</TableCell>
                  <TableCell>{sale.customerName || 'Walk-in'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{sale.paymentMethod}</Badge>
                  </TableCell>
                  <TableCell className="font-bold">${sale.finalAmount.toFixed(2)}</TableCell>
                  <TableCell>{sale.cashier?.firstName} {sale.cashier?.lastName}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {sales?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No sales found for this branch.
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
