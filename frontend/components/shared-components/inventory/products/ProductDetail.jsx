"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Edit, Trash2, Barcode as BarcodeIcon, Printer } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useReactToPrint } from 'react-to-print';
import BarcodePrint from './BarcodePrint';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const ProductDetail = ({ product, role }) => {
  const router = useRouter();
  const deleteProductMutation = useDeleteProduct();
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  
  // Barcode Printing State
  const [isPrintDialogOpen, setIsPrintDialogOpen] = useState(false);
  const [printCount, setPrintCount] = useState(1);
  const [activeVariantForPrint, setActiveVariantForPrint] = useState(null);
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Barcodes_${product?.productName || 'Product'}`,
  });

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

  const openPrintDialog = (variant) => {
    setActiveVariantForPrint(variant);
    setPrintCount(1);
    setIsPrintDialogOpen(true);
  };

  const confirmPrint = () => {
    setIsPrintDialogOpen(false);
    // Give state a moment to update if needed, then trigger print
    setTimeout(() => {
      handlePrint();
    }, 150);
  };

  return (
    <Card className="w-full">
      {/* Printable Area - Rendered but off-screen */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
        {activeVariantForPrint && (
          <BarcodePrint 
            ref={printRef} 
            value={activeVariantForPrint.barcode || activeVariantForPrint.sku} 
            count={printCount}
            productName={product.productName}
          />
        )}
      </div>

      {/* Barcode Print Dialog */}
      <Dialog open={isPrintDialogOpen} onOpenChange={setIsPrintDialogOpen}>
        <DialogContent className="sm:max-w-106">
          <DialogHeader>
            <DialogTitle>Print Barcodes</DialogTitle>
            <DialogDescription>
              Enter the number of barcodes you want to print for variant {activeVariantForPrint?.sku}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="print-count" className="text-right">
                Quantity
              </Label>
              <Input
                id="print-count"
                type="number"
                min="1"
                max="100"
                value={printCount}
                onChange={(e) => setPrintCount(parseInt(e.target.value) || 1)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmPrint}>
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-bold">{product.productName}</CardTitle>
            {product.description && (
              <CardDescription className="mt-2 text-md">{product.description}</CardDescription>
            )}
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
                    <span className="font-bold">{product.productName}</span>.
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
            <p className="text-base">{product.brand?.name || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Category</p>
            <p className="text-base">{product.category?.name || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Total Stock</p>
            <p className="text-base font-semibold">{product.totalStock}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <Badge className={`text-base ${product.isActive ? 'bg-green-500' : 'bg-red-500'}`}>
              {product.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">Last Restocked</p>
            <p className="text-base">
              {product.lastRestocked ? new Date(product.lastRestocked).toLocaleDateString() : 'N/A'}
            </p>
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
                        <CardTitle className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            Variant: {variant.sku || 'N/A'}
                            {variant.isDeleted && <Badge variant="destructive">Soft Deleted</Badge>}
                          </div>
                          <Button variant="outline" size="sm" onClick={() => openPrintDialog(variant)}>
                            <BarcodeIcon className="mr-2 h-4 w-4" /> Generate Barcode
                          </Button>
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">SKU</p>
                            <p className="text-base">{variant.sku || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Current Selling Price</p>
                            <p className="text-base font-semibold">
                              ${variant.priceHistory && variant.priceHistory.length > 0
                                ? variant.priceHistory[variant.priceHistory.length - 1].sellingPrice?.toFixed(2)
                                : '0.00'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Current Buying Price</p>
                            <p className="text-base font-semibold">
                              ${variant.priceHistory && variant.priceHistory.length > 0
                                ? variant.priceHistory[variant.priceHistory.length - 1].buyingPrice?.toFixed(2)
                                : '0.00'}
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Stock</p>
                            <p className="text-base">{variant.stock}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Supplier</p>
                            <p className="text-base">{variant.supplier?.name || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Barcode</p>
                            <p className="text-base">{variant.barcode || 'N/A'}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">QR Code</p>
                            <p className="text-base">{variant.qrCode || 'N/A'}</p>
                          </div>
                        </div>

                        {variant.attributes && variant.attributes.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <h4 className="text-lg font-semibold mb-2">Attributes</h4>
                              <div className="flex flex-wrap gap-2">
                                {variant.attributes.map((attr, idx) => (
                                  <Badge key={idx} variant="secondary">
                                    {attr.key}: {attr.value}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        <Separator />

                        <div>
                          <h4 className="text-lg font-semibold mb-2">Images</h4>
                          {variant.images && variant.images.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {variant.images.map((url, index) => (
                                <div key={index} className="relative w-48 h-48 rounded-md overflow-hidden border">
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
                                    <TableHead>Effective Date</TableHead>
                                    <TableHead>Buying Price</TableHead>
                                    <TableHead>Selling Price</TableHead>
                                    <TableHead>Changed By</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {variant.priceHistory.map((history, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{new Date(history.effectiveDate).toLocaleDateString()}</TableCell>
                                      <TableCell>${history.buyingPrice?.toFixed(2)}</TableCell>
                                      <TableCell>${history.sellingPrice?.toFixed(2)}</TableCell>
                                      <TableCell>
                                        {history.changedBy
                                          ? `${history.changedBy.firstName || ''} ${history.changedBy.lastName || ''}`.trim() || 'N/A'
                                          : 'System'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm">No price history available.</div>
                          )}
                        </div>

                        <Separator />

                        <div>
                          <h4 className="text-lg font-semibold mb-2">Stock History</h4>
                          {variant.stockHistory && variant.stockHistory.length > 0 ? (
                            <div className="rounded-md border">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Change</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Performed By</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {variant.stockHistory.map((history, index) => (
                                    <TableRow key={index}>
                                      <TableCell>{new Date(history.date).toLocaleDateString()}</TableCell>
                                      <TableCell>{history.change}</TableCell>
                                      <TableCell>{history.type}</TableCell>
                                      <TableCell>{history.reason || 'N/A'}</TableCell>
                                      <TableCell>
                                        {history.performedBy
                                          ? `${history.performedBy.firstName || ''} ${history.performedBy.lastName || ''}`.trim() || 'N/A'
                                          : 'System'}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          ) : (
                            <div className="text-muted-foreground text-sm">No stock history available.</div>
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