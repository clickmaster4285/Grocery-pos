"use client";

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useGetSalesHistory } from '@/features/sale.api';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft, Eye, Store, Printer, Search, Calendar, ChevronRight, ChevronLeft as ChevronLeftIcon, Loader2 } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import ReceiptPrint from '@/components/shared-components/sales/ReceiptPrint';

const SalesHistory = () => {
  const { user } = useAuth();
  const { role } = useParams();
  const router = useRouter();
  const receiptRef = useRef(null);

  // Default Dates (Today)
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  
  // Filter States
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [page, setPage] = useState(1);
  const [selectedSale, setSelectedSale] = useState(null);

  // Fetch Data
  const { data: response, isLoading } = useGetSalesHistory({
    search: debouncedSearch,
    startDate,
    endDate,
    page,
    limit: 10
  });

  const sales = response?.data;
  const pagination = response?.pagination;

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

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, startDate, endDate]);

  return (
    <div className="space-y-6">
      {/* Hidden Receipt Component */}
      <div style={{ display: 'none' }}>
        <ReceiptPrint 
            ref={receiptRef} 
            sale={selectedSale} 
            branch={selectedSale?.branch} 
        />
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push(`/${role}/sales`)}>
            <ChevronLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold tracking-tight">Sales History</h1>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
            <Calendar className="h-4 w-4" />
            <span>{startDate === endDate ? `Records for ${startDate}` : `${startDate} to ${endDate}`}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="bg-muted/30">
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2 space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Search Transactions</Label>
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Bill No, Customer Name or Phone..." 
                        className="pl-9 bg-background"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">Start Date</Label>
                <Input 
                    type="date" 
                    className="bg-background"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                />
            </div>
            <div className="space-y-1.5">
                <Label className="text-[10px] font-bold uppercase tracking-wider">End Date</Label>
                <Input 
                    type="date" 
                    className="bg-background"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                />
            </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="pb-3 border-b">
          <CardTitle className="text-lg font-bold">Transaction Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="pl-6 w-45">Bill Number</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Branch</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-center">Items</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Total Amount</TableHead>
                <TableHead className="text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="font-medium">Fetching sales data...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sales?.length > 0 ? (
                sales.map((sale) => (
                    <TableRow key={sale._id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-6 font-mono font-bold text-primary">{sale.billNumber}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex flex-col">
                            <span className="font-medium">{new Date(sale.createdAt).toLocaleDateString()}</span>
                            <span className="text-muted-foreground">{new Date(sale.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="gap-1 px-2 py-0 h-6 font-medium bg-background">
                          <Store className="h-3 w-3 text-muted-foreground" />
                          {sale.branch?.branch_name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                            <span className="font-medium">{sale.customerName || 'Walk-in'}</span>
                            {sale.customerPhone && <span className="text-[10px] text-muted-foreground">{sale.customerPhone}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        <Badge variant="secondary" className="rounded-full h-6 w-6 p-0 flex items-center justify-center">
                            {sale.items?.length || 0}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={sale.paymentMethod === 'CASH' ? 'default' : 'secondary'} className="text-[10px] font-black uppercase">
                            {sale.paymentMethod}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-black text-base">${sale.finalAmount.toFixed(2)}</TableCell>
                      <TableCell className="text-right pr-6">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button 
                                variant="outline" 
                                size="icon" 
                                className="h-8 w-8 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
                                onClick={() => triggerPrint(sale)}
                                title="Print Receipt"
                            >
                                <Printer className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                title="View Details"
                            >
                                <Eye className="h-4 w-4" />
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-24 text-muted-foreground">
                    <div className="flex flex-col items-center gap-3">
                        <div className="bg-muted p-4 rounded-full">
                            <Search className="h-8 w-8 opacity-20" />
                        </div>
                        <p className="text-sm font-medium">No transactions found matching your filters.</p>
                        {(search || startDate !== todayStr || endDate !== todayStr) && (
                            <Button variant="link" onClick={() => {
                                setSearch('');
                                setStartDate(todayStr);
                                setEndDate(todayStr);
                            }}>Clear all filters</Button>
                        )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        
        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
            <CardFooter className="flex items-center justify-between py-4 border-t px-6 bg-muted/10">
                <p className="text-xs text-muted-foreground font-medium">
                    Showing page <span className="font-bold text-foreground">{pagination.page}</span> of <span className="font-bold text-foreground">{pagination.totalPages}</span> ({pagination.total} records)
                </p>
                <div className="flex items-center gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 gap-1 font-bold"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={pagination.page === 1}
                    >
                        <ChevronLeftIcon className="h-4 w-4" /> Previous
                    </Button>
                    <div className="flex items-center gap-1">
                        {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
                            <Button 
                                key={p}
                                variant={pagination.page === p ? "default" : "ghost"}
                                size="icon"
                                className="h-8 w-8 font-bold text-xs"
                                onClick={() => setPage(p)}
                            >
                                {p}
                            </Button>
                        ))}
                    </div>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-8 px-3 gap-1 font-bold"
                        onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                        disabled={pagination.page === pagination.totalPages}
                    >
                        Next <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default SalesHistory;
