'use client';

import React, { useMemo, useEffect } from 'react';
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
import { Tag, Calendar, Clock, Percent, Users, Store, Package, Info, Plus, X } from 'lucide-react';
import { useGetAllCategories } from '@/features/category.api';
import { useGetAllProducts } from '@/features/product.api';
import { useGetAllBranches } from '@/features/branch.api';
import MultiSelect from '@/components/ui/multi-select'; // Assuming a multi-select component exists or I'll use Checkboxes

const discountFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.enum(['BOGO', 'Discount', 'Mix & Match', 'Bundle']),
  couponCode: z.string().optional().nullable(),
  isGlobal: z.boolean().default(false),
  applicableBranches: z.array(z.string()).default([]),
  qualifyingCategories: z.array(z.string()).default([]),
  qualifyingProducts: z.array(z.string()).default([]),
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

const DiscountForm = ({ initialData, onSubmit, isLoading, isEditing }) => {
  const { data: categoriesData } = useGetAllCategories();
  const { data: productsData } = useGetAllProducts({ limit: 100 });
  const { data: branchesData } = useGetAllBranches();

  const categoryOptions = useMemo(() => 
    categoriesData?.data?.map(c => ({ label: c.name, value: c._id })) || [], 
  [categoriesData]);

  const productOptions = useMemo(() => 
    productsData?.products?.map(p => ({ label: p.productName, value: p._id })) || [], 
  [productsData]);

  const branchOptions = useMemo(() => 
    branchesData?.data?.map(b => ({ label: b.name, value: b._id })) || [], 
  [branchesData]);

  const form = useForm({
    resolver: zodResolver(discountFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
      endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
    } : {
      name: '',
      type: 'Discount',
      couponCode: '',
      isGlobal: true,
      applicableBranches: [],
      qualifyingCategories: [],
      qualifyingProducts: [],
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

  const watchType = form.watch('type');
  const watchIsGlobal = form.watch('isGlobal');

  const handleSubmit = (data) => {
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
          {/* Left Column - Basic Config */}
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
                    <p className="col-span-2 text-xs text-muted-foreground italic">
                      Example: Buy 2 Get 1 = Buy: 2, Get: 1. The 'Get' items will be discounted by the 'Value' above.
                    </p>
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
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <FormLabel>Applies to Categories</FormLabel>
                  <div className="flex flex-wrap gap-2">
                    {categoryOptions.map(opt => (
                      <div key={opt.value} className="flex items-center space-x-2 bg-secondary/30 px-3 py-1 rounded-full border">
                        <Checkbox 
                          id={`cat-${opt.value}`}
                          checked={form.watch('qualifyingCategories').includes(opt.value)}
                          onCheckedChange={(checked) => {
                            const current = form.getValues('qualifyingCategories');
                            form.setValue('qualifyingCategories', 
                              checked ? [...current, opt.value] : current.filter(v => v !== opt.value)
                            );
                          }}
                        />
                        <label htmlFor={`cat-${opt.value}`} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                          {opt.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 border-t pt-4">
                  <FormLabel>Applies to Specific Products</FormLabel>
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
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.watch('qualifyingProducts').map(pid => {
                      const p = productOptions.find(opt => opt.value === pid);
                      return (
                        <Badge key={pid} variant="secondary" className="gap-1 px-3 py-1">
                          {p?.label || 'Unknown Product'}
                          <X size={14} className="cursor-pointer hover:text-destructive" onClick={() => {
                            form.setValue('qualifyingProducts', form.getValues('qualifyingProducts').filter(v => v !== pid));
                          }} />
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Rules & Availability */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Availability & Scheduling
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
                  <p className="text-[10px] text-muted-foreground italic">None selected means all days.</p>
                </div>

                <div className="grid grid-cols-2 gap-2 border-t pt-4">
                   <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Start Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} value={field.value || ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">End Time</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} value={field.value || ''} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  Audience & Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <FormLabel>Customer Tiers</FormLabel>
                  <div className="grid grid-cols-2 gap-2">
                    {CUSTOMER_GROUPS.map(group => (
                      <div key={group} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`group-${group}`}
                          checked={form.watch('qualifyingCustomerGroups').includes(group)}
                          onCheckedChange={(checked) => {
                            const current = form.getValues('qualifyingCustomerGroups');
                            form.setValue('qualifyingCustomerGroups', 
                              checked ? [...current, group] : current.filter(v => v !== group)
                            );
                          }}
                        />
                        <label htmlFor={`group-${group}`} className="text-xs">{group}</label>
                      </div>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="usageLimit"
                  render={({ field }) => (
                    <FormItem className="border-t pt-4">
                      <FormLabel>Total Usage Limit</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Unlimited" {...field} value={field.value || ''} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="limitPerCustomer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limit Per Customer</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
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
                <FormField
                  control={form.control}
                  name="isGlobal"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Global Promotion</FormLabel>
                        <FormDescription className="text-[10px]">
                          Available in all branches.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {!watchIsGlobal && (
                  <div className="space-y-3">
                    <FormLabel>Specific Branches</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {branchOptions.map(opt => (
                        <div key={opt.value} className="flex items-center space-x-2 bg-secondary/30 px-2 py-1 rounded-md border text-xs">
                          <Checkbox 
                            id={`br-${opt.value}`}
                            checked={form.watch('applicableBranches').includes(opt.value)}
                            onCheckedChange={(checked) => {
                              const current = form.getValues('applicableBranches');
                              form.setValue('applicableBranches', 
                                checked ? [...current, opt.value] : current.filter(v => v !== opt.value)
                              );
                            }}
                          />
                          <label htmlFor={`br-${opt.value}`} className="cursor-pointer">{opt.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem className="border-t pt-4">
                      <FormLabel>Application Priority (1-10)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="10" {...field} />
                      </FormControl>
                      <FormDescription className="text-[10px]">10 is highest priority.</FormDescription>
                    </FormItem>
                  )}
                />

                <div className="flex flex-col gap-3 border-t pt-4">
                  <FormField
                    control={form.control}
                    name="autoApply"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel className="text-xs">Auto-apply in POS</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="allowFurtherDiscounts"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <FormLabel className="text-xs">Stackable (allow more)</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
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
