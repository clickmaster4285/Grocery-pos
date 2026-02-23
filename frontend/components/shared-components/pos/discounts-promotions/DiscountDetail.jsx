'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDiscountHook } from '@/hooks/useDiscountHook';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Tag, 
  Calendar, 
  Clock, 
  Percent, 
  Users, 
  Store, 
  Package, 
  Edit, 
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Gift,
  Layers,
  BarChart
} from 'lucide-react';
import { format } from 'date-fns';

const DiscountDetail = ({ id, role }) => {
  const router = useRouter();
  const { getDiscountByIdQuery } = useDiscountHook(id);
  const discount = getDiscountByIdQuery.data?.data;

  if (getDiscountByIdQuery.isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!discount) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Promotion not found</h2>
        <Button variant="link" onClick={() => router.back()}>Go back</Button>
      </div>
    );
  }

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return <Badge className="bg-green-100 text-green-700 border-green-200 hover:bg-green-100"><CheckCircle2 size={12} className="mr-1" /> Active</Badge>;
    }
    return <Badge variant="secondary" className="bg-gray-100 text-gray-700 border-gray-200"><XCircle size={12} className="mr-1" /> Inactive</Badge>;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{discount.name}</h1>
              {getStatusBadge(discount.status)}
            </div>
            <p className="text-muted-foreground">{discount.discountDescription || 'No description provided.'}</p>
          </div>
        </div>
        <Button onClick={() => router.push(`/${role}/pos/discounts-promotions/${id}`)} className="gap-2">
          <Edit size={18} />
          Edit Promotion
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-none shadow-lg">
            <CardHeader className="bg-primary/5 border-b">
              <CardTitle className="flex items-center gap-2">
                <Gift className="text-primary" />
                Promotion Mechanics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Type</p>
                  <p className="font-semibold text-lg">{discount.type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Coupon Code</p>
                  <p className="font-mono text-primary font-bold">{discount.couponCode || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Value</p>
                  <p className="font-semibold text-lg">
                    {discount.amountValue}{discount.amountType === 'Percentage' ? '%' : '$'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider mb-1">Method</p>
                  <p className="text-sm font-medium px-2 py-0.5 bg-secondary rounded inline-block">
                    {discount.autoApply ? 'Automatic' : 'Manual Entry'}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-sm text-primary">
                    <Layers size={16} /> Logic Rules
                  </h3>
                  <ul className="space-y-3">
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Minimum Purchase:</span>
                      <span className="font-medium">${discount.minPurchaseAmount || 0}</span>
                    </li>
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Minimum Quantity:</span>
                      <span className="font-medium">{discount.minQuantity || 1} items</span>
                    </li>
                    {discount.type === 'BOGO' && (
                      <li className="flex justify-between text-sm p-2 bg-primary/5 rounded border border-primary/10">
                        <span className="text-primary font-bold">BOGO Rule:</span>
                        <span className="font-bold">Buy {discount.buyQuantity} Get {discount.getQuantity}</span>
                      </li>
                    )}
                    <li className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Stackable:</span>
                      <span className={discount.allowFurtherDiscounts ? "text-green-600 font-bold" : "text-amber-600 font-bold"}>
                        {discount.allowFurtherDiscounts ? "Yes (Allows others)" : "No (Solo only)"}
                      </span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold flex items-center gap-2 text-sm text-primary">
                    <BarChart size={16} /> Performance
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-3xl font-black text-foreground">{discount.usageCount || 0}</span>
                      <span className="text-xs text-muted-foreground mb-1">TOTAL REDEMPTIONS</span>
                    </div>
                    {discount.usageLimit && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                          <span>Usage Limit</span>
                          <span>{Math.round((discount.usageCount / discount.usageLimit) * 100)}% Consumed</span>
                        </div>
                        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-1000" 
                            style={{ width: `${(discount.usageCount / discount.usageLimit) * 100}%` }}
                          />
                        </div>
                        <p className="text-right text-xs font-medium">{discount.usageCount} / {discount.usageLimit}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="text-primary" />
                Target Items
              </CardTitle>
              <CardDescription>Items eligible for this promotion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <p className="text-sm font-bold text-muted-foreground">Categories</p>
                <div className="flex flex-wrap gap-2">
                  {discount.qualifyingCategories?.length > 0 ? (
                    discount.qualifyingCategories.map(cat => (
                      <Badge key={cat._id} variant="outline" className="px-3 py-1 font-medium bg-secondary/20">
                        {cat.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm italic text-muted-foreground">All Categories (Global)</span>
                  )}
                </div>
              </div>

              <div className="space-y-3 border-t pt-4">
                <p className="text-sm font-bold text-muted-foreground">Specific Products</p>
                <div className="flex flex-wrap gap-2">
                  {discount.qualifyingProducts?.length > 0 ? (
                    discount.qualifyingProducts.map(prod => (
                      <Badge key={prod._id} variant="secondary" className="px-3 py-1 font-medium">
                        {prod.productName}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-sm italic text-muted-foreground">No specific products restricted.</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-primary">
                <Calendar /> Availability
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Valid From</span>
                <span className="font-semibold">{format(new Date(discount.startDate), 'PPP')}</span>
              </div>
              
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Expires On</span>
                <span className="font-semibold">
                  {discount.endDate ? format(new Date(discount.endDate), 'PPP') : 'Never (Perpetual)'}
                </span>
              </div>

              <Separator />

              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Weekly Schedule</span>
                <div className="flex flex-wrap gap-1">
                  {discount.applicableDays?.length > 0 ? (
                    discount.applicableDays.map(day => (
                      <Badge key={day} variant="outline" className="text-[10px] bg-white">{day}</Badge>
                    ))
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-white border-green-200 text-green-700">Daily</Badge>
                  )}
                </div>
              </div>

              {(discount.startTime || discount.endTime) && (
                <div className="flex items-center gap-2 text-sm font-medium text-primary bg-white p-2 rounded-md border border-primary/10">
                  <Clock size={16} />
                  <span>{discount.startTime || '00:00'} to {discount.endTime || '23:59'}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users /> Eligibility
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Customer Groups</span>
                <div className="flex flex-wrap gap-1">
                  {discount.qualifyingCustomerGroups?.length > 0 ? (
                    discount.qualifyingCustomerGroups.map(group => (
                      <Badge key={group} variant="secondary">{group}</Badge>
                    ))
                  ) : (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">All Customers</Badge>
                  )}
                </div>
              </div>
              <div className="flex justify-between text-xs border-t pt-3">
                <span className="text-muted-foreground">Limit Per Customer:</span>
                <span className="font-bold">{discount.limitPerCustomer} times</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Store /> Scope
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Branch Mode:</span>
                <Badge variant={discount.isGlobal ? "default" : "outline"}>
                  {discount.isGlobal ? "Global (All Branches)" : "Specific Branches"}
                </Badge>
              </div>
              
              {!discount.isGlobal && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">Applicable At</span>
                  <div className="flex flex-wrap gap-1">
                    {discount.applicableBranches?.map(branch => (
                      <Badge key={branch._id} variant="secondary">{branch.name}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between text-xs border-t pt-3">
                <span className="text-muted-foreground">Priority Level:</span>
                <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">{discount.priority || 1}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DiscountDetail;
