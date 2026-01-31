// frontend/components/shared-components/staff/StaffDetailPage.jsx
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Mail, Phone, Edit, Trash2, CheckCircle, XCircle, ChevronLeft } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { StaffForm } from './StaffForm';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { formatPhoneNumberForDisplay } from '@/utils/formatters';

import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { useStaff, useUpdateStaff, useDeleteStaff } from '@/hooks/useStaff';
import { ROLES } from '@/constants/roles';


const getRoleLabel = (roleValue) => {
  const role = ROLES.find(r => r.value === roleValue);
  return role ? role.label : roleValue;
};

const getStatusBadge = (user) => (user.isActive ? 'Active' : 'Inactive');
const getStatusVariant = (user) => (user.isActive ? 'success' : 'destructive');

export const StaffDetailPage = () => {
  const { id } = useParams(); 
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { can } = usePermissions();

  const { data: staff, isLoading, error, refetch } = useStaff(id);
  const updateStaffMutation = useUpdateStaff();
  const deleteStaffMutation = useDeleteStaff();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Form data for editing
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: '',
    password: '',
    permissions: [],
    isActive: true,
  });

  // Effect to populate form data when staff data loads or changes
  useEffect(() => {
    if (staff) {
      setFormData({
        firstName: staff.firstName,
        lastName: staff.lastName,
        email: staff.email,
        phone: staff.phone || '',
        role: staff.role,
        password: '', // Never pre-fill password
        permissions: staff.permissions || [],
        isActive: staff.isActive,
      });
    }
  }, [staff]);


  const updateFormField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleEditSubmit = useCallback(async (e) => {
    e.preventDefault();
    const toastId = toast.loading('Updating staff member...');

    // Basic validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.role) {
      toast.error('Validation Error', {
        id: toastId,
        description: 'Please fill in all required fields.',
      });
      return;
    }

    const userData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      permissions: formData.permissions,
      isActive: formData.isActive,
    };

    if (formData.password) {
      userData.password = formData.password;
    }

    try {
      await updateStaffMutation.mutateAsync({ id: staff._id, userData });
      toast.success('Staff member updated successfully.', { id: toastId });
      setIsEditDialogOpen(false);
      refetch(); // Refetch staff data to show updated details
    } catch (err) {
      toast.error('Failed to update staff member.', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
    }
  }, [formData, staff, updateStaffMutation, refetch]);


  const handleDeleteConfirm = useCallback(async () => {
    if (!staff || !currentUser || !currentUser._id) return;
    const toastId = toast.loading('Deleting staff member...');
    try {
      await deleteStaffMutation.mutateAsync(staff._id);
      toast.success('Staff member deleted successfully.', { id: toastId });
      setIsDeleteDialogOpen(false);
      router.back(); // Go back to staff list after deletion
    } catch (err) {
      toast.error('Failed to delete staff member.', {
        id: toastId,
        description: err.message || 'An unexpected error occurred.',
      });
    }
  }, [staff, currentUser, deleteStaffMutation, router]);


  // Permissions for actions
  const canEdit = useMemo(() => can('users:update'), [can]);
  const canDelete = useMemo(() => can('users:delete'), [can]);


  if (isLoading) {
    return (
      <div className="p-6">
        <Skeleton className="h-8 w-1/3 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-red-500">
        Error loading staff details: {error.message}
      </div>
    );
  }

  if (!staff) {
    return (
      <div className="p-6 text-muted-foreground">Staff member not found.</div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ChevronLeft className="h-4 w-4" /> Back to Staff List
        </Button>
        <div className="flex gap-2">
          {canEdit && (
            <Button onClick={() => setIsEditDialogOpen(true)} className="gap-2">
              <Edit className="h-4 w-4" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="destructive" onClick={() => setIsDeleteDialogOpen(true)} className="gap-2">
              <Trash2 className="h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-4">
            <UserAvatar user={staff} size="xl" className="ring-2 ring-primary/50" />
            <div>
              <CardTitle className="text-2xl font-bold">{staff.firstName} {staff.lastName}</CardTitle>
              <Badge
                variant={getStatusVariant(staff)}
                className="mt-1 capitalize"
              >
                {staff.isActive ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                {getStatusBadge(staff)}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">User ID</p>
            <p className="text-base">{staff.userId}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" /> {staff.email}
            </p>
          </div>
          {staff.phone && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone</p>
              <p className="text-base flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" /> {formatPhoneNumberForDisplay(staff.phone)}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-muted-foreground">Role</p>
            <Badge variant="outline" className="font-medium">
              {getRoleLabel(staff.role)}
            </Badge>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Joined</p>
            <p className="text-base">
              {new Date(staff.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </p>
          </div>
          {staff.lastLogin && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Login</p>
              <p className="text-base">
                {new Date(staff.lastLogin).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          )}
          <div className="col-span-1 md:col-span-2">
            <p className="text-sm font-medium text-muted-foreground mb-2">Permissions</p>
            <div className="flex flex-wrap gap-2">
              {staff.permissions && staff.permissions.length > 0 ? (
                staff.permissions.map(p => (
                  <Badge key={p} variant="secondary" className="capitalize">
                    {p.replace(/([A-Z])/g, ' $1').trim().replace(/:/g, ' - ')}
                  </Badge>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No explicit permissions assigned.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-125">
          <StaffForm
            formData={formData}
            updateFormField={updateFormField}
            handleSubmit={handleEditSubmit}
            resetForm={() => { // Custom reset for edit dialog
              setIsEditDialogOpen(false);
              // Reset form to original staff data if cancelled
              if (staff) {
                setFormData({
                  firstName: staff.firstName,
                  lastName: staff.lastName,
                  email: staff.email,
                  phone: staff.phone || '',
                  role: staff.role,
                  password: '',
                  permissions: staff.permissions || [],
                  isActive: staff.isActive,
                });
              }
            }}
            editingUser={staff}
            createUserMutation={createStaffMutation} 
            updateUserMutation={updateStaffMutation}
            ROLES={ROLES}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-semibold">{staff?.firstName} {staff?.lastName}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteStaffMutation.isLoading}
            >
              {deleteStaffMutation.isLoading ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};