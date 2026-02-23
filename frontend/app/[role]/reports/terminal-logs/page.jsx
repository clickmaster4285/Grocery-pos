'use client';

import React, { useState, useMemo } from 'react';
import { useGetTerminalShiftReports } from '@/features/terminalShiftReport.api';
import { usePermissions } from '@/hooks/usePermissions';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/utils/formatters';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, MonitorSmartphone, User, Building2, Calendar, FileText, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { PaginationComponent } from '@/components/shared-components/Pagination';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';

const TerminalLogsPage = () => {
  const { isAdmin } = usePermissions();
  const [filters, setFilters] = useState({
    terminalId: '',
    userName: '',
    branchName: '',
    page: 1,
    limit: 10,
  });
  const [dateRange, setDateRange] = useState({
    from: null,
    to: null,
  });

  const debouncedTerminalId = useDebounce(filters.terminalId, 500);
  const debouncedUserName = useDebounce(filters.userName, 500);
  const debouncedBranchName = useDebounce(filters.branchName, 500);

  const queryParams = useMemo(() => ({
    ...filters,
    terminalId: debouncedTerminalId,
    userName: debouncedUserName,
    branchName: debouncedBranchName,
    startDate: dateRange.from ? dateRange.from.toISOString() : undefined,
    endDate: dateRange.to ? dateRange.to.toISOString() : undefined,
  }), [filters, debouncedTerminalId, debouncedUserName, debouncedBranchName, dateRange]);

  const { data: reportsData, isLoading, isError, error } = useGetTerminalShiftReports(queryParams);
  const reports = reportsData?.data || [];
  const totalPages = reportsData?.pagination?.totalPages || 1;

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      terminalId: '',
      userName: '',
      branchName: '',
      page: 1,
      limit: 10,
    });
    setDateRange({ from: null, to: null });
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  if (isError) {
    return (
      <div className="p-10 text-center space-y-4">
        <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 inline-block">
            Error loading reports: {error.message}
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Terminal Shift Reports</h1>
          <p className="text-[13px] font-medium text-slate-500">Review and audit historical shift data for POS terminals.</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={clearFilters}
          className="h-9 rounded-lg border-slate-200 text-slate-600 hover:bg-slate-50 gap-2"
        >
          <X className="h-4 w-4" /> Clear All Filters
        </Button>
      </div>

      <Card className="shadow-sm border-slate-200/60 overflow-hidden rounded-xl">
        <CardHeader className="border-b bg-slate-50/30 py-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
            <Search className="h-4 w-4 text-primary" /> Smart Search & Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <MonitorSmartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Terminal ID..."
              value={filters.terminalId}
              onChange={(e) => handleFilterChange('terminalId', e.target.value)}
              className="h-10 pl-9 rounded-lg border-slate-200 focus:ring-primary/20"
            />
          </div>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Cashier Name..."
              value={filters.userName}
              onChange={(e) => handleFilterChange('userName', e.target.value)}
              className="h-10 pl-9 rounded-lg border-slate-200 focus:ring-primary/20"
            />
          </div>
          {isAdmin && (
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search Branch Name..."
                value={filters.branchName}
                onChange={(e) => handleFilterChange('branchName', e.target.value)}
                className="h-10 pl-9 rounded-lg border-slate-200 focus:ring-primary/20"
              />
            </div>
          )}
          <DatePickerWithRange date={dateRange} setDate={setDateRange} />
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-slate-200/60 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="hover:bg-transparent border-slate-200/60">
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Terminal</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Cashier</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Branch</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Session Period</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 text-right">Opening</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 text-right">Expected</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 text-right">Closing</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 text-right">Variance</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4 text-center">Sales</TableHead>
                <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-500 py-4">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse border-slate-100">
                    <TableCell colSpan={10} className="h-16 bg-slate-50/20"></TableCell>
                  </TableRow>
                ))
              ) : reports.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="h-40 text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-slate-400">
                      <FileText className="h-8 w-8 opacity-20" />
                      <p className="font-medium italic">No shift reports found matching your criteria.</p>
                      <Button variant="link" onClick={clearFilters} className="text-primary text-xs">Reset Filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reports.map((report) => (
                  <TableRow key={report._id} className="h-16 hover:bg-slate-50/50 transition-colors border-slate-100">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-slate-700">{report.terminal?.name}</span>
                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
                           {report.terminal?.terminalId}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-semibold text-slate-600">{report.user?.firstName} {report.user?.lastName}</span>
                        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">{report.user?.userId}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-medium text-[11px] py-0.5 px-2">
                        {report.branch?.branch_name}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-[12px] font-medium text-slate-600">{new Date(report.openedAt).toLocaleDateString()}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {new Date(report.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {report.closedAt ? new Date(report.closedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Open'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-[13px] font-semibold tabular-nums text-slate-600">
                      {formatCurrency(report.openingFloat)}
                    </TableCell>
                    <TableCell className="text-right text-[13px] font-semibold tabular-nums text-slate-600">
                      {formatCurrency(report.expectedFloat)}
                    </TableCell>
                    <TableCell className="text-right text-[13px] font-semibold tabular-nums text-slate-900">
                      {formatCurrency(report.closingFloat)}
                    </TableCell>
                    <TableCell className="text-right text-[13px] font-bold tabular-nums">
                      <span className={cn(
                          report.variance === 0 ? "text-emerald-600" : 
                          report.variance > 0 ? "text-blue-600" : "text-rose-600"
                      )}>
                          {report.variance > 0 ? '+' : ''}{formatCurrency(report.variance)}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="bg-primary/5 text-primary text-[12px] font-bold px-2 py-1 rounded-md">
                        {report.totalSalesCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                          "text-[9px] font-bold uppercase tracking-widest border-none px-2",
                          report.status === 'Completed' 
                            ? "bg-emerald-100 text-emerald-700" 
                            : "bg-amber-100 text-amber-700"
                      )}>
                          {report.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex justify-center pt-2">
        <PaginationComponent
          currentPage={filters.page}
          totalPages={totalPages}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default TerminalLogsPage;
