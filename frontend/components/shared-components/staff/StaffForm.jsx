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

export const StaffForm = ({
   formData,
   updateFormField,
   handleSubmit,
   resetForm,
   editingUser,
   createUserMutation,
   updateUserMutation,
   ROLES,
   GROUPED_ROLES,
   DEPARTMENTS
}) => {

   // Handle phone change with formatting
   const handlePhoneChange = (phone) => {
      updateFormField('phone', phone);
   };

   return (
      <>
         <DialogHeader>
            <DialogTitle>{editingUser ? "Edit Staff Member" : "Add New Staff"}</DialogTitle>
            <DialogDescription>
               {editingUser
                  ? "Update staff member details below."
                  : "Add a new staff member to your organization."
               }
            </DialogDescription>
         </DialogHeader>

         <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
               <Label htmlFor="name">Full Name *</Label>
               <Input
                  id="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => updateFormField('name', e.target.value)}
                  required
               />
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

               <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Select
                     value={formData.department}
                     onValueChange={(value) => updateFormField('department', value)}
                  >
                     <SelectTrigger>
                        <SelectValue placeholder="Select Department" />
                     </SelectTrigger>
                     <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                           <SelectItem key={dept.value} value={dept.value}>
                              {dept.label}
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