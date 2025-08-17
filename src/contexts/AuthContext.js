import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

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

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';
  
  // Simple axios configuration
  const createAxiosConfig = () => ({
    withCredentials: true,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication...');
      const config = createAxiosConfig();
      let response;
      try {
        response = await axios.get(`${API_BASE_URL}/api/user`, config);
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
            response = await axios.get(`${API_BASE_URL}/api/user`, tokenConfig);
          } else {
            throw error;
          }
        } else {
          throw error;
        }
      }
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Login function
  const login = async (username, password) => {
    try {
      const config = createAxiosConfig();
      const response = await axios.post(`${API_BASE_URL}/api/login`, 
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
      await axios.post(`${API_BASE_URL}/api/logout`, {}, createAxiosConfig());
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