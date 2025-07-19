import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { createMobileAxiosConfig, handleMobileError, performMobileAuthCheck, performMobileLogin } from '../utils/mobileAuth';
import { isMobileBrowser } from '../utils/mobileDetection';

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [justLoggedIn, setJustLoggedIn] = useState(false);

  // Configure axios defaults for better mobile support
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';
  
  // Token refresh function
  const refreshToken = useCallback(async () => {
    if (isRefreshing) {
      console.log('Token refresh already in progress');
      return false;
    }

    setIsRefreshing(true);
    
    try {
      console.log('Attempting to refresh token...');
      const config = createMobileAxiosConfig();
      
      // Try to refresh token
      const response = await axios.post(`${API_BASE_URL}/api/refresh-token`, {}, config);
      
      // Update localStorage token if provided
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        console.log('Token refreshed and stored in localStorage');
      }
      
      setIsRefreshing(false);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error.response?.status, error.response?.data);
      
      // Clear invalid tokens
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      
      setIsRefreshing(false);
      return false;
    }
  }, [API_BASE_URL, isRefreshing]);
  
  const checkAuth = useCallback(async () => {
    // Skip auth check if user just logged in (especially on mobile)
    if (justLoggedIn) {
      console.log('Skipping auth check - user just logged in');
      setLoading(false);
      return;
    }

    try {
      const authCheckFn = async () => {
        const config = createMobileAxiosConfig();
        const response = await axios.get(`${API_BASE_URL}/api/user`, config);
        return response;
      };
      
      const response = await performMobileAuthCheck(authCheckFn);
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error.response?.status, error.response?.data);
      
      const errorInfo = handleMobileError(error, 'auth check');
      
      // For mobile browsers, be more lenient with auth checks
      if (isMobileBrowser()) {
        // On mobile, only logout on very specific auth errors
        if (errorInfo.type === 'auth' && 
            (error.response?.data?.error === 'Invalid token' || 
             error.response?.data?.error === 'Access token required')) {
          
          // Try to refresh token first
          const refreshResult = await refreshToken();
          if (!refreshResult) {
            console.log('Mobile auth check failed, logging out');
            setUser(null);
            localStorage.removeItem('user');
          }
        } else if (errorInfo.type === 'permission') {
          console.log('Mobile permission error, logging out');
          setUser(null);
          localStorage.removeItem('user');
        } else {
          // For network errors or other issues on mobile, don't logout
          console.log('Mobile auth check failed but not logging out:', errorInfo.type);
        }
      } else {
        // Desktop behavior - more strict
        if (errorInfo.type === 'auth') {
          const refreshResult = await refreshToken();
          if (!refreshResult) {
            setUser(null);
            localStorage.removeItem('user');
          }
        } else if (errorInfo.type === 'permission') {
          setUser(null);
          localStorage.removeItem('user');
        } else if (errorInfo.type === 'network') {
          console.log('Network error during auth check, not logging out');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, refreshToken, justLoggedIn]);

  useEffect(() => {
    // For mobile browsers, skip initial auth check to prevent conflicts
    if (isMobileBrowser()) {
      console.log('Mobile browser detected - skipping initial auth check');
      setLoading(false);
      return;
    }
    
    // Only run initial auth check on desktop
    checkAuth();
  }, [checkAuth]);

  // Set up axios interceptors for better error handling
  useEffect(() => {
    // Request interceptor
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        // Ensure credentials are always sent
        config.withCredentials = true;
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor with better mobile handling
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Handle CORS errors specifically
        if (error.message && error.message.includes('CORS')) {
          console.error('CORS error detected:', error.message);
          // Don't logout on CORS errors, just return the error
          return Promise.reject(error);
        }
        
        // Handle token expiration
        if (error.response?.status === 401 && 
            error.response?.data?.error === 'Token expired' && 
            !originalRequest._retry) {
          
          originalRequest._retry = true;
          
          // Try to refresh token
          const refreshResult = await refreshToken();
          if (refreshResult) {
            // Retry the original request
            return axios(originalRequest);
          }
        }
        
        // Use mobile error handling
        const errorInfo = handleMobileError(error, 'axios interceptor');
        
        // Only logout on specific auth errors, not network issues
        if (errorInfo.type === 'auth' && 
            (error.response?.data?.error === 'Invalid token' || 
             error.response?.data?.error === 'Access token required')) {
          setUser(null);
          localStorage.removeItem('user');
        }
        
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [refreshToken]);

  const checkAdminStatus = async () => {
    try {
      const config = createMobileAxiosConfig();
      const response = await axios.get(`${API_BASE_URL}/api/admin/check`, config);
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Admin check failed:', error.response?.status, error.response?.data);
      return { success: false, error: error.response?.data?.error || 'Admin check failed' };
    }
  };

  const login = async (username, password) => {
    try {
      // Set flag to prevent auth check conflicts
      setJustLoggedIn(true);
      
      const loginFn = async () => {
        const config = createMobileAxiosConfig();
        const response = await axios.post(`${API_BASE_URL}/api/login`, 
          { username, password }, 
          config
        );
        return response;
      };
      
      // Use mobile-specific login helper
      const response = await performMobileLogin(loginFn);
      
      // Debug login response
      console.log('🔑 Login response:', response.data);
      console.log('🔑 User data:', response.data.user);
      console.log('🔑 User role:', response.data.user?.role);
      console.log('🔑 Is admin:', response.data.user?.role === 'admin');
      
      // Set user immediately from login response
      setUser(response.data.user);
      
      // For mobile, add a longer delay before allowing auth checks
      if (isMobileBrowser()) {
        setTimeout(() => {
          console.log('Mobile: Allowing auth checks after login delay');
          setJustLoggedIn(false);
          // Silently check auth after delay
          checkAuth().catch(error => {
            console.log('Post-login auth check failed (mobile):', error);
            // Don't logout on mobile if this fails, user is already logged in
          });
        }, 5000); // Increased delay for mobile
      } else {
        // For desktop, shorter delay
        setTimeout(() => {
          console.log('Desktop: Allowing auth checks after login delay');
          setJustLoggedIn(false);
        }, 1000);
      }
      
      return { success: true };
    } catch (error) {
      // Reset flag on error
      setJustLoggedIn(false);
      
      console.error('Login error:', error.response?.data);
      const errorInfo = handleMobileError(error, 'login');
      
      // Provide more specific error messages
      let errorMessage = errorInfo.message;
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password. Please try again.';
      } else if (error.response?.status === 0 || error.code === 'ERR_NETWORK') {
        errorMessage = 'Network connection issue. Please check your internet connection and try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  const logout = async () => {
    try {
      const config = createMobileAxiosConfig();
      await axios.post(`${API_BASE_URL}/api/logout`, {}, config);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setJustLoggedIn(false); // Reset flag on logout
      localStorage.removeItem('user');
      localStorage.removeItem('authToken'); // Clear localStorage token
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    checkAdminStatus,
    refreshToken,
    isRefreshing,
    // Add a function to handle token expiration
    handleTokenExpiration: () => {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 