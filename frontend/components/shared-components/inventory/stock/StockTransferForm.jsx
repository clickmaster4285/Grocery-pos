"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { useForm, useFieldArray, FormProvider } from 'react-hook-form';
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
import { Trash2, Plus, ChevronRight, ShieldAlert, Package, MapPin, Warehouse, ArrowRightLeft, Info, CheckCircle2, Store, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/hooks/useAuth';
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

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
    { enabled: !!effectiveBranchId }
  );

  const displayProducts = useMemo(() => {
    if (watchTransferType === 'EXTERNAL') {
      return products;
    }

    if (!branchStockData || !watchFromLocation) return [];

    const branchProductsMap = new Map();
    branchStockData.forEach(item => {
      if (!item.product) return;

      const locationStock = item.locations?.find(loc => loc.locationId === watchFromLocation);
      const availableAtLocation = locationStock?.quantity || 0;

      if (availableAtLocation <= 0) return;

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
          stock: availableAtLocation
        });
      }
    });

    return Array.from(branchProductsMap.values());
  }, [watchTransferType, products, branchStockData, watchFromLocation]);

  const handleAdminBranchChange = (branchId) => {
    setSelectedBranchId(branchId);
    form.setValue('fromLocation', '');
    form.setValue('toLocation', '');
    form.setValue('items', [{ productId: '', variantId: '', quantity: 1 }]);
  };

  useEffect(() => {
    if (watchTransferType === 'INTERNAL') {
      if (!isAdmin) {
      }
      form.setValue('fromLocation', '');
      form.setValue('toLocation', '');
    } else {
      form.setValue('fromLocation', 'WAREHOUSE');
      form.setValue('toLocation', '');
    }
    form.setValue('items', [{ productId: '', variantId: '', quantity: 1 }]);
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

    // Final sanity check on quantities
    for (const item of values.items) {
      const prod = displayProducts.find(p => p._id === item.productId);
      const vari = prod?.variants.find(v => v._id === item.variantId);
      const avail = vari?.stock || 0;
      if (item.quantity > avail) {
        return toast.error(`Insufficient stock for ${prod.productName} (${vari.sku}). Available: ${avail}`);
      }
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
      <div className="p-8 text-center bg-background rounded-lg border border-dashed flex flex-col items-center justify-center min-h-80">
        <ShieldAlert className="h-12 w-12 text-destructive mb-4 opacity-50" />
        <h2 className="text-xl font-bold text-destructive mb-2">Access Denied</h2>
        <p className="text-muted-foreground max-w-sm">You do not have permission to view or manage stock transfers.</p>
      </div>
    );
  }

  return (
    <Card className="border-none shadow-xl bg-white overflow-hidden">
      <CardContent className="p-6">
        <FormProvider {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
              <FormField
                control={form.control}
                name="transferType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Transfer Type</FormLabel>
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
                        {isAdmin && <SelectItem value="EXTERNAL" className="font-medium">External (Branch/Warehouse)</SelectItem>}
                        <SelectItem value="INTERNAL" className="font-medium">Internal (Within Branch)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isAdmin && watchTransferType === 'INTERNAL' && (
                <FormItem>
                  <FormLabel className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Select Active Branch</FormLabel>
                  <Select onValueChange={handleAdminBranchChange} value={selectedBranchId || ''} disabled={isLoadingBranches}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Branch" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {branches.map(branch => (
                        <SelectItem key={branch._id} value={branch._id} className="font-medium">{branch.branch_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 hidden md:block">
                <div className="bg-white p-2 rounded-full border shadow-sm">
                  <ArrowRightLeft className="h-4 w-4 text-primary/40" />
                </div>
              </div>

              {watchTransferType === 'EXTERNAL' ? (
                <>
                  <FormField
                    control={form.control}
                    name="fromLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <Warehouse className="h-3 w-3" /> From Source
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!canCreateTransfer}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select source" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="WAREHOUSE" className="font-semibold">Main Warehouse</SelectItem>
                            {branches.map(b => (
                              <SelectItem key={b._id} value={b._id} className="font-semibold">{b.branch_name}</SelectItem>
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
                        <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <Store className="h-3 w-3" /> To Destination
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!canCreateTransfer}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select destination" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="WAREHOUSE" className="font-semibold">Main Warehouse</SelectItem>
                            {branches.filter(b => b._id !== watchFromLocation).map(b => (
                              <SelectItem key={b._id} value={b._id} className="font-semibold">{b.branch_name}</SelectItem>
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
                        <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <MapPin className="h-3 w-3" /> From Internal Area
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!canCreateTransfer || isLocationsLoading || (isAdmin && !selectedBranchId)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isAdmin && !selectedBranchId ? "Select branch first" : "Source location"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branchLocations.map(loc => (
                              <SelectItem key={loc._id} value={loc._id} className="font-semibold">{loc.name} ({loc.type})</SelectItem>
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
                        <FormLabel className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                          <MapPin className="h-3 w-3" /> To Internal Area
                        </FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} disabled={!canCreateTransfer || isLocationsLoading || (isAdmin && !selectedBranchId)}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={isAdmin && !selectedBranchId ? "Select branch first" : "Target location"} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {branchLocations.filter(loc => loc._id !== watchFromLocation).map(loc => (
                              <SelectItem key={loc._id} value={loc._id} className="font-semibold">{loc.name} ({loc.type})</SelectItem>
                            ))}
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
              <div className="flex justify-between items-center px-1">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  <Label className="text-sm font-bold text-slate-700">Products to Transfer</Label>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ productId: '', variantId: '', quantity: 1 })}
                  disabled={!canCreateTransfer || (watchTransferType === 'INTERNAL' && !watchFromLocation)}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item
                </Button>
              </div>

              <div className="space-y-3">
                {fields.map((itemField, index) => {
                  const watchedProductId = form.watch(`items.${index}.productId`);
                  const selectedProduct = displayProducts.find(p => p._id === watchedProductId);
                  const watchedVariantId = form.watch(`items.${index}.variantId`);
                  const selectedVariant = selectedProduct?.variants.find(v => v._id === watchedVariantId);
                  const availableStock = selectedVariant?.stock || 0;

                  return (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={itemField.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50/30 p-5 rounded-2xl border border-slate-100 relative group transition-all hover:bg-white hover:shadow-md"
                    >
                      <div className="md:col-span-5">
                        <FormField
                          control={form.control}
                          name={`items.${index}.productId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Product</FormLabel>
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
                                    <SelectValue placeholder="Choose product" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {displayProducts.map(p => (
                                    <SelectItem key={p._id} value={p._id} className="font-medium">{p.productName}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-4">
                        <FormField
                          control={form.control}
                          name={`items.${index}.variantId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Select Variant</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                value={field.value}
                                disabled={!watchedProductId || !canCreateTransfer}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose variant" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {selectedProduct?.variants.map(v => (
                                    <SelectItem key={v._id} value={v._id} className="font-medium">
                                      {v.sku} ({v.stock} Available)
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="md:col-span-3 flex gap-2">
                        <FormField
                          control={form.control}
                          name={`items.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem className="grow">
                              <FormLabel>
                                Quantity
                                <span className={cn("font-bold tracking-tight", availableStock < 5 ? "text-red-500" : "text-emerald-600")}>
                                  Max: {availableStock}
                                </span>
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  min="1"
                                  max={availableStock}
                                  {...field}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    field.onChange(val > availableStock ? availableStock : val);
                                  }}
                                  disabled={!canCreateTransfer || !watchedVariantId}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                        {fields.length > 1 && canCreateTransfer && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => remove(index)}
                            className="h-10 w-10 rounded-xl text-slate-300 hover:text-destructive hover:bg-destructive/5 self-end"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-3">
              <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-bold text-blue-800 uppercase tracking-wider">Transfer Intelligence</p>
                <p className="text-[11px] text-blue-600/80 leading-relaxed font-medium">
                  For <span className="font-bold">Internal Transfers</span>, only products with stock in the selected source area are visible.
                  For <span className="font-bold">Warehouse Transfers</span>, the master warehouse availability is used.
                  Quantities are automatically capped at the available stock.
                </p>
              </div>
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Weekly shelf restock, Store damage replacement"
                      {...field}
                      disabled={!canCreateTransfer}
                      className="h-11 rounded-xl bg-white border-slate-200 font-medium text-sm"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {canCreateTransfer && (
              <Button
                type="submit"
                className="w-full h-14 rounded-2xl font-bold uppercase tracking-widest text-sm shadow-xl shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] gap-2"
                disabled={createTransferMutation.isPending || !form.formState.isValid}
              >
                {createTransferMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><CheckCircle2 className="h-5 w-5" /> Execute Stock Transfer</>}
              </Button>
            )}
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
};

export default StockTransferForm;
