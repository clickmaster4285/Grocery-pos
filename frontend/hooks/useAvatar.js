// hooks/useAvatar.js
'use client';

import { useMemo } from 'react';
import { generateUserAvatar, getInitials } from '@/utils/avatarUtils';

export const useAvatar = (user) => {
   const avatar = useMemo(() => {
      if (!user) return { url: null, initials: '?' };

      return {
         url: generateUserAvatar(user),
         initials: getInitials(user.name),
         alt: `${user.name} avatar`
      };
   }, [user]);

   return avatar;
};