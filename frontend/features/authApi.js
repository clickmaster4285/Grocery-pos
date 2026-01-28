// features/authApi.js
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authAPI } from '@/lib/api';

export const useLogin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: (response) => {
      const { data } = response;

      // Store token
      localStorage.setItem('token', data.token);

      // Transform user data to match frontend expectations
      const transformedUser = {
        ...data.user,
        user_name: data.user.name,
        user_role: data.user.role,
        // Keep original properties for compatibility
        name: data.user.name,
        role: data.user.role,
      };

      // Update user data in cache
      queryClient.setQueryData(['user'], transformedUser);

      // Invalidate and refetch the user query
      queryClient.invalidateQueries(['user']);
    },
    onError: (error) => {
      console.error('Login error:', error);
      throw error;
    }
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authAPI.register,
    onError: (error) => {
      console.error('Register error:', error);
      throw error;
    }
  });
};

export const useGetMe = (options = {}) => {
  const isEnabled = typeof window !== 'undefined' && !!localStorage.getItem('token');

  return useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      try {
        const response = await authAPI.getMe();
        return response.data;
      } catch (error) {
        // Clear token on 401
        if (error.status === 401) {
          localStorage.removeItem('token');
        }
        throw error;
      }
    },
    select: (response) => {
      const userData = response?.data;

      if (userData) {
        const transformedUser = {
          ...userData,
          user_name: userData.name,
          user_role: userData.role,
          // Keep original properties
          name: userData.name,
          role: userData.role,
        };
        return transformedUser;
      }

      return userData;
    },
    retry: false,
    enabled: isEnabled && (options.enabled !== false),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();

  return () => {
    localStorage.removeItem('token');
    queryClient.clear();
    queryClient.removeQueries();
    // Redirect to login
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: authAPI.updateProfile,
    onSuccess: (response) => {
      const updatedUser = response?.data?.data;

      if (updatedUser) {
        // Keep the same shape you're using in useLogin / useGetMe
        const transformedUser = {
          ...updatedUser,
          user_name: updatedUser.name,
          user_role: updatedUser.role,
          name: updatedUser.name,
          role: updatedUser.role,
        };

        // Update user cache so UI updates immediately
        queryClient.setQueryData(['user'], transformedUser);

        // Invalidate to stay in sync with backend
        queryClient.invalidateQueries(['user']);
      }
    },
    onError: (error) => {
      console.error('Update profile error:', error);
      throw error;
    },
  });
};