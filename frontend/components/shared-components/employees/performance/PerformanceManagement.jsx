'use client';

import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  Search, 
  Star, 
  Zap, 
  BarChart3, 
  Target, 
  Award,
  AlertCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight
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
import { useStaffList } from '@/features/users.api';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { Progress } from "@/components/ui/progress";

const PerformanceManagement = () => {
  const router = useRouter();
  const { data: staff = [], isLoading } = useStaffList();
  const { currentUserRole } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');

  // Mock performance data generation
  const filteredStaff = useMemo(() => {
    return staff.map(user => ({
      ...user,
      metrics: {
        avgTransactionValue: Math.floor(Math.random() * 50) + 20,
        scanRate: (Math.random() * 15 + 10).toFixed(1),
        customerRating: (Math.random() * 1.5 + 3.5).toFixed(1),
        accuracy: Math.floor(Math.random() * 5 + 95),
        voidRate: (Math.random() * 2).toFixed(1),
        trend: Math.random() > 0.3 ? 'up' : 'down'
      }
    })).filter(user => 
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employment?.department?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [staff, searchTerm]);

  const topPerformer = useMemo(() => {
    if (!filteredStaff.length) return null;
    return [...filteredStaff].sort((a, b) => b.metrics.customerRating - a.metrics.customerRating)[0];
  }, [filteredStaff]);

  if (isLoading) return <div className="p-8 text-center">Loading performance metrics...</div>;

  return (
    <div className="p-4 md:p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Performance Analytics</h1>
          <p className="text-muted-foreground text-sm">Real-time tracking of staff efficiency and service quality</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search staff or department..." 
            className="pl-9 bg-white shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topPerformer && (
          <Card className="border-none shadow-md bg-linear-to-br from-indigo-600 to-violet-700 text-white overflow-hidden relative">
            <Award className="absolute -right-4 -bottom-4 h-32 w-32 text-white/10 rotate-12" />
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold uppercase tracking-[0.2em] text-white/80 flex items-center gap-2">
                <Target className="h-3 w-3" /> Month's MVP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <UserAvatar user={topPerformer} size="lg" className="border-2 border-white/20" />
                <div>
                  <h3 className="text-xl font-bold">{topPerformer.firstName} {topPerformer.lastName}</h3>
                  <p className="text-sm text-indigo-100">{topPerformer.employment?.designation}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    <span className="text-sm font-bold">{topPerformer.metrics.customerRating}</span>
                    <span className="text-[10px] text-white/60 ml-1">Avg Rating</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-sm bg-white border border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Global Scan Rate</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900">14.2</span>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mb-1">
                <ArrowUpRight className="h-3 w-3" /> 8.4%
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Items per minute (Company Average)</p>
            <Progress value={75} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white border border-slate-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Error Threshold</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end justify-between">
              <span className="text-3xl font-bold text-slate-900">98.8%</span>
              <div className="flex items-center gap-1 text-emerald-600 text-xs font-bold mb-1">
                <ArrowUpRight className="h-3 w-3" /> 0.2%
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Transaction accuracy rate</p>
            <Progress value={92} className="h-1.5 bg-slate-100" />
          </CardContent>
        </Card>
      </div>

      {/* Main Table */}
      <Card className="border-none shadow-lg overflow-hidden bg-white">
        <CardHeader className="border-b py-4 px-6 bg-muted/10">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2 text-slate-700">
              <BarChart3 className="h-4 w-4 text-primary" /> Performance Register
            </CardTitle>
            <Badge variant="secondary" className="font-mono">{filteredStaff.length} Employees Matched</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30 border-b">
                  <TableHead className="w-55 font-bold">Employee</TableHead>
                  <TableHead className="text-center font-bold">Avg. Transaction</TableHead>
                  <TableHead className="text-center font-bold">Scan Rate</TableHead>
                  <TableHead className="text-center font-bold">Accuracy</TableHead>
                  <TableHead className="text-center font-bold">Voids</TableHead>
                  <TableHead className="text-center font-bold">CSAT</TableHead>
                  <TableHead className="text-right font-bold pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaff.map((user) => (
                  <TableRow key={user._id} className="hover:bg-muted/5 group transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <UserAvatar user={user} size="sm" />
                        <div>
                          <p className="text-sm font-bold text-slate-900 leading-none">{user.firstName} {user.lastName}</p>
                          <p className="text-[10px] text-muted-foreground mt-1 font-medium">{user.employment?.department}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-mono font-bold">${user.metrics.avgTransactionValue}</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-bold">{user.metrics.scanRate}</span>
                        <span className="text-[9px] text-muted-foreground italic">i/m</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={cn(
                        "text-xs font-bold px-2 py-0.5 rounded-full",
                        user.metrics.accuracy > 98 ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
                      )}>
                        {user.metrics.accuracy}%
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className="text-xs font-mono text-muted-foreground">{user.metrics.voidRate}%</span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 font-bold text-xs text-slate-700">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                        {user.metrics.customerRating}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {user.metrics.trend === 'up' ? (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                            <TrendingUp className="h-3 w-3" /> IMPROVING
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                            <AlertCircle className="h-3 w-3" /> STAGNANT
                          </div>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7"
                          onClick={() => router.push(`/${currentUserRole}/employees/${user._id}`)}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
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

export default PerformanceManagement;
