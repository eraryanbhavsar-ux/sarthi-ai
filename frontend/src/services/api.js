import axios from 'axios';

export const getBaseApiUrl = () => {
  const envUrl = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || '';
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return 'https://sarthi-ai-szqy.onrender.com/api';
    }
  }
  return '/api';
};

const api = axios.create({
  baseURL: getBaseApiUrl(),
  timeout: 95000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sarthi_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Network error occurred.';
    const err = new Error(message);
    if (error.code) err.code = error.code;
    if (error.response) err.response = error.response;
    return Promise.reject(err);
  }
);

export default api;
