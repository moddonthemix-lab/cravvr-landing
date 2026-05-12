import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../auth/AuthContext';
import { Icons } from './Icons';
import { formatRelativeTime } from '../../utils/formatters';
import { cn } from '@/lib/utils';

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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
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
      case 'system_alert': {
        const truckId = notification.data?.truck_id;
        if (truckId) navigate(`/owner?truckId=${truckId}`);
        else navigate('/owner');
        break;
      }
      case 'flagged_content': {
        const truckId = notification.data?.truck_id;
        if (truckId) navigate(`/owner?truckId=${truckId}&tab=trucks`);
        else navigate('/owner');
        break;
      }
      default:
        break;
    }
    closePanel();
  };

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
      case 'system_alert':
        return Icons.alertCircle || Icons.shield || Icons.bell;
      case 'flagged_content':
        return Icons.flag || Icons.alertCircle || Icons.bell;
      default:
        return Icons.bell;
    }
  };

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={togglePanel}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted"
      >
        <span className="h-5 w-5">{Icons.bell}</span>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground tabular-nums">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {isMobile && (
            <div
              className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
              onClick={closePanel}
            />
          )}

          <div
            className={cn(
              'z-50 flex flex-col overflow-hidden border border-border bg-card shadow-lg',
              isMobile
                ? 'fixed inset-x-0 bottom-0 max-h-[80vh] rounded-t-xl animate-in slide-in-from-bottom duration-200'
                : 'absolute right-0 top-[calc(100%+8px)] w-[360px] max-h-[480px] rounded-xl'
            )}
          >
            <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
              <h3 className="text-base font-semibold leading-none">Notifications</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="rounded-md px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                  >
                    Mark all read
                  </button>
                )}
                {isMobile && (
                  <button
                    type="button"
                    onClick={closePanel}
                    aria-label="Close"
                    className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <span className="h-4 w-4">{Icons.x}</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain">
              {loading ? (
                <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-sm text-muted-foreground">
                  <span className="h-5 w-5 animate-spin">{Icons.loader}</span>
                  <span>Loading…</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                  <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                    <span className="h-6 w-6">{Icons.bell}</span>
                  </span>
                  <p className="text-sm font-medium">No notifications yet</p>
                  <span className="mt-1 text-xs text-muted-foreground">
                    We'll let you know when something happens
                  </span>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.slice(0, 10).map((notification) => (
                    <li key={notification.id}>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNotificationClick(notification)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleNotificationClick(notification);
                          }
                        }}
                        className={cn(
                          'group relative flex items-start gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none',
                          !notification.isRead && 'bg-primary/[0.04]'
                        )}
                      >
                        {!notification.isRead && (
                          <span
                            aria-hidden
                            className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-primary"
                          />
                        )}
                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                          <span className="h-4 w-4">{getNotificationIcon(notification.type)}</span>
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold leading-snug text-foreground truncate">
                            {notification.title}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground leading-snug line-clamp-2">
                            {notification.message}
                          </p>
                          <span className="mt-1 block text-[11px] text-muted-foreground/80">
                            {formatRelativeTime(notification.createdAt)}
                          </span>
                        </div>
                        <button
                          type="button"
                          aria-label="Delete notification"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-opacity hover:bg-muted hover:text-foreground md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100"
                        >
                          <span className="h-4 w-4">{Icons.x}</span>
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {notifications.length > 10 && (
              <div className="border-t border-border p-2">
                <button
                  type="button"
                  onClick={() => {
                    navigate('/notifications');
                    closePanel();
                  }}
                  className="w-full rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
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
