'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ComboBox } from "@/components/ui/combobox";
import { Switch } from "@/components/ui/switch";
import { Briefcase, Calendar, UserCog, UserCheck } from "lucide-react";
import { ROLES } from "@/constants/roles";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

export const EmploymentDetails = ({ formData, updateFormField, branches }) => {
  
  const employmentStatuses = [
    { value: 'ACTIVE', label: 'Active' },
    { value: 'INACTIVE', label: 'Inactive' },
    { value: 'ON_LEAVE', label: 'On Leave' },
    { value: 'TERMINATED', label: 'Terminated' },
  ];

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Briefcase className="h-4 w-4" />
            <span>Job Information</span>
          </div>
          <div className="flex items-center gap-2 bg-muted/20 px-3 py-1 rounded-full border">
            <Label htmlFor="isActive" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground cursor-pointer">Account Active</Label>
            <Switch 
              id="isActive"
              checked={formData.isActive} 
              onCheckedChange={(val) => updateFormField('isActive', val)} 
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="designation">Designation / Job Title</Label>
            <Input
              id="designation"
              placeholder="e.g. Senior Cashier"
              value={formData.designation}
              onChange={(e) => updateFormField('designation', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              placeholder="e.g. Sales, Inventory"
              value={formData.department}
              onChange={(e) => updateFormField('department', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Employment Status</Label>
            <Select 
              value={formData.employmentStatus} 
              onValueChange={(val) => updateFormField('employmentStatus', val)}
            >
              <SelectTrigger className="w-full bg-white">
                <SelectValue placeholder="Select Status" />
              </SelectTrigger>
              <SelectContent>
                {employmentStatuses.map(status => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="hireDate">Hire Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="hireDate"
                type="date"
                className="pl-10"
                value={formData.hireDate}
                onChange={(e) => updateFormField('hireDate', e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
          <UserCog className="h-4 w-4" />
          <span>Role & Assignment</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>System Role *</Label>
            <ComboBox
              items={ROLES}
              value={formData.role}
              onValueChange={(value) => updateFormField('role', value)}
              placeholder="Select Role"
              searchPlaceholder="Search roles..."
              emptyPlaceholder="No role found."
            />
          </div>

          <div className="space-y-2">
            <Label>Assigned Branch *</Label>
            <ComboBox
              items={branches.map(b => ({ label: b.branch_name, value: b._id }))}
              value={formData.branch_id}
              onValueChange={(value) => updateFormField('branch_id', value)}
              placeholder="Select Branch"
              searchPlaceholder="Search branches..."
              emptyPlaceholder="No branches found."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

