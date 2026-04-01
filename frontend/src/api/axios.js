import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Add JWT to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('inv_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 Unauthorized globally
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      // Clear auth and force reload to login screen
      localStorage.removeItem('inv_token');
      localStorage.removeItem('inv_user');
      window.location.reload();
    }
    return Promise.reject(err);
  }
);

export default api;
