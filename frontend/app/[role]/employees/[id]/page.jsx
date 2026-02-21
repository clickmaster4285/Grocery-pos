'use client';

import { 
  ArrowLeft, 
  Badge, 
  CalendarDays, 
  Check, 
  CheckCircle, 
  Mail, 
  Phone, 
  X, 
  ShieldX, 
  Briefcase, 
  Clock, 
  Banknote, 
  History, 
  Building2, 
  User as UserIcon,
  MapPin,
  Landmark,
  Calendar
} from 'lucide-react'; 
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"; 
import { useGetPermissions, useGetUserById } from '@/features/users.api';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Separator } from '@/components/ui/separator';
import { formatPhoneNumberForDisplay } from '@/utils/formatters';
import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/hooks/usePermissions";
import StaffDetailSkeleton from '@/components/shared-components/employees/StaffDetailSkeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const EmployeeDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { employee, isAdmin, currentUserRole } = usePermissions();

  const { data: user, isLoading, error } = useGetUserById(id);
  const { data: allPermissionsData, isLoading: permissionsLoading } = useGetPermissions();

  // Transform allPermissionsData for the grid
  const transformedAllPermissions = useMemo(() => {
    if (!allPermissionsData?.length) return [];
    return allPermissionsData.map(moduleDef => ({
      ...moduleDef,
      permissions: moduleDef.permissions.map(pId => {
        const parts = pId.split(':');
        return {
          key: pId,
          label: parts[2].charAt(0).toUpperCase() + parts[2].slice(1),
          menuSlug: parts[1],
        };
      }),
    }));
  }, [allPermissionsData]);

  const uniquePermissionTypes = ['Create', 'Read', 'Update', 'Delete'];
  
  useEffect(() => {
    if (error) {
      router.push(`/${currentUserRole}/employees`);
    }
  }, [error, router, currentUserRole]);

  if (isLoading || permissionsLoading) {
    return <StaffDetailSkeleton />;
  }

  if (!user) {
    return (
      <div className="p-6 text-center text-red-500">Employee not found.</div>
    );
  }

  const canUpdateEmployee = isAdmin || employee.database.update;

  const DetailItem = ({ icon: Icon, label, value, className }) => (
    <div className={cn("flex items-start gap-3 py-2", className)}>
      <div className="mt-0.5 p-1.5 bg-muted rounded-md shrink-0">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">{label}</p>
        <p className="text-sm font-medium text-foreground">{value || 'N/A'}</p>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 space-y-8 max-w-7xl mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-6">
        <div className="space-y-1">
          <Button 
            variant="ghost" 
            onClick={() => router.push(`/${currentUserRole}/employees`)} 
            className="gap-2 mb-2 px-0 hover:bg-transparent hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back to Staff List</span>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight capitalize">
            {user.firstName} {user.lastName}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="capitalize font-semibold tracking-wide">{user.role.replace(/_/g, ' ')}</span>
            <span className={cn("capitalize rounded-full px-4 border border-green-500 bg-green-100 text-green-500", user.isActive ? "" : "text-red-500")}>
              {user.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          {canUpdateEmployee && (
            <Button 
              onClick={() => router.push(`/${currentUserRole}/employees/${user._id}/edit`)}
              className="bg-primary hover:bg-primary/90 shadow-sm"
            >
              Edit Employee
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar: Profile Summary */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="overflow-hidden border-none shadow-md">
            <div className="h-32 bg-primary/10 flex items-center justify-center relative">
              <div className="absolute -bottom-12 left-6">
                <UserAvatar user={user} size="xl" className="h-24 w-24 ring-4 ring-background" />
              </div>
            </div>
            <CardContent className="pt-16 pb-6 px-6 space-y-6">
              <div>
                <h3 className="text-xl font-bold">{user.firstName} {user.lastName}</h3>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Mail className="h-3 w-3" /> {user.email || 'No system access'}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 gap-1">
                <DetailItem icon={Phone} label="Phone" value={formatPhoneNumberForDisplay(user.phone)} />
                <DetailItem icon={Building2} label="Department" value={user.employment?.department} />
                <DetailItem icon={Briefcase} label="Designation" value={user.employment?.designation} />
                <DetailItem icon={CalendarDays} label="Joined" value={new Date(user.employment?.hireDate || user.createdAt).toLocaleDateString()} />
                <DetailItem icon={Clock} label="Last Active" value={user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'} />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Location & Emergency</h4>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                    <p className="text-sm text-muted-foreground italic">
                      {user.address?.street}<br />
                      {user.address?.city}, {user.address?.state} {user.address?.zip}<br />
                      {user.address?.country}
                    </p>
                  </div>
                  <div className="p-3 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/20">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Emergency Contact</p>
                    <p className="text-sm font-semibold">{user.emergencyContact?.name} ({user.emergencyContact?.relationship})</p>
                    <p className="text-xs text-muted-foreground">{user.emergencyContact?.phone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content: Tabs */}
        <div className="lg:col-span-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start bg-muted/50 p-1 mb-6 overflow-x-auto h-auto">
              <TabsTrigger value="overview" className="gap-2">Overview</TabsTrigger>
              {user.hasSystemAccess && <TabsTrigger value="permissions" className="gap-2">Permissions</TabsTrigger>}
              <TabsTrigger value="history" className="gap-2 text-emerald-600 font-bold tracking-tight italic uppercase ">History & Audits</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 outline-none">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Financial Overview */}
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Banknote className="h-4 w-4 text-emerald-500" /> Financial Configuration
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 grid grid-cols-1 gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Base Salary</span>
                      <span className="text-lg font-bold">${user.salary?.baseAmount?.toLocaleString() || '0.00'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Pay Cycle</span>
                      <span className="capitalize">{user.salary?.payType}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-medium capitalize">{user.salary?.paymentMethod?.replace(/_/g, ' ')}</span>
                    </div>
                    {user.salary?.paymentMethod === 'BANK_TRANSFER' && (
                      <div className="mt-2 p-3 bg-muted/30 rounded-lg space-y-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Bank Account</p>
                        <p className="text-xs font-medium">{user.salary.bankDetails?.bankName}</p>
                        <p className="text-xs font-mono">{user.salary.bankDetails?.accountNumber}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shift Configuration */}
                <Card className="border-none shadow-sm bg-card">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" /> Shift & Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Shift</span>
                      <span className="text-sm font-mono font-bold bg-blue-50 text-blue-700 px-2 py-1 rounded">
                        {user.shift?.startTime} - {user.shift?.endTime}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Work Days</p>
                      <div className="flex flex-wrap gap-1.5">
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                          <span 
                            key={day} 
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full border",
                              user.shift?.workDays?.includes(day) 
                                ? "bg-primary/10 border-primary text-primary font-bold" 
                                : "bg-muted border-transparent text-muted-foreground opacity-50"
                            )}
                          >
                            {day.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="outline-none">
              <Card className="border-none shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldX className="h-4 w-4" /> System Access Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {transformedAllPermissions?.length > 0 ? (
                    <div className="rounded-md border overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="min-w-50">Menu / Section</TableHead>
                            {uniquePermissionTypes.map((type) => (
                              <TableHead key={type} className="text-center">{type}</TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transformedAllPermissions.map((moduleDef) => (
                            <useMemo key={moduleDef.moduleName}>
                              <TableRow className="bg-muted/20 font-bold">
                                <TableCell colSpan={uniquePermissionTypes.length + 1} className="text-xs uppercase tracking-widest">{moduleDef.moduleName}</TableCell>
                              </TableRow>
                              {[...new Set(moduleDef.permissions.map(p => p.menuSlug))].map(menuSlug => (
                                <TableRow key={`${moduleDef.moduleName}-${menuSlug}`} className="hover:bg-muted/5">
                                  <TableCell className="pl-8 text-sm capitalize">{menuSlug.replace(/_/g, ' ')}</TableCell>
                                  {uniquePermissionTypes.map(type => {
                                    const pId = `${moduleDef.moduleName.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_').replace(/-/g, '_')}:${menuSlug}:${type.toLowerCase()}`;
                                    const hasAccess = user.permissions.includes(pId);
                                    return (
                                      <TableCell key={type} className="text-center">
                                        {hasAccess ? (
                                          <CheckCircle className="h-4 w-4 text-emerald-500 mx-auto" />
                                        ) : (
                                          <X className="h-4 w-4 text-muted-foreground/20 mx-auto" />
                                        )}
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              ))}
                            </useMemo>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <ShieldX className="mx-auto h-12 w-12 text-muted-foreground/30" />
                      <p className="mt-4 text-muted-foreground font-medium">No permissions assigned.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="outline-none space-y-6">
              <div className="grid grid-cols-1 gap-6">
                {/* Salary History */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3 border-b bg-emerald-50/30">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <History className="h-4 w-4 text-emerald-600" /> Salary Increment Log
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead className="text-xs uppercase tracking-tighter">Effective Date</TableHead>
                          <TableHead className="text-xs uppercase tracking-tighter">Amount</TableHead>
                          <TableHead className="text-xs uppercase tracking-tighter">Type</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.salaryHistory?.length > 0 ? (
                          [...user.salaryHistory].reverse().map((entry, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm">{new Date(entry.effectiveDate).toLocaleDateString()}</TableCell>
                              <TableCell className="text-sm font-bold">${entry.baseAmount?.toLocaleString()}</TableCell>
                              <TableCell className="text-sm italic text-muted-foreground capitalize">{entry.payType}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-xs italic">No historical records found</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                {/* Designation History */}
                <Card className="border-none shadow-sm">
                  <CardHeader className="pb-3 border-b bg-blue-50/30">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <History className="h-4 w-4 text-blue-600" /> Promotion & Role History
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/20">
                          <TableHead className="text-xs uppercase tracking-tighter">Date</TableHead>
                          <TableHead className="text-xs uppercase tracking-tighter">Title</TableHead>
                          <TableHead className="text-xs uppercase tracking-tighter">Department</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {user.designationHistory?.length > 0 ? (
                          [...user.designationHistory].reverse().map((entry, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-sm">{new Date(entry.effectiveDate).toLocaleDateString()}</TableCell>
                              <TableCell className="text-sm font-semibold text-blue-700">{entry.designation}</TableCell>
                              <TableCell className="text-sm">{entry.department}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground text-xs italic">No historical records found</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-8 flex justify-end">
            <Button variant="outline" onClick={() => router.push(`/${currentUserRole}/employees`)} className="gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Staff List
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPage;