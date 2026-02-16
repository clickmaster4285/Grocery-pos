'use client';

import { ArrowLeft, Badge, CalendarDays, Check, CheckCircle, Mail, Phone, X, ShieldX } from 'lucide-react'; 
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
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Separator } from '@/components/ui/separator';
import { formatPhoneNumberForDisplay } from '@/utils/formatters';
import { useAuth } from "@/hooks/useAuth"
import { usePermissions } from "@/hooks/usePermissions";
import StaffDetailSkeleton from '@/components/shared-components/employees/StaffDetailSkeleton';

const EmployeeDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { user: currentUser } = useAuth();
  const { canRead, canUpdate, currentUserRole } = usePermissions();

  const module = 'employee_management';
  const menu = 'employee_database';

  const { data: user, isLoading, error } = useGetUserById(id);
  const { data: allPermissionsData, isLoading: permissionsLoading } = useGetPermissions();

  // Transform allPermissionsData into the format expected by the rendering logic
  const transformedAllPermissions = useMemo(() => {
    if (!allPermissionsData || allPermissionsData.length === 0) {
      return [];
    }
    return allPermissionsData.map(moduleDef => ({
      ...moduleDef,
      permissions: moduleDef.permissions.map(pId => {
        const parts = pId.split(':');
        return {
          key: pId,
          label: parts[2].charAt(0).toUpperCase() + parts[2].slice(1), // e.g., "Create"
          menuSlug: parts[1],
        };
      }),
    }));
  }, [allPermissionsData]);

  // Extract unique permission types (Create, Read, Update, Delete) from transformed data
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
      <div className="p-6 text-center text-red-500">Employee not found or an error occurred.</div>
    );
  }

  // Determine permissions for rendering UI elements
  const canUpdateEmployee = canUpdate(module, menu);
  const canViewEmployee = canRead(module, menu);

  if (!canViewEmployee) {
    router.push('/unauthorized');
    return null;
  }

  const getStatusBadge = (isActive) => (isActive ? 'Active' : 'Inactive');
  const getStatusVariant = (isActive) => (isActive ? 'success' : 'destructive');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold capitalize">{`${user.firstName} ${user.lastName? user.lastName:""}`}</h1>
        {canUpdateEmployee && (
          <Button onClick={() => router.push(`/${currentUserRole}/employees/${user._id}/edit`)}>Edit Employee</Button>
        )}
      </div>

      <Button variant="outline" onClick={() => router.push(`/${currentUserRole}/employees`)} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to List
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="p-6">
              <UserAvatar user={user} size="xl" className="ring-4 ring-primary mb-4" />
              <CardTitle className="text-2xl capitalize">{`${user.firstName} ${user.lastName? user.lastName:""}`}</CardTitle>
              <p className="text-lg font-semibold text-muted-foreground capitalize">{user.role}</p>
              {user?.branch_id && (
                <p className="text-sm font-semibold text-primary">
                  {user.branch_id.branch_name}
                </p>
              )}
              <Badge variant={getStatusVariant(user.isActive)} className="mt-4">
                {user.isActive ? <CheckCircle className="h-4 w-4 mr-1" /> : <X className="h-4 w-4 mr-1" />}
                {getStatusBadge(user.isActive)}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4 px-6 pb-6">
              <Separator />
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-start space-x-3">
                    <Phone className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Phone</p>
                      <p className="text-sm font-medium">{formatPhoneNumberForDisplay(user.phone)}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start space-x-3">
                  <CalendarDays className="h-5 w-5 text-muted-foreground mt-1" />
                  <div>
                    <p className="text-xs text-muted-foreground">Joined</p>
                    <p className="text-sm font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {user.lastLogin && (
                  <div className="flex items-start space-x-3">
                    <CalendarDays className="h-5 w-5 text-muted-foreground mt-1" />
                    <div>
                      <p className="text-xs text-muted-foreground">Last Login</p>
                      <p className="text-sm font-medium">{new Date(user.lastLogin).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Permissions */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Permissions Grid</CardTitle>
            </CardHeader>
            <CardContent>
              {transformedAllPermissions && transformedAllPermissions.length > 0 ? (
                <div className="rounded-md border overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="min-w-50">Menu / Section</TableHead>
                        {uniquePermissionTypes.map((type) => (
                          <TableHead key={type} className="text-center">{type}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transformedAllPermissions.map((moduleDef) => (
                        <TableRow key={moduleDef.moduleName} className="bg-muted/30 font-semibold">
                          <TableCell colSpan={uniquePermissionTypes.length + 1}>{moduleDef.moduleName}</TableCell>
                        </TableRow>
                      ))}
                      {transformedAllPermissions.flatMap(moduleDef => {
                        // Group permissions by menu for this module
                        const menus = [...new Set(moduleDef.permissions.map(p => p.menuSlug))];
                        return menus.map(menuSlug => (
                          <TableRow key={`${moduleDef.moduleName}-${menuSlug}`}>
                            <TableCell className="pl-8 capitalize">{menuSlug.replace(/_/g, ' ')}</TableCell>
                            {uniquePermissionTypes.map(type => {
                              const pId = `${moduleDef.moduleName.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_').replace(/-/g, '_')}:${menuSlug}:${type.toLowerCase()}`;
                              const userHasPermission = user.permissions.includes(pId);
                              
                              return (
                                <TableCell key={type} className="text-center">
                                  {userHasPermission ? (
                                    <Check className="h-4 w-4 text-green-500 mx-auto" />
                                  ) : (
                                    <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                  )}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        ));
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center p-8">
                  <ShieldX className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">No Permissions Found</h3>
                  <p className="mt-1 text-sm text-gray-500">This user has not been assigned any permissions yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailPage;