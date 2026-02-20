"use client";

import React from 'react';
import BranchLocationForm from '@/components/shared-components/inventory/locations/BranchLocationForm';
import BranchLocationTable from '@/components/shared-components/inventory/locations/BranchLocationTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, ShieldAlert } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBranchLocationHook } from '@/hooks/useBranchLocationHook'; // Import the new hook

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
  } = useBranchLocationHook(); // Use the new hook

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Branch Locations</CardTitle>
          {canCreate && (
            <Button onClick={() => handleOpenForm()}>
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Location
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <BranchLocationTable
            data={locations}
            isLoading={isLocationsLoading}
            onEdit={canUpdate ? handleOpenForm : undefined}
            onDelete={canDelete ? handleDelete : undefined}
          />
        </CardContent>
      </Card>

      <Dialog open={isFormOpen} onOpenChange={handleCloseForm}> {/* Use handleCloseForm */}
        <DialogContent className="sm:max-w-106.25">
          <DialogHeader>
            <DialogTitle>{editingLocation ? 'Edit Branch Location' : 'Create New Branch Location'}</DialogTitle>
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
