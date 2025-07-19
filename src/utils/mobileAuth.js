// Mobile-specific authentication utilities
import { isMobileBrowser } from './mobileDetection';

// Enhanced axios configuration for mobile browsers
export const createMobileAxiosConfig = (baseConfig = {}) => {
  const mobileConfig = {
    ...baseConfig,
    timeout: isMobileBrowser() ? 20000 : 15000, // Longer timeout for mobile
    withCredentials: true,
    headers: {
      ...baseConfig.headers,
      'X-Requested-With': 'XMLHttpRequest'
      // Removed Cache-Control and Pragma headers that were causing CORS issues
    }
  };

  return mobileConfig;
};

// Retry logic for mobile network issues
export const retryRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      console.log(`Request attempt ${attempt} failed:`, error.message);
      
      // Don't retry on authentication errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw error;
      }
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
};

// Check if the error is a mobile network issue
export const isMobileNetworkError = (error) => {
  return (
    error.code === 'ECONNABORTED' || // Timeout
    error.code === 'ERR_NETWORK' || // Network error
    error.message?.includes('Network Error') ||
    error.message?.includes('timeout') ||
    error.message?.includes('Failed to fetch')
  );
};

// Enhanced error handling for mobile
export const handleMobileError = (error, context = '') => {
  console.error(`Mobile error in ${context}:`, error);
  
  if (isMobileNetworkError(error)) {
    return {
      type: 'network',
      message: 'Network connection issue. Please check your internet connection and try again.',
      retryable: true
    };
  }
  
  if (error.response?.status === 401) {
    return {
      type: 'auth',
      message: 'Authentication failed. Please log in again.',
      retryable: false
    };
  }
  
  if (error.response?.status === 403) {
    return {
      type: 'permission',
      message: 'Access denied. You don\'t have permission for this action.',
      retryable: false
    };
  }
  
  return {
    type: 'unknown',
    message: 'An unexpected error occurred. Please try again.',
    retryable: true
  };
};

// Cookie management for mobile browsers
export const checkCookieSupport = () => {
  try {
    document.cookie = "testCookie=1";
    const hasCookie = document.cookie.indexOf("testCookie=") !== -1;
    document.cookie = "testCookie=1; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    return hasCookie;
  } catch (e) {
    return false;
  }
};

// Mobile-specific authentication check
export const performMobileAuthCheck = async (authCheckFn) => {
  if (!checkCookieSupport()) {
    throw new Error('Cookies are disabled. Please enable cookies for this site.');
  }
  
  return await retryRequest(authCheckFn, 2, 2000);
}; 