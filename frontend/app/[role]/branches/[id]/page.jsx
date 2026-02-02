'use client';

import { useParams } from 'next/navigation';
import { useGetBranchById } from '@/features/branch/branch.api';
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const BranchDetailPage = () => {
  const params = useParams();
  const { id } = params;
  const router = useRouter();

  const { data: branchData, isLoading, isError, error } = useGetBranchById(id);
  const branch = branchData?.data;

  if (isLoading) {
    return <div className="p-6">Loading branch details...</div>;
  }

  if (isError) {
    return <div className="p-6 text-destructive">Error loading branch: {error?.message}</div>;
  }

  if (!branch) {
    return <div className="p-6 text-muted-foreground">Branch not found.</div>;
  }

  const formatTime = (time) => {
    if (!time) return "N/A";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-bold text-foreground">Branch Details: {branch.branch_name}</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-card p-6 rounded-lg shadow-sm border border-border">
        <div>
          <h2 className="text-lg font-semibold mb-3 text-primary">General Information</h2>
          <p className="text-sm text-muted-foreground mb-1">
            {/* <span className="font-medium text-foreground">Branch ID:</span> {branch._id} */}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium text-foreground">Tax Region:</span> {branch.tax_region || 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium text-foreground">Status:</span> {branch.status}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium text-foreground">Created At:</span> {new Date(branch.createdAt).toLocaleDateString()}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium text-foreground">Last Updated:</span> {new Date(branch.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3 text-primary">Operating Hours</h2>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium text-foreground">Opening Time:</span> {formatTime(branch.opening_time)}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium text-foreground">Closing Time:</span> {formatTime(branch.closing_time)}
          </p>

          <h2 className="text-lg font-semibold mb-3 mt-4 text-primary">Address</h2>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium text-foreground">City:</span> {branch.address?.city || 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium text-foreground">State:</span> {branch.address?.state || 'N/A'}
          </p>
          <p className="text-sm text-muted-foreground mb-1">
            <span className="font-medium text-foreground">Country:</span> {branch.address?.country || 'N/A'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BranchDetailPage;