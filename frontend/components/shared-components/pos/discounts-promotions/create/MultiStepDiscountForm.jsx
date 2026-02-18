'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useGetAllCategories } from '@/features/category.api';
import { useGetAllBrands } from '@/features/brand.api';
import { useGetAllProducts } from '@/features/product.api';
import { useGetAllBranches } from '@/features/branch.api';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { CheckCircle2, ChevronRight, ChevronLeft, Save } from 'lucide-react';

import StepBasicDetails from './StepBasicDetails';
import StepTargeting from './StepTargeting';
import StepAvailability from './StepAvailability';

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

const STEPS = [
  { id: 'details', title: 'Basic Details', description: 'Name, type and value' },
  { id: 'targeting', title: 'Targeting', description: 'Products and categories' },
  { id: 'availability', title: 'Availability', description: 'Schedule and branches' },
];

const MultiStepDiscountForm = ({ initialData, onSubmit, isLoading, isEditing }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [currentStep, setCurrentStep] = useState(0);

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
    branchesData?.data?.map(b => ({ label: b.name, value: b._id })) || [], 
  [branchesData]);

  const form = useForm({
    resolver: zodResolver(discountFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
      endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
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

  const watchProducts = form.watch('qualifyingProducts');
  const watchVariants = form.watch('qualifyingVariants');
  const watchCategories = form.watch('qualifyingCategories');
  const watchBrands = form.watch('qualifyingBrands');
  const watchIsGlobal = form.watch('isGlobal');
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

  const nextStep = async () => {
    // Only validate fields relevant to the current step before proceeding
    let fieldsToValidate = [];
    if (currentStep === 0) {
      fieldsToValidate = ['name', 'type', 'amountType', 'amountValue'];
    } else if (currentStep === 1) {
      // Step 2 doesn't have required fields but we check logic
    }

    const isValid = await form.trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = (data) => {
    if (!isAdmin) {
      data.isGlobal = false;
      data.applicableBranches = [user?.branch_id];
    }
    onSubmit(data);
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isEditing ? 'Edit Promotion' : 'Create New Promotion'}
          </h1>
          <p className="text-muted-foreground mt-1">
            Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep].title}
          </p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => window.history.back()}>
            Cancel
          </Button>
          {currentStep === STEPS.length - 1 ? (
            <Button type="button" onClick={form.handleSubmit(handleSubmit)} disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : isEditing ? 'Update Promotion' : 'Save Promotion'}
            </Button>
          ) : (
            <Button type="button" onClick={nextStep}>
              Next Step
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Stepper Tabs */}
      <div className="mb-8 overflow-x-auto">
        <div className="flex items-center justify-between w-full min-w-150 bg-card border rounded-xl p-2">
          {STEPS.map((step, index) => (
            <React.Fragment key={step.id}>
              <div 
                className={cn(
                  "flex items-center gap-3 px-4 py-2 rounded-lg transition-all cursor-pointer flex-1",
                  currentStep === index ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
                )}
                onClick={async () => {
                  if (index < currentStep) setCurrentStep(index);
                  else if (index > currentStep) {
                    // Only allow jumping forward if current step is valid
                    const isValid = await form.trigger();
                    if (isValid) setCurrentStep(index);
                  }
                }}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2",
                  currentStep === index ? "border-primary bg-primary text-white" : 
                  currentStep > index ? "border-primary bg-primary/20 text-primary" : "border-muted-foreground/30"
                )}>
                  {currentStep > index ? <CheckCircle2 size={16} strokeWidth={3} /> : index + 1}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold whitespace-nowrap uppercase tracking-tight">{step.title}</span>
                  <span className="text-[10px] whitespace-nowrap opacity-70">{step.description}</span>
                </div>
              </div>
              {index < STEPS.length - 1 && (
                <div className="h-4 w-px bg-muted mx-2" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 pb-20">
          {currentStep === 0 && (
            <StepBasicDetails form={form} />
          )}

          {currentStep === 1 && (
            <StepTargeting 
              form={form}
              categoryOptions={categoryOptions}
              brandOptions={brandOptions}
              productOptions={productOptions}
              productsData={productsData}
              watchCategories={watchCategories}
              watchBrands={watchBrands}
              watchProducts={watchProducts}
              watchVariants={watchVariants}
              handleToggleVariant={handleToggleVariant}
              handleToggleAllVariants={handleToggleAllVariants}
            />
          )}

          {currentStep === 2 && (
            <StepAvailability 
              form={form}
              isAdmin={isAdmin}
              branchOptions={branchOptions}
              watchIsGlobal={watchIsGlobal}
              watchBranches={watchBranches}
            />
          )}

          {/* Navigation Buttons (Bottom) */}
          <div className="flex justify-between items-center pt-6 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={prevStep}
              disabled={currentStep === 0}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            
            <div className="flex gap-3">
              {currentStep < STEPS.length - 1 ? (
                <Button type="button" onClick={nextStep}>
                  Continue to {STEPS[currentStep + 1].title}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button type="button" onClick={form.handleSubmit(handleSubmit)} disabled={isLoading}>
                  <Save className="mr-2 h-4 w-4" />
                  {isLoading ? 'Saving...' : isEditing ? 'Update Promotion' : 'Save Promotion'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default MultiStepDiscountForm;
