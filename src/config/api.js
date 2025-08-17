// API Configuration
export const API_CONFIG = {
  // Base URL for API calls
  BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app',
  
  // Socket URL for real-time connections
  SOCKET_URL: process.env.REACT_APP_SOCKET_URL || 'https://smcback-production-6d12.up.railway.app',
  
  // API endpoints
  ENDPOINTS: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      USER: '/api/auth/me',
      REGISTER: '/api/auth/register'
    },
    COUNTRIES: '/api/countries',
    NOTIFICATIONS: '/api/notifications',
    INVENTORY: '/api/inventory',
    ADMIN: '/api/admin'
  },
  
  // Request configuration
  REQUEST_CONFIG: {
    timeout: 15000,
    withCredentials: true,
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  }
};

// Helper function to get full API URL
export const getApiUrl = (endpoint) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Helper function to get full socket URL
export const getSocketUrl = () => {
  return API_CONFIG.SOCKET_URL;
};
