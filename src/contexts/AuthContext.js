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
  
  // Axios configuration with auth token
  const createAxiosConfig = () => {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    return {
      withCredentials: true,
      timeout: 10000,
      headers
    };
  };

  // Check if user is authenticated
  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication...');
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('🔐 No token found, user is not authenticated');
        setUser(null);
        setLoading(false);
        return false;
      }
      
      const config = createAxiosConfig();
      try {
        console.log('🔐 Verifying token with server...');
        const response = await axios.get(`${API_BASE_URL}/api/user`, config);
        
        if (response.data) {
          console.log('✅ User is authenticated:', response.data);
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
          setLoading(false);
          return true;
        }
        
        throw new Error('Invalid user data received');
      } catch (error) {
        console.error('Authentication error:', error);
        if (error.response?.status === 401) {
          console.log('🔐 Token is invalid or expired');
          // Clear invalid token
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          delete axios.defaults.headers.common['Authorization'];
        }
        setUser(null);
        setLoading(false);
        return false;
      }
    } catch (error) {
      console.error('Unexpected error during authentication check:', error);
      setUser(null);
      setLoading(false);
      return false;
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
      // Remove any existing token to ensure we get a fresh one
      localStorage.removeItem('token');
      
      console.log('🔐 Attempting login for user:', username);
      const response = await axios.post(
        `${API_BASE_URL}/api/login`,
        { username, password },
        config
      );
      
      console.log('🔑 Login response:', response.data);
      
      const { user: userData, token } = response.data;
      
      if (!token || !userData) {
        throw new Error('Invalid response from server');
      }
      
      // Store the token and update axios defaults
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Fetch fresh user data using the token
      const userResponse = await axios.get(`${API_BASE_URL}/api/user`, config);
      if (!userResponse.data) {
        throw new Error('Failed to fetch user data after login');
      }
      
      // Update user state and local storage
      const user = userResponse.data;
      setUser(user);
      localStorage.setItem('user', JSON.stringify(user));
      
      console.log('✅ Login successful, user data:', user);
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      // Clear any partial auth data on error
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
      
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed. Please try again.'
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