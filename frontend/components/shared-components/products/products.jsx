"use client";

import React, { useState, useMemo } from 'react';
import { useGetAllProducts } from '@/features/product.api';
import ProductTable from './ProductTable';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce'; // Assuming you have a debounce hook

const ProductsPage = ({ role }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const queryFilters = useMemo(() => ({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    search: debouncedSearchTerm,
    ...filters,
  }), [pagination, debouncedSearchTerm, filters]);

  const { data, isLoading, isError, error } = useGetAllProducts(queryFilters);

  const handleCreateProduct = () => {
    router.push(`/${role}/products/create`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Products</h2>
          <p className="text-muted-foreground">
            Manage your store's products and inventory.
          </p>
        </div>
        <Button onClick={handleCreateProduct}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search products..."
          className="w-full pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <ProductTable
        products={data?.products}
        isLoading={isLoading}
        isError={isError}
        error={error}
        pagination={pagination}
        setPagination={setPagination}
        pageCount={data?.totalPages ?? -1}
        role={role}
      />
    </div>
  );
};

export default ProductsPage;