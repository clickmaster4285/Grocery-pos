// utils/avatarUtils.js
/**
 * Generate a Dicebear avatar URL with consistent styling
 */
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

/**
 * Generate avatar with user-specific options
 */
export const generateUserAvatar = (user) => {
   if (!user) return null;

   // Priority: ID > email > name > random
   const seed = user._id || user.email || user.name || Math.random().toString();

   // Map roles to different avatar styles
   const roleStyles = {
      'admin': 'avataaars',
      'manager': 'personas',
      'surveyor': 'adventurer',
      'supervisor': 'lorelei',
      'civil-engineer': 'bottts',
      'technician': 'pixel-art'
   };

   const style = roleStyles[user.role] || 'personas';

   // Different background colors based on role
   const roleColors = {
      'admin': '4f46e5', // Indigo
      'manager': '10b981', // Emerald
      'surveyor': 'f59e0b', // Amber
      'supervisor': '3b82f6', // Blue
      'civil-engineer': '8b5cf6', // Violet
      'technician': 'ef4444' // Red
   };

   const backgroundColor = roleColors[user.role] || 'f0f0f0';

   return generateAvatar(seed, {
      style,
      backgroundColor
   });
};

/**
 * Generate initials for fallback
 */
export const getInitials = (name = '') => {
   if (!name.trim()) return 'U';

   const parts = name.trim().split(' ');
   if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
   }

   return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Get avatar props compatible with Shadcn Avatar
 */
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


//how to use 


// {
//    // Example 1: Basic usage in Navbar
//    import { UserAvatar } from '@/components/ui/UserAvatar';

//    <UserAvatar user={currentUser} size="sm" />

//    // Example 2: With tooltip in user list
//    import { UserAvatarWithTooltip } from '@/components/ui/UserAvatar';

//    <UserAvatarWithTooltip
//       user={user}
//       size="md"
//       showTooltip={true}
//       tooltipPosition="right"
//    />

//    // Example 3: In a table or list
//    import { useAvatar } from '@/hooks/useAvatar';

//    const { url, initials } = useAvatar(user);

//    // Example 4: Direct utility usage
//    import { generateUserAvatar, getInitials } from '@/utils/avatarUtils';

//    const avatarUrl = generateUserAvatar(user);
//    const initials = getInitials(user.name);
// }