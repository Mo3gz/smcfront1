import axios from 'axios';

// Force localhost for local development, production URL for production
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'
  : (process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app');

// Debug logging
console.log('🔧 API Configuration:');
console.log('🔧 Hostname:', window.location.hostname);
console.log('🔧 NODE_ENV:', process.env.NODE_ENV);
console.log('🔧 API_BASE_URL:', API_BASE_URL);

// Create axios instance with mobile-friendly configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 15000, // 15 second timeout for mobile networks
  headers: {
    'Content-Type': 'application/json',
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add mobile-specific headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    console.log('🔧 Making request to:', config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle mobile-specific errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - mobile network issue');
      return Promise.reject({
        message: 'Network timeout. Please check your connection and try again.'
      });
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('Token expired or invalid');
      // Clear user data
      localStorage.removeItem('user');
      // You can trigger a redirect to login here
    }

    if (error.response?.status === 0) {
      // Network error (common on mobile)
      console.error('Network error - mobile connection issue');
      return Promise.reject({
        message: 'Network error. Please check your connection and try again.'
      });
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL }; 