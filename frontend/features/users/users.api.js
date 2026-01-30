import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

 const usersAPI = {
  getAllUsers: () => api.get('/users'),
  getUserById: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.patch(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getPermissions: () => api.get('/users/permissions'),
};

export const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
};

export const useGetAllUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () =>{
       const response = await usersAPI.getAllUsers();
       console.log('Users fetched successfully:', response.data);
       return response;
      }, 
    staleTime: 60 * 1000, 
    select: (response) => response.data.data, 
  });
};

export const useGetUserById = (id) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersAPI.getUserById(id),
    enabled: !!id,
    select: (response) => response.data.data, 
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: usersAPI.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userData }) => usersAPI.updateUser(id, userData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(variables.id) });
    },
  });
};

export const useDeleteUser = () => { 
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => usersAPI.deleteUser(id), 
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({ queryKey: userKeys.detail(id) });
    },
  });
};

export const useGetPermissions = () => {
  return useQuery({
    queryKey: [...userKeys.all, 'permissions'],
    queryFn: async () => {
      const response = await usersAPI.getPermissions();
      return response;
    },
    select: (response) => {
      const permissionsObject = response.data; 
      return Object.entries(permissionsObject).map(([moduleName, perms]) => ({
        module: moduleName,
        permissions: Object.entries(perms).map(([key, value]) => ({
          key: value,
          label: value.split(':')[1].replace(/([A-Z])/g, ' $1').trim(), 
        })),
      }));
    },
  });
};

export const useStaffList = useGetAllUsers;
export const useCreateStaff = useCreateUser;
export const useUpdateStaff = useUpdateUser;
export const useDeleteStaff = useDeleteUser;
export const usePermissions = useGetPermissions;