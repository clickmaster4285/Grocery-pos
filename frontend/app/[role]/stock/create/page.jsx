"use client";

import React from 'react';
import StockTransferForm from '@/components/shared-components/stock/StockTransferForm';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';

const CreateTransferPage = () => {
  const router = useRouter();
  const { role } = useParams();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.push(`/${role}/stock`)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Stock Transfer</h1>
      </div>
      
      <StockTransferForm onSuccess={() => router.push(`/${role}/stock`)} />
    </div>
  );
};

export default CreateTransferPage;
