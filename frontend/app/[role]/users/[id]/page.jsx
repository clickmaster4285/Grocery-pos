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
import { useGetPermissions, useGetUserById } from '@/features/users/users.api';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Separator } from '@/components/ui/separator';
import { formatPhoneNumberForDisplay } from '@/utils/formatters';
import { useAuth } from "@/hooks/useAuth"
import StaffDetailSkeleton from '@/components/shared-components/users/StaffDetailSkeleton';

const StaffDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const { user: currentUser, role } = useAuth();

  const { data: user, isLoading, error } = useGetUserById(id);
  const { data: allPermissionsData, isLoading: permissionsLoading } = useGetPermissions(); // Renamed to allPermissionsData

  // Transform allPermissionsData into the format expected by the rendering logic
  const transformedAllPermissions = useMemo(() => {
    if (!allPermissionsData || allPermissionsData.length === 0) {
      return [];
    }
    return allPermissionsData.map(module => ({
      ...module,
      permissions: module.permissions.map(pId => ({
        key: pId,
        label: pId.split(':')[1].replace(/([A-Z])/g, ' $1').trim(), // Extract label from permission ID
      })),
    }));
  }, [allPermissionsData]);

  // Extract unique permission types (Create, Read, Update, Delete, View) from transformed data
  const uniquePermissionTypes = useMemo(() => {
    return [...new Set(transformedAllPermissions.flatMap(module => module.permissions.map(p => p.label)))].sort();
  }, [transformedAllPermissions]);
  
  useEffect(() => {
    if (error) {
      router.push(`/${role}/users`);
    }
  }, [error, router, role]);

  if (isLoading || permissionsLoading) {
    return <StaffDetailSkeleton />;
  }

  if (!user) {
    return (
      <div className="p-6 text-center text-red-500">User not found or an error occurred.</div>
    );
  }

  // Determine permissions for rendering UI elements
  const canUpdateStaff = currentUser?.permissions?.includes('users:update');
  const canDeleteStaff = currentUser?.permissions?.includes('users:delete'); 
  const canViewStaff = currentUser?.permissions?.includes('users:read'); 

  if (!canViewStaff) {
    router.push('/unauthorized');
    return null;
  }

  const getStatusBadge = (isActive) => (isActive ? 'Active' : 'Inactive');
  const getStatusVariant = (isActive) => (isActive ? 'success' : 'destructive');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold capitalize">{`${user.firstName} ${user.lastName}`}</h1>
        {canUpdateStaff && (
          <Button onClick={() => router.push(`/${currentUser.role}/users/${user._id}/edit`)}>Edit User</Button>
        )}
      </div>

      {user?._id !== currentUser?._id && (
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: User Info */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="p-6">
              <UserAvatar user={user} size="xl" className="ring-4 ring-primary mb-4" />
              <CardTitle className="text-2xl capitalize">{`${user.firstName} ${user.lastName}`}</CardTitle>
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
              <CardTitle>Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              {transformedAllPermissions && transformedAllPermissions.length > 0 ? (
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-38">Module</TableHead>
                        {uniquePermissionTypes.map((type) => (
                          <TableHead key={type} className="text-center">{type}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transformedAllPermissions.map((module) => (
                        <TableRow key={module.moduleName}>
                          <TableCell className="font-medium capitalize">{module.moduleName}</TableCell>
                          {uniquePermissionTypes.map((type) => {
                            const hasPermissionInModule = module.permissions.some(p => p.label === type);
                            const userHasPermission = user.permissions.includes(`${module.moduleName.toLowerCase()}:${type.toLowerCase()}`);

                            return (
                              <TableCell key={type} className="text-center">
                                {hasPermissionInModule && userHasPermission ? (
                                  <Check className="h-5 w-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-red-500 mx-auto" />
                                )}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      ))}
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

export default StaffDetailPage;