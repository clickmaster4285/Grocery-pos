// lib/api.js
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }

    // Return a consistent error format
    return Promise.reject({
      message: error.response?.data?.message || 'An error occurred',
      status: error.response?.status,
      data: error.response?.data,
    });
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => {
    return api.post('/auth/login', credentials);
  },
  register: (userData) => {
    return api.post('/auth/register', userData);
  },
  getMe: () => {
    return api.get('/auth/me');
  },
  updateProfile: (payload) => {

    return api.put('/auth/profile', payload);
  },
};

// Users API
export const usersAPI = {
  getUsers: () => api.get('/user/all'),
  getUser: (id) => api.get(`/user/${id}`),
  createUser: (userData) => api.post('/user/create', userData),
  updateUser: (id, userData) => api.put(`/user/${id}/update`, userData),
  deleteUser: (id) => api.delete(`/user/${id}/delete`),
};

export default api;