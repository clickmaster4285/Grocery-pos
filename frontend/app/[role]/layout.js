'use client';

import DynamicSidebar from '@/components/layout/DynamicSidebar';
import DynamicNavbar from '@/components/layout/DynamicNavbar';
import Loading from '../loading';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions'; 

export default function RoleLayout({ children, params }) { 
   const { user, isLoading, isAuthenticated } = useAuth();
   const { hasRole } = usePermissions(); // Use the new hasRole function
   const router = useRouter();
   const pathname = usePathname();

   const currentRoleInPath = params.role;

   useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
        const userPrimaryRole = user.role?.toLowerCase(); // Use single user.role
        if (!hasRole(currentRoleInPath.toLowerCase())) { // Use hasRole from usePermissions
            if (userPrimaryRole) {
                router.replace(`/${userPrimaryRole}/dashboard`);
            } else {
                // If user has no primary role, or an invalid one, redirect to unauthorized
                router.replace('/unauthorized');
            }
        }
    }
   }, [user, isLoading, isAuthenticated, router, currentRoleInPath, hasRole]); // Update dependencies

   if (isLoading || !isAuthenticated || !user) {
      return null;
   }

   return (
      <div className="flex h-screen overflow-hidden">
         <DynamicSidebar />
         <div className="flex-1 flex flex-col overflow-auto">
            <DynamicNavbar />
            <main className="flex-1 p-4 md:p-6 bg-gray-50 overflow-auto">
               {children}
            </main>
         </div>
      </div>
   );
}