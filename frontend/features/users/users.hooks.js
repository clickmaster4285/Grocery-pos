import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from './users.api';

const userKeys = {
  all: ['users'],
  lists: () => [...userKeys.all, 'list'],
  details: () => [...userKeys.all, 'detail'],
  detail: (id) => [...userKeys.details(), id],
};

export const useGetAllUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: usersAPI.getAllUsers,
    staleTime: 60 * 1000, // 1 minute
    select: (response) => response.data.data, // Add select transformation
  });
};

export const useGetUserById = (id) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersAPI.getUserById(id),
    enabled: !!id, // Only run query if id is available
    select: (response) => response.data.data, // Add select transformation
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

export const useGetPermissions = () => {
  return useQuery({
    queryKey: [...userKeys.all, 'permissions'],
    queryFn: usersAPI.getPermissions,
    staleTime: Infinity, // Permissions list is unlikely to change often
    select: (response) => response.data.data,
  });
};
