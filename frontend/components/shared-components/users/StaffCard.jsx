// components/staff/StaffCard.jsx
'use client';

import { Mail, Phone, MoreVertical, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserAvatar } from "@/components/ui/UserAvatar"; 
import { formatPhoneNumberForDisplay } from "@/utils/formatters";

export const StaffCard = ({
   user,
   onEdit,
   onDelete,
   getStatusBadge,
   getStatusVariant,
   getRoleLabel,
   getDepartmentLabel
}) => {
   return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
         <CardContent className="p-0">
            {/* Header with avatar and actions */}
            <div className="p-6 pb-4">
               <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                     {/* Use the new UserAvatar component */}
                     <UserAvatar
                        user={user}
                        size="lg"
                        className="ring-2 ring-white shadow-lg"
                        imageClassName="object-cover"
                     />

                     <div>
                        <h3 className="font-semibold text-lg">{`${user.firstName} ${user.lastName?user.lastName:""}`}</h3>
                        <Badge
                           variant={getStatusVariant(user)}
                           className="mt-1 capitalize"
                        >
                           {user.isActive ? (
                              <CheckCircle className="h-3 w-3 mr-1" />
                           ) : (
                              <XCircle className="h-3 w-3 mr-1" />
                           )}
                           {getStatusBadge(user)}
                        </Badge>
                     </div>
                  </div>

                  <DropdownMenu>
                     <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                           <MoreVertical className="h-4 w-4" />
                        </Button>
                     </DropdownMenuTrigger>
                     <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onEdit(user)}>
                           <Edit className="h-4 w-4 mr-2" />
                           Edit Details
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                           onClick={() => onDelete(user)}
                           className="text-destructive focus:text-destructive"
                        >
                           <Trash2 className="h-4 w-4 mr-2" />
                           Delete Staff
                        </DropdownMenuItem>
                     </DropdownMenuContent>
                  </DropdownMenu>
               </div>
            </div>

            {/* User Info - same as before */}
            <div className="px-6 pb-6 space-y-4">
               <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                     <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                     <span className="text-muted-foreground truncate">
                        {user.email || "No email provided"}
                     </span>
                  </div>

                  {user.phone && (
                     <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{formatPhoneNumberForDisplay(user.phone)}</span>
                     </div>
                  )}
               </div>

               <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Role</span>
                     <Badge variant="outline" className="font-medium">
                        {getRoleLabel(user.role)}
                     </Badge>
                  </div>

                  

                  <div className="flex items-center justify-between">
                     <span className="text-sm text-muted-foreground">Joined</span>
                     <span className="text-sm font-medium">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                           year: 'numeric',
                           month: 'short',
                           day: 'numeric'
                        })}
                     </span>
                  </div>

                  {user.lastLogin && (
                     <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Last Login</span>
                        <span className="text-sm font-medium">
                           {new Date(user.lastLogin).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                           })}
                        </span>
                     </div>
                  )}
               </div>
            </div>
         </CardContent>
      </Card>
   );
};