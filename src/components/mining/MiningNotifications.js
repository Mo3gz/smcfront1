import React, { useState, useEffect } from 'react';
import { List, Badge, Button, Empty, notification, Spin, Tooltip } from 'antd';
import { 
  BellOutlined, 
  CheckOutlined, 
  ClockCircleOutlined,
  CloseOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import axios from 'axios';
import './MiningStyles.css';

const MiningNotifications = ({ onClose }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  useEffect(() => {
    fetchNotifications();
    // Set up interval to check for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/api/mining/notifications');
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to load notifications. Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      setMarkingAsRead(true);
      await axios.put(`/api/mining/notifications/read/${notificationId}`);
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(n =>
          n._id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setMarkingAsRead(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAsRead(true);
      
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.isRead);
      await Promise.all(
        unreadNotifications.map(n => 
          axios.put(`/api/mining/notifications/read/${n._id}`)
        )
      );
      
      // Update local state
      setNotifications(prevNotifications =>
        prevNotifications.map(n => ({
          ...n,
          isRead: true
        }))
      );
      
      notification.success({
        message: 'Marked all as read',
        description: 'All notifications have been marked as read.'
      });
    } catch (error) {
      console.error('Error marking all as read:', error);
      notification.error({
        message: 'Error',
        description: 'Failed to mark notifications as read. Please try again.'
      });
    } finally {
      setMarkingAsRead(false);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.isRead) {
      markAsRead(notification._id);
    }
    
    // Handle notification action if needed
    // For example, navigate to a specific page or show a modal
    if (notification.data?.type === 'mining_complete') {
      // Handle mining complete action
      console.log('Mining complete notification clicked:', notification);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'mining_complete':
        return <ClockCircleOutlined className="notification-icon mining-complete" />;
      case 'admin_alert':
        return <ExclamationCircleOutlined className="notification-icon admin-alert" />;
      default:
        return <BellOutlined className="notification-icon default" />;
    }
  };

  const formatTimeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now - date) / 1000);
    
    let interval = Math.floor(seconds / 31536000);
    if (interval > 1) return `${interval} years ago`;
    if (interval === 1) return '1 year ago';
    
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) return `${interval} months ago`;
    if (interval === 1) return '1 month ago';
    
    interval = Math.floor(seconds / 86400);
    if (interval > 1) return `${interval} days ago`;
    if (interval === 1) return '1 day ago';
    
    interval = Math.floor(seconds / 3600);
    if (interval > 1) return `${interval} hours ago`;
    if (interval === 1) return '1 hour ago';
    
    interval = Math.floor(seconds / 60);
    if (interval > 1) return `${interval} minutes ago`;
    if (interval === 1) return '1 minute ago';
    
    return 'just now';
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="mining-notifications">
      <div className="notifications-header">
        <div className="header-title">
          <BellOutlined />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <Badge count={unreadCount} style={{ marginLeft: 8 }} />
          )}
        </div>
        <div className="header-actions">
          <Button 
            type="text" 
            size="small" 
            onClick={markAllAsRead}
            disabled={unreadCount === 0 || markingAsRead}
            loading={markingAsRead}
          >
            Mark all as read
          </Button>
          <Button 
            type="text" 
            size="small" 
            icon={<CloseOutlined />} 
            onClick={onClose}
          />
        </div>
      </div>
      
      <div className="notifications-list">
        {loading ? (
          <div className="loading-container">
            <Spin size="large" />
          </div>
        ) : notifications.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No notifications yet"
            className="empty-notifications"
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={notifications}
            renderItem={item => (
              <List.Item
                className={`notification-item ${!item.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(item)}
              >
                <div className="notification-content">
                  <div className="notification-icon-wrapper">
                    {getNotificationIcon(item.type)}
                  </div>
                  <div className="notification-body">
                    <div className="notification-message">
                      <span className="notification-title">{item.title}</span>
                      <span className="notification-text">{item.message}</span>
                      
                      {item.data?.amount && (
                        <div className="notification-detail">
                          <span className="detail-label">Amount:</span>
                          <span className="detail-value">
                            {parseFloat(item.data.amount).toFixed(6)} coins
                          </span>
                        </div>
                      )}
                      
                      {item.data?.duration && (
                        <div className="notification-detail">
                          <span className="detail-label">Duration:</span>
                          <span className="detail-value">
                            {parseFloat(item.data.duration).toFixed(2)} hours
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="notification-meta">
                      <span className="notification-time">
                        {formatTimeAgo(item.createdAt)}
                      </span>
                      {!item.isRead && (
                        <Tooltip title="Mark as read">
                          <Button 
                            type="text" 
                            size="small" 
                            icon={<CheckOutlined />} 
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(item._id);
                            }}
                            className="mark-as-read-btn"
                          />
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </div>
              </List.Item>
            )}
          />
        )}
      </div>
      
      <div className="notifications-footer">
        <Button 
          type="text" 
          size="small" 
          icon={<DeleteOutlined />}
          disabled={notifications.length === 0}
          onClick={() => {
            // TODO: Implement clear all notifications
            notification.info({
              message: 'Clear All',
              description: 'This feature will be implemented soon.'
            });
          }}
        >
          Clear All
        </Button>
      </div>
    </div>
  );
};

export default MiningNotifications;
