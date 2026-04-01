// hooks/useAvatar.js
'use client';

import { useMemo } from 'react';
import { generateUserAvatar, getInitials } from '@/utils/avatarUtils';

export const useAvatar = (user) => {
   const avatar = useMemo(() => {
      if (!user) return { url: null, initials: '?' };

      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim();

      return {
         // url: generateUserAvatar(user),
         url: null, // Always null for avatar URL
         initials: getInitials(fullName || 'User'),
         alt: `${fullName || 'User'} avatar`
      };
   }, [user]);

   return avatar;
};