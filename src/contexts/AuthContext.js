import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Debug user state changes
  useEffect(() => {
    console.log('🔍 User state changed:', user);
  }, [user]);

  // Safari API interceptor - automatically add username to all requests
  useEffect(() => {
    const userAgent = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    
    if (isSafari) {
      console.log('🦁 Setting up Safari API interceptor for global axios');
      
      // Add request interceptor for Safari to global axios
      const requestInterceptor = axios.interceptors.request.use(
        (config) => {
          const storedUsername = localStorage.getItem('safariUsername');
          if (storedUsername && !config.headers['x-username']) {
            config.headers['x-username'] = storedUsername;
            console.log('🦁 Safari global interceptor added username to request:', storedUsername, 'URL:', config.url);
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );
      
      // Cleanup interceptor on unmount
      return () => {
        axios.interceptors.request.eject(requestInterceptor);
      };
    }
  }, []);

  // Immediate Safari interceptor setup (runs on every render)
  const userAgent = navigator.userAgent;
  const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
  
  if (isSafari && typeof window !== 'undefined') {
    // Set up interceptor immediately if not already set
    if (!window.safariInterceptorSet) {
      console.log('🦁 Setting up immediate Safari interceptor');
      window.safariInterceptorSet = true;
      
      axios.interceptors.request.use(
        (config) => {
          const storedUsername = localStorage.getItem('safariUsername');
          if (storedUsername && !config.headers['x-username']) {
            config.headers['x-username'] = storedUsername;
            console.log('🦁 Safari immediate interceptor added username to request:', storedUsername, 'URL:', config.url);
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );
    }
  }

  // Simple axios configuration
  const createAxiosConfig = () => {
    const config = {
      withCredentials: true,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    // For Safari, add username to headers for all requests
    const userAgent = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    
    if (isSafari) {
      const storedUsername = localStorage.getItem('safariUsername');
      if (storedUsername) {
        config.headers['x-username'] = storedUsername;
        console.log('🦁 Adding Safari username to headers:', storedUsername);
      }
    }
    
    return config;
  };

  // Token refresh function
  const refreshToken = async () => {
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      if (!token) return false;
      
      console.log('🔄 Attempting token refresh...');
      
      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'x-auth-token': token,
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        sessionStorage.setItem('authToken', response.data.token);
        console.log('🔄 Token refreshed successfully');
        return true;
      }
    } catch (error) {
      console.log('🔄 Token refresh failed:', error.message);
      // If refresh fails, clear tokens
      localStorage.removeItem('authToken');
      sessionStorage.removeItem('authToken');
    }
    return false;
  };

  // Check if user is authenticated - Enhanced for all browsers
  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication...');
      
      // Enhanced browser detection
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isMacOS = /Mac OS X/.test(userAgent);
      const isWindows = /Windows/.test(userAgent);
      const isChrome = /Chrome/.test(userAgent);
      const isFirefox = /Firefox/.test(userAgent);
      const isEdge = /Edg/.test(userAgent);
      
      console.log('🔍 Browser detection:', { 
        isSafari, 
        isIOS, 
        isMacOS, 
        isWindows,
        isChrome,
        isFirefox,
        isEdge,
        userAgent: userAgent 
      });
      
      // For Safari, try the simple auth approach first
      if (isSafari) {
        console.log('🦁 Safari detected - trying simple auth approach');
        
        // Check if we have a stored username
        const storedUsername = localStorage.getItem('safariUsername');
        if (storedUsername) {
          console.log('🦁 Found stored username for Safari:', storedUsername);
          
          try {
            const simpleConfig = {
              ...createAxiosConfig(),
              headers: {
                ...createAxiosConfig().headers,
                'x-username': storedUsername
              }
            };
            
            const simpleResponse = await axios.get(`${API_BASE_URL}/api/safari/simple-auth?username=${storedUsername}`, simpleConfig);
            console.log('🦁 Safari simple auth response:', simpleResponse.data);
            
            if (simpleResponse.data.id) {
              console.log('🦁 Safari simple auth successful');
              setUser(simpleResponse.data);
              return;
            }
          } catch (simpleError) {
            console.log('🦁 Safari simple auth failed, trying token approach:', simpleError.message);
          }
        }
        
        // Fallback to token approach for Safari
        const config = {
          ...createAxiosConfig(),
          headers: {
            ...createAxiosConfig().headers,
          }
        };
        
        // Try multiple token sources for Safari
        const token = localStorage.getItem('authToken') || 
                     localStorage.getItem('token') || 
                     localStorage.getItem('safariToken') ||
                     sessionStorage.getItem('authToken');
        
        if (token) {
          config.headers['x-auth-token'] = token;
          config.headers['Authorization'] = `Bearer ${token}`;
          console.log('🔍 Safari token found and added to headers');
        } else {
          console.log('🔍 No Safari token found in any storage');
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/safari/auth/me`, config);
        console.log('🔍 Safari auth check response:', response.data);
        
        if (response.data.id || response.data.username) {
          setUser(response.data);
          return;
        }
      } else {
        // For other browsers (Windows, Chrome, Firefox, Edge), use standard approach
        console.log('🖥️ Standard browser detected - using token approach');
        
        const config = {
          ...createAxiosConfig(),
          headers: {
            ...createAxiosConfig().headers,
          }
        };
        
        // Try multiple token sources for better compatibility
        const token = localStorage.getItem('authToken') || 
                     sessionStorage.getItem('authToken') ||
                     localStorage.getItem('token');
        
        if (token) {
          config.headers['x-auth-token'] = token;
          config.headers['Authorization'] = `Bearer ${token}`;
          console.log('🔍 Token found and added to headers for standard browser');
        } else {
          console.log('🔍 No token found in any storage for standard browser');
        }
        
        const response = await axios.get(`${API_BASE_URL}/api/user`, config);
        console.log('🔍 Standard auth check response:', response.data);
        
        // Handle different response formats
        let userData;
        if (response.data.user) {
          userData = response.data.user;
        } else if (response.data.id || response.data.username) {
          userData = response.data;
        } else {
          throw new Error('Invalid response format from server');
        }
        
        console.log('🔍 Processed user data:', userData);
        setUser(userData);
        return;
      }
      
      // If we get here, no authentication method worked
      console.log('🔍 No authentication method worked');
      setUser(null);
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error.response) {
        if (error.response.status === 401) {
          console.log('🔍 401 error - attempting token refresh');
          // Try to refresh the token before giving up
          const refreshSuccess = await refreshToken();
          if (refreshSuccess) {
            console.log('🔍 Token refreshed, retrying auth check');
            // Retry the auth check with the new token
            try {
              await checkAuth();
              return; // Exit early if retry succeeds
            } catch (retryError) {
              console.log('🔍 Retry failed after token refresh');
            }
          }
          
          errorMessage = 'Token expired or invalid. Please log in again.';
          // Clear stored tokens on auth failure
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
        } else if (error.response.status === 403) {
          errorMessage = 'Access forbidden.';
        } else {
          errorMessage = error.response.data?.error || error.message;
        }
      } else if (error.request) {
        errorMessage = 'No response from server.';
      } else {
        errorMessage = error.message;
      }
      console.error('🔍 Auth check failed:', errorMessage);
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Enhanced login function with better error handling - All browsers compatible
  const login = async (username, password) => {
    try {
      console.log('🔐 Attempting login for:', username);
      
      // Enhanced browser detection
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isMacOS = /Mac OS X/.test(userAgent);
      const isWindows = /Windows/.test(userAgent);
      
      console.log('🔐 Browser detection for login:', { isSafari, isIOS, isMacOS, isWindows });
      
      // Use Safari-specific endpoint if Safari is detected
      const endpoint = isSafari ? '/api/safari/login' : '/api/login';
      console.log('🔐 Using login endpoint:', endpoint);
      
      const config = createAxiosConfig();
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        username,
        password
      }, config);
      
      console.log('🔐 Login response:', response.data);
      
      // Handle different response formats
      let userData;
      if (response.data.user) {
        // Backend returns { user: {...} }
        userData = response.data.user;
      } else if (response.data.id || response.data.username) {
        // Backend returns user object directly
        userData = response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
      
      console.log('🔐 Processed user data:', userData);
      
      // Store token in multiple locations for better compatibility
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        sessionStorage.setItem('authToken', response.data.token);
        console.log('🔐 Token stored in localStorage and sessionStorage for compatibility');
        
        // For Safari, also store in multiple localStorage keys
        if (isSafari) {
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('safariToken', response.data.token);
          console.log('🔐 Token stored in multiple localStorage keys for Safari');
        }
        
        // For Windows browsers, ensure token is accessible
        if (isWindows) {
          localStorage.setItem('token', response.data.token);
          console.log('🔐 Token stored in additional localStorage key for Windows');
        }
      }
      
      // For Safari, also store username for simple auth fallback
      if (isSafari) {
        localStorage.setItem('safariUsername', username);
        console.log('🔐 Username stored for Safari simple auth fallback');
      }
      
      // Set user in state and localStorage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Add a small delay to ensure state is properly set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the user data is properly set
      console.log('🔐 Current user state after login:', userData);
      
      return { success: true, user: userData };
    } catch (error) {
      console.error('🔐 Login failed:', error);
      let errorMessage = 'Login failed';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid username or password';
        } else if (error.response.status === 403) {
          errorMessage = 'Account is disabled';
        } else {
          errorMessage = error.response.data?.error || error.message;
        }
      } else if (error.request) {
        errorMessage = 'No response from server. Please check your connection.';
      } else {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Logout function - Enhanced for Safari (iOS + macOS)
  const logout = async () => {
    // Enhanced Safari detection - moved to top level for scope access
    const userAgent = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isMacOS = /Mac OS X/.test(userAgent);
    
    console.log('🚪 Browser detection for logout:', { isSafari, isIOS, isMacOS });
    
    try {
      console.log('🚪 Starting logout process...');
      
      // Use Safari-specific logout endpoint if Safari is detected
      const logoutEndpoint = isSafari ? '/api/safari/logout' : '/api/logout';
      console.log('🚪 Using logout endpoint:', logoutEndpoint);
      
      const config = createAxiosConfig();
      await axios.post(`${API_BASE_URL}${logoutEndpoint}`, {}, config);
      
      console.log('✅ Backend logout successful');
    } catch (error) {
      console.error('❌ Backend logout error:', error);
      // Continue with frontend cleanup even if backend fails
    } finally {
      // Clear all possible stored data
      setUser(null);
      
      // Clear localStorage (Safari-specific keys)
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('safariToken');
      localStorage.removeItem('safariUsername');
      
      // Clear sessionStorage (especially important for Safari)
      sessionStorage.clear();
      
      // Clear any cached axios headers
      delete axios.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['x-auth-token'];
      
      console.log('✅ Frontend logout cleanup completed');
      
      // For Safari, force a complete page reload to ensure clean state
      if (isSafari) {
        console.log('🦁 Safari detected - forcing page reload');
        window.location.reload();
      } else {
        // For other browsers, redirect to home
        window.location.href = '/';
      }
    }
  };

  // Check admin status
  const checkAdminStatus = async () => {
    try {
      const config = createAxiosConfig();
      let response;
      try {
        response = await axios.get(`${API_BASE_URL}/api/admin/check`, config);
      } catch (error) {
        // If 401 and we have a token in localStorage, try with token in header
        if (error.response?.status === 401) {
          const token = localStorage.getItem('authToken');
          if (token) {
            const tokenConfig = {
              ...config,
              headers: {
                ...config.headers,
                'x-auth-token': token
              }
            };
            response = await axios.get(`${API_BASE_URL}/api/admin/check`, tokenConfig);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Admin check failed:', error.response?.status, error.response?.data);
      return { success: false, error: error.response?.data?.error || 'Admin check failed' };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    checkAdminStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 