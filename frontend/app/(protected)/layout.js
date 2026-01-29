'use client';

import { useAuth } from '../../../hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Skeleton } from '../../components/ui/skeleton';

export default function ProtectedLayout({ children }) {
  const { isAuthenticated, isLoading, isError, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router, isError, logout]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Skeleton className="h-12 w-12 rounded-full" />
        <Skeleton className="h-4 w-62.5" />
      </div>
    );
  }

  return <>{children}</>;
}
