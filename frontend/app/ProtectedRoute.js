'use client';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Loading from '@/app/loading';
import { ALLOWED_ROLES } from '@/constants/roles';

export default function ProtectedRoute({ children, allowedRoles = ALLOWED_ROLES }) {
   const { user, isLoading, isAuthenticated } = useAuth();
   const router = useRouter();

   useEffect(() => {
      if (!isLoading && !isAuthenticated) {
         router.push('/login');
         return;
      }

      if (!isLoading && isAuthenticated && user) {
         const userRole = user?.role?.toLowerCase() || user?.user_role?.toLowerCase();

         if (!allowedRoles.includes(userRole)) {
            router.push(`/${userRole}/dashboard`);
         }
      }
   }, [user, isLoading, isAuthenticated, router, allowedRoles]);

   if (isLoading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <Loading />
         </div>
      );
   }

   if (!isAuthenticated) {
      return null;
   }

   const userRole = user?.role?.toLowerCase() || user?.user_role?.toLowerCase();

   if (!allowedRoles.includes(userRole)) {
      return null;
   }

   return <>{children}</>;
}