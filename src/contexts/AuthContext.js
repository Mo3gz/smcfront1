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

  // Configure axios defaults for better mobile support
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';
  
  const checkAuth = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user`, { 
        withCredentials: true,
        timeout: 10000 // 10 second timeout for mobile
      });
      setUser(response.data);
    } catch (error) {
      console.error('Auth check failed:', error.response?.status, error.response?.data);
      setUser(null);
      // Clear any stored user data
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

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

    // Response interceptor
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          setUser(null);
          // Clear any stored user data
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
  }, []);

  const checkAdminStatus = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/check`, { 
        withCredentials: true,
        timeout: 10000
      });
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Admin check failed:', error.response?.status, error.response?.data);
      return { success: false, error: error.response?.data?.error || 'Admin check failed' };
    }
  };

  const login = async (username, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/login`, 
        { username, password }, 
        { 
          withCredentials: true,
          timeout: 15000 // Longer timeout for login
        }
      );
      setUser(response.data.user);
      return { success: true };
    } catch (error) {
      console.error('Login error:', error.response?.data);
      return { 
        success: false, 
        error: error.response?.data?.error || error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/logout`, {}, { 
        withCredentials: true,
        timeout: 5000
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      // Clear any stored user data
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
    // Add a function to handle token expiration
    handleTokenExpiration: () => {
      setUser(null);
      localStorage.removeItem('user');
      // You can add navigation to login page here if needed
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 