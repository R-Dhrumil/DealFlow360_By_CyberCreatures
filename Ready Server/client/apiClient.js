import axios from 'axios';

// Default API Base URL (Configurable via Frontend Env Vars)
const API_BASE_URL =
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_API_URL || process.env?.REACT_APP_API_URL || process.env?.VITE_API_URL)) ||
  'http://localhost:5000/api/v1';

/**
 * Pre-configured Axios Instance for Hackathon Frontend
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically Attach JWT Bearer Token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Responses & Token Expiration
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const errorResponse = error.response?.data || {
      success: false,
      message: error.message || 'Network error occurred',
    };

    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Token expired or invalid
      console.warn('⚠️ [API Client] Session expired or unauthorized');
    }

    return Promise.reject(errorResponse);
  }
);

/**
 * Namespaced API Methods Ready for React / Next.js / Vue
 */
export const api = {
  // Authentication & OTP
  auth: {
    login: async (credentials) => {
      const data = await apiClient.post('/auth/login', credentials);
      if (data.data?.token && typeof window !== 'undefined') {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }
      return data;
    },
    register: async (userData) => {
      const data = await apiClient.post('/auth/register', userData);
      if (data.data?.token && typeof window !== 'undefined') {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }
      return data;
    },
    sendOtp: (payload) => apiClient.post('/auth/send-otp', payload),
    verifyOtp: async (payload) => {
      const data = await apiClient.post('/auth/verify-otp', payload);
      if (data.data?.token && typeof window !== 'undefined') {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
      }
      return data;
    },
    getMe: () => apiClient.get('/auth/me'),
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    },
  },

  // Universal Media & File Upload
  upload: {
    single: (file, fieldName = 'file') => {
      const formData = new FormData();
      formData.append(fieldName, file);
      return apiClient.post('/upload/single', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    multiple: (files, fieldName = 'files') => {
      const formData = new FormData();
      Array.from(files).forEach((file) => formData.append(fieldName, file));
      return apiClient.post('/upload/multiple', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
  },

  // Users Management
  users: {
    getAll: (params) => apiClient.get('/users', { params }),
    getById: (id) => apiClient.get(`/users/${id}`),
    update: (id, data) => apiClient.put(`/users/${id}`, data),
    delete: (id) => apiClient.delete(`/users/${id}`),
  },

  // Sample Resource CRUD
  sample: {
    getAll: (params) => apiClient.get('/sample', { params }),
    create: (data) => apiClient.post('/sample', data),
    getById: (id) => apiClient.get(`/sample/${id}`),
    update: (id, data) => apiClient.put(`/sample/${id}`, data),
    delete: (id) => apiClient.delete(`/sample/${id}`),
  },
};

export default api;
