import axios from 'axios';

// Dynamically use the current hostname (e.g. localhost or 192.168.x.x) so team members on the same Wi-Fi connect seamlessly
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${hostname}:5001/api`;
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: automatically log out user and redirect to login if unauthorized (401), except on public routes
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthEndpoint = error.config?.url?.includes('/auth/login') || error.config?.url?.includes('/auth/signup');
      const isPublicRoute = typeof window !== 'undefined' && (
        window.location.pathname.startsWith('/portal/') ||
        window.location.pathname === '/' ||
        window.location.pathname === '/marketplace'
      );

      if (!isAuthEndpoint && !isPublicRoute) {
        console.warn('Unauthorized 401 detected — logging out user and clearing local session.');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

