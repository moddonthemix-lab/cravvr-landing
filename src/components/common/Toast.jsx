import React, { useEffect, useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Icons } from './Icons';

// Toast notification container and items
const ToastContainer = () => {
  const { toasts, dismissToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div
      className="toast-container"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
    >
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
};

// Individual toast item with animation
const ToastItem = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Trigger enter animation
    const enterTimeout = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(enterTimeout);
  }, []);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(onDismiss, 200); // Wait for exit animation
  };

  // Get icon based on toast type
  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return Icons.checkCircle;
      case 'error':
        return Icons.alertCircle;
      case 'warning':
        return Icons.alertCircle;
      case 'info':
      default:
        return Icons.info;
    }
  };

  return (
    <div
      className={`toast toast-${toast.type} ${isVisible ? 'toast-visible' : ''} ${isExiting ? 'toast-exiting' : ''}`}
      role="alert"
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
    >
      <span className="toast-icon">
        {getIcon()}
      </span>
      <span className="toast-message">{toast.message}</span>
      <button
        className="toast-close"
        onClick={handleDismiss}
        aria-label="Dismiss notification"
      >
        {Icons.x}
      </button>
    </div>
  );
};

export default ToastContainer;
