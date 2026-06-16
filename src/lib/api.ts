import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || '/api/faculty';
const apiBaseUrl = rawBaseUrl.startsWith('http')
  ? `${rawBaseUrl.replace(/\/$/, '')}${rawBaseUrl.endsWith('/api/faculty') ? '' : ''}`
  : rawBaseUrl;
const api = axios.create({ baseURL: apiBaseUrl });

export const getFileUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const backendBase = apiBaseUrl.replace(/\/api\/faculty\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? url : '/' + url}`;
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('iqac_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('iqac_token');
      localStorage.removeItem('iqac_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
