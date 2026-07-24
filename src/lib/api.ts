import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || '';
let apiBaseUrl = '/api/faculty';

if (rawBaseUrl) {
  const normalized = rawBaseUrl.replace(/\/$/, '');
  if (normalized.endsWith('/api/faculty')) {
    apiBaseUrl = normalized;
  } else if (normalized.endsWith('/api')) {
    apiBaseUrl = `${normalized}/faculty`;
  } else {
    apiBaseUrl = `${normalized}/api/faculty`;
  }
}

const api = axios.create({ baseURL: apiBaseUrl });

const rawStudentBaseUrl = import.meta.env.VITE_STUDENT_API_URL || 'https://kuc-backend-1.onrender.com';
const studentBase = rawStudentBaseUrl.replace(/\/$/, '');
const studentBaseUrl = studentBase.endsWith('/api') ? studentBase : `${studentBase}/api`;

export const apiRoot = axios.create({
  baseURL: studentBaseUrl
});

export const getFileUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  const backendBase = apiBaseUrl.replace(/\/api\/faculty\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? url : '/' + url}`;
};

export const getAuthenticatedFileUrl = (url?: string) => {
  if (!url) return '';
  const fullUrl = getFileUrl(url);
  const token = localStorage.getItem('iqac_token');
  if (!token) return fullUrl;
  
  const separator = fullUrl.includes('?') ? '&' : '?';
  return `${fullUrl}${separator}token=${token}`;
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

apiRoot.interceptors.request.use((config) => {
  const token = localStorage.getItem('iqac_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiRoot.interceptors.response.use(
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
