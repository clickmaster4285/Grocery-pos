import {
  useGetAllUsers,
  useCreateUser,
  useUpdateUser,
  useDeleteUser,
  useGetPermissions,
} from '@/features/users/users.hooks';

export const useStaffList = useGetAllUsers;
export const useCreateStaff = useCreateUser;
export const useUpdateStaff = useUpdateUser;
export const useDeleteStaff = useDeleteUser;
export const usePermissions = useGetPermissions;