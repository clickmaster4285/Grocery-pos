'use client';

import React, { useState } from 'react';
import { useGetAllCustomers, useDeleteCustomer } from '@/features/customer.api';
import { useDebounce } from '@/hooks/useDebounce';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Users, RefreshCw, Filter, UserPlus, Phone } from 'lucide-react';
import CustomerTable from './CustomerTable';
import CustomerForm from './CustomerForm';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const CustomerList = () => {
  const { customerManagement } = usePermissions();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);
  const [groupFilter, setGroupFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const { data, isLoading, refetch, isFetching } = useGetAllCustomers({
    search: debouncedSearch,
    customerGroup: groupFilter,
  });

  const deleteCustomerMutation = useDeleteCustomer();

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to deactivate this customer account?')) {
      try {
        await deleteCustomerMutation.mutateAsync(id);
      } catch (err) {
        // Error handled by mutation
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary uppercase italic">Customer Database</h1>
          <p className="text-muted-foreground text-sm">Manage your customer relationships, loyalty points, and contact details.</p>
        </div>
        
        {customerManagement.database.create && (
          <Button onClick={handleCreate} className="gap-2 shadow-lg shadow-primary/20 font-bold">
            <UserPlus size={18} /> Register Customer
          </Button>
        )}
      </div>

      {/* Control Bar */}
      <Card className="bg-muted/30 border-none shadow-none">
        <CardContent className="p-4 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, phone, email or ID..."
              className="pl-9 border-none shadow-sm focus-visible:ring-primary"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-muted-foreground" />
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="w-37.5 border-none shadow-sm h-9 text-xs">
                  <SelectValue placeholder="All Groups" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  <SelectItem value="Regular">Regular</SelectItem>
                  <SelectItem value="Silver">Silver</SelectItem>
                  <SelectItem value="Gold">Gold</SelectItem>
                  <SelectItem value="Platinum">Platinum</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              variant="outline" 
              size="icon" 
              className="h-9 w-9" 
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw size={16} className={isFetching ? "animate-spin" : ""} />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <CustomerTable 
        customers={data?.data || []}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Form Modal */}
      {isFormOpen && (
        <CustomerForm 
          isOpen={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          customerData={selectedCustomer}
        />
      )}
    </div>
  );
};

export default CustomerList;
