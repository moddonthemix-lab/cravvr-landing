import { supabase } from '../lib/supabase';

/**
 * Notification types for different roles
 */
export const NOTIFICATION_TYPES = {
  // Customer notifications
  ORDER_CONFIRMED: 'order_confirmed',
  ORDER_STATUS_UPDATE: 'order_status_update',
  ORDER_READY: 'order_ready',
  REVIEW_REPLY: 'review_reply',
  PROMOTION: 'promotion',
  POINTS_EARNED: 'points_earned',

  // Owner notifications
  NEW_ORDER: 'new_order',
  NEW_REVIEW: 'new_review',
  LOW_STOCK_ALERT: 'low_stock_alert',
  DAILY_SUMMARY: 'daily_summary',

  // Admin notifications
  NEW_USER_SIGNUP: 'new_user_signup',
  NEW_TRUCK_REGISTERED: 'new_truck_registered',
  FLAGGED_CONTENT: 'flagged_content',
  SYSTEM_ALERT: 'system_alert',
};

/**
 * Transform raw notification data to app format
 */
export const transformNotification = (notification) => ({
  id: notification.id,
  userId: notification.user_id,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  data: notification.data || {},
  isRead: notification.is_read,
  readAt: notification.read_at,
  createdAt: notification.created_at,
  _raw: notification,
});

/**
 * Create a notification for a user
 */
export const createNotification = async ({ userId, type, title, message, data = {} }) => {
  const { data: notification, error } = await supabase
    .from('notifications')
    .insert([{
      user_id: userId,
      type,
      title,
      message,
      data,
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return transformNotification(notification);
};

/**
 * Create notifications for multiple users (e.g., all admins)
 */
export const createBulkNotifications = async (notifications) => {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notifications.map(n => ({
      user_id: n.userId,
      type: n.type,
      title: n.title,
      message: n.message,
      data: n.data || {},
    })))
    .select();

  if (error) {
    console.error('Error creating bulk notifications:', error);
    throw error;
  }

  return data?.map(transformNotification) || [];
};

/**
 * Fetch notifications for a user
 */
export const fetchNotifications = async (userId, limit = 50) => {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data?.map(transformNotification) || [];
};

/**
 * Get unread notification count for a user
 */
export const getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
};

/**
 * Mark a notification as read
 */
export const markAsRead = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId);

  if (error) throw error;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
};

/**
 * Delete a notification
 */
export const deleteNotification = async (notificationId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) throw error;
};

/**
 * Clear all notifications for a user
 */
export const clearAllNotifications = async (userId) => {
  const { error } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId);

  if (error) throw error;
};

/**
 * Subscribe to real-time notifications for a user
 * Returns the subscription channel for cleanup
 */
export const subscribeToNotifications = (userId, onNewNotification) => {
  const channel = supabase
    .channel(`notifications:${userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onNewNotification(transformNotification(payload.new));
      }
    )
    .subscribe();

  return channel;
};
