"use client";

import React, { useState } from 'react';
import { useGetTransfers, useGetBranchStock } from '@/features/stockTransfer.api';
import { useGetAllProducts } from '@/features/product.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, History, Boxes, Warehouse, Lock, Search } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';

import PageHeader from '@/components/shared-components/PageHeader';

const StockManagement = () => {
  const [activeTab, setActiveTab] = useState('current-stock');
  const [searchTerm, setSearchTerm] = useState('');
  const { inventory } = usePermissions();
  const { user } = useAuth();
  const router = useRouter();
  const { role } = useParams();

  const isAdmin = user?.role === 'admin';
  const canReadStock = inventory.stock.read;
  const canCreateTransfer = inventory.stock.create;

  const { data: transfers } = useGetTransfers();
  
  // Logic for Current Stock visibility
  // Admins see Warehouse Stock, others see their Branch Stock
  const { data: warehouseProducts } = useGetAllProducts({ 
    page: 1, 
    limit: 1000, 
    enabled: isAdmin && canReadStock 
  });

  const { data: branchStock } = useGetBranchStock(user?.branch, searchTerm, {
    enabled: !isAdmin && !!user?.branch && canReadStock
  });

  if (!canReadStock) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md text-center p-6">
          <CardHeader>
            <div className="mx-auto bg-yellow-100 p-3 rounded-full w-fit mb-4">
              <Lock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle>Access Restricted</CardTitle>
            <CardDescription>
              You do not have the required permissions to view the stock management system. 
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Stock Management"
        description="Monitor and transfer inventory across your business locations."
        actions={
          canCreateTransfer && (
            <Button onClick={() => router.push(`/${role}/inventory/stock/create`)} className="h-11 rounded-xl font-semibold">
              <Plus className="mr-2 h-4 w-4" /> New Transfer
            </Button>
          )
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="current-stock">
            <Boxes className="mr-2 h-4 w-4" /> Current Stock
          </TabsTrigger>
          <TabsTrigger value="transfer-history">
            <History className="mr-2 h-4 w-4" /> Transfer History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="current-stock" className="space-y-4">
          {!isAdmin && (
            <div className="flex items-center space-x-2 bg-background p-2 rounded-md border">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search branch stock..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-none focus-visible:ring-0"
              />
            </div>
          )}
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isAdmin ? "Warehouse Inventory (Main Stock)" : "Branch Stock Levels"}
              </CardTitle>
              {isAdmin ? <Warehouse className="h-4 w-4 text-muted-foreground" /> : <Boxes className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isAdmin ? (
                    warehouseProducts?.products?.map(product => (
                      product.variants.map(variant => (
                        <TableRow key={variant._id}>
                          <TableCell className="font-medium">{product.productName}</TableCell>
                          <TableCell>{variant.sku}</TableCell>
                          <TableCell className="font-bold">{variant.stock}</TableCell>
                          <TableCell>
                            {variant.stock < 10 ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    ))
                  ) : (
                    branchStock?.map(item => {
                      const variant = item.product?.variants?.find(v => v._id === item.variantId);
                      return (
                        <TableRow key={item._id}>
                          <TableCell className="font-medium">{item.product?.productName}</TableCell>
                          <TableCell>{variant?.sku || 'N/A'}</TableCell>
                          <TableCell className="font-bold">{item.quantity}</TableCell>
                          <TableCell>
                            {item.quantity < 5 ? (
                              <Badge variant="destructive">Low Stock</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">In Stock</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>
                {isAdmin ? "Viewing all external and internal transfers" : "Viewing transfers within your branch"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Transfer Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Performed By</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transfers?.map((transfer) => (
                    <TableRow key={transfer._id}>
                      <TableCell>{new Date(transfer.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={transfer.transferType === 'EXTERNAL' ? 'default' : 'outline'}>
                          {transfer.transferType}
                        </Badge>
                      </TableCell>
                      <TableCell>{transfer.fromLocationDisplay}</TableCell>
                      <TableCell>{transfer.toLocationDisplay}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {transfer.items.map((item, idx) => (
                            <span key={idx} className="text-xs">
                              {item.product?.productName} x {item.quantity}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{transfer.transferredBy?.firstName} {transfer.transferredBy?.lastName}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {transfer.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StockManagement;
