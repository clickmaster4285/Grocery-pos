// frontend/hooks/useUsersHook.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { useGetPermissions, useCreateUser, useUpdateUser, useGetUserById } from '@/features/users.api';
import { ROLES } from '@/constants/roles';

export const useUsersHook = (userId = null) => {
    const router = useRouter();
    const params = useParams();
    const { user: currentUser } = useAuth(); // Current logged-in user
    const { employee, isAdmin, can } = usePermissions();

    const isEditMode = !!userId;

    // Fetching user data for edit mode
    const { data: userData, isLoading: isUserLoading } = useGetUserById(userId, { enabled: isEditMode });

    // Fetching all available permissions
    const { data: allPermissions = [], isLoading: permissionsLoading } = useGetPermissions();

    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();

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

    // Populate form data for edit mode or initialize with empty permissions for create mode
    useEffect(() => {
        if (isEditMode && userData) {
            setFormData({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone || '',
                role: userData.role,
                permissions: userData.permissions || [],
                isActive: userData.isActive,
                password: '', // Password is not pre-filled for security
            });
        }
    }, [isEditMode, userData]);

    // Redirect if current user doesn't have create/update permission
    useEffect(() => {
        if (isAdmin) return;

        const hasAccess = isEditMode ? employee.database.update : employee.database.create;
            
        if (currentUser && !hasAccess) {
            console.error('Permission denied for Employee Database:', isEditMode ? 'update' : 'create');
            router.push(`/forbidden`);
        }
    }, [currentUser, isEditMode, router, employee.database, isAdmin]);

    const updateFormField = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        const toastId = toast.loading(isEditMode ? 'Saving employee...' : 'Creating employee...');

        const dataToSubmit = { ...formData };
        if (!dataToSubmit.password) {
            delete dataToSubmit.password; // Don't send empty password on update
        }
        if (!isEditMode && !dataToSubmit.password) {
            toast.error('Validation Error', {
                id: toastId,
                description: 'Password is required for new employees.',
            });
            return;
        }

        try {
            if (isEditMode) {
                await updateUserMutation.mutateAsync({ id: userId, userData: dataToSubmit });
                toast.success('Employee updated successfully.', { id: toastId });
            } else {
                await createUserMutation.mutateAsync(dataToSubmit);
                toast.success('Employee created successfully.', { id: toastId });
            }
            router.push(`/${params.role}/employees`);
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.message || 'An unexpected error occurred.',
            });
        }
    }, [isEditMode, formData, userId, router, params.role, createUserMutation, updateUserMutation]);

    const resetForm = useCallback(() => {
        router.push(`/${params.role}/employees`);
    }, [router, params.role]);

    // Transformed permissions for StaffForm display
    const transformedAllPermissions = useMemo(() => {
        if (!allPermissions || allPermissions.length === 0) {
            return [];
        }

        return allPermissions.map(moduleDef => {
            const filteredPermissions = moduleDef.permissions.filter(pId => {
                // If current user is admin, show all permissions
                if (isAdmin) return true;
                // Otherwise, only show permissions the current user has
                return can(pId);
            });

            return {
                ...moduleDef,
                permissions: filteredPermissions.map(pId => {
                    const parts = pId.split(':');
                    // Format label as "Action (Menu)" e.g. "Create (Product Database)"
                    const action = parts[2];
                    const menuName = parts[1].replace(/_/g, ' ');
                    
                    return {
                        key: pId,
                        label: `${action.charAt(0).toUpperCase() + action.slice(1)} - ${menuName}`,
                    };
                }),
            };
        }).filter(m => m.permissions.length > 0);
    }, [allPermissions, isAdmin, can]);


    return {
        formData,
        isUserLoading,
        permissionsLoading,
        transformedAllPermissions,
        updateFormField,
        handleSubmit,
        resetForm,
        createUserMutation,
        updateUserMutation,
        isEditMode,
        currentUser,
    };
};