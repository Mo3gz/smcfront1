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

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';
  
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

  // Enhanced login function with better error handling
  const login = async (username, password) => {
    try {
      console.log('🔑 Attempting login for:', username);
      console.log('🔑 API Base URL:', API_BASE_URL);
      
      const config = createAxiosConfig();
      console.log('🔑 Request config:', config);
      
      const response = await axios.post(`${API_BASE_URL}/api/login`, 
        { username, password }, 
        config
      );
      
      console.log('🔑 Login response status:', response.status);
      console.log('🔑 Login response data:', response.data);
      console.log('🔑 User data:', response.data.user);
      console.log('🔑 User role:', response.data.user?.role);
      
      // Validate response data
      if (!response.data.user) {
        throw new Error('Invalid response: missing user data');
      }
      
      // Set user immediately
      setUser(response.data.user);
      
      // Store in localStorage as backup
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // If token is provided, store it as well
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      
      console.log('✅ Login successful, user set in state');
      
      return { success: true };
    } catch (error) {
      console.error('🔑 Login failed - Full error:', error);
      console.error('🔑 Error response:', error.response?.data);
      console.error('🔑 Error status:', error.response?.status);
      console.error('🔑 Error headers:', error.response?.headers);
      
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid username or password. Please try again.';
      } else if (error.response?.status === 0 || error.code === 'ERR_NETWORK') {
        errorMessage = 'Network connection issue. Please check your internet connection.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { 
        success: false, 
        error: errorMessage
      };
    }
  };

  // Enhanced logout function with better cleanup
  const logout = async () => {
    try {
      console.log('🚪 Starting logout process...');
      
      // Call backend to clear cookie
      const config = createAxiosConfig();
      await axios.post(`${API_BASE_URL}/api/logout`, {}, config);
      
      console.log('✅ Backend logout successful');
    } catch (error) {
      console.error('❌ Backend logout error:', error);
      // Continue with frontend cleanup even if backend fails
    } finally {
      // Clear all possible stored data
      setUser(null);
      
      // Clear localStorage
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      
      // Clear sessionStorage
      sessionStorage.clear();
      
      // Clear any cached axios headers
      delete axios.defaults.headers.common['Authorization'];
      
      console.log('✅ Frontend logout cleanup completed');
      
      // Force a complete page reload to ensure clean state
      window.location.reload();
    }
  };

  // Check admin status
  const checkAdminStatus = async () => {
    try {
      console.log('🔐 Checking admin status...');
      const config = createAxiosConfig();
      const response = await axios.get(`${API_BASE_URL}/api/admin/check`, config);
      console.log('🔐 Admin check successful:', response.data);
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('🔐 Admin check failed:', error.response?.status, error.response?.data);
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

