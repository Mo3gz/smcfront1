import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG, getApiUrl } from '../config/api';

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

  // Simple axios configuration
  const createAxiosConfig = () => ({
    ...API_CONFIG.REQUEST_CONFIG,
    timeout: 10000
  });

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication...');
      
      // First try with stored user data
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('authToken');
      
      console.log('📦 Stored auth data:', { 
        hasUser: !!storedUser, 
        hasToken: !!storedToken,
        token: storedToken ? storedToken.substring(0, 20) + '...' : null
      });
      
      const config = createAxiosConfig();
      let response;
      
      try {
        // Try with cookies first (backend priority)
        response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.USER), config);
        console.log('✅ Authentication successful with cookies');
        
        // If we have a stored token, keep it. If not, try to extract from response headers
        if (!storedToken && response.headers['x-auth-token']) {
          localStorage.setItem('authToken', response.headers['x-auth-token']);
          console.log('🔑 Stored token from response headers');
        }
        
      } catch (error) {
        console.log('❌ Cookie auth failed, trying token:', error.response?.status);
        
        // If 401 and we have a token in localStorage, try with token in header
        if (error.response?.status === 401 && storedToken) {
          const tokenConfig = {
            ...config,
            headers: {
              ...config.headers,
              'Authorization': `Bearer ${storedToken}`,
              'x-auth-token': storedToken
            }
          };
          response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.USER), tokenConfig);
          console.log('✅ Authentication successful with token');
        } else {
          throw error;
        }
      }
      
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      console.log('👤 User set:', response.data.username, response.data.role);
      
    } catch (error) {
      console.error('❌ Authentication check failed:', error.response?.data || error.message);
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get current auth token (helper function)
  const getAuthToken = () => {
    return localStorage.getItem('authToken');
  };

  // Set auth token manually (helper function)
  const setAuthToken = (token) => {
    if (token) {
      localStorage.setItem('authToken', token);
      console.log('🔑 Auth token set manually');
    }
  };

  // Refresh auth token (helper function)
  const refreshAuthToken = async () => {
    try {
      const response = await axios.get(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.USER), createAxiosConfig());
      if (response.headers['x-auth-token']) {
        localStorage.setItem('authToken', response.headers['x-auth-token']);
        console.log('🔑 Auth token refreshed from headers');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Failed to refresh auth token:', error);
      return false;
    }
  };

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (username, password) => {
    try {
      const config = createAxiosConfig();
      const response = await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGIN), 
        { username, password }, 
        config
      );
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      return { success: true };
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password. Please try again.';
      } else if (error.response?.status === 0 || error.code === 'ERR_NETWORK') {
        errorMessage = 'Network connection issue. Please check your internet connection.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await axios.post(getApiUrl(API_CONFIG.ENDPOINTS.AUTH.LOGOUT), {}, createAxiosConfig());
    } catch (error) {
      // Ignore errors
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      sessionStorage.clear();
      window.location.href = '/';
    }
  };

  // Check admin status (simplified - check user role)
  const checkAdminStatus = () => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }
    return { 
      success: user.role === 'admin', 
      user,
      error: user.role !== 'admin' ? 'User is not an admin' : null
    };
  };

  const value = {
    user,
    loading,
    login,
    logout,
    checkAuth,
    checkAdminStatus,
    getAuthToken,
    setAuthToken,
    refreshAuthToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 