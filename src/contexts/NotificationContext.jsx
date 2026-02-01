import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { useToast } from './ToastContext';
import {
  fetchNotifications,
  getUnreadCount,
  markAsRead as markAsReadService,
  markAllAsRead as markAllAsReadService,
  deleteNotification as deleteNotificationService,
  clearAllNotifications,
  subscribeToNotifications,
} from '../services/notifications';

const NotificationContext = createContext({});

export const NotificationProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Fetch notifications from database
  const loadNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const data = await fetchNotifications(user.id, 50);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Handle new notification from real-time subscription
  const handleNewNotification = useCallback((notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show toast for new notification
    showToast(notification.title, 'info');
  }, [showToast]);

  // Subscribe to real-time notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = subscribeToNotifications(user.id, handleNewNotification);

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id, handleNewNotification]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      await markAsReadService(notificationId);

      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    try {
      await markAllAsReadService(user.id);

      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all as read:', err);
    }
  }, [user?.id]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const notification = notifications.find(n => n.id === notificationId);

      await deleteNotificationService(notificationId);

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (notification && !notification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  }, [notifications]);

  // Clear all notifications
  const clearAll = useCallback(async () => {
    if (!user?.id) return;

    try {
      await clearAllNotifications(user.id);

      setNotifications([]);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  }, [user?.id]);

  // Open/close notification panel
  const openPanel = useCallback(() => setIsOpen(true), []);
  const closePanel = useCallback(() => setIsOpen(false), []);
  const togglePanel = useCallback(() => setIsOpen(prev => !prev), []);

  // Fetch on mount and user change
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, loadNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    isOpen,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    openPanel,
    closePanel,
    togglePanel,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
