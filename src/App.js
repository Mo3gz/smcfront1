import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import { Toaster } from 'react-hot-toast';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import ErrorBoundary from './components/ErrorBoundary';
import DebugInfo from './components/DebugInfo';
import MobileAuthTest from './components/MobileAuthTest';
import IOSCompatibilityGuide from './components/iOSCompatibilityGuide';
import AdminLoginGuide from './components/AdminLoginGuide';
import ConnectivityTest from './components/ConnectivityTest';
import UserStateDebug from './components/UserStateDebug';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

const socket = io('smcback-production-0e51.up.railway.app', {
  withCredentials: true,
  timeout: 20000, // 20 second timeout for mobile
  transports: ['websocket', 'polling'] // Fallback for mobile browsers
});

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return null;
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
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      socket.emit('join-team', user.id);
    }

    socket.on('notification', (notification) => {
      const notificationWithId = { ...notification, _id: Date.now() + Math.random() };
      setNotifications(prev => [...prev, notificationWithId]);
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n._id !== notificationWithId._id));
      }, 5000);
    });

    socket.on('scoreboard-update', (scoreboard) => {
      // Handle real-time scoreboard updates
      console.log('Scoreboard updated:', scoreboard);
    });

    socket.on('user-update', (userData) => {
      // Handle user data updates
      console.log('User updated:', userData);
    });

    return () => {
      socket.off('notification');
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
    return <Login />;
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
        {notifications.map((notification) => (
          <div key={notification._id} className="notification">
            {notification.message}
          </div>
        ))}

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
        
        {/* Debug component for troubleshooting mobile issues */}
        <DebugInfo />
        
        {/* Mobile authentication test component */}
        <MobileAuthTest />
        
        {/* iOS compatibility guide */}
        <IOSCompatibilityGuide />
        
        {/* Admin login guide */}
        <AdminLoginGuide />
        
        {/* Connectivity test */}
        <ConnectivityTest />
        
        {/* User state debug */}
        <UserStateDebug />
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
