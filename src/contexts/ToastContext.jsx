import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext({});

let toastId = 0;

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  // Add a toast notification
  const showToast = useCallback((message, type = 'info') => {
    const id = ++toastId;
    const toast = {
      id,
      message,
      type, // 'success', 'error', 'info', 'warning'
    };

    setToasts(prev => [...prev, toast]);

    // Auto-dismiss after 3.5 seconds
    setTimeout(() => {
      dismissToast(id);
    }, 3500);

    return id;
  }, []);

  // Dismiss a specific toast
  const dismissToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  // Clear all toasts
  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const value = {
    toasts,
    showToast,
    dismissToast,
    clearToasts,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export default ToastContext;
