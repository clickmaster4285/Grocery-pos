// components/staff/StaffForm.jsx
'use client';

import { Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComboBox } from "@/components/ui/combobox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PhoneInput } from "@/components/ui/PhoneInput";
import { Checkbox } from "@/components/ui/checkbox";
import { useState, useMemo } from "react";
import { DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { getFilteredRoles } from "@/utils/roles";

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
   branches,
}) => {
   const { user: currentUser } = useAuth();
   const [permissionSearchTerm, setPermissionSearchTerm] = useState('');

   const filteredRoles = useMemo(() => getFilteredRoles(ROLES, currentUser?.role), [ROLES, currentUser?.role]);

   const handlePermissionChange = (permissionKey, checked) => {
      let updatedPermissions = [...formData.permissions];
      if (checked) {
         updatedPermissions.push(permissionKey);
      } else {
         updatedPermissions = updatedPermissions.filter((p) => p !== permissionKey);
      }
      updateFormField('permissions', updatedPermissions);
   };

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
                     required={false}
                     placeholder="0300-0000000"
                     showValidation={false}
                  />
               </div>
            </div>

            <div className="space-y-2">
               <Label htmlFor="role">Role *</Label>
               <ComboBox
                  items={filteredRoles}
                  value={formData.role}
                  onValueChange={(value) => updateFormField('role', value)}
                  placeholder="Select Role"
                  searchPlaceholder="Search or create role..."
                  emptyPlaceholder="No role found."
                  custom
               />
            </div>

            {/* New Branch Selection ComboBox */}
            <div className="space-y-2">
               <Label htmlFor="branch">Branch</Label>
               <ComboBox
                  items={branches.map(branch => ({ label: branch.branch_name, value: branch._id }))}
                  value={formData.branch_id}
                  onValueChange={(value) => updateFormField('branch_id', value)}
                  placeholder="Select Branch"
                  searchPlaceholder="Search branch..."
                  emptyPlaceholder="No branches found."
               />
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

            <div className="space-y-2">
               <Label>Permissions</Label>
               {permissionsLoading && <p className="text-muted-foreground">Loading permissions...</p>}
               {!permissionsLoading && allPermissions && allPermissions.length > 0 ? (
                  <Tabs defaultValue={allPermissions[0]?.moduleName} className="w-full">
                     <div className="flex flex-col md:flex-row gap-2 mb-4 justify-between">
                        <TabsList>
                           {allPermissions.map((module) => (
                              <TabsTrigger key={module.moduleName} value={module.moduleName}>
                                 {module.moduleName}
                              </TabsTrigger>
                           ))}
                        </TabsList>
                        <Input
                           placeholder="Search permissions..."
                           value={permissionSearchTerm}
                           onChange={(e) => setPermissionSearchTerm(e.target.value)}
                           className="grow md:grow-0 md:max-w-xs"
                        />
                     </div>

                     {allPermissions.map((module) => (
                        <TabsContent key={module.moduleName} value={module.moduleName}>
                           <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border p-2 rounded-md">
                              {module.permissions.filter(permission =>
                                 permission.key.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                                 permission.label.toLowerCase().includes(permissionSearchTerm.toLowerCase())
                              ).length > 0 ? (
                                 module.permissions.filter(permission =>
                                    permission.key.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                                    permission.label.toLowerCase().includes(permissionSearchTerm.toLowerCase())
                                 ).map((permission) => (
                                    <div key={permission.key} className="flex items-center space-x-2 text-sm">
                                       <Checkbox
                                          id={permission.key}
                                          checked={formData.permissions.includes(permission.key)}
                                          onCheckedChange={(checked) => handlePermissionChange(permission.key, checked)}
                                       />
                                       <label
                                          htmlFor={permission.key}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                                       >
                                          {permission.label}
                                       </label>
                                    </div>
                                 ))
                              ) : (
                                 <p className="col-span-2 text-muted-foreground">No permissions found matching search for this module.</p>
                              )}
                           </div>
                        </TabsContent>
                     ))}
                  </Tabs>
               ) : (
                  <p className="text-muted-foreground">No permissions available.</p>
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
                  disabled={
                     createUserMutation?.isLoading ||
                     updateUserMutation?.isLoading
                  }
               >
                  {editingUser ?
                     (updateUserMutation?.isLoading ? "Updating..." : "Update Staff") :
                     (createUserMutation?.isLoading ? "Creating..." : "Create Staff")
                  }
               </Button>
            </DialogFooter>
         </form>
      </>
   );
};
