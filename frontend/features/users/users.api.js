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

export const useGetAllUsers = (options) => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: async () =>{
       const response = await usersAPI.getAllUsers();
       return response;
      }, 
    staleTime: 60 * 1000, 
    select: (response) => response.data.users,
    retry: (failureCount, error) => {
      // Don't retry if the error status is 403 (Forbidden)
      if (error?.response?.status === 403) {
        return false;
      }
      // Otherwise, retry up to 3 times
      return failureCount < 3;
    },
    ...options,
  });
};

export const useGetUserById = (id) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: async() =>{ 
      const response = await usersAPI.getUserById(id);
      return response;
    }, 
    staleTime: 60 * 1000, 
    enabled: !!id,
    select: (response) => response.data, 
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
    select: (response) => response.data, // Directly return the structured array
  });
};

export const useStaffList = useGetAllUsers;
export const useCreateStaff = useCreateUser;
export const useUpdateStaff = useUpdateUser;
export const useDeleteStaff = useDeleteUser;
export const usePermissions = useGetPermissions;