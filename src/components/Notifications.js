import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { createMobileAxiosConfig } from '../utils/mobileAuth';

// Add socket.io import if not already present
import io from 'socket.io-client';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-6d12.up.railway.app';

  // Setup socket connection (singleton)
  const [socket] = useState(() => {
    if (window.socket) return window.socket;
    const s = io(API_BASE_URL, { withCredentials: true });
    window.socket = s;
    return s;
  });

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔔 Fetching notifications for user:', user?.id);
      
      const config = createMobileAxiosConfig();
      const response = await axios.get(`${API_BASE_URL}/api/notifications`, config);
      
      console.log('🔔 Notifications response:', response.data);
      setNotifications(response.data);
      const unread = response.data.filter(n => !n.read).length;
      setUnreadCount(unread);
      console.log('🔔 Unread count:', unread);
    } catch (error) {
      console.error('❌ Error fetching notifications:', error);
      console.error('❌ Error details:', error.response?.data);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL, user?.id]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const config = createMobileAxiosConfig();
      await axios.post(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, config);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, read: true, readAt: new Date() } : n
        )
      );
      
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      const config = createMobileAxiosConfig();
      await axios.post(`${API_BASE_URL}/api/notifications/read-all`, {}, config);
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true, readAt: new Date() }))
      );
      
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark notifications as read');
    }
  };

  // Create test notifications
  const createTestNotifications = async () => {
    try {
      const config = createMobileAxiosConfig();
      const response = await axios.post(`${API_BASE_URL}/api/debug/create-test-notifications`, {}, config);
      
      console.log('✅ Test notifications created:', response.data);
      toast.success('Test notifications created!');
      
      // Refresh notifications
      await fetchNotifications();
    } catch (error) {
      console.error('❌ Error creating test notifications:', error);
      toast.error('Failed to create test notifications');
    }
  };

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

  // Get notification icon
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'coins-updated':
        return '💰';
      case 'score-updated':
        return '🏆';
      case 'spin':
        return '🎰';
      case 'country-purchased':
        return '🌍';
      case 'global':
        return '📢';
      default:
        return '📋';
    }
  };

  // Get notification color
  const getNotificationColor = (type) => {
    switch (type) {
      case 'coins-updated':
        return '#4caf50';
      case 'score-updated':
        return '#2196f3';
      case 'spin':
        return '#ff9800';
      case 'country-purchased':
        return '#9c27b0';
      case 'global':
        return '#f44336';
      default:
        return '#607d8b';
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // Listen for real-time notifications and open modal
  useEffect(() => {
    if (!socket || !user) return;
    const handleNotification = (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      setIsVisible(true); // Open modal automatically
      toast.success('New notification received!');
      fetchNotifications(); // Always refresh the full list from backend
    };
    socket.on('notification', handleNotification);
    return () => {
      socket.off('notification', handleNotification);
    };
  }, [socket, user, fetchNotifications]);

  // Refresh notifications when modal is opened
  useEffect(() => {
    if (isVisible && user) {
      console.log('🔔 Modal opened, refreshing notifications...');
      fetchNotifications();
    }
  }, [isVisible, user, fetchNotifications]);

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
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            background: '#ff4757',
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
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 99999,
      padding: '20px',
      background: 'rgba(0, 0, 0, 0.5)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '0',
        width: '90%',
        maxWidth: '500px',
        maxHeight: '90vh',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4)',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
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
                border: '1px solid #eee',
                borderRadius: '8px',
                marginBottom: '12px',
                background: notification.read ? '#f9f9f9' : 'white',
                boxShadow: notification.read ? 'none' : '0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '4px', color: '#333' }}>
                  {notification.type}
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
};

export default Notifications; 