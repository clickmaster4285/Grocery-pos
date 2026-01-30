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
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Separator } from '@/components/ui/separator';
import { formatPhoneNumberForDisplay } from '@/utils/formatters';

const StaffDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const { id, role } = params;

  const { data: user, isLoading, error } = useGetUserById(id);
  const { data: allPermissions, isLoading: permissionsLoading } = useGetPermissions();

  useEffect(() => {
    if (error) {
      router.push(`/${role}/staff`);
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

  const getStatusBadge = (isActive) => (isActive ? 'Active' : 'Inactive');
  const getStatusVariant = (isActive) => (isActive ? 'success' : 'destructive');

  // Extract unique permission types (Create, Read, Update, Delete, View)
  const uniquePermissionTypes = [
    ...new Set(allPermissions.flatMap(module => module.permissions.map(p => p.label)))
  ].sort();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{`${user.firstName} ${user.lastName}`}</h1>
        <Button onClick={() => router.push(`/${role}/staff/${user._id}/edit`)}>Edit User</Button>
      </div>
      <Button variant="outline" onClick={() => router.back()} className="mb-4">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Go Back
      </Button>

      <Card>
        <CardHeader className="flex flex-row items-center space-x-4">
          <UserAvatar user={user} size="xl" className="ring-2 ring-primary" />
          <div>
            <CardTitle className="text-2xl">{`${user.firstName} ${user.lastName}`}</CardTitle>
            <p className="text-muted-foreground">{user.role.toUpperCase()}</p>
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
            {allPermissions && allPermissions.length > 0 ? (
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
                    {allPermissions.map((module) => (
                      <TableRow key={module.module}>
                        <TableCell className="font-medium">{module.module}</TableCell>
                        {uniquePermissionTypes.map((type) => {
                          const permission = module.permissions.find(p => p.label === type);
                          const hasPermission = permission ? user.permissions.includes(permission.key) : false;
                          return (
                            <TableCell key={type} className="text-center">
                              {hasPermission ? (
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