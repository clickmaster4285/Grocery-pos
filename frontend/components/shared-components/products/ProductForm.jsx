"use client";

import React, { useEffect, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, XCircle, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { ComboBox } from '@/components/ui/combobox';
import { toast } from 'sonner';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';
import { useGetAllCategories } from '@/features/category.api';
import { useGetAllBrands } from '@/features/brand.api';
import { useGetAllSuppliers } from '@/features/supplier.api';
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
    (val) => Number(val),
    z.number().min(0.01, { message: 'Buying price must be at least 0.01' })
  ),
  sellingPrice: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, { message: 'Selling price must be at least 0.01' })
  ),
  stock: z.preprocess(
    (val) => Number(val),
    z.number().int().min(0, { message: 'Stock must be a non-negative integer' })
  ),
  supplier: z.string().optional().nullable(),
  barcode: z.string().max(100, { message: "Barcode cannot be more than 100 characters." }).optional().nullable(),
  qrCode: z.string().max(200, { message: "QR Code cannot be more than 200 characters." }).optional().nullable(),
  images: z.array(z.union([z.string(), z.instanceof(File)])).optional(),
});

const productFormSchema = z.object({
  productName: z.string().min(2, { message: 'Product name must be at least 2 characters.' }).max(100, { message: 'Product name cannot be more than 100 characters.' }),
  description: z.string().max(1000, { message: 'Product description cannot be more than 1000 characters.' }).optional().nullable(),
  brand: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  variants: z.array(variantSchema).min(1, { message: 'At least one variant is required.' }),
});

