import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import io from 'socket.io-client';
import { Toaster, toast } from 'react-hot-toast';
import Login from './components/Login';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

const socket = io('https://smcback-production-6d12.up.railway.app', {
  withCredentials: true
});

function AppContent() {
  const { user, loading } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user) {
      socket.emit('join-team', user.id);
    }

    socket.on('notification', (notification) => {
      setNotifications(prev => [...prev, notification]);
      toast.success(notification.message);
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
        
        {notifications.map((notification, index) => (
          <div key={index} className="notification">
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
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 
