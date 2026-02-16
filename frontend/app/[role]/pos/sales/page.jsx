"use client";

import React from 'react';
import POS from '@/components/shared-components/pos/sales/POS';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock, History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter, useParams } from 'next/navigation';

const SalesPage = () => {
  const { can } = usePermissions();
  const router = useRouter();
  const { role } = useParams();

  if (!can('sales:create')) {
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Point of Sale</h1>
          <p className="text-muted-foreground">Manage branch sales and customer billing.</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/${role}/sales/history`)}>
          <History className="mr-2 h-4 w-4" /> Sales History
        </Button>
      </div>

      <POS />
    </div>
  );
};

export default SalesPage;
