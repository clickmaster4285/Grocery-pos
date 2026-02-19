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
import { MoreHorizontal, Edit, Trash2, User, Phone, Mail, MapPin, BadgeCheck, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const CustomerTable = ({ 
  customers = [], 
  onEdit, 
  onDelete, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="w-full h-64 flex flex-col items-center justify-center text-muted-foreground bg-secondary/10 rounded-lg border-2 border-dashed">
        <User size={48} className="mb-4 opacity-20" />
        <p className="text-lg font-medium">No customers found</p>
        <p className="text-sm">Register your first customer to get started</p>
      </div>
    );
  }

  const getGroupColor = (group) => {
    switch (group) {
      case 'Platinum': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'Gold': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Silver': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'Staff': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-bold">Customer</TableHead>
            <TableHead className="font-bold">Contact</TableHead>
            <TableHead className="font-bold">Group & Loyalty</TableHead>
            <TableHead className="font-bold">Status</TableHead>
            <TableHead className="font-bold text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer._id} className="hover:bg-muted/30 transition-colors">
              <TableCell>
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {customer.firstName[0]}{customer.lastName ? customer.lastName[0] : ''}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-semibold text-foreground">{customer.fullName}</span>
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-tighter">
                      {customer.customerId}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1 text-xs">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Phone size={12} className="text-muted-foreground" />
                    {customer.phonePrimary}
                  </span>
                  <span className="flex items-center gap-1.5 text-muted-foreground truncate max-w-45">
                    <Mail size={12} />
                    {customer.email}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <Badge variant="outline" className={cn("w-fit py-0 h-5 text-[10px] font-bold", getGroupColor(customer.customerGroup))}>
                    {customer.customerGroup}
                  </Badge>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                    <Star size={10} fill="currentColor" />
                    {customer.loyaltyPoints?.toLocaleString() || 0} Points
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={customer.isActive ? "success" : "destructive"} 
                  className={cn("h-5 px-2 text-[10px] uppercase font-black tracking-widest", 
                    customer.isActive ? "bg-green-500/10 text-green-600 border-green-500/20" : "bg-red-500/10 text-red-600 border-red-500/20"
                  )}
                >
                  {customer.isActive ? 'Active' : 'Inactive'}
                </Badge>
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
                    <DropdownMenuItem onClick={() => onEdit(customer)} className="cursor-pointer">
                      <Edit className="mr-2 h-4 w-4 text-amber-500" />
                      Edit Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(customer._id)} 
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Deactivate
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

export default CustomerTable;
