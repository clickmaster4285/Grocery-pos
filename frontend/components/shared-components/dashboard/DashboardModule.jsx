"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  TrendingUp,
  ShoppingCart,
  Layers,
  Box,
  Loader2,
  PackageSearch,
  BellRing,
  Megaphone,
  Zap,
  Building2,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useDashboardHook } from "@/hooks/useDashboardHook";
import { formatCurrency } from "@/utils/formatters";
import { useAuth } from "@/hooks/useAuth";
import { useGetAllBranches } from "@/features/branch.api";

const COLORS = ["#ea580c", "#94a3b8", "#64748b", "#cbd5e1"];

export default function Dashboard() {
  const [period, setPeriod] = useState("today");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const router = useRouter();
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin';
  const branchId = selectedBranch === "all" ? null : selectedBranch;
  
  const {
    summaryQuery,
    salesChartQuery,
    paymentMethodsQuery,
    topProductsQuery,
    lowStockAlertsQuery,
    activePromotionsQuery
  } = useDashboardHook(period, branchId);

  const { data: branchesData } = useGetAllBranches({ enabled: isAdmin });
  const branches = branchesData?.data || [];

  const summary = summaryQuery.data || {
    totalCollection: 0,
    totalSales: 0,
    totalItemsSold: 0,
    avgTransactionValue: 0,
  };

  return (
    <div className="min-h-screen bg-slate-50/30 p-4 md:p-6">
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Executive Dashboard</h1>
          <p className="text-slate-500 text-sm font-medium">
            Real-time operational overview and performance analytics.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Selector for Admin */}
          {isAdmin && (
            <div className="flex items-center gap-2">
               <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-50 h-11 bg-white border-slate-200 rounded-xl shadow-sm text-slate-600 font-semibold">
                    <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <SelectValue placeholder="All Branches" />
                    </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                  <SelectItem value="all">All Branches</SelectItem>
                  {branches.map((branch) => (
                    <SelectItem key={branch._id} value={branch._id}>
                      {branch.branch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedBranch !== "all" && (
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-11 w-11 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => setSelectedBranch("all")}
                >
                    <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}

          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-45 h-11 bg-white border-slate-200 rounded-xl shadow-sm text-slate-600 font-semibold">
              <SelectValue placeholder="Select Period" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-100 shadow-xl">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="last_7_days">Last 7 Days</SelectItem>
              <SelectItem value="last_30_days">Last 30 Days</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="this_year">This Year</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => router.push('workflow')}
            className="h-11 px-5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold shadow-xl shadow-orange-500/20 border-none transition-all hover:scale-105 active:scale-95"
          >
            <Zap className="mr-2 h-4 w-4 fill-current" /> Project Workflow
          </Button>
          <Button variant="outline" className="h-11 px-5 rounded-xl bg-white border-slate-200 text-slate-600 font-semibold shadow-sm hover:bg-slate-50">
            <FileText className="mr-2 h-4 w-4 text-slate-400" /> Export Reports
          </Button>
        </div>
      </div>

      {/* --- KPI Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Revenue Card */}
        <Card className="border-none shadow-sm rounded-2xl bg-slate-900 overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total Revenue</span>
                {summaryQuery.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500 mt-2" />
                ) : (
                  <h3 className="text-2xl font-bold text-white tabular-nums mt-1">
                    {formatCurrency(summary.totalCollection)}
                  </h3>
                )}
              </div>
              <div className="p-2.5 bg-white/10 rounded-xl group-hover:scale-110 transition-transform">
                <TrendingUp className="h-5 w-5 text-orange-400" />
              </div>
            </div>
            <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-orange-500/20 text-orange-400 border-none text-[10px] font-bold">
                    LIVE
                </Badge>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Sync Active</span>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Card */}
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Transactions</span>
                {summaryQuery.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-300 mt-2" />
                ) : (
                  <h3 className="text-2xl font-bold text-slate-800 tabular-nums mt-1">
                    {summary.totalSales}
                  </h3>
                )}
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                <ShoppingCart className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Order Volume</span>
            </div>
          </CardContent>
        </Card>

        {/* Avg Value Card */}
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Avg Ticket</span>
                {summaryQuery.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-300 mt-2" />
                ) : (
                  <h3 className="text-2xl font-bold text-slate-800 tabular-nums mt-1">
                    {formatCurrency(summary.avgTransactionValue)}
                  </h3>
                )}
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                <Layers className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Per Sale</span>
            </div>
          </CardContent>
        </Card>

        {/* Items Sold Card */}
        <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden group">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex flex-col">
                <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Units Sold</span>
                {summaryQuery.isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-300 mt-2" />
                ) : (
                  <h3 className="text-2xl font-bold text-slate-800 tabular-nums mt-1">
                    {summary.totalItemsSold}
                  </h3>
                )}
              </div>
              <div className="p-2.5 bg-slate-50 rounded-xl group-hover:scale-110 transition-transform">
                <Box className="h-5 w-5 text-slate-400" />
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Inventory Flow</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Main Charts Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 shadow-sm rounded-2xl border-none bg-white overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-0 px-6 pt-6">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800">Sales Trend</CardTitle>
              <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
                {period.replace(/_/g, ' ')} performance
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-6">
            <div className="h-80 w-full mt-4">
              {salesChartQuery.isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-orange-500/20" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesChartQuery.data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="time"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 700 }}
                      tickFormatter={(value) => `Rs.${value}`}
                    />
                    <Tooltip
                      contentStyle={{ 
                        borderRadius: "16px", 
                        border: "none", 
                        boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                        padding: "12px"
                      }}
                      itemStyle={{ fontWeight: 700, fontSize: '12px' }}
                      labelStyle={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', fontSize: '10px', marginBottom: '4px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#ea580c"
                      strokeWidth={4}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0, fill: '#ea580c' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="shadow-sm rounded-2xl border-none bg-white overflow-hidden">
          <CardHeader className="pb-0 px-6 pt-6">
            <CardTitle className="text-lg font-bold text-slate-800">Payments</CardTitle>
            <CardDescription className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-1">
              Method Distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="h-64 w-full relative">
              {paymentMethodsQuery.isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-slate-200" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentMethodsQuery.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={95}
                      paddingAngle={8}
                      dataKey="value"
                      stroke="none"
                    >
                      {paymentMethodsQuery.data?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                        contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            <div className="grid grid-cols-2 gap-y-3 gap-x-6 mt-6 w-full">
              {paymentMethodsQuery.data?.map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {item.name}
                    </span>
                    <span className="text-xs font-bold text-slate-700 tabular-nums">
                        {formatCurrency(item.value)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Bottom Lists Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <Card className="shadow-sm rounded-2xl border-none bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between py-5 px-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                    <PackageSearch className="h-4 w-4 text-orange-500" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                  Best Sellers
                </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {topProductsQuery.data?.length > 0 ? (
                topProductsQuery.data.map((product, index) => (
                    <div key={index} className="flex items-center justify-between py-4 px-6 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 line-clamp-1">{product.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          {product.quantity} Units Sold
                        </span>
                      </div>
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        {formatCurrency(product.revenue)}
                      </span>
                    </div>
                ))
            ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No Data Available</div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="shadow-sm rounded-2xl border-none bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between py-5 px-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-red-50 rounded-lg">
                    <BellRing className="h-4 w-4 text-red-500" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                  Stock Alerts
                </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
             {lowStockAlertsQuery.data?.length > 0 ? (
                lowStockAlertsQuery.data.map((item, index) => (
                    <div key={index} className="flex items-center justify-between py-4 px-6 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 line-clamp-1">{item.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          SKU: {item.variantSku}
                        </span>
                      </div>
                      <Badge className="bg-red-50 text-red-600 border-none shadow-none font-bold text-[10px] h-6 px-2 rounded-lg">
                        {item.currentStock} REMAINING
                      </Badge>
                    </div>
                ))
             ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Stock Levels Healthy</div>
             )}
          </CardContent>
        </Card>

        {/* Active Promotions */}
        <Card className="shadow-sm rounded-2xl border-none bg-white overflow-hidden">
          <CardHeader className="border-b border-slate-50 flex flex-row items-center justify-between py-5 px-6">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                    <Megaphone className="h-4 w-4 text-blue-500" />
                </div>
                <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                  Live Offers
                </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {activePromotionsQuery.data?.length > 0 ? (
                activePromotionsQuery.data.map((promo, index) => (
                    <div key={index} className="flex items-center justify-between py-4 px-6 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700 line-clamp-1">{promo.name}</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                          {promo.amountType === 'percentage' ? `${promo.amountValue}% DISCOUNT` : `${formatCurrency(promo.amountValue)} OFF`}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Active</span>
                      </div>
                    </div>
                ))
            ) : (
                <div className="p-8 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">No Active Promotions</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
