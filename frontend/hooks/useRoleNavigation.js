'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from './useAuth';

export const useRoleNavigation = () => {
   const router = useRouter();
   const { user } = useAuth();

   const getUserRole = () => {
      return user?.role || user?.user_role || null;
   };

   const getRoleRoute = (path = '') => {
      const userRole = getUserRole();
      const cleanPath = path.startsWith('/') ? path.slice(1) : path;

      if (!userRole) {
         return `/[role]${cleanPath ? `/${cleanPath}` : ''}`;
      }

      return `/${userRole}${cleanPath ? `/${cleanPath}` : ''}`;
   };

   const navigate = (path) => {
      const route = getRoleRoute(path);
      router.push(route);
   };

   const replace = (path) => {
      const route = getRoleRoute(path);
      router.replace(route);
   };

   const prefetch = (path) => {
      const route = getRoleRoute(path);
      router.prefetch(route);
   };

   return {
      getUserRole,
      getRoleRoute,
      navigate,
      replace,
      prefetch,
      router
   };
};