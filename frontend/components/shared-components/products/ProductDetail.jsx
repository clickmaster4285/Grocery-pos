"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2 } from 'lucide-react';
import { useDeleteProduct } from '@/features/product.api';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const ProductDetail = ({ product, role }) => {
  const router = useRouter();
  const deleteProductMutation = useDeleteProduct();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  if (!product) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Product Not Found</CardTitle>
          <CardDescription>The requested product could not be loaded.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleDeleteProduct = async () => {
    try {
      await deleteProductMutation.mutateAsync(product._id);
      toast.success('Product deleted successfully!');
      router.push(`/${role}/products`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-bold">{product.name}</CardTitle>
            <CardDescription className="mt-1">{product.description}</CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => router.push(`/${role}/products/${product._id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
            <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will soft delete the product{' '}
                    <span className="font-bold">{product.name}</span>.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDeleteProduct}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Brand</p>
            <p className="text-base">{product.brand}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Category</p>
            <p className="text-base">{product.category}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Stock</p>
            <p className="text-base font-semibold">{product.totalStock}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Created At</p>
            <p className="text-base">{new Date(product.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
            <p className="text-base">{new Date(product.updatedAt).toLocaleDateString()}</p>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-xl font-semibold mb-4">Product Variants</h3>
          <Tabs defaultValue={product.variants[0]?._id || 'no-variant'} className="w-full">
            {product.variants && product.variants.length > 0 ? (
              <>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {product.variants.map((variant) => (
                    <TabsTrigger key={variant._id} value={variant._id}>
                      {variant.sku || `Variant ${variant._id.substring(0, 4)}`}
                    </TabsTrigger>
                  ))}
                </TabsList>
                {product.variants.map((variant) => (
                  <TabsContent key={variant._id} value={variant._id} className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Variant Details: {variant.sku}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">SKU</p>
                            <p className="text-base">{variant.sku}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Price</p>
                            <p className="text-base">${variant.price.toFixed(2)}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Stock</p>
                            <p className="text-base">{variant.stock}</p>
                          </div>
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-lg font-semibold mb-2">Images</h4>
                          {variant.images && variant.images.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {variant.images.map((url, index) => (
                                <div key={index} className="relative w-24 h-24 rounded-md overflow-hidden border">
                                  <Image src={`${API_URL}${url}`} alt={`Variant image ${index + 1}`} fill style={{ objectFit: 'cover' }} unoptimized={true} />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm">No images for this variant.</div>
                          )}
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-lg font-semibold mb-2">Price History</h4>
                          {variant.priceHistory && variant.priceHistory.length > 0 ? (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Buying Price</TableHead>
                                    <TableHead>Selling Price</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {variant.priceHistory.map((history, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{new Date(history.date).toLocaleDateString()}</TableCell>
                                      <TableCell>${history.buyingPrice.toFixed(2)}</TableCell>
                                      <TableCell>${history.sellingPrice.toFixed(2)}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm">No price history available.</div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                ))}
              </>
            ) : (
              <div className="text-muted-foreground text-sm">No variants defined for this product.</div>
            )}
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductDetail;