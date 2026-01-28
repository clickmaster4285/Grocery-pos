// hooks/useAuth.js
'use client';

import { useRouter } from 'next/navigation';
import { useGetMe, useLogout } from '@/features/authApi';
import { useEffect } from 'react';

export const useAuth = () => {
   const router = useRouter();
   const {
      data: user,
      isLoading,
      error,
      isError,
      refetch,
      isFetching
   } = useGetMe();

   const logoutMutation = useLogout();

   // Check if we have a token
   const hasToken = typeof window !== 'undefined' ? !!localStorage.getItem('token') : false;

   // Check if we got a 401 error (unauthorized)
   const isUnauthorized = isError && error?.response?.status === 401;

   // User is authenticated if we have user data, no error, and not loading
   const isAuthenticated = !!user && !error && !isLoading && !isFetching;

   const hasRole = (allowedRoles = []) => {
      if (!user || !allowedRoles.length) return false;
      const userRole = user?.role || user?.user_role;
      return allowedRoles.includes(userRole);
   };

   const logout = () => {
      logoutMutation();
      router.push('/');
   };

   // Force refetch when token becomes available
   useEffect(() => {
      if (hasToken && !user && !isLoading) {
         refetch();
      }
   }, [hasToken, user, isLoading, refetch]);

   // Auto-redirect on unauthorized access
   useEffect(() => {
      if (isUnauthorized && hasToken) {
         localStorage.removeItem('token');
         router.push(`/dashboard/${user?.role}`);
      }
   }, [isUnauthorized, hasToken, router]);

   return {
      user,
      isLoading: isLoading || isFetching,
      isAuthenticated,
      hasRole,
      error,
      hasToken,
      isUnauthorized,
      logout,
      refetch
   };
};