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

  // Debug user state changes
  useEffect(() => {
    console.log('🔍 User state changed:', user);
  }, [user]);

  // Simple axios configuration
  const createAxiosConfig = () => ({
    withCredentials: true,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    }
  });

  // Check if user is authenticated - Enhanced for Safari (iOS + macOS)
  const checkAuth = useCallback(async () => {
    try {
      console.log('🔍 Checking authentication...');
      
      // Enhanced Safari detection for both iOS and macOS
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isMacOS = /Mac OS X/.test(userAgent);
      const isSafariOnIOS = isSafari && isIOS;
      const isSafariOnMacOS = isSafari && isMacOS;
      
      console.log('🔍 Browser detection:', { 
        isSafari, 
        isIOS, 
        isMacOS, 
        isSafariOnIOS, 
        isSafariOnMacOS, 
        userAgent: userAgent 
      });
      
      // Enhanced config for Safari (iOS + macOS) compatibility
      const config = {
        ...createAxiosConfig(),
        headers: {
          ...createAxiosConfig().headers,
        }
      };
      
      // For Safari, try multiple token sources
      if (isSafari) {
        const token = localStorage.getItem('authToken') || 
                     localStorage.getItem('token') || 
                     localStorage.getItem('safariToken') ||
                     sessionStorage.getItem('authToken');
        
        if (token) {
          config.headers['x-auth-token'] = token;
          config.headers['Authorization'] = `Bearer ${token}`;
          console.log('🔍 Safari token found and added to headers');
        } else {
          console.log('🔍 No Safari token found in any storage');
        }
      } else {
        // For other browsers, use standard approach
        if (localStorage.getItem('authToken')) {
          config.headers['x-auth-token'] = localStorage.getItem('authToken');
        }
      }
      
      // Use Safari-specific endpoint if detected
      const endpoint = isSafari ? '/api/safari/auth/me' : '/api/user';
      console.log('🔍 Using endpoint:', endpoint);
      
      const response = await axios.get(`${API_BASE_URL}${endpoint}`, config);
      console.log('🔍 Auth check response:', response.data);
      
      // Handle different response formats
      let userData;
      if (response.data.user) {
        // Backend returns { user: {...} }
        userData = response.data.user;
      } else if (response.data.id || response.data.username) {
        // Backend returns user object directly
        userData = response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
      
      console.log('🔍 Processed user data:', userData);
      setUser(userData);
    } catch (error) {
      let errorMessage = 'Unknown error';
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Token expired or invalid. Please log in again.';
          // Clear stored tokens on auth failure
          localStorage.removeItem('authToken');
          localStorage.removeItem('user');
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

  // Enhanced login function with better error handling - Safari (iOS + macOS) compatible
  const login = async (username, password) => {
    try {
      console.log('🔐 Attempting login for:', username);
      
      // Enhanced Safari detection
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const isIOS = /iPad|iPhone|iPod/.test(userAgent);
      const isMacOS = /Mac OS X/.test(userAgent);
      
      console.log('🔐 Browser detection for login:', { isSafari, isIOS, isMacOS });
      
      // Use Safari-specific endpoint if Safari is detected
      const endpoint = isSafari ? '/api/safari/login' : '/api/login';
      console.log('🔐 Using login endpoint:', endpoint);
      
      const config = createAxiosConfig();
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, {
        username,
        password
      }, config);
      
      console.log('🔐 Login response:', response.data);
      
      // Handle different response formats
      let userData;
      if (response.data.user) {
        // Backend returns { user: {...} }
        userData = response.data.user;
      } else if (response.data.id || response.data.username) {
        // Backend returns user object directly
        userData = response.data;
      } else {
        throw new Error('Invalid response format from server');
      }
      
      console.log('🔐 Processed user data:', userData);
      
      // Store token in localStorage for Safari (iOS + macOS) compatibility
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
        console.log('🔐 Token stored in localStorage for Safari compatibility');
        
        // For Safari, also set the token in sessionStorage as backup
        if (isSafari) {
          sessionStorage.setItem('authToken', response.data.token);
          console.log('🔐 Token also stored in sessionStorage for Safari');
          
          // Also store in multiple localStorage keys for Safari
          localStorage.setItem('token', response.data.token);
          localStorage.setItem('safariToken', response.data.token);
          console.log('🔐 Token stored in multiple localStorage keys for Safari');
        }
      }
      
      // Set user in state and localStorage
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Add a small delay to ensure state is properly set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Verify the user data is properly set
      console.log('🔐 Current user state after login:', userData);
      
      return { success: true, user: userData };
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

  // Logout function - Enhanced for Safari (iOS + macOS)
  const logout = async () => {
    // Enhanced Safari detection - moved to top level for scope access
    const userAgent = navigator.userAgent;
    const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
    const isIOS = /iPad|iPhone|iPod/.test(userAgent);
    const isMacOS = /Mac OS X/.test(userAgent);
    
    console.log('🚪 Browser detection for logout:', { isSafari, isIOS, isMacOS });
    
    try {
      console.log('🚪 Starting logout process...');
      
      // Use Safari-specific logout endpoint if Safari is detected
      const logoutEndpoint = isSafari ? '/api/safari/logout' : '/api/logout';
      console.log('🚪 Using logout endpoint:', logoutEndpoint);
      
      const config = createAxiosConfig();
      await axios.post(`${API_BASE_URL}${logoutEndpoint}`, {}, config);
      
      console.log('✅ Backend logout successful');
    } catch (error) {
      console.error('❌ Backend logout error:', error);
      // Continue with frontend cleanup even if backend fails
    } finally {
      // Clear all possible stored data
      setUser(null);
      
      // Clear localStorage (Safari-specific keys)
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('token');
      localStorage.removeItem('safariToken');
      
      // Clear sessionStorage (especially important for Safari)
      sessionStorage.clear();
      
      // Clear any cached axios headers
      delete axios.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['x-auth-token'];
      
      console.log('✅ Frontend logout cleanup completed');
      
      // For Safari, force a complete page reload to ensure clean state
      if (isSafari) {
        console.log('🦁 Safari detected - forcing page reload');
        window.location.reload();
      } else {
        // For other browsers, redirect to home
        window.location.href = '/';
      }
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