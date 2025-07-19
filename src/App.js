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
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

const socket = io('smcback-production-0e51.up.railway.app', {
  withCredentials: true,
  timeout: 20000, // 20 second timeout for mobile
  transports: ['websocket', 'polling'] // Fallback for mobile browsers
});

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
          <Route 
            path="/" 
            element={
              user.role === 'admin' ? 
                <AdminDashboard socket={socket} /> : 
                <UserDashboard socket={socket} />
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Debug component for troubleshooting mobile issues */}
        <DebugInfo />
        
        {/* Mobile authentication test component */}
        <MobileAuthTest />
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
