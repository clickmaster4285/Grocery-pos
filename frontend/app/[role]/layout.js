'use client';

import React from 'react'; // Added import
import DynamicSidebar from '@/components/layout/DynamicSidebar';
import DynamicNavbar from '@/components/layout/DynamicNavbar';
import Loading from '@/app/loading/page';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions'; 

export default function RoleLayout({ children, params }) { 
   const { user, isLoading, isAuthenticated, logout } = useAuth(); 
   const { hasRole } = usePermissions(); 
   const router = useRouter();
   const pathname = usePathname();

   const currentRoleInPath = React.use(params).role;

 

   // useEffect(() => {
   //  if (!isLoading && isAuthenticated && user) {
   //      const userPrimaryRole = user.role?.toLowerCase(); 
   //      if (!hasRole(currentRoleInPath.toLowerCase())) { 
   //          if (userPrimaryRole) {
   //              router.replace(`/${userPrimaryRole}/dashboard`);
   //          } else {
   //              router.replace('/unauthorized');
   //          }
   //      }
   //  }
   // }, [user, isLoading, isAuthenticated, router, currentRoleInPath, hasRole, logout]); 

   useEffect(() => {
     const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
     if (!token) {
       logout('/'); 
     }
   }, [logout]);

   if (isLoading || !isAuthenticated || !user) {
      return null;
   }
   
   return (
      <div className="flex h-screen overflow-hidden">
         <DynamicSidebar />
         <div className="flex-1 flex flex-col overflow-auto">
            <DynamicNavbar />
            <main className="flex-1 p-4 md:p-6 bg-gray-50">
               {children}
            </main>
         </div>
      </div>
   );
}