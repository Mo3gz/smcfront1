import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Create axios instance with mobile-friendly configuration
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  ...API_CONFIG.REQUEST_CONFIG
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add mobile-specific headers
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    
    // Add authentication token if available
    // Try multiple sources for the token
    let token = localStorage.getItem('authToken');
    
    // If no token in localStorage, try to get from sessionStorage or other sources
    if (!token) {
      token = sessionStorage.getItem('authToken');
    }
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      config.headers['x-auth-token'] = token; // Backup header for iOS compatibility
      console.log('🔑 Adding auth token to request:', config.url, 'token exists:', !!token);
    } else {
      console.warn('⚠️ No auth token found for request:', config.url);
      // Log more details for debugging
      console.log('🔍 Token sources checked:', {
        localStorage: !!localStorage.getItem('authToken'),
        sessionStorage: !!sessionStorage.getItem('authToken'),
        cookies: !!document.cookie.includes('auth_token')
      });
      
      // Try to refresh token automatically if this is an authenticated endpoint
      if (config.url.includes('/api/') && !config.url.includes('/auth/login') && !config.url.includes('/auth/register')) {
        console.log('🔄 Attempting automatic token refresh for:', config.url);
        // We'll handle this in the response interceptor
      }
    }
    
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
    // Handle mobile-specific errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - mobile network issue');
      return Promise.reject({
        message: 'Network timeout. Please check your connection and try again.'
      });
    }

    if (error.response?.status === 401) {
      // Token expired or invalid
      console.error('❌ Authentication failed (401):', error.response.data);
      
      // Try to refresh the token if we have a user but no token
      if (!localStorage.getItem('authToken') && localStorage.getItem('user')) {
        console.log('🔄 Attempting to refresh auth token...');
        try {
          // Make a request to get the current user (which should include the token in headers)
          const refreshResponse = await axios.get('/api/auth/me', {
            baseURL: API_CONFIG.BASE_URL,
            withCredentials: true
          });
          
          if (refreshResponse.headers['x-auth-token']) {
            localStorage.setItem('authToken', refreshResponse.headers['x-auth-token']);
            console.log('✅ Auth token refreshed, retrying original request...');
            
            // Retry the original request with the new token
            const originalConfig = error.config;
            const token = localStorage.getItem('authToken');
            if (token) {
              originalConfig.headers['Authorization'] = `Bearer ${token}`;
              originalConfig.headers['x-auth-token'] = token;
              return axios(originalConfig);
            }
          }
        } catch (refreshError) {
          console.error('❌ Failed to refresh token:', refreshError);
        }
      }
      
      // Clear auth data if refresh failed
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
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

// Health check function to test API connectivity
export const checkApiHealth = async () => {
  try {
    const response = await api.get('/health');
    console.log('✅ API Health Check:', response.data);
    return { status: 'success', data: response.data };
  } catch (error) {
    console.error('❌ API Health Check Failed:', error);
    return { 
      status: 'error', 
      error: error.message || 'API connection failed',
      details: error.response?.data || error.code
    };
  }
};

// Function to manually refresh auth token
export const refreshAuthToken = async () => {
  try {
    console.log('🔄 Manually refreshing auth token...');
    const response = await axios.get('/api/auth/me', {
      baseURL: API_CONFIG.BASE_URL,
      withCredentials: true
    });
    
    if (response.headers['x-auth-token']) {
      localStorage.setItem('authToken', response.headers['x-auth-token']);
      console.log('✅ Auth token refreshed and stored');
      return { success: true, token: response.headers['x-auth-token'] };
    } else {
      console.warn('⚠️ No token found in response headers');
      return { success: false, error: 'No token in response' };
    }
  } catch (error) {
    console.error('❌ Failed to refresh auth token:', error);
    return { success: false, error: error.message };
  }
};

// Function to check if we have a valid token
export const hasValidToken = () => {
  const token = localStorage.getItem('authToken');
  return !!token && token.length > 10;
};

// Function to get current token
export const getCurrentToken = () => {
  return localStorage.getItem('authToken');
};

export default api; 