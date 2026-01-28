// features/usersApi.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersAPI } from '@/lib/api';

export const useUsers = () => {
   return useQuery({
      queryKey: ['users'],
      queryFn: usersAPI.getUsers,
      select: (response) => response.data.data,
   });
};

export const useUser = (id) => {
   return useQuery({
      queryKey: ['user', id],
      queryFn: () => usersAPI.getUser(id),
      select: (response) => response.data.data,
      enabled: !!id,
   });
};

export const useCreateUser = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: usersAPI.createUser,
      onSuccess: () => {
         queryClient.invalidateQueries(['users']);
      },
      onError: (error) => {
         console.error('Create user error:', error);
         throw error; // Let the component handle the error
      },
   });
};

export const useUpdateUser = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: ({ id, data }) => usersAPI.updateUser(id, data),
      onSuccess: (response, variables) => {
         queryClient.invalidateQueries(['users']);
         queryClient.invalidateQueries(['user', variables.id]);
      },
      onError: (error) => {
         console.error('Update user error:', error);
         throw error;
      },
   });
};

export const useDeleteUser = () => {
   const queryClient = useQueryClient();

   return useMutation({
      mutationFn: usersAPI.deleteUser,
      onSuccess: () => {
         queryClient.invalidateQueries(['users']);
      },
      onError: (error) => {
         console.error('Delete user error:', error);
         throw error;
      },
   });
};