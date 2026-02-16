"use client";

import React, { useMemo, useState } from 'react';
import { useGetAllProducts, useGetProductStats } from '@/features/product.api';
import ProductTable from './ProductTable';
import ProductStatsCards from './ProductStatsCards';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PlusCircle, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce'; 

const ProductsPage = ({ role }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ category: undefined, brand: undefined });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const queryFilters = useMemo(() => ({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearchTerm,
    category: filters.category,
    brand: filters.brand,
  }), [pagination, debouncedSearchTerm, filters]);

  const { data, isLoading, isError, error } = useGetAllProducts(queryFilters);
  const { data: stats, isLoading: statsLoading } = useGetProductStats();

  const handleCreateProduct = () => {
    router.push(`/${role}/inventory/products/create`);
  };

  const handleEditProduct = (productId) => {
    router.push(`/${role}/inventory/products/${productId}/edit`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black tracking-tight uppercase">Product Inventory</h2>
          <p className="text-muted-foreground font-medium">
            Manage store items, monitor stock distribution, and track suppliers.
          </p>
        </div>
        <Button onClick={handleCreateProduct} className="shadow-lg shadow-primary/20 font-bold">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add New Product
        </Button>
      </div>

      {/* Stats & Filter Cards */}
      <ProductStatsCards 
        stats={stats} 
        loading={statsLoading} 
        filters={filters}
        onFilterChange={setFilters}
      />

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          type="search"
          placeholder="Smart Search: Type product name, SKU, or barcode (handles typos automatically)..."
          className="w-full pl-10 h-11 text-sm font-medium border-2 focus-visible:ring-primary/10 shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Products Table */}
      <Card className="border-none shadow-none">
        <ProductTable
            products={data?.products}
            isLoading={isLoading}
            isError={isError}
            error={error}
            pagination={pagination}
            setPagination={setPagination}
            pageCount={data?.totalPages ?? -1}
            role={role}
            onEditProduct={handleEditProduct}
        />
      </Card>
    </div>
  );
}

export default ProductsPage;