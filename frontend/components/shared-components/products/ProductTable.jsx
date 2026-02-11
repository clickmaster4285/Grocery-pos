"use client";

import React from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, Eye, Edit, Trash2, ChevronDown, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { DotsHorizontalIcon } from '@radix-ui/react-icons';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteProduct } from '@/features/product.api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export const columns = [
  {
    id: 'expander',
    header: ({ table }) => (
      <Button
        variant="ghost"
        size="sm"
        onClick={table.getToggleAllRowsExpandedHandler()}
      >
        {table.getIsAllRowsExpanded() ? 'Collapse All' : 'Expand All'}
      </Button>
    ),
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="sm"
        {...{
          onClick: row.getToggleExpandedHandler(),
          style: { cursor: row.getCanExpand() ? 'pointer' : 'default' },
        }}
      >
        {row.getIsExpanded() ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </Button>
    ),
  },
  {
    accessorKey: 'primaryImage',
    header: 'Image',
    cell: ({ row }) => {
      const firstVariantImages = row.original.variants?.[0]?.images;
      const imageUrl = firstVariantImages && firstVariantImages.length > 0
        ? firstVariantImages[0]
        : '/placeholder.png';
        
      return (
        <div className="w-10 h-10 relative">
          <Image
            src={`${API_URL}${imageUrl}`}
            alt={`Variant image`}
            width={80}
            height={80}
            className="rounded-md"
            preload={true}
            style={{ objectFit: 'cover' }}
            unoptimized={true}  // <--- ADD THIS
          />
        </div>
      );
    },
  },
  {
    accessorKey: 'productName',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Product Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div className="font-medium">{row.getValue('productName')}</div>,
  },
  {
    accessorKey: 'category',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Category
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.original.category?.name || 'N/A'}</div>,
  },
  {
    accessorKey: 'brand',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Brand
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => <div>{row.original.brand?.name || 'N/A'}</div>,
  },
  {
    accessorKey: 'totalStock',
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Total Stock
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => <div className="text-right font-bold">{row.getValue('totalStock')}</div>,
  },
  {
    accessorKey: 'lastRestocked',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Last Restocked
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = row.original.lastRestocked;
      return date ? new Intl.DateTimeFormat('en-US').format(new Date(date)) : 'N/A';
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row, table }) => {
      const product = row.original;
      const router = useRouter();
      const { role } = table.options.meta;
      const deleteProductMutation = useDeleteProduct();

      const handleDeleteProduct = async (productId) => {
        try {
          await deleteProductMutation.mutateAsync(productId);
        } catch (err) {
          // Error handling is already in the mutation's onError callback
        }
      };

      return (
        <div className="text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <DotsHorizontalIcon className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => router.push(`/${role}/products/${product._id}`)}>
                <Eye className="mr-2 h-4 w-4" /> View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => table.options.meta.onEditProduct(product._id)}>
                <Edit className="mr-2 h-4 w-4" /> Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-red-600">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will soft delete the product{' '}
                      <span className="font-bold">{product.name}</span>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteProduct(product._id)}>
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];

const VariantDetails = ({ variant }) => {
  const latestPrice = variant.priceHistory && variant.priceHistory.length > 0
    ? variant.priceHistory[variant.priceHistory.length - 1]
    : null;

  return (
    <div className="flex flex-col md:flex-row gap-4 p-3 bg-white dark:bg-gray-800 rounded-md shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="shrink-0">
        {variant.images && variant.images.length > 0 ? (
          <Image
            src={`${API_URL}${variant.images[0]}`}
            alt={`Variant ${variant.sku} image`}
            width={80}
            height={80}
            style={{ objectFit: 'cover' }}
            className="rounded-md"
            unoptimized={true}
          />
        ) : (
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-gray-500 text-xs">
            No Image
          </div>
        )}
      </div>
      <div className="grow grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-sm">
        <p><strong>SKU:</strong> {variant.sku}</p>
        <p><strong>Supplier:</strong> {variant.supplier?.name || 'N/A'}</p>
        <p><strong>Stock:</strong> {variant.stock}</p>
        <p><strong>Buying Price:</strong> {latestPrice ? `$${latestPrice.buyingPrice.toFixed(2)}` : 'N/A'}</p>
        <p><strong>Selling Price:</strong> {latestPrice ? `$${latestPrice.sellingPrice.toFixed(2)}` : 'N/A'}</p>
        <p><strong>Barcode:</strong> {variant.barcode || 'N/A'}</p>
        <p><strong>QR Code:</strong> {variant.qrCode || 'N/A'}</p>
        {variant.attributes && variant.attributes.length > 0 && (
          <div className="col-span-full">
            <strong>Attributes:</strong>
            <div className="flex flex-wrap gap-2 mt-1">
              {variant.attributes.map((attr, idx) => (
                <Badge key={idx} variant="secondary">{attr.key}: {attr.value}</Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
const ProductTable = ({ products, isLoading, isError, error, pagination, setPagination, pageCount, role, onEditProduct }) => {
  const table = useReactTable({
    data: products || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(), // Add this
    getSubRows: row => row.variants,           // Add this
    onPaginationChange: setPagination,
    state: {
      pagination,
    },
    manualPagination: true,
    meta: {
      role, // Pass role to columns for action routing
      onEditProduct, // Pass onEditProduct to meta
    },
  });

  if (isLoading) {
    return (
      <div className="rounded-md border p-4">
        <Skeleton className="h-10 w-full mb-4" />
        <div className="space-y-2">
          {Array.from({ length: pagination.pageSize }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    toast.error(error?.message || 'Failed to fetch products.');
    return <div className="text-red-500 p-4">Error: {error?.message || 'Failed to load products.'}</div>;
  }

  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow data-state={row.getIsSelected() && 'selected'}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="py-0 pl-14 pr-4">
                        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-md border border-gray-200 dark:border-gray-700">
                          <h4 className="font-semibold text-sm mb-2">Variants:</h4>
                          {row.original.variants && row.original.variants.length > 0 ? (
                            <div className="space-y-3">
                              {row.original.variants.map((variant, index) => (
                                <VariantDetails key={variant._id || index} variant={variant} />
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-sm">No variants available.</p>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default ProductTable;
