"use client";

import React from 'react';
import POS from '@/components/shared-components/pos/sales/POS';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';

import PageHeader from '@/components/shared-components/PageHeader';

const SalesPage = () => {
  const { pos } = usePermissions();
  const router = useRouter();
  const { role } = useParams();

  // New hierarchical check
  if (!pos.transaction.create) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md text-center p-6">
          <CardHeader>
            <div className="mx-auto bg-yellow-100 p-3 rounded-full w-fit mb-4">
              <Lock className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle>POS Restricted</CardTitle>
            <CardDescription>
              You do not have the required permissions to make sales.
              Only authorized staff can access the Point of Sale system.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Point of Sale"
        description="Manage branch sales and customer billing."
        actions={
          <Button variant="outline" onClick={() => router.push(`/${role}/pos/sales/history`)} className="h-11 rounded-xl font-semibold">
            <History className="mr-2 h-4 w-4" /> Sales History
          </Button>
        }
      />

      <POS />
    </div>
  );
};

export default SalesPage;
