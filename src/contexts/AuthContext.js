import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { createMobileAxiosConfig, handleMobileError, performMobileAuthCheck } from '../utils/mobileAuth';

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

  // Configure axios defaults for better mobile support
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';
  
  // Token refresh function
  const refreshToken = useCallback(async () => {
    if (isRefreshing) return false; // Prevent multiple refresh attempts
    
    try {
      setIsRefreshing(true);
      const config = createMobileAxiosConfig();
      const response = await axios.post(`${API_BASE_URL}/api/refresh-token`, {}, config);
      
      if (response.status === 200) {
        // Token refreshed successfully, retry the original request
        const userResponse = await axios.get(`${API_BASE_URL}/api/user`, config);
        setUser(userResponse.data);
        return true;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
    return false;
  }, [API_BASE_URL, isRefreshing]);
  
  const checkAuth = useCallback(async () => {
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
      
      // Only logout on specific authentication errors, not network issues
      if (errorInfo.type === 'auth') {
        // Try to refresh token first
        const refreshResult = await refreshToken();
        if (!refreshResult) {
          setUser(null);
          localStorage.removeItem('user');
        }
      } else if (errorInfo.type === 'permission') {
        setUser(null);
        localStorage.removeItem('user');
      }
      // Don't logout on network errors or other issues
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, refreshToken]);

  useEffect(() => {
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
      const config = createMobileAxiosConfig();
      const response = await axios.post(`${API_BASE_URL}/api/login`, 
        { username, password }, 
        config
      );
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error.response?.data);
      const errorInfo = handleMobileError(error, 'login');
      return { 
        success: false, 
        error: errorInfo.message || 'Login failed' 
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
      localStorage.removeItem('user');
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