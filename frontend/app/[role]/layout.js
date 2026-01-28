'use client';
import { useAuth } from '@/hooks/useAuth';
import ProtectedRoute from '../ProtectedRoute';
import DynamicSidebar from '@/components/layout/DynamicSidebar';
import DynamicNavbar from '@/components/layout/DynamicNavbar';
import Loading from '../loading';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ALLOWED_ROLES } from '@/constants/roles';

export default function RoleLayout({ children }) {
   const { user, isLoading, isAuthenticated } = useAuth();
   const router = useRouter();
   const pathname = usePathname();

   // Redirect logic
   useEffect(() => {
      if (!isLoading && isAuthenticated && user) {
         const userRole = user?.role?.toLowerCase() || user?.user_role?.toLowerCase();

         // Extract current role from pathname (first segment after /)
         const pathSegments = pathname.split('/').filter(segment => segment);
         const currentRoleInPath = pathSegments[0];

         // If accessing root or invalid role, redirect to user's role dashboard
         if (!pathSegments.length || !ALLOWED_ROLES.includes(currentRoleInPath)) {
            router.push(`/${userRole}/dashboard`);
            return;
         }

         // If accessing someone else's role route, redirect to own role
         if (currentRoleInPath !== userRole) {
            const remainingPath = pathSegments.slice(1).join('/');
            router.push(`/${userRole}/${remainingPath}`);
         }
      }
   }, [user, isLoading, isAuthenticated, router, pathname]);

   if (isLoading) {
      return (
         <div className="flex items-center justify-center min-h-screen">
            <Loading />
         </div>
      );
   }

   return (
      <ProtectedRoute allowedRoles={ALLOWED_ROLES}>
         <div className="flex h-screen overflow-hidden">
            <DynamicSidebar />
            <div className="flex-1 flex flex-col overflow-auto">
               <DynamicNavbar />
               <main className="flex-1 p-4 md:p-6 bg-gray-50 overflow-auto">
                  {children}
               </main>
            </div>
         </div>
      </ProtectedRoute>
   );
}