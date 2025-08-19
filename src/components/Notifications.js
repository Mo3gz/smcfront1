import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_BASE_URL } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

const Notifications = ({ socket }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      // Safari-specific authentication
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const config = { withCredentials: true };
      
      if (isSafari) {
        const storedUsername = localStorage.getItem('safariUsername');
        if (storedUsername) {
          config.headers = { 'x-username': storedUsername };
          console.log('🦁 Notifications: Adding Safari username:', storedUsername);
        }
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/notifications`, config);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Listen for real-time notifications and open modal
  useEffect(() => {
    if (!socket) return;
    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      if (!isVisible) {
        setUnreadCount(prev => prev + 1);
      }
      setIsVisible(true); // Open modal automatically
      // Custom toast for card-received
      if (notification.type === 'card-received') {
        toast.success('🎴 You received a new card! Check your inventory.', {
          icon: '🎴',
          style: {
            background: '#4facfe',
            color: 'white',
            fontWeight: 'bold',
            fontSize: '16px'
          }
        });
      } else {
        toast.success('New notification received!');
      }
      fetchNotifications(); // Always refresh the full list from backend
    };
    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, fetchNotifications, isVisible]);

  // Refresh notifications when modal is opened
  useEffect(() => {
    if (isVisible && user) {
      console.log('🔔 Modal opened, refreshing notifications...');
      fetchNotifications();
    }
  }, [isVisible, user, fetchNotifications]);

  useEffect(() => {
    if (isVisible && notifications.length > 0) {
      // Mark all as read in state
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
      // Sync with backend
      const userAgent = navigator.userAgent;
      const isSafari = /^((?!chrome|android).)*safari/i.test(userAgent);
      const config = { withCredentials: true };
      
      if (isSafari) {
        const storedUsername = localStorage.getItem('safariUsername');
        if (storedUsername) {
          config.headers = { 'x-username': storedUsername };
        }
      }
      
      axios.post(`${API_BASE_URL}/api/notifications/read-all`, {}, config).catch(() => {});
    }
  }, [isVisible, notifications.length]);

  const modal = (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 999999,
      background: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '0',
        width: '95%',
        maxWidth: '600px',
        minHeight: '350px',
        maxHeight: '90vh',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-start',
        alignItems: 'stretch',
      }}>
        <div style={{ padding: '24px 32px 0 32px' }}>
          <h3 style={{ margin: 0, color: '#333', fontWeight: 'bold', fontSize: '22px' }}>Notifications</h3>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 0 32px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>⏳</div>
              <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>Loading notifications...</h3>
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '60px' }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#333', fontSize: '20px' }}>No notifications</h3>
              <p style={{ margin: 0, fontSize: '16px' }}>You're all caught up!</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div key={notification.id} style={{
                padding: '12px',
                border: notification.type === 'card-received' ? '2px solid #4facfe' : '1px solid #eee',
                borderRadius: '8px',
                marginBottom: '12px',
                background: notification.read ? '#f9f9f9' : 'white',
                boxShadow: notification.read ? 'none' : '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#333', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {notification.type}
                  {notification.type === 'card-received' && (
                    <span style={{
                      background: '#4facfe',
                      color: 'white',
                      borderRadius: '6px',
                      padding: '2px 8px',
                      fontSize: '11px',
                      fontWeight: 700,
                      marginLeft: '8px'
                    }}>New Card</span>
                  )}
                </div>
                <div style={{ fontSize: '14px', color: '#666', marginBottom: '4px' }}>
                  {notification.message}
                </div>
                <div style={{ fontSize: '12px', color: '#999' }}>
                  {formatTime(notification.timestamp)}
                </div>
              </div>
            ))
          )}
        </div>
        <div style={{ padding: '24px 32px', textAlign: 'center' }}>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '14px 32px',
              cursor: 'pointer',
              fontSize: '16px',
              fontWeight: 'bold',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.background = '#5a6fd8'}
            onMouseLeave={(e) => e.target.style.background = '#667eea'}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
  if (!isVisible) {
    return (
      <button 
        onClick={() => setIsVisible(true)}
        style={{
          background: unreadCount > 0 ? '#ff4757' : '#667eea',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          position: 'relative',
          marginRight: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        title={`${unreadCount} unread notifications`}
      >
        🔔
        <span style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          background: unreadCount > 0 ? '#ff4757' : '#667eea',
          color: 'white',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}>
          {isVisible ? 0 : (unreadCount > 99 ? '99+' : unreadCount)}
        </span>
      </button>
    );
  }
  return ReactDOM.createPortal(modal, document.body);
};

export default Notifications; 