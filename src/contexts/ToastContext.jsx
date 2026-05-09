import React, { createContext, useContext, useMemo } from 'react';
import { toast as sonnerToast } from 'sonner';

// Drop-in replacement for the previous handwritten toast context. The hook
// surface (showToast / dismissToast / clearToasts) is preserved so the 27
// existing call sites keep working unchanged; under the hood every call
// delegates to Sonner. Mount `<Toaster />` from sonner once at the app root.

const ToastContext = createContext(null);

const showToast = (message, type = 'info') => {
  switch (type) {
    case 'success': return sonnerToast.success(message);
    case 'error': return sonnerToast.error(message);
    case 'warning': return sonnerToast.warning(message);
    case 'info':
    default: return sonnerToast.info(message);
  }
};

const dismissToast = (id) => {
  if (id === undefined) sonnerToast.dismiss();
  else sonnerToast.dismiss(id);
};

const clearToasts = () => sonnerToast.dismiss();

export const ToastProvider = ({ children }) => {
  // Memoised so consumers don't see unstable identity on every parent render.
  const value = useMemo(
    () => ({ showToast, dismissToast, clearToasts, toasts: [] }),
    []
  );
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

export default ToastContext;
