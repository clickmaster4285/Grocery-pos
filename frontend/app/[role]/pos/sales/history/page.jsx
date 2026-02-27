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
import {
  ChevronLeft,
  Eye,
  Store,
  Printer,
  Search,
  Calendar,
  ChevronRight,
  ChevronLeft as ChevronLeftIcon,
  Loader2,
  RotateCcw,
  MoreVertical,
  DollarSign,
  ShoppingCart,
  Package,
  Filter,
  ArrowUpRight
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useReactToPrint } from 'react-to-print';
import ReceiptPrint from '@/components/shared-components/pos/sales/ReceiptPrint';
import StatsCard from '@/components/ui/StatsCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency } from "@/utils/formatters";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

import PageHeader from '@/components/shared-components/PageHeader';

const SalesHistory = ({ 
  title = "Transaction Archive", 
  description = "Electronic journal of all branch sales and returns." 
}) => {
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
  const stats = response?.stats;
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
    <div className="space-y-6 text-slate-600">
      {/* Hidden Receipt Component */}
      <div style={{ display: 'none' }}>
        <ReceiptPrint
          ref={receiptRef}
          sale={selectedSale}
          branch={selectedSale?.branch}
        />
      </div>

      <PageHeader 
        title={
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="icon" 
              onClick={() => router.push(`/${role}/pos/sales`)}
              className="rounded-xl border-slate-200 bg-white shadow-sm hover:bg-slate-50 transition-all active:scale-95 h-10 w-10"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span>{title}</span>
          </div>
        }
        description={description}
        actions={
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-white px-4 py-2.5 rounded-xl border border-slate-100 shadow-sm">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            <span>{startDate === endDate ? `Records for ${startDate}` : `${startDate} → ${endDate}`}</span>
          </div>
        }
      />

      {/* KPI STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
            { title: 'Total Collection', value: formatCurrency(stats?.totalCollection || 0), icon: DollarSign, color: 'emerald' },
            { title: 'Invoices Issued', value: stats?.totalSales || 0, icon: ShoppingCart, color: 'primary' },
            { title: 'Inventory Volume', value: stats?.totalItems || 0, icon: Package, color: 'slate' }
        ].map((stat, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden group">
                    <CardContent className="p-5 flex items-center gap-5">
                        <div className={cn(
                            "h-12 w-12 rounded-xl flex items-center justify-center transition-colors shadow-sm",
                            stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white" :
                            stat.color === 'primary' ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white" :
                            "bg-slate-50 text-slate-600 group-hover:bg-slate-600 group-hover:text-white"
                        )}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{stat.title}</span>
                            <span className="text-xl font-bold text-slate-700 tracking-tight leading-none mt-1">{stat.value}</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        ))}
      </div>

      {/* Filter Toolbar */}
      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
        <CardContent className="p-4 flex flex-col md:flex-row items-end gap-4">
          <div className="flex-1 space-y-1.5 w-full">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1 flex items-center gap-1.5">
                <Search className="h-3 w-3" /> Quick Search
            </Label>
            <div className="relative group">
              <Input
                placeholder="Find bill, customer, or phone..."
                className="pl-4 h-11 bg-slate-50/50 border-slate-100 rounded-xl text-sm font-medium focus-visible:ring-primary/10 transition-all"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="w-full md:w-44 space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">From Date</Label>
            <Input
              type="date"
              className="h-11 bg-slate-50/50 border-slate-100 rounded-xl text-sm font-medium focus-visible:ring-primary/10"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="w-full md:w-44 space-y-1.5">
            <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 ml-1">To Date</Label>
            <Input
              type="date"
              className="h-11 bg-slate-50/50 border-slate-100 rounded-xl text-sm font-medium focus-visible:ring-primary/10"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl border-slate-100 bg-slate-50 hover:bg-slate-100" onClick={() => {setSearch(''); setStartDate(todayStr); setEndDate(todayStr);}}>
            <RotateCcw className="h-4 w-4 text-slate-500" />
          </Button>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden min-h-100">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
              <TableRow className="hover:bg-transparent border-none h-12">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest pl-6">Bill ID</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Timestamp</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Store Branch</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Customer</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-center">Items</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest">Type</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right">Total Payable</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-right pr-6">Manage</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-32">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-10 w-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">Synchronizing Records...</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : sales?.length > 0 ? (
                <AnimatePresence mode="popLayout">
                    {sales.map((sale, idx) => (
                    <motion.tr 
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        key={sale._id} 
                        className="group hover:bg-slate-50/50 border-b border-slate-100 transition-colors h-16"
                    >
                        <TableCell className="pl-6">
                            <span className="font-mono text-[11px] font-bold text-primary bg-primary/5 px-2 py-1 rounded-md border border-primary/10 uppercase tracking-tighter">{sale.billNumber}</span>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-bold text-slate-700">{format(new Date(sale.createdAt), 'MMM dd')}</span>
                                <span className="text-[10px] text-slate-500 font-medium">{format(new Date(sale.createdAt), 'hh:mm a')}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-emerald-400" />
                                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-tighter">{sale.branch?.branch_name}</span>
                            </div>
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-bold text-slate-700">{sale.customerName || 'Walk-in'}</span>
                                {sale.customerPhone && <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{sale.customerPhone}</span>}
                            </div>
                        </TableCell>
                        <TableCell className="text-center">
                            <span className="text-[10px] font-black bg-slate-100 text-slate-500 h-6 w-6 inline-flex items-center justify-center rounded-full tabular-nums border border-slate-200">{sale.items?.length || 0}</span>
                        </TableCell>
                        <TableCell>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[9px] font-bold uppercase tracking-widest px-2 py-0 h-5 border-none shadow-none",
                                    sale.paymentMethod === 'CASH' ? 'bg-emerald-50 text-emerald-600' : 
                                    (sale.paymentMethod === 'ONLINE' || sale.paymentMethod === 'ONLINE_TRANSFER') ? 'bg-sky-50 text-sky-600' : 
                                    'bg-slate-100 text-slate-500'
                                )}
                            >
                                {sale.paymentMethod}
                            </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                            <span className="text-sm font-bold text-slate-800 tabular-nums tracking-tight">{formatCurrency(sale.finalAmount)}</span>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-slate-100 bg-white/95 backdrop-blur-xl">
                            <DropdownMenuLabel className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 px-3 py-2">
                                Audit Controls
                            </DropdownMenuLabel>

                            <DropdownMenuItem className="gap-3 cursor-pointer py-2.5 px-3 rounded-xl focus:bg-primary/5 transition-all" onClick={() => router.push(`/${role}/pos/sales/history/${sale._id}`)}>
                                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                                <Eye className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                <span className="font-bold text-xs text-slate-700">View Detailed Bill</span>
                                <span className="text-[10px] text-slate-500 font-medium">Lifecycle & tax breakdown</span>
                                </div>
                                <ArrowUpRight className="h-3 w-3 ml-auto opacity-20" />
                            </DropdownMenuItem>

                            <DropdownMenuItem className="gap-3 cursor-pointer py-2.5 px-3 rounded-xl focus:bg-amber-50 transition-all mt-1" onClick={() => router.push(`/${role}/pos/sales/history/${sale._id}/return`)}>
                                <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                                <RotateCcw className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                <span className="font-bold text-xs text-slate-700">Return or Exchange</span>
                                <span className="text-[10px] text-slate-500 font-medium">Process inventory reversal</span>
                                </div>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator className="my-2 bg-slate-100" />

                            <DropdownMenuItem className="gap-3 cursor-pointer py-2.5 px-3 rounded-xl focus:bg-slate-50 transition-all" onClick={() => triggerPrint(sale)}>
                                <div className="bg-slate-100 p-2 rounded-lg text-slate-600">
                                <Printer className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col">
                                <span className="font-bold text-xs text-slate-700">Quick Print Slip</span>
                                <span className="text-[10px] text-slate-500 font-medium">Thermal receipt copy</span>
                                </div>
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </motion.tr>
                    ))}
                </AnimatePresence>
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-32">
                    <div className="flex flex-col items-center gap-4 opacity-30">
                      <div className="p-6 bg-slate-100 rounded-full">
                        <ShoppingCart className="h-12 w-12 stroke-[1px]" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-bold uppercase tracking-[0.2em]">No records found</p>
                        <p className="text-[10px] font-medium mt-1">Try adjusting your date range or search terms.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <CardFooter className="flex items-center justify-between py-4 border-t border-slate-100 px-6 bg-slate-50/30">
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Records <span className="text-slate-600 font-black">{pagination.page}</span> of <span className="text-slate-600 font-black">{pagination.totalPages}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
              >
                <ChevronLeftIcon className="mr-2 h-3.5 w-3.5" /> Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 rounded-xl border-slate-200 font-bold text-[10px] uppercase tracking-widest transition-all active:scale-95"
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page === pagination.totalPages}
              >
                Next <ChevronRight className="ml-2 h-3.5 w-3.5" />
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default SalesHistory;
