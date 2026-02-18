'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ComboBox } from '@/components/ui/combobox';
import { Tag, Calendar, Clock, Percent, Users, Store, Package, Info, Plus, X, Layers, CheckCircle2 } from 'lucide-react';
import { useGetAllCategories } from '@/features/category.api';
import { useGetAllBrands } from '@/features/brand.api';
import { useGetAllProducts } from '@/features/product.api';
import { useGetAllBranches } from '@/features/branch.api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

const discountFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['BOGO', 'Discount', 'Mix & Match', 'Bundle']),
  couponCode: z.string().optional().nullable(),
  isGlobal: z.boolean().default(false),
  applicableBranches: z.array(z.string()).default([]),
  qualifyingCategories: z.array(z.string()).default([]),
  qualifyingBrands: z.array(z.string()).default([]),
  qualifyingProducts: z.array(z.string()).default([]),
  qualifyingVariants: z.array(z.string()).default([]),
  qualifyingCustomerGroups: z.array(z.string()).default([]),
  discountDescription: z.string().optional(),
  amountType: z.enum(['Fixed', 'Percentage', 'Set Price']),
  amountValue: z.coerce.number().min(0),
  minPurchaseAmount: z.coerce.number().min(0).default(0),
  minItemPrice: z.coerce.number().optional().nullable(),
  maxItemPrice: z.coerce.number().optional().nullable(),
  minQuantity: z.coerce.number().min(1).default(1),
  buyQuantity: z.coerce.number().optional().nullable(),
  getQuantity: z.coerce.number().optional().nullable(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional().nullable(),
  applicableDays: z.array(z.string()).default([]),
  startTime: z.string().optional().nullable(),
  endTime: z.string().optional().nullable(),
  usageLimit: z.coerce.number().optional().nullable(),
  limitPerCustomer: z.coerce.number().default(1),
  priority: z.coerce.number().min(1).max(10).default(1),
  autoApply: z.boolean().default(true),
  allowFurtherDiscounts: z.boolean().default(true),
  status: z.enum(['active', 'inactive']).default('active'),
});

const DAYS_OF_WEEK = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

const CUSTOMER_GROUPS = [
  "Regular", "Silver", "Gold", "Platinum", "Staff"
];

