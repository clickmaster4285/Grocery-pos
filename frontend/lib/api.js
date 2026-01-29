// lib/api.js
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let authErrorHandler = null;

export const setAuthErrorRedirector = (handler) => {
  authErrorHandler = handler;
};

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
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined' && authErrorHandler) {
        authErrorHandler(error.response.status);
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

export default api;
