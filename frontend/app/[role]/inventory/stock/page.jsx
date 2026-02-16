"use client";

import React, { useState } from 'react';
import { useGetTransfers, useGetBranchStock } from '@/features/stockTransfer.api';
import { useGetAllBranches } from '@/features/branch.api';
import { useGetAllProducts } from '@/features/product.api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, History, Boxes, Warehouse, Lock } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useRouter, useParams } from 'next/navigation';

const StockManagement = () => {
  const [activeTab, setActiveTab] = useState('current-stock');
  const { can } = usePermissions();
  const router = useRouter();
  const { role } = useParams();

  const canReadStock = can('stock:read');
  const canCreateTransfer = can('stock:create');

  const { data: transfers } = useGetTransfers();
  const { data: products } = useGetAllProducts({ page: 1, limit: 1000 });
  
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
              Please contact your administrator if you believe this is an error.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
          <p className="text-muted-foreground">Monitor and transfer inventory across your business locations.</p>
        </div>
        {canCreateTransfer && (
          <Button onClick={() => router.push(`/${role}/stock/create`)}>
            <Plus className="mr-2 h-4 w-4" /> New Transfer
          </Button>
        )}
      </div>

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
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Warehouse Inventory (Main Stock)</CardTitle>
              <Warehouse className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Warehouse Quantity</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.products?.map(product => (
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
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfer-history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
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
                      <TableCell>{new Date(transfer.transferDate).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {transfer.fromLocation === 'WAREHOUSE' ? (
                          <Badge variant="outline">Warehouse</Badge>
                        ) : (
                          "Branch" // Simplified for display
                        )}
                      </TableCell>
                      <TableCell>{transfer.toLocation?.branch_name}</TableCell>
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
