"use client";

import React, { useMemo } from 'react';
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
import { useGetAllBranches } from '@/features/branch/branch.api';

const CATEGORIES = [
  { label: "Fruits", value: "fruits" },
  { label: "Vegetables", value: "vegetables" },
  { label: "Dairy", value: "dairy" },
  { label: "Meat", value: "meat" },
  { label: "Bakery", value: "bakery" },
  { label: "Beverages", value: "beverages" },
];

// Define the schema for product variants
const variantSchema = z.object({
  _id: z.string().optional(), // For existing variants
  name: z.string().optional(), // Optional variant name
  value: z.string().optional(), // Optional variant value (e.g., "Red", "Large")
  sku: z.string().optional(),
  price: z.preprocess(
    (val) => Number(val),
    z.number().min(0.01, { message: 'Price must be at least 0.01' })
  ),
  stock: z.preprocess(
    (val) => Number(val),
    z.number().int().min(0, { message: 'Stock must be a non-negative integer' })
  ),
  // images can be string (URL) or File object
  images: z.array(z.union([z.string().url(), z.instanceof(File)])).optional(),
});

// Define the main product schema
const productFormSchema = z.object({
  productName: z.string().min(2, { message: 'Product name must be at least 2 characters.' }),
  description: z.string().optional(),
  brand: z.string().optional(),
  category: z.string().optional(),
  variants: z.array(variantSchema).min(1, { message: 'At least one variant is required.' }),
  branch_id: z.string().optional(), // Added branch_id to schema
});

const ProductForm = ({ initialData, onSubmit, isLoading, isEditing }) => {
  const { user } = useAuth(); // Fetch current user
  const { data: branchesData, isLoading: isLoadingBranches } = useGetAllBranches(); // Fetch all branches
  const isAdmin = user?.role === 'admin';

  const branchOptions = useMemo(() => {
    if (branchesData?.data) {
      return branchesData.data.map(branch => ({
        label: branch.branch_name,
        value: branch._id,
      }));
    }
    return [];
  }, [branchesData]);

  // Adjust schema dynamically if admin
  const finalProductFormSchema = useMemo(() => {
    if (isAdmin) {
      return productFormSchema.extend({
        branch_id: z.string().min(1, { message: 'Branch is required for admin users.' }),
      });
    }
    return productFormSchema;
  }, [isAdmin]);

  const form = useForm({
    resolver: zodResolver(finalProductFormSchema),
    defaultValues: initialData || {
      productName: '',
      description: '',
      brand: '',
      category: '',
      branch_id: '', // Initialize branch_id
      variants: [{ sku: '', price: 0.01, stock: 0, images: [] }],
    },
    mode: 'onChange',
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  // Calculate total stock dynamically
  const totalStock = useMemo(() => {
    return form.watch('variants').reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0);
  }, [form.watch('variants')]);




  const handleAddVariant = () => {
    append({ sku: '', price: 0.01, stock: 0, images: [] });
  };

  // Handles adding new files to a variant's images array
  const handleImageUpload = (variantIndex, e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const currentImages = form.getValues(`variants.${variantIndex}.images`) || [];
      const newImagesArray = [...currentImages, ...files];
      form.setValue(`variants.${variantIndex}.images`, newImagesArray, { shouldValidate: true });
      toast.success(`${files.length} image(s) added to variant.`);
    }
  };

  // Handles removing an image (either File or URL) from a variant's images array
  const handleRemoveImage = (variantIndex, imageIndex) => {
    const currentImages = form.getValues(`variants.${variantIndex}.images`) || [];
    const newImages = currentImages.filter((_, i) => i !== imageIndex);
    form.setValue(`variants.${variantIndex}.images`, newImages, { shouldValidate: true });
    toast.info('Image removed.');
  };

  const onSubmitHandler = (data) => {
    onSubmit(data);
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
              <FormItem>
                <FormLabel>Brand</FormLabel>
                <FormControl>
                  <Input placeholder="E.g., Fresh Harvest" {...field} />
                </FormControl>
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
                  items={CATEGORIES}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Select a category"
                  searchPlaceholder="Search categories..."
                  emptyPlaceholder="No category found. Create new?"
                  custom={true}
                />
                <FormDescription>The category this product belongs to.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {isAdmin && (
            <FormField
              control={form.control}
              name="branch_id"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Assign Branch</FormLabel>
                  <ComboBox
                    items={branchOptions}
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder={isLoadingBranches ? "Loading branches..." : "Select a branch"}
                    searchPlaceholder="Search branches..."
                    emptyPlaceholder="No branches found."
                  />
                  <FormDescription>Assign this product to a specific branch.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
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

          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-4 border-t pt-4 relative md:grid-cols-2 lg:grid-cols-3">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
                className="absolute top-2 right-2 h-7 w-7 rounded-full"
              >
                <XCircle className="h-4 w-4" />
                <span className="sr-only">Remove variant</span>
              </Button>

              <FormField
                control={form.control}
                name={`variants.${index}.name`}
                render={({ field: variantNameField }) => (
                  <FormItem>
                    <FormLabel>Variant Name (e.g. Color)</FormLabel>
                    <FormControl>
                      <Input placeholder="Color" {...variantNameField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`variants.${index}.value`}
                render={({ field: variantValueField }) => (
                  <FormItem>
                    <FormLabel>Variant Value (e.g. Red)</FormLabel>
                    <FormControl>
                      <Input placeholder="Red" {...variantValueField} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`variants.${index}.sku`}
                render={({ field: skuField }) => (
                  <FormItem>
                    <FormLabel>SKU (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Leave blank to auto-generate" {...skuField} />
                    </FormControl>
                    <FormDescription>Unique identifier for this variant. Auto-generated if left blank.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`variants.${index}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`variants.${index}.stock`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem className="lg:col-span-3">
                <FormLabel>Variant Images</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-3 p-3 border rounded-md min-h-[100px] items-center">
                    {(form.watch(`variants.${index}.images`) || []).map((image, imgIdx) => {
                      const imageUrl = image instanceof File ? URL.createObjectURL(image) : image;
                      return (
                        <div key={imgIdx} className="relative w-24 h-24 rounded-md overflow-hidden group">
                          <Image src={imageUrl} alt={`Variant image ${imgIdx + 1}`} layout="fill" objectFit="cover" />
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveImage(index, imgIdx)}
                          >
                            <XCircle className="h-3 w-3" />
                            <span className="sr-only">Remove image</span>
                          </Button>
                        </div>
                      );
                    })}
                    <label className="flex flex-col items-center justify-center w-24 h-24 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                      <UploadCloud className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground mt-1">Add Images</span>
                      <Input type="file" multiple className="sr-only" onChange={(e) => handleImageUpload(index, e)} accept="image/*" />
                    </label>
                  </div>
                </FormControl>
                <FormDescription>Upload multiple images specific to this variant.</FormDescription>
                <FormMessage />
              </FormItem>
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

        {/* Display total stock outside form, perhaps in a stats card or summary */}
        <div className="text-right text-sm text-muted-foreground">
          Total Stock Across Variants: <span className="font-bold text-primary">{totalStock}</span>
        </div>
      </form>
    </Form>
  );
};

export default ProductForm;
