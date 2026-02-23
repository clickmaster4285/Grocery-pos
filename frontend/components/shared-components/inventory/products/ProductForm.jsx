"use client";

import React, { useEffect, useMemo, useState } from 'react'; // Added useState
import { FormProvider, useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form as ShadcnForm,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';
import { useGetAllCategories } from '@/features/category.api';
import { useGetAllBrands } from '@/features/brand.api';
import { useGetAllSuppliers } from '@/features/supplier.api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import ProductDetailsTabContent from './product-form-tabs/ProductDetailsTabContent';
import VariantManagementTabContent from './product-form-tabs/VariantManagementTabContent';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const attributeSchema = z.object({
  key: z.string().min(1, { message: "Attribute key cannot be empty." }),
  value: z.string().min(1, { message: "Attribute value cannot be empty." }),
});

const variantSchema = z.object({
  _id: z.string().optional(),
  sku: z.string().max(50, { message: "SKU cannot be more than 50 characters." }).optional(),
  attributes: z.array(attributeSchema).optional(),
  buyingPrice: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0.01, { message: 'Buying price must be at least 0.01' })
  ),
  sellingPrice: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0.01, { message: 'Selling price must be at least 0.01' })
  ),
  stock: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(0, { message: 'Stock must be a non-negative integer' })
  ),
  supplier: z.string().optional().nullable(),
  barcode: z.string().max(100, { message: "Barcode cannot be more than 100 characters." }).optional().nullable(),
  qrCode: z.string().max(200, { message: "QR Code cannot be more than 200 characters." }).optional().nullable(),
  images: z.array(z.union([z.string(), z.instanceof(File)])).optional(),
  isDeleted: z.boolean().optional(),
  stockChangeAmount: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().optional().nullable()
  ),
  stockChangeType: z.enum(['RESTOCK', 'SALE', 'RETURN', 'ADJUSTMENT', 'TRANSFER_IN', 'TRANSFER_OUT']).optional().nullable(),
  stockChangeReason: z.string().max(200).optional().nullable(),
  minStockLevel: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(0, { message: 'Minimum stock level cannot be negative.' }).default(0)
  ),
  maxStockLevel: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().int().min(0, { message: 'Maximum stock level cannot be negative.' }).default(0)
  ),
});

