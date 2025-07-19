import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://smcback-production-0e51.up.railway.app';

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/notifications`, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      setNotifications(response.data);
      const unread = response.data.filter(n => !n.read).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [API_BASE_URL]);

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.post(`${API_BASE_URL}/api/notifications/${notificationId}/read`, {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
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
      await axios.post(`${API_BASE_URL}/api/notifications/read-all`, {}, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
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
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, color: '#333' }}>🔔 Notifications</h2>
          <button 
            onClick={() => setIsVisible(false)}
            style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#666' }}
          >
            ×
          </button>
        </div>

        {unreadCount > 0 && (
          <div style={{ marginBottom: '16px' }}>
            <button
              onClick={markAllAsRead}
              style={{
                background: '#4caf50',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
            >
              Mark All as Read
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            Loading notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📭</div>
            <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>No notifications</h3>
            <p style={{ margin: 0, fontSize: '14px' }}>You're all caught up!</p>
          </div>
        ) : (
          <div style={{ maxHeight: '400px', overflow: 'auto' }}>
            {notifications.map((notification) => (
              <div
                key={notification.id}
                style={{
                  padding: '16px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  background: notification.read ? '#fafafa' : '#fff',
                  borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                  cursor: notification.read ? 'default' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => !notification.read && markAsRead(notification.id)}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', flex: 1 }}>
                    <span style={{ fontSize: '20px', marginRight: '12px' }}>
                      {getNotificationIcon(notification.type)}
                    </span>
                    <div style={{ flex: 1 }}>
                      <p style={{ 
                        margin: '0 0 4px 0', 
                        color: notification.read ? '#666' : '#333',
                        fontWeight: notification.read ? 'normal' : 'bold',
                        fontSize: '14px',
                        lineHeight: '1.4'
                      }}>
                        {notification.message}
                      </p>
                      <span style={{ 
                        fontSize: '12px', 
                        color: '#999',
                        display: 'block'
                      }}>
                        {formatTime(notification.timestamp)}
                      </span>
                    </div>
                  </div>
                  {!notification.read && (
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: '#ff4757',
                      marginLeft: '12px'
                    }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default Notifications; 