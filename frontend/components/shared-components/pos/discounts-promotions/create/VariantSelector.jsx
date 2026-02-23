'use client';

import React, { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Package, Layers, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export default VariantSelector;
