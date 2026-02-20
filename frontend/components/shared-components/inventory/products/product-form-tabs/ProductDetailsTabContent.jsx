"use client";

import React from 'react';
import { useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ComboBox } from '@/components/ui/combobox';
import { Button } from '@/components/ui/button'; // Import Button
import { ArrowRight } from 'lucide-react'; // Import Icon

// Product Details Tab Content
const ProductDetailsTabContent = ({ categoryOptions, isLoadingCategories, brandOptions, isLoadingBrands, setActiveTab, form }) => { // Added setActiveTab and form props
  const { control, trigger } = useFormContext(); // Use trigger for validation

  const handleNext = async () => {
    // Validate fields pertinent to this tab
    const isValid = await trigger([
      "productName",
      "brand",
      "category",
      "unit",
      "storageRequirement",
      "taxRate",
      "description"
    ]);

    if (isValid) {
      setActiveTab('variants');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <FormField
          control={control}
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
          control={control}
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
          control={control}
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

        <FormField
          control={control}
          name="unit"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Unit</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PIECE">Piece</SelectItem>
                  <SelectItem value="KG">Kilogram (KG)</SelectItem>
                  <SelectItem value="GRAM">Gram (G)</SelectItem>
                  <SelectItem value="LITER">Liter (L)</SelectItem>
                  <SelectItem value="ML">Milliliter (ML)</SelectItem>
                  <SelectItem value="PACK">Pack</SelectItem>
                  <SelectItem value="DOZEN">Dozen</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The unit of measure for this product.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="storageRequirement"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Storage Requirement</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select storage type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AMBIENT">Ambient</SelectItem>
                  <SelectItem value="REFRIGERATED">Refrigerated</SelectItem>
                  <SelectItem value="FROZEN">Frozen</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>The required storage condition for this product.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="taxRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tax Rate (%)</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="e.g., 5, 12.5" {...field} />
              </FormControl>
              <FormDescription>The applicable tax rate for this product.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
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

      <div className="flex justify-end mt-8">
        <Button type="button" onClick={handleNext} className="gap-2">
          Next <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default ProductDetailsTabContent;