const VariantAttributes = ({ form, variantIndex, supplierOptions, isLoadingSuppliers }) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: `variants.${variantIndex}.attributes`,
  });

  const handleAddAttribute = () => {
    append({ key: '', value: '' });
  };

  return (
    <div className="space-y-3 p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
      <div className="flex justify-between items-center">
        <h5 className="font-semibold text-sm">Attributes ({fields.length})</h5>
        <Button type="button" variant="outline" size="sm" onClick={handleAddAttribute}>
          <PlusCircle className="mr-2 h-3 w-3" /> Add Attribute
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">Define key-value pairs for variant characteristics (e.g., "Color: Red", "Size: M").</p>

      {fields.map((field, attrIndex) => (
        <div key={field.id} className="flex gap-2 items-center">
          <FormField
            control={form.control}
            name={`variants.${variantIndex}.attributes.${attrIndex}.key`}
            render={({ field: attrKeyField }) => (
              <FormItem className="flex-1">
                <FormLabel className="sr-only">Attribute Key</FormLabel>
                <FormControl>
                  <Input placeholder="Key (e.g., Color)" {...attrKeyField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name={`variants.${variantIndex}.attributes.${attrIndex}.value`}
            render={({ field: attrValueField }) => (
              <FormItem className="flex-1">
                <FormLabel className="sr-only">Attribute Value</FormLabel>
                <FormControl>
                  <Input placeholder="Value (e.g., Red)" {...attrValueField} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => remove(attrIndex)}
          >
            <XCircle className="h-4 w-4 text-red-500" />
            <span className="sr-only">Remove attribute</span>
          </Button>
        </div>
      ))}
    </div>
  );
};

const ProductForm = ({ initialData, onSubmit, isLoading, isEditing }) => {

  const { user } = useAuth();

  const { data: categoriesData, isLoading: isLoadingCategories } = useGetAllCategories();

  const categoryOptions = useMemo(() => {
    if (categoriesData) {
      return categoriesData?.map(category => ({
        label: category.name,
        value: category._id,
      }));
    }
    return [];
  }, [categoriesData]);

  const { data: brandsData, isLoading: isLoadingBrands } = useGetAllBrands();
  const brandOptions = useMemo(() => {
    if (brandsData) {
      return brandsData?.map(brand => ({
        label: brand.name,
        value: brand._id,
      }));
    }
    return [];
  }, [brandsData]);

  const { data: suppliersData, isLoading: isLoadingSuppliers } = useGetAllSuppliers();

  const supplierOptions = useMemo(() => {
    if (suppliersData) {
      return suppliersData?.map(supplier => ({
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
      variants: initialData.variants?.map(variant => ({
        ...variant,
        buyingPrice: variant.priceHistory?.length ? variant.priceHistory[variant.priceHistory.length - 1].buyingPrice : 0.01,
        sellingPrice: variant.priceHistory?.length ? variant.priceHistory[variant.priceHistory.length - 1].sellingPrice : 0.01,
        supplier: variant.supplier?._id || '',
        attributes: variant.attributes || [],
        barcode: variant.barcode || '',
        qrCode: variant.qrCode || '',
      })) || [],
    } : {
      productName: '',
      description: '',
      brand: '',
      category: '',
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
      }],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  const totalStock = useMemo(() => {
    return form.watch('variants').reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);
  }, [form.watch('variants')]);

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
    if (isEditing && initialData?._id) {
      onSubmit({ id: initialData._id, ...data });
    } else {
      onSubmit(data);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)} className="space-y-8 p-4">
        <h2 className="text-3xl font-bold tracking-tight text-primary">
          {isEditing ? 'Edit Product' : 'Create New Product'}
        </h2>
        <p className="text-muted-foreground text-sm">
          {isEditing ? 'Update the details for your product.' : 'Fill in the details to add a new product to your inventory.'}
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="productName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Product Name</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Organic Apples" {...field} />
                </FormControl>
                <FormDescription>The name of your product.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="brand"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Brand</FormLabel>
                <ComboBox
                  items={brandOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={isLoadingBrands ? "Loading brands..." : "Select a brand"}
                  searchPlaceholder="Search brands..."
                  emptyPlaceholder="No brands found."
                />
                <FormDescription>The brand of the product.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Category</FormLabel>
                <ComboBox
                  items={categoryOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder={isLoadingCategories ? "Loading categories..." : "Select a category"}
                  searchPlaceholder="Search categories..."
                  emptyPlaceholder="No categories found."
                />
                <FormDescription>The category this product belongs to.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="A detailed description of the product..." rows={5} {...field} />
              </FormControl>
              <FormDescription>Provide a detailed description of the product.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="mt-8 space-y-6 border p-4 rounded-md shadow-inner">
          <h3 className="text-xl font-semibold flex justify-between items-center">
            Product Variants ({fields.length})
            <Button type="button" onClick={handleAddVariant} size="sm">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
            </Button>
          </h3>
          <p className="text-muted-foreground text-sm">
            Define different variations of your product (e.g., size, color, weight)
            along with their unique SKU, price, stock, and images.
          </p>

          {fields.map((variantField, variantIndex) => (
            <div key={variantField.id} className="space-y-4 border-t pt-4 relative">
              <h4 className="text-lg font-semibold flex items-center justify-between">
                Variant #{variantIndex + 1}
                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => remove(variantIndex)}
                    className="h-7 w-7 rounded-full"
                  >
                    <XCircle className="h-4 w-4" />
                    <span className="sr-only">Remove variant</span>
                  </Button>
                )}
              </h4>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={form.control}
                  name={`variants.${variantIndex}.sku`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SKU (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Leave blank to auto-generate" {...field} />
                      </FormControl>
                      <FormDescription>Unique identifier for this variant. Auto-generated if left blank.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variants.${variantIndex}.supplier`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Supplier</FormLabel>
                      <ComboBox
                        items={supplierOptions}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={isLoadingSuppliers ? "Loading suppliers..." : "Select a supplier"}
                        searchPlaceholder="Search suppliers..."
                        emptyPlaceholder="No suppliers found."
                      />
                      <FormDescription>Assign a supplier to this variant.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variants.${variantIndex}.stock`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variants.${variantIndex}.buyingPrice`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Buying Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variants.${variantIndex}.sellingPrice`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variants.${variantIndex}.barcode`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Barcode (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter barcode" {...field} />
                      </FormControl>
                      <FormDescription>Unique barcode for this variant.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`variants.${variantIndex}.qrCode`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>QR Code (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter QR code data" {...field} />
                      </FormControl>
                      <FormDescription>QR code data for this variant.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <VariantAttributes form={form} variantIndex={variantIndex} />

              <FormField
                control={form.control}
                name={`variants.${variantIndex}.images`}
                render={() => (
                  <FormItem className="lg:col-span-3">
                    <FormLabel>Variant Images</FormLabel>
                    <FormControl>
                      <div className="flex flex-wrap gap-3 p-3 border rounded-md min-h-25 items-center">
                        {(form.watch(`variants.${variantIndex}.images`) || []).map((image, imgIdx) => {
                          const imageUrl = image instanceof File ? URL.createObjectURL(image) : `${API_URL}${image}`;
                          return (
                            <div key={imgIdx} className="relative w-40 h-40 rounded-md overflow-hidden group">
                              <Image src={imageUrl} alt={`Variant image ${imgIdx + 1}`} fill style={{ objectFit: 'cover' }} unoptimized={true} />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemoveImage(variantIndex, imgIdx)}
                              >
                                <XCircle className="h-3 w-3" />
                                <span className="sr-only">Remove image</span>
                              </Button>
                            </div>
                          );
                        })}
                        {(form.watch(`variants.${variantIndex}.images`)?.length || 0) < 5 && (
                          <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                            <UploadCloud className="h-6 w-6 text-muted-foreground" />
                            <span className="text-xs text-muted-foreground mt-1">Add Images</span>
                            <Input type="file" multiple className="sr-only" onChange={(e) => handleImageUpload(variantIndex, e)} accept="image/*" />
                          </label>
                        )}
                      </div>
                    </FormControl>
                    <FormDescription>
                      You can upload up to 5 images for each variant, with each image up to 5MB (total 25MB per variant). Accepted formats: JPG, PNG, GIF, WebP.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit" disabled={isLoading || !form.formState.isValid}>
            {isLoading ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
          </Button>
        </div>

        <div className="text-right text-sm text-muted-foreground">
          Total Stock Across Variants: <span className="font-bold text-primary">{totalStock}</span>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
