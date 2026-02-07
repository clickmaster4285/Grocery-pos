import { useRouter } from 'next/navigation';
import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';
import { authAPI } from '../features/auth.api';
import { setAuthErrorRedirector } from '../lib/api';
import { useCallback, useMemo, useEffect } from 'react';

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: userData, isLoading, isError, error } = useQuery({
    queryKey: ['me'],
    queryFn: authAPI.getMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
    enabled: typeof window !== 'undefined' && !!localStorage.getItem('token'),
  });

  const loginMutation = useMutation({
    mutationFn: authAPI.login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.data.token);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
    onError: (error) => {
      console.error('Login error:', error);
    },
  });

  const user = useMemo(() => userData?.data, [userData]);
  const isAuthenticated = useMemo(() => !!user, [user]);

  const logout = useCallback((redirectPath = '/') => {
    localStorage.removeItem('token');
    queryClient.clear();
    router.replace(redirectPath);
  }, [router, queryClient]);

  // Set the global error handler for the API interceptor
  useEffect(() => {
    setAuthErrorRedirector((status) => {
      if (status === 401) {
        logout();
      } else if (status === 403 && window.location.pathname !== '/forbidden') {
        router.replace('/forbidden');
      }
    });
  }, [logout, router]);

  return {
    user,
    isAuthenticated,
    isLoading,
    isError,
    logout,
    loginMutation,
  };
};