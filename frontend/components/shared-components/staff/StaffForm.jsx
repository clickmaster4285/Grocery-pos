// components/staff/StaffForm.jsx
'use client';

import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from "@/components/ui/select";
import {
   DialogFooter,
   DialogHeader,
   DialogTitle,
   DialogDescription,
} from "@/components/ui/dialog";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Checkbox } from "@/components/ui/checkbox";
import { useGetPermissions } from "@/features/users/users.hooks"; 
import { useState } from "react";

export const StaffForm = ({
   formData,
   updateFormField,
   handleSubmit,
   resetForm,
   editingUser,
   createUserMutation,
   updateUserMutation,
   allPermissions,
   permissionsLoading,
   ROLES,
}) => {
   const [permissionSearchTerm, setPermissionSearchTerm] = useState('');

   const handlePermissionChange = (permissionKey, checked) => {
      let updatedPermissions = [...formData.permissions];
      if (checked) {
         updatedPermissions.push(permissionKey);
      } else {
         updatedPermissions = updatedPermissions.filter((p) => p !== permissionKey);
      }
      updateFormField('permissions', updatedPermissions);
   };

   const filteredPermissions = allPermissions.filter(permission =>
     permission.toLowerCase().includes(permissionSearchTerm.toLowerCase())
   ) || [];

   // Handle phone change with formatting
   const handlePhoneChange = (phone) => {
      updateFormField('phone', phone);
   };

   return (
      <>
         

         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                     id="firstName"
                     placeholder="John"
                     value={formData.firstName}
                     onChange={(e) => updateFormField('firstName', e.target.value)}
                     required
                  />
               </div>
               <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                     id="lastName"
                     placeholder="Doe"
                     value={formData.lastName}
                     onChange={(e) => updateFormField('lastName', e.target.value)}
                     required
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                     <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                     <Input
                        id="email"
                        type="email"
                        placeholder="john@example.com"
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => updateFormField('email', e.target.value)}
                     />
                  </div>
                  <p className="text-xs text-muted-foreground">
                     Leave empty if no email
                  </p>
               </div>

               <div className="space-y-2">
                  {/* Using the new PhoneInput component */}
                  <PhoneInput
                     value={formData.phone}
                     onChange={handlePhoneChange}
                     label="Phone Number *"
                     required={true}
                     placeholder="0300-0000000"
                     showValidation={true}
                  />
               </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                     value={formData.role}
                     onValueChange={(value) => updateFormField('role', value)}
                  >
                     <SelectTrigger>
                        <SelectValue placeholder="Select Role" />
                     </SelectTrigger>
                     <SelectContent>
                        {ROLES.map((role) => (
                           <SelectItem key={role.value} value={role.value}>
                              {role.label}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
            </div>

            <div className="space-y-2">
               <Label htmlFor="password">
                  {editingUser ? "New Password" : "Initial Password *"}
                  <span className="text-muted-foreground text-xs font-normal ml-1">
                     {editingUser ? "(leave empty to keep current)" : ""}
                  </span>
               </Label>
               <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => updateFormField('password', e.target.value)}
                  placeholder={editingUser ? "Enter new password" : "Set initial password"}
                  required={!editingUser}
               />
               <p className="text-xs text-muted-foreground">
                  {editingUser
                     ? "Leave empty to keep current password"
                     : "User will be able to change this password after first login"}
               </p>
            </div>

            {/* Permissions Section */}
            <div className="space-y-2">
               <Label>Permissions</Label>
               {permissionsLoading && <p className="text-muted-foreground">Loading permissions...</p>}
               {!permissionsLoading && allPermissions && (
                 <>
                   <Input
                      placeholder="Search permissions..."
                      value={permissionSearchTerm}
                      onChange={(e) => setPermissionSearchTerm(e.target.value)}
                      className="mb-2"
                   />
                   <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border p-2 rounded-md">
                     {filteredPermissions.length > 0 ? (
                       filteredPermissions.map((permissionKey) => (
                         <div key={permissionKey} className="flex items-center space-x-2 text-sm">
                           <Checkbox
                             id={permissionKey}
                             checked={formData.permissions.includes(permissionKey)}
                             onCheckedChange={(checked) => handlePermissionChange(permissionKey, checked)}
                           />
                           <label
                             htmlFor={permissionKey}
                             className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                           >
                             {permissionKey.replace(/([A-Z])/g, ' $1').trim().replace(/:/g, ' - ')}
                           </label>
                         </div>
                       ))
                     ) : (
                       <p className="col-span-2 text-muted-foreground">No permissions found matching search.</p>
                     )}
                   </div>
                 </>
               )}
            </div>

            <DialogFooter className="pt-4">
               <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
               >
                  Cancel
               </Button>
               <Button
                  type="submit"
                  disabled={createUserMutation.isLoading || updateUserMutation.isLoading}
               >
                  {editingUser ?
                     (updateUserMutation.isLoading ? "Updating..." : "Update Staff") :
                     (createUserMutation.isLoading ? "Creating..." : "Create Staff")
                  }
               </Button>
            </DialogFooter>
         </form>
      </>
   );
};
