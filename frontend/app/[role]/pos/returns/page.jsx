"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGetAllReturns } from '@/features/saleReturn.api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    RotateCcw,
    ArrowRightLeft,
    User,
    Store,
    Calendar,
    Search,
    Loader2,
    MoreVertical,
    History,
    PackageCheck,
    Trash2,
    DollarSign,
    Scale,
    Printer
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { format } from 'date-fns';
import { useDebounce } from '@/hooks/useDebounce';
import StatsCard from '@/components/ui/StatsCard';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useReactToPrint } from 'react-to-print';
import ReturnReceiptPrint from '@/components/shared-components/pos/sales/ReturnReceiptPrint';

const ReturnsManagementPage = () => {
    const { role } = useParams();
    const router = useRouter();

    // Default Dates (Today)
    const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

    // Filter States
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 500);
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);

    // Printing Logic
    const receiptRef = useRef(null);
    const [selectedForPrint, setSelectedForPrint] = useState(null);

    const { data: response, isLoading } = useGetAllReturns({
        search: debouncedSearch,
        startDate,
        endDate
    });

    const returns = response?.data;
    const stats = response?.stats;

    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Reprint-${selectedForPrint?.returnNumber}`,
    });

    const triggerPrint = (rtn) => {
        setSelectedForPrint(rtn);
    };

    useEffect(() => {
        if (selectedForPrint) {
            handlePrint();
            setSelectedForPrint(null);
        }
    }, [selectedForPrint, handlePrint]);

    return (
        <div className="space-y-6">
            {/* Hidden Receipt Component */}
            <div style={{ display: 'none' }}>
                <ReturnReceiptPrint
                    ref={receiptRef}
                    returnData={selectedForPrint}
                    originalSale={selectedForPrint?.originalSale}
                    branch={selectedForPrint?.branch}
                />
            </div>

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter uppercase italic text-primary">Returns & Exchanges</h1>
                    <p className="text-muted-foreground font-medium text-sm italic">Audit trail for all post-sale transactions</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium">
                    <Calendar className="h-4 w-4" />
                    <span>{startDate === endDate ? `Records for ${startDate}` : `${startDate} to ${endDate}`}</span>
                </div>
            </div>

            {/* STATUS CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatsCard
                    title="Restored Stock"
                    value={stats?.inventoryRestored || 0}
                    icon={<PackageCheck />}
                    color="emerald"
                    description="Units back in inventory"
                />
                <StatsCard
                    title="Wasted/Damaged"
                    value={stats?.totalDamages || 0}
                    icon={<Trash2 />}
                    color="rose"
                    description="Units written off"
                />
                <StatsCard
                    title="Total Refunded"
                    value={`$${(stats?.totalRefunded || 0).toFixed(2)}`}
                    icon={<DollarSign />}
                    color="sky"
                    description="Cash returned to customers"
                />
                <StatsCard
                    title="Exch. Balance"
                    value={`$${(stats?.exchangeBalance || 0).toFixed(2)}`}
                    icon={<Scale />}
                    color="primary"
                    description="Net difference from swaps"
                />
            </div>

            {/* Filter Toolbar */}
            <Card className="bg-muted/30">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2 space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider">Search Return ID</Label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by Return Number (RTN-...)"
                                className="pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider">Start Date</Label>
                        <Input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold uppercase tracking-wider">End Date</Label>
                        <Input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card className="shadow-sm border-2">
                <CardHeader className="bg-muted/30 border-b">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-primary" />
                        Activity Logs
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/50">
                            <TableRow>
                                <TableHead className="pl-6">Return Number</TableHead>
                                <TableHead>Orig. Bill</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Branch</TableHead>
                                <TableHead>Handled By</TableHead>
                                <TableHead className="text-right">Adjustment</TableHead>
                                <TableHead className="text-right pr-6">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                    </TableCell>
                                </TableRow>
                            ) : returns?.length > 0 ? (
                                returns.map((rtn) => (
                                    <TableRow key={rtn._id} className="hover:bg-muted/30 transition-colors group">
                                        <TableCell className="pl-6 font-mono font-bold text-primary">
                                            {rtn.returnNumber}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {rtn.originalSale?.billNumber}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={rtn.type === 'RETURN' ? 'destructive' : 'default'} className="font-bold gap-1">
                                                {rtn.type === 'RETURN' ? <RotateCcw className="h-3 w-3" /> : <ArrowRightLeft className="h-3 w-3" />}
                                                {rtn.type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs font-medium">
                                            {format(new Date(rtn.createdAt), 'dd MMM yyyy HH:mm')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                <Store className="h-3 w-3 text-muted-foreground" />
                                                {rtn.branch?.branch_name}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-xs font-bold">
                                                <User className="h-3 w-3 text-muted-foreground" />
                                                {rtn.performedBy?.firstName}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right font-black">
                                            {rtn.type === 'RETURN'
                                                ? <span className="text-red-600">-${rtn.totalRefundAmount.toFixed(2)}</span>
                                                : <span className={rtn.totalExchangeDifference > 0 ? 'text-amber-600' : 'text-green-600'}>
                                                    {rtn.totalExchangeDifference > 0 ? `+${rtn.totalExchangeDifference.toFixed(2)}` : `${rtn.totalExchangeDifference.toFixed(2)}`}
                                                </span>
                                            }
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors">
                                                        <MoreVertical className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-56 p-2 shadow-xl border-2">
                                                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-2 py-1.5">
                                                        Log Controls
                                                    </DropdownMenuLabel>
                                                    <DropdownMenuItem
                                                        className="gap-3 cursor-pointer py-3 rounded-xl"
                                                        onClick={() => triggerPrint(rtn)}
                                                    >
                                                        <div className="bg-primary/10 p-2 rounded-lg">
                                                            <Printer className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-xs">Reprint Receipt</span>
                                                            <span className="text-[10px] text-muted-foreground">Thermal audit copy</span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="gap-3 cursor-pointer py-3 rounded-xl"
                                                        onClick={() => router.push(`/${role}/pos/sales/history/${rtn.originalSale?._id}`)}
                                                    >
                                                        <div className="bg-blue-100 p-2 rounded-lg">
                                                            <History className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-xs">View Full History</span>
                                                            <span className="text-[10px] text-muted-foreground">See whole bill lifecycle</span>
                                                        </div>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-20 text-muted-foreground font-bold italic">
                                        No return or exchange records found in the audit trail.
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

export default ReturnsManagementPage;
