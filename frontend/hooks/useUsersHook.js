// frontend/hooks/useUsersHook.js
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from './useAuth';
import { usePermissions } from './usePermissions';
import { useGetPermissions, useCreateUser, useUpdateUser, useGetUserById } from '@/features/users.api';

export const useUsersHook = (userId = null) => {
    const router = useRouter();
    const params = useParams();
    const { user: currentUser } = useAuth();
    const { employee, isAdmin, can } = usePermissions();

    const isEditMode = !!userId;

    const { data: userData, isLoading: isUserLoading } = useGetUserById(userId, { enabled: isEditMode });
    const { data: allPermissions = [], isLoading: permissionsLoading } = useGetPermissions();

    const createUserMutation = useCreateUser();
    const updateUserMutation = useUpdateUser();

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'general_staff',
        password: '',
        pin: '',
        hasSystemAccess: false,
        isTwoFactorEnabled: false,
        permissions: [],
        isActive: true,
        branch_id: '',
        // Refactored Employment Structure
        employment: {
            hireDate: new Date().toISOString().split('T')[0],
            designation: '',
            department: '',
            status: 'ACTIVE',
        },
        // New Shift Structure
        shift: {
            startTime: '09:00',
            endTime: '17:00',
            workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        },
        // Financial
        salary: {
            baseAmount: 0,
            payType: 'SALARY',
            paymentMethod: 'CASH',
            bankDetails: {
                bankName: '',
                accountNumber: '',
                iban: '',
            }
        },
        address: {
            street: '',
            city: '',
            state: '',
            zip: '',
            country: '',
        },
        emergencyContact: {
            name: '',
            relationship: '',
            phone: '',
        }
    });

    // Sync state with fetched user data
    useEffect(() => {
        if (isEditMode && userData) {
            setFormData({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email || '',
                phone: userData.phone || '',
                role: userData.role || 'general_staff',
                hasSystemAccess: userData.hasSystemAccess || false,
                isTwoFactorEnabled: userData.isTwoFactorEnabled || false,
                permissions: userData.permissions || [],
                isActive: userData.isActive ?? true,
                employment: {
                    hireDate: userData.employment?.hireDate ? new Date(userData.employment.hireDate).toISOString().split('T')[0] : '',
                    designation: userData.employment?.designation || '',
                    department: userData.employment?.department || '',
                    status: userData.employment?.status || 'ACTIVE',
                },
                shift: {
                    startTime: userData.shift?.startTime || '09:00',
                    endTime: userData.shift?.endTime || '17:00',
                    workDays: userData.shift?.workDays || [],
                },
                salary: {
                    baseAmount: userData.salary?.baseAmount || 0,
                    payType: userData.salary?.payType || 'SALARY',
                    paymentMethod: userData.salary?.paymentMethod || 'CASH',
                    bankDetails: {
                        bankName: userData.salary?.bankDetails?.bankName || '',
                        accountNumber: userData.salary?.bankDetails?.accountNumber || '',
                        iban: userData.salary?.bankDetails?.iban || '',
                    }
                },
                address: {
                    street: userData.address?.street || '',
                    city: userData.address?.city || '',
                    state: userData.address?.state || '',
                    zip: userData.address?.zip || '',
                    country: userData.address?.country || '',
                },
                emergencyContact: {
                    name: userData.emergencyContact?.name || '',
                    relationship: userData.emergencyContact?.relationship || '',
                    phone: userData.emergencyContact?.phone || '',
                },
                branch_id: userData.branch_id?._id || userData.branch_id || '',
                password: '', 
                pin: '', 
            });
        }
    }, [isEditMode, userData]);

    // Permissions logic
    useEffect(() => {
        if (isAdmin) return;
        const hasAccess = isEditMode ? employee.database.update : employee.database.create;
        if (currentUser && !hasAccess) {
            router.push(`/forbidden`);
        }
    }, [currentUser, isEditMode, router, employee.database, isAdmin]);

    // Helper for nested state updates
    const updateFormField = useCallback((path, value) => {
        setFormData(prev => {
            const keys = path.split('.');
            if (keys.length === 1) {
                return { ...prev, [path]: value };
            }
            
            const newState = { ...prev };
            let current = newState;
            for (let i = 0; i < keys.length - 1; i++) {
                current[keys[i]] = { ...current[keys[i]] };
                current = current[keys[i]];
            }
            current[keys[keys.length - 1]] = value;
            return newState;
        });
    }, []);

    const handleSubmit = useCallback(async (e) => {
        if (e && e.preventDefault) e.preventDefault();
        const toastId = toast.loading(isEditMode ? 'Saving employee...' : 'Creating employee...');

        const dataToSubmit = { ...formData };
        
        // Remove empty strings for security fields
        if (isEditMode) {
            if (!dataToSubmit.password) delete dataToSubmit.password;
            if (!dataToSubmit.pin) delete dataToSubmit.pin;
        }

        try {
            if (isEditMode) {
                await updateUserMutation.mutateAsync({ id: userId, userData: dataToSubmit });
                toast.success('Profile updated.', { id: toastId });
            } else {
                await createUserMutation.mutateAsync(dataToSubmit);
                toast.success('Employee created.', { id: toastId });
            }
            router.push(`/${params.role}/employees`);
        } catch (err) {
            toast.error('Operation Failed', {
                id: toastId,
                description: err.message || 'Error occurred.',
            });
        }
    }, [isEditMode, formData, userId, router, params.role, createUserMutation, updateUserMutation]);

    const resetForm = useCallback(() => {
        router.push(`/${params.role}/employees`);
    }, [router, params.role]);

    const transformedAllPermissions = useMemo(() => {
        if (!allPermissions?.length) return [];
        return allPermissions.map(moduleDef => ({
            ...moduleDef,
            permissions: moduleDef.permissions
                .filter(pId => isAdmin || can(pId))
                .map(pId => {
                    const parts = pId.split(':');
                    return {
                        key: pId,
                        label: `${parts[2].toUpperCase()} - ${parts[1].replace(/_/g, ' ')}`,
                    };
                }),
        })).filter(m => m.permissions.length > 0);
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