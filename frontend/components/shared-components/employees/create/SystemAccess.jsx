'use client';

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, Mail, Lock, KeyRound, CheckSquare, Square, Circle, CheckCircle2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";

export const SystemAccess = ({ 
  formData, 
  updateFormField, 
  allPermissions, 
  permissionsLoading
}) => {
  const [permissionSearchTerm, setPermissionSearchTerm] = useState('');
  const [activeModule, setActiveModule] = useState(null);

  // Initialize active module
  useMemo(() => {
    if (!activeModule && allPermissions && allPermissions.length > 0) {
      setActiveModule(allPermissions[0].moduleName);
    }
  }, [allPermissions, activeModule]);

  const handlePermissionChange = useCallback((permissionKey, checked) => {
    let updatedPermissions = [...formData.permissions];
    if (checked) {
      if (!updatedPermissions.includes(permissionKey)) {
        updatedPermissions.push(permissionKey);
      }
    } else {
      updatedPermissions = updatedPermissions.filter((p) => p !== permissionKey);
    }
    updateFormField('permissions', updatedPermissions);
  }, [formData.permissions, updateFormField]);

  const toggleModulePermissions = useCallback((modulePermissions, shouldSelectAll) => {
    const moduleKeys = modulePermissions.map(p => p.key);
    let updatedPermissions = [...formData.permissions];
    
    if (shouldSelectAll) {
      moduleKeys.forEach(key => {
        if (!updatedPermissions.includes(key)) {
          updatedPermissions.push(key);
        }
      });
    } else {
      updatedPermissions = updatedPermissions.filter(key => !moduleKeys.includes(key));
    }
    
    updateFormField('permissions', updatedPermissions);
  }, [formData.permissions, updateFormField]);

  const toggleAllPermissions = useCallback((shouldSelectAll) => {
    if (shouldSelectAll) {
      const allKeys = allPermissions.flatMap(m => m.permissions.map(p => p.key));
      updateFormField('permissions', allKeys);
    } else {
      updateFormField('permissions', []);
    }
  }, [allPermissions, updateFormField]);

  const isAllSelected = useMemo(() => {
    if (!allPermissions || allPermissions.length === 0) return false;
    const allKeys = allPermissions.flatMap(m => m.permissions.map(p => p.key));
    return allKeys.length > 0 && allKeys.every(key => formData.permissions.includes(key));
  }, [allPermissions, formData.permissions]);

  const currentModuleData = useMemo(() => {
    return allPermissions.find(m => m.moduleName === activeModule);
  }, [allPermissions, activeModule]);

  return (
    <div className="space-y-6">
      {/* Access Toggles */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
          <ShieldCheck className="h-4 w-4" />
          <span>Security & Access Control</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
            <div className="space-y-0.5">
              <Label className="text-base">System Access</Label>
              <p className="text-sm text-muted-foreground">Allow user to log in to the software</p>
            </div>
            <Switch 
              checked={formData.hasSystemAccess} 
              onCheckedChange={(val) => updateFormField('hasSystemAccess', val)} 
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/10">
            <div className="space-y-0.5">
              <Label className="text-base">Two-Factor Auth</Label>
              <p className="text-sm text-muted-foreground">Enable additional security verification</p>
            </div>
            <Switch 
              checked={formData.isTwoFactorEnabled} 
              onCheckedChange={(val) => updateFormField('isTwoFactorEnabled', val)} 
            />
          </div>
        </div>
      </section>

      {/* Login Credentials (Conditional) */}
      {formData.hasSystemAccess && (
        <section className="space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
            <Lock className="h-4 w-4" />
            <span>Login Credentials</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  className="pl-10"
                  value={formData.email}
                  onChange={(e) => updateFormField('email', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Initial Password *</Label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  value={formData.password}
                  onChange={(e) => updateFormField('password', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PIN Code (Required for All) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-primary font-semibold border-b pb-2">
          <KeyRound className="h-4 w-4" />
          <span>Attendance PIN *</span>
        </div>
        <div className="max-w-50 space-y-2">
          <Input
            id="pin"
            type="text"
            maxLength={6}
            placeholder="4-6 digit PIN"
            value={formData.pin}
            onChange={(e) => updateFormField('pin', e.target.value.replace(/\D/g, ''))}
            className="text-center text-lg tracking-widest font-mono"
            required
          />
          <p className="text-[10px] text-muted-foreground text-center italic">Required for Time Clock & attendance</p>
        </div>
      </section>

      {/* Permissions (Conditional) */}
      {formData.hasSystemAccess && (
        <section className="space-y-4 animate-in zoom-in-95 duration-300">
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-2 text-primary font-semibold">
              <ShieldCheck className="h-4 w-4" />
              <span>Permission Settings</span>
            </div>
            {!permissionsLoading && allPermissions && allPermissions.length > 0 && (
              <Button 
                type="button" 
                variant="ghost" 
                size="sm" 
                className={`h-8 px-2 text-xs gap-1.5 ${isAllSelected ? "hover:bg-red-50 text-red-600" : "hover:bg-emerald-50 text-emerald-600"}`}
                onClick={() => toggleAllPermissions(!isAllSelected)}
              >
                {isAllSelected ? <><Square className="h-3.5 w-3.5" /> Deselect All</> : <><CheckSquare className="h-3.5 w-3.5" /> Select All Permissions</>}
              </Button>
            )}
          </div>

          <div className="w-full border rounded-lg p-4 bg-card">
            <div className="flex flex-col gap-4 mb-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="w-full overflow-x-auto pb-2 custom-scrollbar">
                  <div className="inline-flex h-9 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                    {allPermissions.map((module) => (
                      <button
                        key={module.moduleName}
                        type="button"
                        onClick={() => setActiveModule(module.moduleName)}
                        className={cn(
                          "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                          activeModule === module.moduleName ? "bg-white text-foreground shadow-sm" : "hover:text-foreground"
                        )}
                      >
                        {module.moduleName}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative w-full sm:w-64">
                  <Input
                    placeholder="Search permissions..."
                    value={permissionSearchTerm}
                    onChange={(e) => setPermissionSearchTerm(e.target.value)}
                    className="h-9 pr-8"
                  />
                </div>
              </div>
            </div>

            {currentModuleData && (
              <div className="mt-0 space-y-4">
                <div className="flex items-center justify-between bg-muted/30 p-2 rounded-md">
                  <span className="text-xs font-medium text-muted-foreground px-1">
                    {currentModuleData.moduleName} Module
                  </span>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2 text-[11px] gap-1 bg-emerald-50"
                    onClick={() => toggleModulePermissions(currentModuleData.permissions, !(currentModuleData.permissions.length > 0 && currentModuleData.permissions.every(p => formData.permissions.includes(p.key))))}
                  >
                    {currentModuleData.permissions.length > 0 && currentModuleData.permissions.every(p => formData.permissions.includes(p.key)) ? (
                      <><Circle className="h-3 w-3" /> Unselect Module</>
                    ) : (
                      <><CheckCircle2 className="h-3 w-3 text-emerald-400" /> Select All in Module</>
                    )}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                  {currentModuleData.permissions.filter(p => 
                    p.key.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                    p.label.toLowerCase().includes(permissionSearchTerm.toLowerCase())
                  ).length > 0 ? (
                    currentModuleData.permissions.filter(p => 
                      p.key.toLowerCase().includes(permissionSearchTerm.toLowerCase()) ||
                      p.label.toLowerCase().includes(permissionSearchTerm.toLowerCase())
                    ).map((permission) => {
                      const isChecked = formData.permissions.includes(permission.key);
                      return (
                        <div 
                          key={permission.key} 
                          className={cn(
                            "flex items-center space-x-3 p-3 rounded-md border transition-all cursor-pointer select-none",
                            isChecked ? "bg-emerald-50 border-emerald-400 ring-1 ring-emerald-100" : "border-input hover:bg-muted/50 hover:border-emerald-200"
                          )}
                          onClick={() => handlePermissionChange(permission.key, !isChecked)}
                        >
                          <div className={cn(
                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                            isChecked ? "bg-emerald-500 border-emerald-500 text-white" : "bg-transparent border-input"
                          )}>
                            {isChecked && <Check className="h-3 w-3" />}
                          </div>
                          <span className="text-sm font-medium leading-none capitalize flex-1">
                            {permission.label}
                          </span>
                        </div>
                      );
                    })
                  ) : (
                    <p className="col-span-full py-8 text-center text-muted-foreground text-sm italic">
                      No permissions found matching "{permissionSearchTerm}"
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
