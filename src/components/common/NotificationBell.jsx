import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../auth/AuthContext';
import { Icons } from './Icons';
import { formatRelativeTime } from '../../utils/formatters';
import './NotificationBell.css';

const NotificationBell = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    isOpen,
    loading,
    togglePanel,
    closePanel,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const panelRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close on outside click (desktop only)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!isMobile && panelRef.current && !panelRef.current.contains(event.target)) {
        closePanel();
      }
    };

    if (isOpen && !isMobile) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closePanel, isMobile]);

  // Handle notification click
  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);

    // Navigate based on notification type
    switch (notification.type) {
      case 'order_status_update':
      case 'order_confirmed':
      case 'order_ready':
        navigate('/profile?tab=orders');
        break;
      case 'new_order':
        navigate('/owner?tab=orders');
        break;
      case 'new_review':
        navigate('/owner?tab=trucks');
        break;
      case 'review_reply':
        if (notification.data?.truckId) {
          navigate(`/truck/${notification.data.truckId}`);
        }
        break;
      case 'new_user_signup':
      case 'new_truck_registered':
        navigate('/admin?tab=dashboard');
        break;
      default:
        break;
    }

    closePanel();
  };

  // Get icon for notification type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'order_status_update':
      case 'order_confirmed':
      case 'order_ready':
      case 'new_order':
        return Icons.orders || Icons.shoppingBag;
      case 'new_review':
      case 'review_reply':
        return Icons.star;
      case 'promotion':
        return Icons.gift;
      case 'points_earned':
        return Icons.ticket;
      case 'new_user_signup':
        return Icons.user;
      case 'new_truck_registered':
        return Icons.truck;
      default:
        return Icons.bell;
    }
  };

  if (!user) return null;

  return (
    <div className="notification-bell-container" ref={panelRef}>
      <button
        className="notification-bell-btn"
        onClick={togglePanel}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        {Icons.bell}
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Mobile overlay */}
          {isMobile && (
            <div className="notification-overlay" onClick={closePanel} />
          )}

          <div className={`notification-panel ${isMobile ? 'mobile' : ''}`}>
            <div className="notification-panel-header">
              <h3>Notifications</h3>
              <div className="notification-header-actions">
                {unreadCount > 0 && (
                  <button
                    className="mark-all-read-btn"
                    onClick={markAllAsRead}
                  >
                    Mark all read
                  </button>
                )}
                {isMobile && (
                  <button className="close-panel-btn" onClick={closePanel}>
                    {Icons.x}
                  </button>
                )}
              </div>
            </div>

            <div className="notification-list">
              {loading ? (
                <div className="notification-loading">
                  {Icons.loader}
                  <span>Loading...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="notification-empty">
                  <span className="empty-icon">{Icons.bell}</span>
                  <p>No notifications yet</p>
                  <span className="empty-hint">We'll let you know when something happens</span>
                </div>
              ) : (
                notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="notification-icon">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="notification-content">
                      <p className="notification-title">{notification.title}</p>
                      <p className="notification-message">{notification.message}</p>
                      <span className="notification-time">
                        {formatRelativeTime(notification.createdAt)}
                      </span>
                    </div>
                    <button
                      className="notification-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      aria-label="Delete notification"
                    >
                      {Icons.x}
                    </button>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 10 && (
              <div className="notification-panel-footer">
                <button onClick={() => { navigate('/notifications'); closePanel(); }}>
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
