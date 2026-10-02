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
  async (error) => {
    const config = error.config;
    // Dual-route resilience: If request to direct Render URL fails with a network/CORS error on Vercel,
    // automatically retry via the same-origin Vercel reverse proxy (/api)
    if (
      config &&
      !config._fallbackTried &&
      typeof window !== 'undefined' &&
      window.location.hostname.endsWith('.vercel.app') &&
      config.baseURL?.startsWith('https://sarthi-ai-szqy.onrender.com')
    ) {
      config._fallbackTried = true;
      try {
        console.warn('[SARTHI Network] Direct Render connection failed. Retrying via same-origin Vercel proxy...');
        const proxyRes = await axios({
          ...config,
          baseURL: '/api',
        });
        return proxyRes;
      } catch (proxyErr) {
        // Fall through to standard error handler if proxy also fails
      }
    }

    const message = error.response?.data?.error || error.response?.data?.message || error.message || 'Network error occurred.';
    const err = new Error(message);
    if (error.code) err.code = error.code;
    if (error.response) err.response = error.response;
    return Promise.reject(err);
  }
);

export default api;
