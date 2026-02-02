// utils/avatarUtils.js
export const generateAvatar = (
   seed = 'default',
   options = {}
) => {
   const {
      style = 'identicon',
      size = 128,
      backgroundColor = 'f0f0f0',
      ...restOptions // Capture all other options
   } = options;

   // Clean the seed
   const cleanSeed = encodeURIComponent(
      seed.toString().trim().toLowerCase().replace(/\s+/g, '-')
   );

   let url = `https://api.dicebear.com/7.x/${style}/svg?seed=${cleanSeed}&size=${size}&backgroundColor=${backgroundColor}`;

   // Append restOptions as query parameters
   for (const key in restOptions) {
       if (Object.hasOwnProperty.call(restOptions, key)) {
           url += `&${key}=${encodeURIComponent(restOptions[key])}`;
       }
   }

   return url;
};

export const generateUserAvatar = (user) => {
   if (!user) {
      return null;
   }

   const seed = user._id || user.email || user.firstName || user.lastName || Math.random().toString();
   const primaryRole = user.role ? user.role.toLowerCase() : 'customer';

   const roleStyles = {
      'admin': 'micah',
      'manager': 'personas',
      'staff': 'avataaars',
      'customer': 'notionists',
   };

   const style = roleStyles[primaryRole] || 'personas'; 
   const roleColors = {
      'admin': '4f46e5', // Indigo
      'manager': '10b981', // Emerald
      'staff': '3b82f6', // Blue
      'customer': 'f97316', // Orange
   };

   const backgroundColor = roleColors[primaryRole] || 'f0f0f0';

   const avatarUrl = generateAvatar(seed, {
      style,
      backgroundColor,
   });

   return avatarUrl;
};

export const getInitials = (name = '') => {
   if (!name.trim()) return 'U';

   const parts = name.trim().split(' ');
   if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
   }

   return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

export const getAvatarProps = (user, options = {}) => {
   const {
      size = 'md',
      showFallback = true
   } = options;

   const avatarUrl = generateUserAvatar(user);
   const initials = getInitials(user?.name);

   return {
      src: avatarUrl,
      alt: `${user?.name || 'User'} avatar`,
      initials,
      size,
      showFallback
   };
};