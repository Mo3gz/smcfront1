// Mobile-specific authentication utilities

// Enhanced mobile axios configuration with dual authentication support
export const createMobileAxiosConfig = () => {
  const config = {
    withCredentials: true,
    timeout: 15000, // 15 seconds for mobile
    headers: {
      'Content-Type': 'application/json',
    }
  };

  // Add token from localStorage as fallback for iOS
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers['x-auth-token'] = token;
  }

  return config;
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
    error.message?.includes('Failed to fetch') ||
    error.message?.includes('ERR_INTERNET_DISCONNECTED') ||
    error.message?.includes('ERR_NETWORK_CHANGED')
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

// Enhanced mobile auth check with dual authentication
export const performMobileAuthCheck = async (authCheckFn) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Mobile auth check attempt ${attempt}/${maxRetries}`);
      
      // Try with cookies first
      const response = await authCheckFn();
      return response;
    } catch (error) {
      lastError = error;
      console.log(`Auth check attempt ${attempt} failed:`, error.response?.status);
      
      // If it's a 401 and we have a token in localStorage, try with token in body
      if (error.response?.status === 401 && attempt < maxRetries) {
        const token = localStorage.getItem('authToken');
        if (token) {
          try {
            console.log('Retrying with localStorage token...');
            const retryConfig = {
              ...createMobileAxiosConfig(),
              data: { token: token } // Send token in request body
            };
            
            // Create a new auth check function with token in body
            const retryAuthCheck = async () => {
              const axios = (await import('axios')).default;
              return axios.get('/api/user', retryConfig);
            };
            
            const response = await retryAuthCheck();
            return response;
          } catch (retryError) {
            console.log('Retry with localStorage token failed:', retryError.response?.status);
            lastError = retryError;
          }
        }
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Enhanced mobile login with dual authentication
export const performMobileLogin = async (loginFn) => {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Mobile login attempt ${attempt}/${maxRetries}`);
      
      const response = await loginFn();
      
      // Store token in localStorage as fallback for iOS
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        console.log('Token stored in localStorage for iOS compatibility');
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.log(`Login attempt ${attempt} failed:`, error.response?.status);
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}; 