"use client";

import React, { useState } from 'react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PlusCircle, XCircle, UploadCloud, Badge, Image as ImageIcon, ArrowLeft, Plus } from 'lucide-react'; // Added Plus icon
import { ComboBox } from '@/components/ui/combobox';
import { toast } from 'sonner';
import Image from 'next/image';
import SupplierForm from '@/components/shared-components/inventory/suppliers/SupplierForm'; // Import the flexible SupplierForm

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

// VariantAttributes remains a sub-component within VariantManagementTabContent.jsx
import { ATTRIBUTE_SUGGESTIONS, COMMON_ATTRIBUTE_KEYS } from '@/constants/productAttributes';

const VariantAttributes = ({ variantIndex }) => {
  const { control, watch } = useFormContext(); // Use useFormContext here
  const { fields, append, remove } = useFieldArray({
    control: control,
    name: `variants.${variantIndex}.attributes`,
  });

  const handleAddAttribute = () => {
    append({ key: '', value: '' });
  };

  const attributeKeyOptions = COMMON_ATTRIBUTE_KEYS.map(key => ({ label: key, value: key }));

  return (
    <div className="space-y-3 p-3 border rounded-md bg-gray-50 dark:bg-gray-900">
      <div className="flex justify-between items-center">
        <h5 className="font-semibold text-sm">Attributes ({fields.length})</h5>
        <Button type="button" variant="outline" size="sm" onClick={handleAddAttribute}>
          <PlusCircle className="mr-2 h-3 w-3" /> Add Attribute
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">Define key-value pairs for variant characteristics (e.g., "Color: Red", "Size: M").</p>

      {fields.map((field, attrIndex) => {
        const currentKey = watch(`variants.${variantIndex}.attributes.${attrIndex}.key`);
        const valueSuggestions = ATTRIBUTE_SUGGESTIONS[currentKey] || [];

        return (
          <div key={field.id} className="flex gap-2 items-center">
            <FormField
              control={control}
              name={`variants.${variantIndex}.attributes.${attrIndex}.key`}
              render={({ field: attrKeyField }) => (
                <FormItem className="flex-1">
                  <FormLabel className="sr-only">Attribute Key</FormLabel>
                  <ComboBox
                    items={attributeKeyOptions}
                    value={attrKeyField.value}
                    onValueChange={attrKeyField.onChange}
                    placeholder="Key (e.g., Color)"
                    searchPlaceholder="Search keys..."
                    emptyPlaceholder="Type to create new..."
                    custom={true}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`variants.${variantIndex}.attributes.${attrIndex}.value`}
              render={({ field: attrValueField }) => (
                <FormItem className="flex-1">
                  <FormLabel className="sr-only">Attribute Value</FormLabel>
                  <ComboBox
                    items={valueSuggestions}
                    value={attrValueField.value}
                    onValueChange={attrValueField.onChange}
                    placeholder="Value (e.g., Red)"
                    searchPlaceholder="Search values..."
                    emptyPlaceholder="Type to create new..."
                    custom={true}
                    disabled={!currentKey}
                  />
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
        );
      })}
    </div>
  );
};

// Variants Tab Content
const VariantManagementTabContent = ({ fields, handleAddVariant, handleRemoveImage, handleImageUpload, isEditing, supplierOptions, isLoadingSuppliers, setActiveTab, form, onSubmitHandler, isLoading, initialData, removeVariant }) => {
  const { control, watch, setValue } = useFormContext(); // Use useFormContext here
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [currentVariantIndexForSupplier, setCurrentVariantIndexForSupplier] = useState(null); // To track which variant is being edited

  const handlePrevious = () => {
    setActiveTab('product-details');
  };

  const handleFormSubmit = async () => {
    const isValid = await form.trigger(); // Trigger validation for all fields

    if (isValid) {
      onSubmitHandler(form.getValues());
    } else {
      toast.error("Please correct the errors in the form.");
    }
  };

  const handleSupplierCreated = (newSupplier) => {
    // Manually add the new supplier to the options
    const newSupplierOption = { label: newSupplier.name, value: newSupplier._id };
    // Assuming supplierOptions is a memoized array or a state that can be updated.
    // For simplicity, we'll just set the value for the current variant.
    if (currentVariantIndexForSupplier !== null) {
      setValue(`variants.${currentVariantIndexForSupplier}.supplier`, newSupplier._id, { shouldValidate: true });
    }
    setIsSupplierModalOpen(false);
    setCurrentVariantIndexForSupplier(null);
    toast.success(`Supplier "${newSupplier.name}" created and selected.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          Product Variants ({fields.length})
        </h3>
        <Button type="button" onClick={handleAddVariant} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Variant
        </Button>
      </div>
      <p className="text-muted-foreground text-sm">
        Define different variations of your product (e.g., size, color, weight)
        along with their unique SKU, price, stock, and images.
      </p>

      {fields.map((variantField, variantIndex) => (
        <div key={variantField.id} className="space-y-4 border-t pt-4 relative">
          <h4 className="text-lg font-semibold flex items-center justify-between">
            <span>Variant #{variantIndex + 1}</span>
            <div className="flex items-center space-x-2">
              {watch(`variants.${variantIndex}.isDeleted`) && (
                <Badge variant="destructive" className="mr-2">Soft Deleted</Badge>
              )}
              {watch(`variants.${variantIndex}.isDeleted`) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setValue(`variants.${variantIndex}.isDeleted`, false)}
                >
                  Restore
                </Button>
              )}
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeVariant(variantIndex)}
                  className="h-7 w-7 rounded-full"
                >
                  <XCircle className="h-4 w-4" />
                  <span className="sr-only">Remove variant</span>
                </Button>
              )}
            </div>
          </h4>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <FormField
              control={control}
              name={`variants.${variantIndex}.sku`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Leave blank to auto-generate" {...field} />
                  </FormControl>
                  <FormDescription>Unique identifier for this variant</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`variants.${variantIndex}.supplier`}
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <FormLabel>Supplier</FormLabel>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => {
                        setIsSupplierModalOpen(true);
                        setCurrentVariantIndexForSupplier(variantIndex);
                      }}
                      className="gap-1 h-auto px-2 py-0 text-xs text-primary hover:bg-transparent hover:text-primary/80"
                    >
                      <Plus className="h-3 w-3" /> Add New
                    </Button>
                  </div>
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
              control={control}
              name={`variants.${variantIndex}.stock`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Stock Quantity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} readOnly={isEditing} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
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
              control={control}
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
              control={control}
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
              control={control}
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

            <FormField
              control={control}
              name={`variants.${variantIndex}.minStockLevel`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Min Stock Level</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>Minimum stock quantity to trigger reorder alerts.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`variants.${variantIndex}.maxStockLevel`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Max Stock Level</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormDescription>Maximum desired stock quantity.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isEditing && (
            <div className="space-y-3 p-3 border rounded-md bg-yellow-50/20 dark:bg-yellow-950/20">
              <h5 className="font-semibold text-sm">Stock Adjustment</h5>
              <p className="text-muted-foreground text-xs">Adjust stock quantity and provide a reason for the change. Use negative values for deductions (e.g., sales, damages).</p>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <FormField
                  control={control}
                  name={`variants.${variantIndex}.stockChangeType`}
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Change Type</FormLabel>
                      <ComboBox
                        items={[
                          { label: 'Restock', value: 'RESTOCK' },
                          { label: 'Sale', value: 'SALE' },
                          { label: 'Return', value: 'RETURN' },
                          { label: 'Adjustment', value: 'ADJUSTMENT' },
                        ]}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select change type"
                        searchPlaceholder="Search types..."
                        emptyPlaceholder="No types found."
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`variants.${variantIndex}.stockChangeAmount`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Change Amount</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 10 (add) or -5 (deduct)" {...field} />
                      </FormControl>
                      <FormDescription>Positive for increase, negative for decrease.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`variants.${variantIndex}.stockChangeReason`}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2 lg:col-span-1">
                      <FormLabel>Reason (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Weekly delivery, Damaged goods" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}

          <VariantAttributes variantIndex={variantIndex} />

          <FormField
            control={control}
            name={`variants.${variantIndex}.images`}
            render={() => (
              <FormItem className="lg:col-span-3">
                <FormLabel>Variant Images</FormLabel>
                <FormControl>
                  <div className="flex flex-wrap gap-3 p-3 border rounded-md min-h-25 items-center">
                    {(watch(`variants.${variantIndex}.images`) || []).map((image, imgIdx) => {
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
                    {(watch(`variants.${variantIndex}.images`)?.length || 0) < 5 && (
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

      <div className="flex justify-between items-center mt-8">
        <Button type="button" variant="outline" onClick={handlePrevious} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Previous
        </Button>
        <Button type="button" onClick={handleFormSubmit} disabled={isLoading} className="gap-2">
          {isLoading ? 'Saving...' : (isEditing ? 'Update Product' : 'Create Product')}
        </Button>
      </div>

      {isSupplierModalOpen && (
        <SupplierForm
          isOpen={isSupplierModalOpen}
          onClose={() => setIsSupplierModalOpen(false)}
          onSuccess={(newSupplier) => handleSupplierCreated(newSupplier)}
        />
      )}
    </div>
  );
};

export default VariantManagementTabContent;
