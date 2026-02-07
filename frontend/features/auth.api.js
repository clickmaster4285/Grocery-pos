import api from '@/lib/api';

export const authAPI = {
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },
  getMe: () => {
    return api.get('/auth/me');
  },
};
