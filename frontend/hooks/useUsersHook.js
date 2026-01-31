// frontend/hooks/useUsersHook.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { useGetPermissions, useCreateUser, useUpdateUser, useGetUserById } from '@/features/users/users.api';
import { ROLES } from '@/constants/roles';

export const useUsersHook = (userId = null) => {
    const router = useRouter();
    const params = useParams();
    const { user: currentUser } = useAuth(); // Current logged-in user

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
        role: ROLES[0]?.value || '',
        password: '',
        permissions: [],
        isActive: true,
    });

    // Populate form data for edit mode or initialize with all permissions for create mode
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
        } else if (!isEditMode && allPermissions.length > 0) {
            // For create mode, initialize permissions with all available permissions
            const flattenedPermissions = allPermissions.flatMap(module =>
                module.permissions.map(p => p)
            );
            setFormData((prev) => ({
                ...prev,
                permissions: flattenedPermissions,
            }));
        }
    }, [isEditMode, userData, allPermissions]);

    // Check permissions for the current user
    const hasPermission = useCallback((permissionKey) => {
        return currentUser?.permissions?.includes(permissionKey);
    }, [currentUser]);

    // Redirect if current user doesn't have create/update permission
    useEffect(() => {
        const requiredPermission = isEditMode ? 'users:update' : 'users:create';
        if (currentUser && !currentUser.permissions.includes(requiredPermission)) {
            router.push(`/${params.role}/forbidden`);
        }
    }, [currentUser, isEditMode, router, params.role]);

    const updateFormField = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        const toastId = toast.loading(isEditMode ? 'Saving user...' : 'Creating user...');

        const dataToSubmit = { ...formData };
        if (!dataToSubmit.password) {
            delete dataToSubmit.password; // Don't send empty password on update
        }
        if (!isEditMode && !dataToSubmit.password) {
            toast.error('Validation Error', {
                id: toastId,
                description: 'Password is required for new users.',
            });
            return;
        }

        try {
            if (isEditMode) {
                await updateUserMutation.mutateAsync({ id: userId, userData: dataToSubmit });
                toast.success('User updated successfully.', { id: toastId });
            } else {
                await createUserMutation.mutateAsync(dataToSubmit);
                toast.success('User created successfully.', { id: toastId });
            }
            router.push(`/${params.role}/users`);
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.message || 'An unexpected error occurred.',
            });
        }
    }, [isEditMode, formData, userId, router, params.role, createUserMutation, updateUserMutation]);

    const resetForm = useCallback(() => {
        router.back();
    }, [router]);

    // Transformed permissions for StaffForm display
    const transformedAllPermissions = useMemo(() => {
        if (!allPermissions || allPermissions.length === 0) {
            return [];
        }
        return allPermissions.map(module => ({
            ...module,
            permissions: module.permissions.map(pId => ({
                key: pId,
                label: pId.split(':')[1].replace(/([A-Z])/g, ' $1').trim(),
            })),
        }));
    }, [allPermissions]);


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