const VariantSelector = ({ products, selectedProductIds, selectedVariantIds, onToggleVariant, onToggleAllVariants }) => {
  const selectedProductsWithVariants = useMemo(() => {
    return products?.filter(p => selectedProductIds.includes(p._id)) || [];
  }, [products, selectedProductIds]);

  if (selectedProductsWithVariants.length === 0) return null;

  return (
    <div className="space-y-4 border-t pt-6 mt-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-bold text-primary">
          <Layers size={18} className="text-primary" />
          <span>Granular Variant Selection</span>
        </div>
        <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground bg-background">
          {selectedVariantIds.length} Selected
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-4 mt-2">
        {selectedProductsWithVariants.map(product => {
          const productVariantIds = product.variants?.map(v => v._id) || [];
          const allSelected = productVariantIds.length > 0 && productVariantIds.every(id => selectedVariantIds.includes(id));

          return (
            <div key={product._id} className="bg-card rounded-xl border border-muted shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="bg-muted/30 px-4 py-2 border-b flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-2">
                  <Package size={14} className="text-primary" /> {product.productName}
                </span>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onToggleAllVariants(productVariantIds, !allSelected)}
                  className="h-7 px-3 text-[10px] font-bold uppercase hover:bg-primary/10 transition-all"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="p-4 flex flex-wrap gap-2">
                {product.variants?.map(variant => {
                  const attrString = variant.attributes?.map(a => a.value).join(' / ') || 'Standard';
                  const isSelected = selectedVariantIds.includes(variant._id);
                  return (
                    <button
                      type="button"
                      key={variant._id}
                      onClick={() => onToggleVariant(variant._id)}
                      className={cn(
                        "flex flex-col items-start gap-1 px-3 py-2 rounded-lg border text-left transition-all",
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                          : "bg-background hover:bg-muted border-input hover:border-primary/40"
                      )}
                    >
                      <div className="flex items-center justify-between w-full gap-2">
                        <span className="text-[11px] font-bold leading-none uppercase">{attrString}</span>
                        {isSelected && <CheckCircle2 size={10} strokeWidth={4} />}
                      </div>
                      <span className={cn(
                        "text-[9px] font-mono opacity-70",
                        isSelected ? "text-primary-foreground" : "text-muted-foreground"
                      )}>
                        {variant.sku}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const DiscountForm = ({ initialData, onSubmit, isLoading, isEditing }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const { data: categoriesData } = useGetAllCategories();
  const { data: brandsData } = useGetAllBrands();
  const { data: productsData } = useGetAllProducts({ limit: 100 });
  const { data: branchesData } = useGetAllBranches();

  const categoryOptions = useMemo(() => 
    categoriesData?.data?.map(c => ({ label: c.name, value: c._id })) || [], 
  [categoriesData]);

  const brandOptions = useMemo(() => 
    brandsData?.data?.map(b => ({ label: b.name, value: b._id })) || [], 
  [brandsData]);

  const productOptions = useMemo(() => 
    productsData?.products?.map(p => ({ label: p.productName, value: p._id })) || [], 
  [productsData]);

  const branchOptions = useMemo(() => 
    branchesData?.data?.map(b => ({ label: b.branch_name, value: b._id })) || [], 
  [branchesData]);

  const form = useForm({
    resolver: zodResolver(discountFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
      endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
      // MAP POPULATED OBJECTS TO IDs
      qualifyingCategories: initialData.qualifyingCategories?.map(c => c._id || c) || [],
      qualifyingBrands: initialData.qualifyingBrands?.map(b => b._id || b) || [],
      qualifyingProducts: initialData.qualifyingProducts?.map(p => p._id || p) || [],
      applicableBranches: initialData.applicableBranches?.map(b => b._id || b) || [],
      qualifyingVariants: initialData.qualifyingVariants || [],
      applicableDays: initialData.applicableDays || [],
      qualifyingCustomerGroups: initialData.qualifyingCustomerGroups || [],
    } : {
      name: '',
      type: 'Discount',
      couponCode: '',
      isGlobal: isAdmin, 
      applicableBranches: !isAdmin ? [user?.branch_id] : [],
      qualifyingCategories: [],
      qualifyingBrands: [],
      qualifyingProducts: [],
      qualifyingVariants: [],
      qualifyingCustomerGroups: [],
      discountDescription: '',
      amountType: 'Percentage',
      amountValue: 0,
      minPurchaseAmount: 0,
      minQuantity: 1,
      startDate: new Date().toISOString().split('T')[0],
      applicableDays: [],
      priority: 1,
      autoApply: true,
      allowFurtherDiscounts: true,
      status: 'active',
      limitPerCustomer: 1,
    },
  });

  useEffect(() => {
    if (isEditing && initialData) {
      console.log('Source of data (initialData from API):', initialData);
    }
  }, [isEditing, initialData]);

  const watchType = form.watch('type');
  const watchIsGlobal = form.watch('isGlobal');
  const watchProducts = form.watch('qualifyingProducts');
  const watchVariants = form.watch('qualifyingVariants');
  const watchCategories = form.watch('qualifyingCategories');
  const watchBrands = form.watch('qualifyingBrands');
  const watchBranches = form.watch('applicableBranches');

  const handleToggleVariant = (variantId) => {
    const current = form.getValues('qualifyingVariants');
    if (current.includes(variantId)) {
      form.setValue('qualifyingVariants', current.filter(id => id !== variantId));
    } else {
      form.setValue('qualifyingVariants', [...current, variantId]);
    }
  };

  const handleToggleAllVariants = (variantIds, select) => {
    const current = form.getValues('qualifyingVariants');
    if (select) {
      const uniqueNewIds = [...new Set([...current, ...variantIds])];
      form.setValue('qualifyingVariants', uniqueNewIds);
    } else {
      form.setValue('qualifyingVariants', current.filter(id => !variantIds.includes(id)));
    }
  };

  const handleSubmit = (data) => {
    if (!isAdmin) {
      data.isGlobal = false;
      data.applicableBranches = [user?.branch_id];
    }
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 pb-20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {isEditing ? 'Edit Promotion' : 'Create New Promotion'}
            </h1>
            <p className="text-muted-foreground">
              Configure how this discount should be applied to transactions.
            </p>
          </div>
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => window.history.back()}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : isEditing ? 'Update Promotion' : 'Save Promotion'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  General Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promotion Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Summer Clearance 2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Promotion Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Discount">Standard Discount</SelectItem>
                            <SelectItem value="BOGO">BOGO (Buy X Get Y)</SelectItem>
                            <SelectItem value="Mix & Match">Mix & Match</SelectItem>
                            <SelectItem value="Bundle">Bundle / Combo</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="couponCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Coupon Code (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., SUMMER50" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormDescription>Leave blank for automatic application.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="discountDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Public Description</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Get 50% off all beverages this weekend!" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Percent className="h-5 w-5 text-primary" />
                  Discount Value & Logic
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Value Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Percentage">Percentage (%)</SelectItem>
                            <SelectItem value="Fixed">Fixed Amount ($)</SelectItem>
                            <SelectItem value="Set Price">Fixed Set Price</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="amountValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Discount Value</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="minPurchaseAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Purchase Amount ($)</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>Cart total must reach this.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="minQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Min Quantity</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} />
                        </FormControl>
                        <FormDescription>Total items required.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {watchType === 'BOGO' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-primary/5 p-4 rounded-lg border border-primary/20">
                    <FormField
                      control={form.control}
                      name="buyQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Buy Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value || ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="getQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Get Quantity</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} value={field.value || ''} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Targeting & Scope
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8">
                {/* REFINED CATEGORY GUI with ComboBox */}
                <div className="space-y-4">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Applies to Categories</FormLabel>
                  <ComboBox
                    items={categoryOptions}
                    placeholder="Search and add categories..."
                    onValueChange={(val) => {
                      const current = form.getValues('qualifyingCategories');
                      if (val && !current.includes(val)) {
                        form.setValue('qualifyingCategories', [...current, val]);
                      }
                    }}
                  />
                  
                  {watchCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {watchCategories.map(cid => {
                        const c = categoryOptions.find(opt => opt.value === cid);
                        return (
                          <Badge key={cid} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                            {c?.label || 'Unknown Category'}
                            <X 
                              size={14} 
                              className="cursor-pointer hover:text-destructive" 
                              onClick={() => form.setValue('qualifyingCategories', watchCategories.filter(v => v !== cid))}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* REFINED BRAND GUI with ComboBox */}
                <div className="space-y-4 border-t pt-6">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Applies to Brands</FormLabel>
                  <ComboBox
                    items={brandOptions}
                    placeholder="Search and add brands..."
                    onValueChange={(val) => {
                      const current = form.getValues('qualifyingBrands');
                      if (val && !current.includes(val)) {
                        form.setValue('qualifyingBrands', [...current, val]);
                      }
                    }}
                  />
                  
                  {watchBrands.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {watchBrands.map(bid => {
                        const b = brandOptions.find(opt => opt.value === bid);
                        return (
                          <Badge key={bid} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                            {b?.label || 'Unknown Brand'}
                            <X 
                              size={14} 
                              className="cursor-pointer hover:text-destructive" 
                              onClick={() => form.setValue('qualifyingBrands', watchBrands.filter(v => v !== bid))}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* REFINED PRODUCT GUI */}
                <div className="space-y-4 border-t pt-6">
                  <FormLabel className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Applies to Specific Products</FormLabel>
                  <ComboBox
                    items={productOptions}
                    placeholder="Search and add products..."
                    onValueChange={(val) => {
                      const current = form.getValues('qualifyingProducts');
                      if (val && !current.includes(val)) {
                        form.setValue('qualifyingProducts', [...current, val]);
                      }
                    }}
                  />
                  
                  {watchProducts.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                      {watchProducts.map(pid => {
                        const p = productOptions.find(opt => opt.value === pid);
                        const product = productsData?.products?.find(prod => prod._id === pid);
                        const variantCount = product?.variants?.length || 0;
                        const selectedInProduct = product?.variants?.filter(v => watchVariants.includes(v._id)).length || 0;

                        return (
                          <div key={pid} className="flex items-center justify-between p-3 bg-secondary/30 border-2 border-transparent hover:border-primary/20 rounded-xl group transition-all">
                            <div className="flex flex-col">
                              <span className="text-xs font-bold truncate max-w-37.5">{p?.label || 'Unknown Product'}</span>
                              <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-tighter">
                                {selectedInProduct || 'ALL'} / {variantCount} Variants
                              </span>
                            </div>
                            <Button 
                              type="button"
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                              onClick={() => {
                                if (product?.variants) {
                                  const vids = product.variants.map(v => v._id);
                                  form.setValue('qualifyingVariants', form.getValues('qualifyingVariants').filter(id => !vids.includes(id)));
                                }
                                form.setValue('qualifyingProducts', form.getValues('qualifyingProducts').filter(v => v !== pid));
                              }}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* REFINED VARIANT GUI */}
                <VariantSelector 
                  products={productsData?.products}
                  selectedProductIds={watchProducts}
                  selectedVariantIds={watchVariants}
                  onToggleVariant={handleToggleVariant}
                  onToggleAllVariants={handleToggleAllVariants}
                />
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-3 border-t pt-4">
                  <FormLabel>Applicable Days</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {DAYS_OF_WEEK.map(day => (
                      <div key={day} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`day-${day}`}
                          checked={form.watch('applicableDays').includes(day)}
                          onCheckedChange={(checked) => {
                            const current = form.getValues('applicableDays');
                            form.setValue('applicableDays', 
                              checked ? [...current, day] : current.filter(v => v !== day)
                            );
                          }}
                        />
                        <label htmlFor={`day-${day}`} className="text-xs">{day}</label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Branch & System
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isAdmin ? (
                  <FormField
                    control={form.control}
                    name="isGlobal"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Global Promotion</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="rounded-lg border p-3 bg-muted/50">
                    <FormLabel className="text-muted-foreground opacity-70">Global Promotion (Admin Only)</FormLabel>
                  </div>
                )}

                {(isAdmin && !watchIsGlobal) && (
                  <div className="space-y-3">
                    <FormLabel>Specific Branches</FormLabel>
                    <ComboBox
                      items={branchOptions}
                      placeholder="Search and add branches..."
                      onValueChange={(val) => {
                        const current = form.getValues('applicableBranches');
                        if (val && !current.includes(val)) {
                          form.setValue('applicableBranches', [...current, val]);
                        }
                      }}
                    />
                    
                    {watchBranches.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {watchBranches.map(bid => {
                          const b = branchOptions.find(opt => opt.value === bid);
                          return (
                            <Badge key={bid} variant="secondary" className="flex items-center gap-1 py-1 px-3">
                              {b?.label || 'Unknown Branch'}
                              <X 
                                size={14} 
                                className="cursor-pointer hover:text-destructive" 
                                onClick={() => form.setValue('applicableBranches', watchBranches.filter(v => v !== bid))}
                              />
                            </Badge>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col gap-3 border-t pt-4">
                   <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel className="text-xs font-bold text-primary">Is Active</FormLabel>
                        <FormControl>
                          <Switch 
                            checked={field.value === 'active'} 
                            onCheckedChange={(checked) => field.onChange(checked ? 'active' : 'inactive')} 
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default DiscountForm;
