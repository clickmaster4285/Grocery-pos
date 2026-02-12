"use client";

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Package, Tags, Bookmark, Loader2, X, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const ProductStatsCards = ({
  stats,
  loading,
  filters,
  onFilterChange
}) => {
  const activeCategory = stats?.categoryStats?.find(c => c._id === filters.category);
  const activeBrand = stats?.brandStats?.find(b => b._id === filters.brand);

  const handleFilterUpdate = (key, value) => {
    // Ensure we send undefined instead of 'all' or literal 'undefined' string
    const newValue = (value === 'all' || !value) ? undefined : value;
    onFilterChange({ ...filters, [key]: newValue });
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {/* Total Products Card */}
      <Card className="border-2 border-primary shadow-sm overflow-hidden h-36">
        <CardContent className="p-0 h-full flex">
          <div className="w-12 bg-primary/5 flex items-center justify-center border-r">
            <Package className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 p-3 flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-0.5">Inventory</p>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <div className="flex items-baseline gap-1.5">
                <div className="text-2xl font-black leading-none">{stats?.totalProducts || 0}</div>
                <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">Items Total</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Category Filter Card */}
      <Card className={`border-2 shadow-sm overflow-hidden transition-all h-36 ${filters.category ? 'border-emerald-500 bg-emerald-50/10' : 'border-emerald-500/10'}`}>
        <CardContent className="p-0 h-full flex flex-col">
          <div className="flex items-center justify-between px-3 pt-2">
            <div className="flex items-center gap-1.5">
              <Tags className="h-3 w-3 text-emerald-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Category</span>
            </div>
            {filters.category && (
              <Badge variant="outline" className="h-4 px-1 text-[8px] border-emerald-200 text-emerald-700 bg-emerald-100 flex gap-1 items-center">
                Filtered <X className="h-2 w-2 cursor-pointer" onClick={() => handleFilterUpdate('category', undefined)} />
              </Badge>
            )}
          </div>

          <div className="flex-1 px-3 pb-2 flex flex-col justify-center gap-1.5 mt-1">
            <div className="flex items-baseline gap-1.5">
              <div className="text-xl font-black leading-none">
                {activeCategory ? activeCategory.count : (stats?.categoryStats?.length || 0)}
              </div>
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                {activeCategory ? 'In selection' : 'Active Groups'}
              </span>
            </div>

            <Select
              value={filters.category || "all"}
              onValueChange={(val) => handleFilterUpdate('category', val)}
            >
              <SelectTrigger className="h-7 text-[10px] font-bold border-emerald-200 bg-background/50 hover:bg-background focus:ring-emerald-500">
                <SelectValue placeholder="Quick Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Categories</SelectItem>
                {stats?.categoryStats?.map((cat) => (
                  <SelectItem key={cat._id} value={cat._id} className="text-xs font-medium">
                    {cat.name} ({cat.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Brand Filter Card */}
      <Card className={`border-2 shadow-sm overflow-hidden transition-all h-36 ${filters.brand ? 'border-sky-500 bg-sky-50/10' : 'border-sky-500/10'}`}>
        <CardContent className="p-0 h-full flex flex-col">
          <div className="flex items-center justify-between px-3 pt-2">
            <div className="flex items-center gap-1.5">
              <Bookmark className="h-3 w-3 text-sky-600" />
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-600">Brand</span>
            </div>
            {filters.brand && (
              <Badge variant="outline" className="h-4 px-1 text-[8px] border-sky-200 text-sky-700 bg-sky-100 flex gap-1 items-center">
                Filtered <X className="h-2 w-2 cursor-pointer" onClick={() => handleFilterUpdate('brand', undefined)} />
              </Badge>
            )}
          </div>

          <div className="flex-1 px-3 pb-2 flex flex-col justify-center gap-1.5 mt-1">
            <div className="flex items-baseline gap-1.5">
              <div className="text-xl font-black leading-none">
                {activeBrand ? activeBrand.count : (stats?.brandStats?.length || 0)}
              </div>
              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                {activeBrand ? 'In selection' : 'Active Brands'}
              </span>
            </div>

            <Select
              value={filters.brand || "all"}
              onValueChange={(val) => handleFilterUpdate('brand', val)}
            >
              <SelectTrigger className="h-7 text-[10px] font-bold border-sky-200 bg-background/50 hover:bg-background focus:ring-sky-500">
                <SelectValue placeholder="Quick Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Brands</SelectItem>
                {stats?.brandStats?.map((brand) => (
                  <SelectItem key={brand._id} value={brand._id} className="text-xs font-medium">
                    {brand.name} ({brand.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductStatsCards;
