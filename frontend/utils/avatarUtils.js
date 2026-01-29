// utils/avatarUtils.js
export const generateAvatar = (
   seed = 'default',
   options = {}
) => {
   const {
      style = 'identicon',
      size = 128,
      backgroundColor = 'f0f0f0'
   } = options;

   // Clean the seed
   const cleanSeed = encodeURIComponent(
      seed.toString().trim().toLowerCase().replace(/\s+/g, '-')
   );

   return `https://api.dicebear.com/7.x/${style}/svg?seed=${cleanSeed}&size=${size}&backgroundColor=${backgroundColor}`;
};

export const generateUserAvatar = (user) => {
   if (!user) return null;

   // Priority: ID > email > name > random
   const seed = user._id || user.email || user.firstName || user.lastName || Math.random().toString();
   const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0].toLowerCase() : 'customer';

   // Map roles to different avatar styles
   const roleStyles = {
      'admin': 'avataaars',
      'manager': 'personas',
      'supervisor': 'lorelei',
      'customer': 'big-smile', // Default style for customers
   };

   const style = roleStyles[primaryRole] || 'personas';

   // Different background colors based on role
   const roleColors = {
      'admin': '4f46e5', // Indigo
      'manager': '10b981', // Emerald
      'supervisor': '3b82f6', // Blue
      'customer': 'f97316', // Orange
   };

   const backgroundColor = roleColors[primaryRole] || 'f0f0f0';

   return generateAvatar(seed, {
      style,
      backgroundColor
   });
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