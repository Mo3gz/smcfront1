import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import ThemeSelector from './components/ThemeSelector';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

// Use the same logic as API_BASE_URL for socket connection
const SOCKET_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:8080'
  : (process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app');

console.log('🔧 Socket URL:', SOCKET_URL);

// Use the same URL logic as the API
const socket = io(SOCKET_URL, {
  withCredentials: true,
  timeout: 20000, // 20 second timeout for mobile
  transports: ['websocket', 'polling'] // Fallback for mobile browsers
});

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading">
      <div className="spinner"></div>
    </div>
  );
  // Remove hardcoded username check; rely on allowedRoles only
  if (!user || (allowedRoles && !allowedRoles.includes(user.role))) {
    // Redirect to appropriate dashboard if not allowed
    if (user && user.role === 'admin') return <Navigate to="/admin-dashboard" replace />;
    if (user && user.role !== 'admin') return <Navigate to="/user" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

function AppContent() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!user) return;

    const handleConnect = () => {
      socket.emit('join-team', user.id);
    };

    socket.on('connect', handleConnect);

    // Join on mount as well
    socket.emit('join-team', user.id);

    socket.on('scoreboard-update', (scoreboard) => {
      // Handle real-time scoreboard updates
      console.log('Scoreboard updated:', scoreboard);
    });

    socket.on('user-update', (userData) => {
      // Handle user data updates
      console.log('User updated:', userData);
    });

    return () => {
      socket.off('connect', handleConnect);
      socket.off('scoreboard-update');
      socket.off('user-update');
    };
  }, [user]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div>
        <ThemeSelector />
        <Login />
      </div>
    );
  }

  // Debug admin routing
  console.log('🔍 App routing debug:', {
    userId: user.id,
    username: user.username,
    role: user.role,
    isAdmin: user.role === 'admin',
    shouldShowAdmin: user.role === 'admin'
  });

  return (
    <Router>
      <div className="app">
        <Toaster position="top-right" />
        <ThemeSelector />

        <Routes>
          {/* Redirect / to the correct dashboard */}
          <Route path="/" element={<Navigate to={user.role === 'admin' ? '/admin-dashboard' : '/user'} replace />} />

          {/* Admin route, only for admins */}
          <Route 
            path="/admin-dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard socket={socket} />
              </ProtectedRoute>
            }
          />

          {/* User route, only for non-admin users */}
          <Route 
            path="/user" 
            element={
              <ProtectedRoute allowedRoles={['user', 'normal', undefined, null, '']}>
                <UserDashboard socket={socket} />
              </ProtectedRoute>
            }
          />

          {/* Catch-all: redirect to / */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppContent />
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App; 
