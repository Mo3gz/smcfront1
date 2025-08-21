import axios from 'axios';

// Force localhost for local development, production URL for production
const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
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

// Retry configuration
const RETRY_DELAY = 1000; // 1 second

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add mobile-specific headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Add authentication token to all requests if available
    const token = localStorage.getItem('authToken') || 
                  sessionStorage.getItem('authToken') || 
                  localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['x-auth-token'] = token;
      console.log('🔧 Token added to request:', token.substring(0, 20) + '...');
    } else {
      console.log('🔧 No token found for request');
    }
    
    // Safari-specific authentication (add username to all requests)
    const userAgent = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    
    if (isSafari) {
      const storedUsername = localStorage.getItem('safariUsername');
      if (storedUsername && !config.headers['x-username']) {
        config.headers['x-username'] = storedUsername;
        console.log('🦁 Safari API interceptor added username to request:', storedUsername);
      }
    }
    
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
  async (error) => {
    const originalRequest = error.config;
    
    // Handle mobile-specific errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - mobile network issue');
      return Promise.reject({
        message: 'Network timeout. Please check your connection and try again.'
      });
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      console.log('Token expired or invalid - attempting to refresh authentication');
      
      // Don't immediately clear everything - let the auth context handle it
      // Only clear if this is not an auth check request itself
      if (!error.config.url.includes('/api/user') && 
          !error.config.url.includes('/api/safari/auth/me') &&
          !error.config.url.includes('/api/auth/refresh') &&
          !error.config.url.includes('/api/notifications') &&
          !error.config.url.includes('/api/mining/info') &&
          !error.config.url.includes('/api/spin')) {
        console.log('Clearing authentication data due to 401 on non-auth endpoint');
        localStorage.removeItem('user');
        localStorage.removeItem('authToken');
        localStorage.removeItem('safariUsername');
        sessionStorage.removeItem('authToken');
        
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      } else {
        console.log('401 on auth endpoint - letting auth context handle refresh');
      }
    }

    if (error.response?.status === 0) {
      // Network error (common on mobile)
      console.error('Network error - mobile connection issue');
      return Promise.reject({
        message: 'Network error. Please check your connection and try again.'
      });
    }

    // Retry logic for network errors (5xx, 0 status, etc.)
    if (originalRequest && !originalRequest._retry && 
        (error.response?.status >= 500 || error.response?.status === 0)) {
      originalRequest._retry = true;
      
      console.log(`Retrying request: ${originalRequest.url}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL }; 