const productFormSchema = z.object({
  productName: z.string().min(2, { message: 'Product name must be at least 2 characters.' }).max(100, { message: 'Product name cannot be more than 100 characters.' }),
  description: z.string().max(1000, { message: 'Product description cannot be more than 1000 characters.' }).optional().nullable(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unit: z.enum(['PIECE', 'KG', 'GRAM', 'LITER', 'ML', 'PACK', 'DOZEN']).default('PIECE'),
  storageRequirement: z.enum(['AMBIENT', 'REFRIGERATED', 'FROZEN']).default('AMBIENT'),
  taxRate: z.preprocess(
    (val) => (val === '' || val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, { message: 'Tax rate cannot be negative.' }).max(100, { message: 'Tax rate cannot exceed 100.' }).default(0)
  ),
  variants: z.array(variantSchema).min(1, { message: 'At least one variant is required.' }),
});


const ProductForm = ({ initialData, onSubmit, isLoading, isEditing }) => {
  const router = useRouter();
  const { user } = useAuth();
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetAllCategories();

  const categoryOptions = useMemo(() => {
    if (categoriesData) {
      return categoriesData?.data?.map(category => ({
        label: category.name,
        value: category._id,
      }));
    }
    return [];
  }, [categoriesData]);

  const { data: brandsData, isLoading: isLoadingBrands } = useGetAllBrands();

  const brandOptions = useMemo(() => {
    if (brandsData) {
      return brandsData?.data?.map(brand => ({
        label: brand.name,
        value: brand._id,
      }));
    }
    return [];
  }, [brandsData]);

  const { data: suppliersData, isLoading: isLoadingSuppliers } = useGetAllSuppliers();

  const supplierOptions = useMemo(() => {
    if (suppliersData) {
      return suppliersData?.data?.map(supplier => ({
        label: supplier.name,
        value: supplier._id,
      }));
    }
    return [];
  }, [suppliersData]);

  const form = useForm({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      category: initialData.category?._id || '',
      brand: initialData.brand?._id || '',
      unit: initialData.unit || 'PIECE', // Initialize new field
      storageRequirement: initialData.storageRequirement || 'AMBIENT', // Initialize new field
      taxRate: initialData.taxRate !== undefined ? initialData.taxRate : 0, // Initialize new field
      variants: initialData.variants?.map(variant => ({
        ...variant,
        _id: variant._id ? String(variant._id) : '',
        buyingPrice: variant.priceHistory?.length ? variant.priceHistory[variant.priceHistory.length - 1].buyingPrice : 0.01,
        sellingPrice: variant.priceHistory?.length ? variant.priceHistory[variant.priceHistory.length - 1].sellingPrice : 0.01,
        supplier: variant.supplier?._id || '',
        attributes: variant.attributes || [],
        barcode: variant.barcode || '',
        qrCode: variant.qrCode || '',
        images: variant.images || [], // Corrected: Should be the actual image data or empty array
        isDeleted: variant.isDeleted || false,
        stockChangeAmount: undefined,
        stockChangeType: undefined,
        stockChangeReason: '',
        minStockLevel: variant.minStockLevel !== undefined ? variant.minStockLevel : 0, // Initialize new field
        maxStockLevel: variant.maxStockLevel !== undefined ? variant.maxStockLevel : 0, // Initialize new field
      })) || [{
        sku: '',
        buyingPrice: 0.01,
        sellingPrice: 0.01,
        stock: 0,
        supplier: '',
        barcode: '',
        qrCode: '',
        images: [],
        attributes: [],
        minStockLevel: 0, // Default for new variant
        maxStockLevel: 0, // Default for new variant
      }],
    } : {
      productName: '',
      description: '',
      brand: '',
      category: '',
      unit: 'PIECE', // Default for new product
      storageRequirement: 'AMBIENT', // Default for new product
      taxRate: 0, // Default for new product
      variants: [{
        sku: '',
        buyingPrice: 0.01,
        sellingPrice: 0.01,
        stock: 0,
        supplier: '',
        barcode: '',
        qrCode: '',
        images: [],
        attributes: [],
        minStockLevel: 0, // Default for new variant
        maxStockLevel: 0, // Default for new variant
      }],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const [activeTab, setActiveTab] = useState('product-details'); // State to manage active tab

  const totalStock = useMemo(() => {
    return form.watch('variants').reduce((sum, variant) => {
      const currentStock = Number(variant.stock) || 0;
      const changeAmount = isEditing ? (Number(variant.stockChangeAmount) || 0) : 0;
      return sum + currentStock + changeAmount;
    }, 0);
  }, [form.watch('variants'), isEditing]);

  const handleAddVariant = () => {
    append({
      sku: '',
      buyingPrice: 0.01,
      sellingPrice: 0.01,
      stock: 0,
      supplier: '',
      barcode: '',
      qrCode: '',
      images: [],
      attributes: [],
      minStockLevel: 0,
      maxStockLevel: 0,
    });
  };

  const handleImageUpload = (variantIndex, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const currentImages = form.getValues(`variants.${variantIndex}.images`) || [];
      const newImagesArray = [...currentImages, ...files];
      form.setValue(`variants.${variantIndex}.images`, newImagesArray, { shouldValidate: true });
      toast.success(`${files.length} image(s) added to variant.`);
    }
  };

  const handleRemoveImage = (variantIndex, imageIndex) => {
    const currentImages = form.getValues(`variants.${variantIndex}.images`) || [];
    const newImages = currentImages.filter((_, i) => i !== imageIndex);
    form.setValue(`variants.${variantIndex}.images`, newImages, { shouldValidate: true });
    toast.info('Image removed.');
  };

  const onSubmitHandler = (data) => {
    // Process variants to include stock adjustment fields for backend
    const processedVariants = data.variants.map(variant => {
      if (isEditing && variant.stockChangeAmount !== undefined && variant.stockChangeAmount !== null) {
        // Send stock adjustment fields to backend for processing
        return {
          ...variant,
          stockChangeAmount: Number(variant.stockChangeAmount), // Ensure it's a number
          stockChangeType: variant.stockChangeType,
          stockChangeReason: variant.stockChangeReason,
        };
      }
      return variant;
    });

    const dataToSend = {
      ...data,
      variants: processedVariants,
    };

    if (isEditing && initialData?._id) {
      onSubmit({ id: initialData._id, ...dataToSend });
    } else {
      onSubmit(dataToSend);
    }
  };

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-8 bg-white p-2">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push(`/${user?.role}/inventory/products`)}
          className="gap-2 px-0 hover:bg-transparent hover:text-primary transition-colors mb-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm font-medium">Back to Product List</span>
        </Button>

        <h2 className="text-3xl font-bold tracking-tight text-primary">
          {isEditing ? 'Edit Product' : 'Create New Product'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isEditing ? 'Update the details for your product.' : 'Fill in the details to add a new product to your inventory.'}
        </p>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4"> {/* Controlled Tabs */}
          <TabsList>
            <TabsTrigger value="product-details">Product Details</TabsTrigger>
            <TabsTrigger value="variants">Variants</TabsTrigger>
          </TabsList>

          <TabsContent value="product-details">
            <ProductDetailsTabContent
              categoryOptions={categoryOptions}
              isLoadingCategories={isLoadingCategories}
              brandOptions={brandOptions}
              isLoadingBrands={isLoadingBrands}
              setActiveTab={setActiveTab} // Pass setActiveTab
              form={form} // Pass form for validation
            />
          </TabsContent>

          <TabsContent value="variants" className="space-y-6 border p-4 rounded-md shadow-inner">
            <VariantManagementTabContent
              fields={fields}
              handleAddVariant={handleAddVariant}
              handleRemoveImage={handleRemoveImage}
              handleImageUpload={handleImageUpload}
              isEditing={isEditing}
              supplierOptions={supplierOptions}
              isLoadingSuppliers={isLoadingSuppliers}
              setActiveTab={setActiveTab} // Pass setActiveTab
              form={form} // Pass form for validation and submission
              onSubmitHandler={onSubmitHandler} // Pass onSubmitHandler
              isLoading={isLoading} // Pass isLoading
              initialData={initialData} // Pass initialData
              removeVariant={remove} // Pass the remove function
            />
          </TabsContent>
        </Tabs>
      </form>
    </FormProvider>
  );
};

export default ProductForm;
