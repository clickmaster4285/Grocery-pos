"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useGetAllProducts } from '@/features/product.api';
import { useGetAllBranches } from '@/features/branch.api';
import { useCreateTransfer, useGetBranchStock } from '@/features/stockTransfer.api';
import { useBranchLocationHook } from '@/hooks/useBranchLocationHook';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ArrowRight, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';


const itemSchema = z.object({
  productId: z.string().min(1, 'Product is required.'),
  variantId: z.string().min(1, 'Variant is required.'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be at least 1.'),
});

const stockTransferFormSchema = z.object({
  transferType: z.enum(['EXTERNAL', 'INTERNAL'], { message: 'Transfer type is required.' }),
  fromLocation: z.string().min(1, 'Source location is required.'),
  toLocation: z.string().min(1, 'Destination location is required.'),
  items: z.array(itemSchema).min(1, 'At least one item is required for transfer.'),
  notes: z.string().max(500, 'Notes cannot exceed 500 characters.').optional(),
});

const StockTransferForm = ({ onSuccess }) => {
  const { user } = useAuth();
  const { inventory, isAdmin } = usePermissions();
  const canCreateTransfer = inventory.stock.create;
  const canReadStock = inventory.stock.read;

  const { data: productsData } = useGetAllProducts({ page: 1, limit: 1000, enabled: canReadStock });
  const products = productsData?.products || [];

  const { data: branchesData, isLoading: isLoadingBranches } = useGetAllBranches({ enabled: isAdmin });
  const branches = branchesData?.data || [];

  const createTransferMutation = useCreateTransfer();

  const {
    locations: branchLocations,
    isLocationsLoading,
    selectedBranchId,
    setSelectedBranchId
  } = useBranchLocationHook();

  const form = useForm({
    resolver: zodResolver(stockTransferFormSchema),
    defaultValues: {
      transferType: isAdmin ? 'EXTERNAL' : 'INTERNAL',
      fromLocation: isAdmin ? 'WAREHOUSE' : '',
      toLocation: '',
      items: [{ productId: '', variantId: '', quantity: 1 }],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const watchTransferType = form.watch('transferType');
  const watchFromLocation = form.watch('fromLocation');

  const effectiveBranchId = isAdmin ? selectedBranchId : (user?.branch_id?._id || user?.branch_id);
  const { data: branchStockData, isLoading: isLoadingBranchStock } = useGetBranchStock(
    effectiveBranchId,
    '',
    { enabled: watchTransferType === 'INTERNAL' && !!effectiveBranchId }
  );

  const displayProducts = useMemo(() => {
    if (watchTransferType === 'EXTERNAL') {
      return products;
    }

    // For internal transfers, derive list from branch stock
    if (!branchStockData) return [];

    // Group by product since branch stock is by variant
    const branchProductsMap = new Map();
    branchStockData.forEach(item => {
      if (!item.product) return;

      const productId = item.product._id;
      if (!branchProductsMap.has(productId)) {
        branchProductsMap.set(productId, {
          ...item.product,
          variants: []
        });
      }

      const product = branchProductsMap.get(productId);
      const originalVariant = item.product.variants.find(v => v._id === item.variantId);

      if (originalVariant) {
        product.variants.push({
          ...originalVariant,
          stock: item.quantity // Use branch stock quantity instead of WH stock
        });
      }
    });

    return Array.from(branchProductsMap.values());
  }, [watchTransferType, products, branchStockData]);

  // When admin selects a branch for internal transfer, update the hook's state
  const handleAdminBranchChange = (branchId) => {
    setSelectedBranchId(branchId);
    form.setValue('fromLocation', ''); // Clear locations as branch changed
    form.setValue('toLocation', '');
  };

  useEffect(() => {
    if (watchTransferType === 'INTERNAL') {
      if (!isAdmin) {
        // For non-admins, effective branch is always their own, 
        // useBranchLocationHook handles syncing this.
      } else if (!selectedBranchId) {
        // Admin needs to select a branch first
      }
      form.setValue('fromLocation', '');
      form.setValue('toLocation', '');
    } else { // EXTERNAL
      form.setValue('fromLocation', 'WAREHOUSE');
      form.setValue('toLocation', '');
    }
  }, [watchTransferType, isAdmin, selectedBranchId, form]);

  const handleSubmit = async (values) => {
    if (!canCreateTransfer) {
      return toast.error('You do not have permission to initiate transfers');
    }

    if (values.transferType === 'INTERNAL' && (!values.fromLocation || !values.toLocation)) {
      return toast.error('For internal transfers, both source and destination locations are required.');
    }
    if (values.transferType === 'INTERNAL' && values.fromLocation === values.toLocation) {
      return toast.error('Source and destination locations cannot be the same for internal transfers.');
    }

    try {
      await createTransferMutation.mutateAsync(values);
      toast.success('Stock transfer completed successfully');
      form.reset();
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete transfer');
    }
  };

  if (!canReadStock) {
    return (
      <div className="p-8 text-center bg-background rounded-lg border border-dashed flex flex-col items-center justify-center">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-sm">You do not have permission to view or manage stock transfers.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initiate Stock Transfer</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="transferType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={!canCreateTransfer || !isAdmin}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select transfer type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isAdmin && <SelectItem value="EXTERNAL">External (Branch to Branch / Warehouse)</SelectItem>}
                      <SelectItem value="INTERNAL">Internal (Location to Location within Branch)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isAdmin && watchTransferType === 'INTERNAL' && (
              <FormItem>
                <FormLabel>Select Branch for Internal Transfer</FormLabel>
                <Select onValueChange={handleAdminBranchChange} value={selectedBranchId || ''} disabled={isLoadingBranches}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select Branch" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {isLoadingBranches ? (
                      <SelectItem value="loading" disabled>Loading branches...</SelectItem>
                    ) : (
                      branches.map(branch => (
                        <SelectItem key={branch._id} value={branch._id}>{branch.branch_name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {watchTransferType === 'EXTERNAL' ? (
                <>
                  <FormField
                    control={form.control}
                    name="fromLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Location</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canCreateTransfer}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="WAREHOUSE">Warehouse (Main Stock)</SelectItem>
                            {branches.map(b => (
                              <SelectItem key={b._id} value={b._id}>{b.branch_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination Branch</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!canCreateTransfer}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branches.filter(b => b._id !== watchFromLocation).map(b => (
                              <SelectItem key={b._id} value={b._id}>{b.branch_name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              ) : ( // INTERNAL
                <>
                  <FormField
                    control={form.control}
                    name="fromLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Source Internal Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!canCreateTransfer || isLocationsLoading || (isAdmin && !selectedBranchId)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isAdmin && !selectedBranchId ? "Select branch first" : "Select source location"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLocationsLoading ? (
                              <SelectItem value="loading" disabled>Loading locations...</SelectItem>
                            ) : (
                              branchLocations.map(loc => (
                                <SelectItem key={loc._id} value={loc._id}>{loc.name} ({loc.type})</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="toLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Destination Internal Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!canCreateTransfer || isLocationsLoading || (isAdmin && !selectedBranchId)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isAdmin && !selectedBranchId ? "Select branch first" : "Select destination location"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {isLocationsLoading ? (
                              <SelectItem value="loading" disabled>Loading locations...</SelectItem>
                            ) : (
                              branchLocations.filter(loc => loc._id !== watchFromLocation).map(loc => (
                                <SelectItem key={loc._id} value={loc._id}>{loc.name} ({loc.type})</SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg font-semibold">Items to Transfer</Label>
                <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', variantId: '', quantity: 1 })} disabled={!canCreateTransfer}>
                  <Plus className="mr-2 h-4 w-4" /> Add Item
                </Button>
              </div>

              {fields.map((itemField, index) => {
                const watchedProductId = form.watch(`items.${index}.productId`);
                const selectedProduct = products.find(p => p._id === watchedProductId);

                return (
                  <div key={itemField.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border p-4 rounded-md relative">
                    <FormField
                      control={form.control}
                      name={`items.${index}.productId`}
                      render={({ field }) => (
                        <FormItem className="md:col-span-2">
                          <FormLabel>Product</FormLabel>
                          <Select
                            onValueChange={(val) => {
                              field.onChange(val);
                              form.setValue(`items.${index}.variantId`, '');
                            }}
                            value={field.value}
                            disabled={!canCreateTransfer}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select product" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {displayProducts.map(p => (
                                <SelectItem key={p._id} value={p._id}>{p.productName}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`items.${index}.variantId`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Variant</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!watchedProductId || !canCreateTransfer}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select variant" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {selectedProduct?.variants.map(v => (
                                <SelectItem key={v._id} value={v._id}>
                                  {v.sku} ({v.stock} in {watchTransferType === 'EXTERNAL' ? 'WH' : 'Branch'})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex gap-2">
                      <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem className="grow">
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                disabled={!canCreateTransfer}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      {fields.length > 1 && canCreateTransfer && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          onClick={() => remove(index)}
                          className="self-end"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Reason for transfer, e.g., Restock for holiday season"
                      {...field}
                      disabled={!canCreateTransfer}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canCreateTransfer && (
              <Button type="submit" className="w-full" disabled={createTransferMutation.isPending || !form.formState.isValid}>
                {createTransferMutation.isPending ? 'Processing...' : 'Complete Transfer'}
              </Button>
            )}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default StockTransferForm;