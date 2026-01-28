// components/ui/UserAvatar.jsx
'use client';

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { generateUserAvatar, getInitials } from "@/utils/avatarUtils";
import { cn } from "@/lib/utils"

/**
 * UserAvatar component - Extends Shadcn Avatar with Dicebear integration
 */
export const UserAvatar = ({
   user,
   size = "md",
   showFallback = true,
   className = "",
   imageClassName = "",
   fallbackClassName = "",
   ...props
}) => {
   // Size mapping
   const sizeClasses = {
      xs: "h-6 w-6 text-xs",
      sm: "h-8 w-8 text-sm",
      md: "h-10 w-10",
      lg: "h-12 w-12 text-lg",
      xl: "h-14 w-14 text-xl",
      "2xl": "h-16 w-16 text-2xl"
   };

   // Generate avatar URL using Dicebear
   const avatarUrl = user ? generateUserAvatar(user) : null;
   const initials = user ? getInitials(user.name) : "?";

   return (
      <Avatar
         className={cn(
            sizeClasses[size] || sizeClasses.md,
            "ring-2 ring-background", // Optional ring
            className
         )}
         {...props}
      >
         {avatarUrl && showFallback ? (
            <>
               <AvatarImage
                  src={avatarUrl}
                  alt={user?.name ? `${user.name} avatar` : "User avatar"}
                  className={cn("object-cover", imageClassName)}
                  onError={(e) => {
                     // Hide the image on error, fallback will show
                     e.target.style.display = 'none';
                  }}
               />
               <AvatarFallback
                  className={cn(
                     "bg-linear-to-br from-primary to-primary/70 text-primary-foreground font-semibold",
                     fallbackClassName
                  )}
               >
                  {initials}
               </AvatarFallback>
            </>
         ) : (
            <AvatarFallback
               className={cn(
                  "bg-linear-to-br from-muted to-muted/70 text-muted-foreground font-semibold",
                  fallbackClassName
               )}
            >
               {initials}
            </AvatarFallback>
         )}
      </Avatar>
   );
};

/**
 * Avatar with tooltip showing user info
 */
export const UserAvatarWithTooltip = ({
   user,
   size = "md",
   showTooltip = true,
   tooltipPosition = "bottom",
   ...props
}) => {
   return (
      <div className="group relative inline-block">
         <UserAvatar user={user} size={size} {...props} />

         {showTooltip && user?.name && (
            <div className={cn(
               "absolute z-50 hidden group-hover:block",
               tooltipPosition === "top" && "bottom-full left-1/2 transform -translate-x-1/2 mb-2",
               tooltipPosition === "bottom" && "top-full left-1/2 transform -translate-x-1/2 mt-2",
               tooltipPosition === "left" && "right-full top-1/2 transform -translate-y-1/2 mr-2",
               tooltipPosition === "right" && "left-full top-1/2 transform -translate-y-1/2 ml-2"
            )}>
               <div className="bg-popover text-popover-foreground text-xs rounded-md border px-2 py-1.5 shadow-md whitespace-nowrap max-w-xs">
                  <div className="font-medium">{user.name}</div>
                  {user.role && (
                     <div className="text-muted-foreground text-xs">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                     </div>
                  )}
               </div>
            </div>
         )}
      </div>
   );
};