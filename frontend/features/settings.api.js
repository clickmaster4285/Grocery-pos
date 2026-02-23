import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settingsData) => {
    const formData = new FormData();
    Object.keys(settingsData).forEach(key => {
      const value = settingsData[key];
      
      // Only append if value is NOT null/undefined
      if (value !== null && value !== undefined) {
        if (key === 'notifications') {
          formData.append(key, JSON.stringify(value));
        } else if (key === 'logo' && value instanceof File) {
          formData.append('logo', value);
        } else if (key !== 'logo') { // Don't append existing logo path strings
          formData.append(key, value);
        }
      }
    });
    return api.put('/settings', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  updateProfile: (profileData) => api.put('/settings/profile', profileData),
};

export const useGetSettings = () => {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await settingsAPI.getSettings();
      return response.data;
    },
  });
};

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsAPI.updateSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success('System settings updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update settings.');
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsAPI.updateProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'user'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile.');
    },
  });
};
