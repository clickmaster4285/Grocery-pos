'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Edit, Trash2, Eye, Tag, Calendar, Users, Percent, Gift } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const DiscountTable = ({ 
  discounts = [], 
  onEdit, 
  onDelete, 
  onView,
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (discounts.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg border-2 border-dashed">
        <Tag size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">No discounts or promotions found</p>
        <p className="text-sm">Create your first promotion to get started</p>
      </div>
    );
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'BOGO': return <Gift size={14} />;
      case 'Mix & Match': return <Tag size={14} />;
      case 'Bundle': return <Percent size={14} />;
      default: return <Percent size={14} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'BOGO': return 'bg-purple-100 text-purple-700 hover:bg-purple-200';
      case 'Mix & Match': return 'bg-blue-100 text-blue-700 hover:bg-blue-200';
      case 'Bundle': return 'bg-orange-100 text-orange-700 hover:bg-orange-200';
      default: return 'bg-green-100 text-green-700 hover:bg-green-200';
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-bold">Promotion Name</TableHead>
            <TableHead className="font-bold">Type</TableHead>
            <TableHead className="font-bold">Value</TableHead>
            <TableHead className="font-bold">Validity</TableHead>
            <TableHead className="font-bold">Usage</TableHead>
            <TableHead className="font-bold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {discounts.map((discount) => (
            <TableRow key={discount._id} className="hover:bg-muted/30 transition-colors">
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-semibold text-foreground">{discount.name}</span>
                  {discount.couponCode && (
                    <span className="text-xs font-mono text-primary flex items-center gap-1 mt-1">
                      <Tag size={10} /> {discount.couponCode}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={cn("gap-1 py-0.5", getTypeColor(discount.type))}>
                  {getTypeIcon(discount.type)}
                  {discount.type}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {discount.amountType === 'Percentage' 
                      ? `${discount.amountValue}% OFF` 
                      : discount.amountType === 'Set Price'
                        ? `Price: ${discount.amountValue}`
                        : `${discount.amountValue} OFF`}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">
                    {discount.amountType}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col text-xs text-muted-foreground gap-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} className="text-primary/60" />
                    {format(new Date(discount.startDate), 'MMM dd, yyyy')}
                  </span>
                  {discount.endDate ? (
                    <span className="flex items-center gap-1 ml-4 text-[10px]">
                      to {format(new Date(discount.endDate), 'MMM dd, yyyy')}
                    </span>
                  ) : (
                    <span className="text-[10px] ml-4 text-green-600 font-medium italic">No End Date</span>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">{discount.usageCount || 0}</span>
                    <span className="text-[10px] text-muted-foreground uppercase">Redeemed</span>
                  </div>
                  {discount.usageLimit && (
                    <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${Math.min((discount.usageCount / discount.usageLimit) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => onView(discount._id)} className="cursor-pointer">
                      <Eye className="mr-2 h-4 w-4 text-blue-500" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onEdit(discount._id)} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4 text-amber-500" />
                      Edit Promotion
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(discount._id)} 
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DiscountTable;
