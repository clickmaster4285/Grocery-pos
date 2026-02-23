'use client';

import React from 'react';
import { FormLabel } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ComboBox } from '@/components/ui/combobox';
import { Package, X } from 'lucide-react';
import VariantSelector from './VariantSelector';

const StepTargeting = ({ 
  form, 
  categoryOptions, 
  brandOptions, 
  productOptions, 
  productsData,
  watchCategories,
  watchBrands,
  watchProducts,
  watchVariants,
  handleToggleVariant,
  handleToggleAllVariants
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Targeting & Scope
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* CATEGORY TARGETING */}
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

          {/* BRAND TARGETING */}
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

          {/* PRODUCT TARGETING */}
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

          {/* VARIANT TARGETING */}
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
  );
};

export default StepTargeting;
