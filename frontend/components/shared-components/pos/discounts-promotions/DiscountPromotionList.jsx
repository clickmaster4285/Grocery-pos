'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDiscountHook } from '@/hooks/useDiscountHook';
import DiscountTable from './DiscountTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  Search, 
  Filter, 
  Tag, 
  RefreshCcw,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useDebounce } from '@/hooks/useDebounce';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import PageHeader from '@/components/shared-components/PageHeader';

const DiscountPromotionList = ({ role }) => {
  const router = useRouter();
  const [params, setParams] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: '',
    type: ''
  });

  const debouncedSearch = useDebounce(params.search, 500);
  const { 
    getAllDiscountsQuery, 
    deleteDiscountMutation 
  } = useDiscountHook(null, { ...params, search: debouncedSearch });

  const [deleteId, setDeleteId] = useState(null);

  const handleSearch = (e) => {
    setParams({ ...params, search: e.target.value, page: 1 });
  };

  const handleStatusChange = (value) => {
    setParams({ ...params, status: value === 'all' ? '' : value, page: 1 });
  };

  const handleTypeChange = (value) => {
    setParams({ ...params, type: value === 'all' ? '' : value, page: 1 });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteDiscountMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const onEdit = (id) => {
    router.push(`/${role}/pos/discounts-promotions/${id}`);
  };

  const onView = (id) => {
    router.push(`/${role}/pos/discounts-promotions/${id}/detail`);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Discounts & Promotions"
        description="Manage your store-wide offers, BOGO deals, and coupon codes."
        actions={
          <Button 
            onClick={() => router.push(`/${role}/pos/discounts-promotions/form`)}
            className="bg-primary hover:bg-primary/90 gap-2 shadow-lg h-11 rounded-xl font-bold"
          >
            <Plus size={18} />
            Create New Promotion
          </Button>
        }
      />

      <Card className="border-none shadow-md bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter size={18} className="text-primary" />
            Filters & Search
          </CardTitle>
          <CardDescription>
            Find specific promotions by name, code, or type.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative col-span-1 md:col-span-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or coupon code..."
                value={params.search}
                onChange={handleSearch}
                className="pl-10 bg-background/50"
              />
            </div>
            <Select onValueChange={handleStatusChange} defaultValue="all">
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={handleTypeChange} defaultValue="all">
              <SelectTrigger className="bg-background/50">
                <SelectValue placeholder="Promotion Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Discount">Standard Discount</SelectItem>
                <SelectItem value="BOGO">BOGO Deal</SelectItem>
                <SelectItem value="Mix & Match">Mix & Match</SelectItem>
                <SelectItem value="Bundle">Bundle Offer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="relative min-h-100">
        <DiscountTable
          discounts={getAllDiscountsQuery.data?.data || []}
          isLoading={getAllDiscountsQuery.isLoading}
          onEdit={onEdit}
          onView={onView}
          onDelete={(id) => setDeleteId(id)}
        />
        
        {getAllDiscountsQuery.isError && (
          <div className="flex flex-col items-center justify-center py-12 text-destructive gap-4 bg-destructive/5 rounded-lg border border-destructive/20 mt-4">
            <AlertCircle size={48} />
            <div className="text-center">
              <p className="font-bold text-lg">Failed to load promotions</p>
              <p className="text-sm opacity-80">{getAllDiscountsQuery.error?.message}</p>
            </div>
            <Button variant="outline" onClick={() => getAllDiscountsQuery.refetch()}>
              <RefreshCcw size={16} className="mr-2" />
              Try Again
            </Button>
          </div>
        )}
      </div>

      {/* Pagination - Simplified for now */}
      {!getAllDiscountsQuery.isLoading && getAllDiscountsQuery.data?.totalPages > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setParams({ ...params, page: Math.max(1, params.page - 1) })}
            disabled={params.page === 1}
          >
            Previous
          </Button>
          <div className="text-sm font-medium">
            Page {params.page} of {getAllDiscountsQuery.data?.totalPages}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setParams({ ...params, page: Math.min(getAllDiscountsQuery.data?.totalPages, params.page + 1) })}
            disabled={params.page === getAllDiscountsQuery.data?.totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the promotion
              and it will no longer be applied to any transactions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Promotion
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default DiscountPromotionList;
