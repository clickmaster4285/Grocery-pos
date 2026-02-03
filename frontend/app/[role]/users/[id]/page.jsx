'use client';

import { ArrowLeft, Badge, CalendarDays, Check, CheckCircle, Mail, Phone, X } from 'lucide-react'; 
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
    return (
      <div className="p-6 text-center">Loading user details...</div>
    );
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{`${user.firstName} ${user.lastName}`}</h1>
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

      <Card>
        <CardHeader className="flex flex-row items-center space-x-4">
          <UserAvatar user={user} size="xl" className="ring-2 ring-primary" />
          <div>
            <CardTitle className="text-2xl capitalize">{`${user.firstName} ${user.lastName}`}</CardTitle>
            <p className="text-muted-foreground"> <span className='font-semibold text-primary'>Role: </span> {user.role.toUpperCase()}</p>
            {user?.branch_id && (
              <div className="text-muted-foreground text-sm">
                <span className='font-semibold text-primary'>Branch: </span>  <span>{user.branch_id.branch_name}</span>
              </div>
            )}
            <Badge variant={getStatusVariant(user.isActive)} className="mt-2">
              {user.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
              {getStatusBadge(user.isActive)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg">{user.email}</span>
            </div>
            {user.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg">{formatPhoneNumberForDisplay(user.phone)}</span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <span className="text-lg">Joined: {new Date(user.createdAt).toLocaleDateString()}</span>
            </div>
            {user.lastLogin && (
              <div className="flex items-center space-x-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg">Last Login: {new Date(user.lastLogin).toLocaleDateString()}</span>
              </div>
            )}
          </div>
          <Separator />
          <div>
            <h3 className="text-xl font-semibold mb-2">Permissions</h3>
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
                        <TableCell className="font-medium">{module.moduleName}</TableCell>
                        {uniquePermissionTypes.map((type) => {
                          const hasPermissionInModule = module.permissions.some(p => p.label === type); // Check if module has this permission type
                          const userHasPermission = user.permissions.includes(module.moduleName.toLowerCase() + ':' + type.toLowerCase()); // Check if user has the specific permission

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
              <p className="text-muted-foreground">No permissions information available.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffDetailPage;