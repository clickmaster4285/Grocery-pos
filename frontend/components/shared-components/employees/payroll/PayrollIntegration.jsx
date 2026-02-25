'use client';

import React, { useMemo, useState } from 'react';
import {
  Banknote,
  Wallet,
  Search,
  Download,
  Landmark,
  CreditCard,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  FileSpreadsheet
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { useStaffList } from '@/features/users.api';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { formatCurrency } from '@/utils/formatters';

const PayrollIntegration = () => {
  const router = useRouter();
  const { data: staff = [], isLoading } = useStaffList();
  const { currentUserRole } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStaff = useMemo(() => {
    return staff.filter(user =>
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employment?.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  const stats = useMemo(() => {
    const total = filteredStaff.reduce((sum, u) => sum + (u.salary?.baseAmount || 0), 0);
    const avg = filteredStaff.length > 0 ? total / filteredStaff.length : 0;
    const byMethod = filteredStaff.reduce((acc, u) => {
      const m = u.salary?.paymentMethod || 'CASH';
      acc[m] = (acc[m] || 0) + (u.salary?.baseAmount || 0);
      return acc;
    }, {});

    return { total, avg, byMethod };
  }, [filteredStaff]);

  if (isLoading) return <div className="p-8 text-center">Loading payroll data...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payroll Integration</h1>
          <p className="text-muted-foreground text-sm">Manage compensation and payment distributions</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="gap-2">
            <FileSpreadsheet className="h-4 w-4" /> Export Report
          </Button>
          <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Wallet className="h-4 w-4" /> Process Payroll
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-primary">Monthly Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold">{formatCurrency(stats.total)}</span>
              <div className="p-2 bg-primary/10 rounded-lg">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-emerald-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Bank Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-emerald-700">{formatCurrency(stats.byMethod['BANK_TRANSFER'] || 0)}</span>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Landmark className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-amber-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Cash Payments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-amber-700">{formatCurrency(stats.byMethod['CASH'] || 0)}</span>
              <div className="p-2 bg-amber-100 rounded-lg">
                <Banknote className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-600">Avg per Employee</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-slate-700">{formatCurrency(Math.round(stats.avg))}</span>
              <div className="p-2 bg-slate-200 rounded-lg">
                <TrendingUp className="h-4 w-4 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-white border-b py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Payroll Register
            </CardTitle>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search employee or bank..."
                className="pl-9 bg-muted/20 border-none h-9 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 hover:bg-muted/30">
                  <TableHead>Employee</TableHead>
                  <TableHead>Designation</TableHead>
                  <TableHead>Pay Type</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Bank Info</TableHead>
                  <TableHead className="text-right">Base Salary</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((user) => (
                  <TableRow key={user._id} className="hover:bg-muted/5 group border-b">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="sm" />
                        <div>
                          <p className="text-sm font-bold">{user.firstName} {user.lastName}</p>
                          <p className="text-[10px] text-muted-foreground uppercase">{user.employment?.department}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">
                      {user.employment?.designation || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {user.salary?.payType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-xs">
                        {user.salary?.paymentMethod === 'BANK_TRANSFER' ? (
                          <><Landmark className="h-3 w-3 text-blue-500" /> Transfer</>
                        ) : (
                          <><Banknote className="h-3 w-3 text-emerald-500" /> Cash</>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.salary?.paymentMethod === 'BANK_TRANSFER' ? (
                        <div className="space-y-0.5">
                          <p className="text-[10px] font-bold text-foreground">{user.salary.bankDetails?.bankName}</p>
                          <p className="text-[9px] font-mono text-muted-foreground">{user.salary.bankDetails?.accountNumber}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic">No bank info</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono font-bold text-sm">
                      {formatCurrency(user.salary?.baseAmount || 0)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/${currentUserRole}/employees/${user._id}`)}>
                            View Financials
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => router.push(`/${currentUserRole}/employees/${user._id}/edit`)}>
                            Update Salary
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PayrollIntegration;
