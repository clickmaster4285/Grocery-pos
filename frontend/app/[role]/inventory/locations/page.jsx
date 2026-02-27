"use client";

import React from 'react';
import BranchLocationForm from '@/components/shared-components/inventory/locations/BranchLocationForm';
import BranchLocationTable from '@/components/shared-components/inventory/locations/BranchLocationTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBranchLocationHook } from '@/hooks/useBranchLocationHook';
import { useGetAllBranches } from '@/features/branch.api';

import PageHeader from '@/components/shared-components/PageHeader';

const LocationsPage = () => {
  const {
    locations,
    isLocationsLoading,
    isFormOpen,
    editingLocation,
    handleOpenForm,
    handleCloseForm,
    handleSubmit,
    handleDelete,
    isSubmitting,
    canCreate,
    canRead,
    canUpdate,
    canDelete,
    isAdmin,
    selectedBranchId,
    setSelectedBranchId,
  } = useBranchLocationHook();

  const { data: branchesData, isLoading: isLoadingBranches } = useGetAllBranches({ enabled: !!isAdmin });

  if (!canRead) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Denied</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-8 text-center bg-background rounded-lg border border-dashed flex flex-col items-center justify-center">
            <ShieldAlert className="h-12 w-12 text-destructive mb-4 opacity-50" />
            <h2 className="text-xl font-bold text-destructive mb-2">Access Denied</h2>
            <p className="text-muted-foreground max-w-sm">You do not have permission to view branch locations.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Branch Locations"
        description="Manage the physical storage locations within your branches."
        actions={
          <>
            {isAdmin && (
              <Select onValueChange={setSelectedBranchId} value={selectedBranchId || ''} disabled={isLoadingBranches}>
                <SelectTrigger className="w-45 h-11 rounded-xl">
                  <SelectValue placeholder="Select Branch" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingBranches ? (
                    <SelectItem value="loading" disabled>Loading branches...</SelectItem>
                  ) : (
                    branchesData?.data?.map(branch => (
                      <SelectItem key={branch._id} value={branch._id}>{branch.branch_name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
            {canCreate && (
              <Button onClick={() => handleOpenForm()} className="h-11 rounded-xl font-semibold">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Location
              </Button>
            )}
          </>
        }
      />

      <Card className="border-none shadow-none bg-transparent">
        <CardContent className="p-0">
          <BranchLocationTable
            locations={locations}
            isLoading={isLocationsLoading}
            onEdit={handleOpenForm}
            onDelete={handleDelete}
            canUpdate={canUpdate}
            canDelete={canDelete}
          />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}>
        <DialogContent className="sm:max-w-106.25 bg-white">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Branch Location' : 'Create New Branch Location'}</DialogTitle>
            <DialogDescription>
              {editingLocation
                ? 'Update the details for this branch location.'
                : 'Fill in the details to create a new branch location.'}
            </DialogDescription>
          </DialogHeader>
          <BranchLocationForm
            initialData={editingLocation}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LocationsPage;
