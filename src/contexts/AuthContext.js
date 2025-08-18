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
      const response = await axios.get(`${API_BASE_URL}/api/user`, config);
      console.log('🔍 Auth check successful:', response.data);
      setUser(response.data);
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Token expired or invalid. Please log in again.';
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

  // Enhanced login function with better error handling
  const login = async (username, password) => {
    try {
      console.log('🔐 Attempting login...');
      const config = createAxiosConfig();
      const response = await axios.post(`${API_BASE_URL}/api/login`, {
        username,
        password
      }, config);
      
      console.log('🔐 Login successful:', response.data);
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return { success: true, user: response.data };
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