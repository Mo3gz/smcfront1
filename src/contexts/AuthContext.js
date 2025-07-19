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
      const response = await axios.get(`${API_BASE_URL}/api/user`, config);
      
      console.log('🔍 Auth check successful:', response.data);
      setUser(response.data);
    } catch (error) {
      console.error('🔍 Auth check failed:', error.response?.status, error.response?.data);
      setUser(null);
      localStorage.removeItem('user');
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
      console.log('🔑 Attempting login for:', username);
      const config = createAxiosConfig();
      const response = await axios.post(`${API_BASE_URL}/api/login`, 
        { username, password }, 
        config
      );
      
      console.log('🔑 Login successful:', response.data);
      console.log('🔑 User data:', response.data.user);
      console.log('🔑 User role:', response.data.user?.role);
      
      // Set user immediately
      setUser(response.data.user);
      
      // Store in localStorage as backup
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      return { success: true };
    } catch (error) {
      console.error('🔑 Login failed:', error.response?.data);
      
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
      // Call backend to clear cookie
      await axios.post(`${API_BASE_URL}/api/logout`, {}, createAxiosConfig());
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all user data
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      sessionStorage.clear();
      // Optionally, redirect to login page
      window.location.href = '/'; // or '/login' if you have a login route
    }
  };

  // Check admin status
  const checkAdminStatus = async () => {
    try {
      const config = createAxiosConfig();
      const response = await axios.get(`${API_BASE_URL}/api/admin/check`, config);
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