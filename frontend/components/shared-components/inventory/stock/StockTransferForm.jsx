"use client";

import React, { useState, useMemo } from 'react';
import { useGetAllProducts } from '@/features/product.api';
import { useGetAllBranches } from '@/features/branch.api';
import { useCreateTransfer } from '@/features/stockTransfer.api';
import { usePermissions } from '@/hooks/usePermissions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, ArrowRight, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const StockTransferForm = ({ onSuccess }) => {
  const { inventory } = usePermissions();
  const canCreateTransfer = inventory.stock.create;
  const canReadStock = inventory.stock.read;

  const { data: products } = useGetAllProducts({ page: 1, limit: 1000, enabled: canReadStock });
  const { data: branches } = useGetAllBranches({ enabled: canReadStock });
  const createTransferMutation = useCreateTransfer();

  const [fromLocation, setFromLocation] = useState('WAREHOUSE');
  const [toLocation, setToLocation] = useState('');
  const [items, setItems] = useState([{ productId: '', variantId: '', quantity: 1 }]);
  const [notes, setNotes] = useState('');

  const handleAddItem = () => {
    setItems([...items, { productId: '', variantId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    
    // Reset variant if product changes
    if (field === 'productId') {
      newItems[index].variantId = '';
    }
    
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canCreateTransfer) return toast.error('You do not have permission to initiate transfers');
    if (!toLocation) return toast.error('Please select a destination branch');
    if (items.some(item => !item.productId || !item.variantId || item.quantity < 1)) {
      return toast.error('Please fill in all item details correctly');
    }

    try {
      await createTransferMutation.mutateAsync({
        fromLocation,
        toLocation,
        items: items.map(item => ({
          product: item.productId,
          variantId: item.variantId,
          quantity: item.quantity
        })),
        notes
      });
      toast.success('Stock transfer completed successfully');
      onSuccess?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to complete transfer');
    }
  };

  if (!canReadStock) {
    return (
        <div className="p-8 text-center bg-background rounded-lg border border-dashed flex flex-col items-center justify-center">
            <ShieldAlert className="h-12 w-12 text-destructive mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground max-w-sm">You do not have permission to view or manage stock transfers.</p>
        </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Initiate Stock Transfer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div className="space-y-2">
              <Label>Source Location</Label>
              <Select value={fromLocation} onValueChange={setFromLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WAREHOUSE">Warehouse (Main Stock)</SelectItem>
                  {branches?.data?.map(b => (
                    <SelectItem key={b._id} value={b._id}>{b.branch_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destination Branch</Label>
              <Select value={toLocation} onValueChange={setToLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select destination" />
                </SelectTrigger>
                <SelectContent>
                  {branches?.data?.filter(b => b._id !== fromLocation).map(b => (
                    <SelectItem key={b._id} value={b._id}>{b.branch_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-lg font-semibold">Items to Transfer</Label>
              <Button type="button" variant="outline" size="sm" onClick={handleAddItem} disabled={!canCreateTransfer}>
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </div>

            {items.map((item, index) => {
              const selectedProduct = products?.products?.find(p => p._id === item.productId);
              
              return (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end border p-4 rounded-md relative">
                  <div className="md:col-span-2 space-y-2">
                    <Label>Product</Label>
                    <Select 
                      value={item.productId} 
                      onValueChange={(val) => handleItemChange(index, 'productId', val)}
                      disabled={!canCreateTransfer}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products?.products?.map(p => (
                          <SelectItem key={p._id} value={p._id}>{p.productName}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Variant</Label>
                    <Select 
                      value={item.variantId} 
                      disabled={!item.productId || !canCreateTransfer}
                      onValueChange={(val) => handleItemChange(index, 'variantId', val)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select variant" />
                      </SelectTrigger>
                      <SelectContent>
                        {selectedProduct?.variants.map(v => (
                          <SelectItem key={v._id} value={v._id}>
                            {v.sku} ({v.stock} in WH)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-2">
                    <div className="grow space-y-2">
                      <Label>Quantity</Label>
                      <Input 
                        type="number" 
                        min="1" 
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 0)}
                        disabled={!canCreateTransfer}
                      />
                    </div>
                    {items.length > 1 && canCreateTransfer && (
                      <Button 
                        type="button" 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input 
              placeholder="Reason for transfer, e.g., Restock for holiday season" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={!canCreateTransfer}
            />
          </div>

          {canCreateTransfer && (
            <Button type="submit" className="w-full" disabled={createTransferMutation.isLoading}>
              {createTransferMutation.isLoading ? 'Processing...' : 'Complete Transfer'}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  );
};

export default StockTransferForm;
