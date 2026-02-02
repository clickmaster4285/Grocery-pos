"use client";

import React from "react";
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
  Package,
  TrendingUp,
  ShoppingCart,
  Layers,
  Box,
  MoreHorizontal,
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
  Legend,
} from "recharts";

// --- Mock Data ---
const salesData = [
  { time: "9 AM", value: 0 },
  { time: "10 AM", value: 500 },
  { time: "11 AM", value: 1000 },
  { time: "12 PM", value: 2000 },
  { time: "1 PM", value: 2400 },
  { time: "2 PM", value: 1800 },
  { time: "3 PM", value: 2300 },
  { time: "4 PM", value: 2600 },
  { time: "5 PM", value: 3100 },
  { time: "6 PM", value: 2800 },
  { time: "7 PM", value: 1800 },
  { time: "8 PM", value: 1200 },
];

const paymentData = [
  { name: "Card", value: 65, color: "#ea580c" }, // Orange-600
  { name: "Cash", value: 20, color: "#9ca3af" }, // Gray-400
  { name: "Digital Wallet", value: 10, color: "#e5e7eb" }, // Gray-200
  { name: "Other", value: 5, color: "#f3f4f6" }, // Gray-100
];

const topSellingProducts = [
  { name: "Milk 1L", price: "$2,340" },
  { name: "Eggs (Dozen)", price: "$1,980" },
  { name: "Bread", price: "$1,620" },
  { name: "Apples", price: "$1,310" },
];

const lowStockAlerts = [
  { name: "Rice 5kg", status: "Critical", variant: "destructive" },
  { name: "Cooking Oil", status: "Low", variant: "warning" },
  { name: "Sugar", status: "Low", variant: "warning" },
];

const activePromotions = [
  { name: "Buy 1 Get 1 - Snacks", value: "$2,340" },
  { name: "10% Off Dairy", value: "$1,980" },
  { name: "Weekend Combo Deal", value: "$1,620" },
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Real-time store performance snapshot
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <Button variant="outline" className="bg-white">
            <FileText className="mr-2 h-4 w-4" /> View Reports
          </Button>
          <Button variant="outline" className="bg-white">
            <Package className="mr-2 h-4 w-4" /> Manage Inventory
          </Button>
        </div>
      </div>

      {/* --- KPI Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Sales Today (Highlighted) */}
        <Card className="border-orange-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-orange-500"></div>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-500 text-sm">Sales Today</span>
              <div className="p-2 bg-orange-50 rounded-md">
                <TrendingUp className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-semibold text-gray-900">$6,250</h3>
              <span className="text-green-500 text-sm font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> +8.4%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Transactions */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-500 text-sm">Transactions Today</span>
              <div className="p-2 bg-orange-50 rounded-md">
                <ShoppingCart className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-semibold text-gray-900">426</h3>
              <span className="text-green-500 text-sm font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> +8.4%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Avg Transaction */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-500 text-sm">Avg. Transaction Value</span>
              <div className="p-2 bg-orange-50 rounded-md">
                <Layers className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-semibold text-gray-900">$43.30</h3>
              <span className="text-green-500 text-sm font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> +8.4%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Items Sold */}
        <Card className="shadow-sm">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <span className="text-gray-500 text-sm">Items Sold</span>
              <div className="p-2 bg-orange-50 rounded-md">
                <Box className="h-5 w-5 text-orange-500" />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <h3 className="text-4xl font-semibold text-gray-900">2,184</h3>
              <span className="text-green-500 text-sm font-medium flex items-center">
                <TrendingUp className="h-3 w-3 mr-1" /> +8.4%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Main Charts Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Line Chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-800">
                Sales by Hour
              </CardTitle>
              <CardDescription className="text-green-600 font-medium">
                Today
              </CardDescription>
            </div>
            <Select defaultValue="today">
              <SelectTrigger className="w-35 text-gray-500 bg-gray-50 border-gray-200">
                <SelectValue placeholder="Select" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Sales by Hour</SelectItem>
                <SelectItem value="week">Sales by Week</SelectItem>
              </SelectContent>
            </Select>
          </CardHeader>
          <CardContent>
            <div className="h-75 w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="time"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 12 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#ea580c"
                    strokeWidth={3}
                    dot={{ fill: "#ea580c", strokeWidth: 2, r: 4, stroke: "#fff" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Donut Chart */}
        <Card className="shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-800">
              Sales by Payment Method
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col items-center justify-center">
            <div className="h-62.5 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Legend matching the image layout */}
              <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500">
                {paymentData.map((item, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></span>
                    {item.name}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* --- Bottom Lists Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Selling Products */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">
              Top Selling Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topSellingProducts.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0 border-gray-100"
                >
                  <span className="text-gray-600 font-medium text-sm">
                    {product.name}
                  </span>
                  <span className="text-gray-500 text-sm">{product.price}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alerts */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {lowStockAlerts.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0 border-gray-100"
                >
                  <span className="text-gray-600 font-medium text-sm">
                    {item.name}
                  </span>
                  <Badge
                    variant={item.variant === "destructive" ? "destructive" : "secondary"}
                    className={`text-xs font-normal px-2 py-0.5 rounded-sm ${item.variant === "destructive"
                        ? "bg-red-100 text-red-600 hover:bg-red-100"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-100"
                      }`}
                  >
                    {item.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Promotions */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-gray-800">
              Active Promotions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activePromotions.map((promo, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between pb-4 border-b last:border-0 last:pb-0 border-gray-100"
                >
                  <span className="text-gray-600 font-medium text-sm">
                    {promo.name}
                  </span>
                  <span className="text-gray-500 text-sm">{promo.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}