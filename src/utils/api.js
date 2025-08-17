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
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('🔑 Adding auth token to request:', config.url);
    } else {
      console.warn('⚠️ No auth token found for request:', config.url);
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
      console.error('❌ Authentication failed (401):', error.response.data);
      // Clear auth data
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

export default api; 