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
  }, [API_BASE_URL]);

  // Initial auth check
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Enhanced login function with better error handling
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
      setUser(response.data.user);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { success: true };
    } catch (error) {
      let errorMessage = 'Login failed. Please try again.';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Invalid username or password. Please try again.';
        } else if (error.response.status === 403) {
          errorMessage = 'Access forbidden.';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = error.response.data?.error || error.message;
        }
      } else if (error.request) {
        errorMessage = 'No response from server.';
      } else {
        errorMessage = error.message;
      }
      console.error('🔑 Login failed:', errorMessage);
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
      const token = localStorage.getItem('authToken');
      const config = {
        ...createAxiosConfig(),
        headers: {
          ...createAxiosConfig().headers,
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      };
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

