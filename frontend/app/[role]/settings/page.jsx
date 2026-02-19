"use client";

import React from 'react';
import SettingsContainer from '@/components/shared-components/settings/SettingsContainer';
import { usePermissions } from '@/hooks/usePermissions';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Lock } from 'lucide-react';

const SettingsPage = () => {
  const { settings } = usePermissions();

  // Settings module requires specialized access
  if (!settings.store.read) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Card className="w-full max-w-md text-center p-6 border-none shadow-2xl bg-muted/20">
          <CardHeader>
            <div className="mx-auto bg-red-100 p-3 rounded-full w-fit mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Access Denied</CardTitle>
            <CardDescription className="text-base">
              You do not have the required permissions to modify system configurations.
              Please contact your system administrator.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return <SettingsContainer />;
};

export default SettingsPage;
