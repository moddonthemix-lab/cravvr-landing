import React, { createContext, useContext, useState, useCallback } from 'react';
import ConfirmModal from '../components/common/ConfirmModal';

/**
 * ConfirmContext - Provides a Promise-based confirmation dialog
 *
 * Usage:
 *   const { confirm } = useConfirm();
 *
 *   const handleDelete = async () => {
 *     const confirmed = await confirm({
 *       title: 'Delete Item?',
 *       message: 'This action cannot be undone.',
 *       confirmText: 'Delete',
 *       variant: 'danger'
 *     });
 *
 *     if (confirmed) {
 *       // User confirmed, proceed with deletion
 *     }
 *   };
 */

const ConfirmContext = createContext({});

export const ConfirmProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState({
    title: 'Confirm',
    message: 'Are you sure?',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    variant: 'default',
  });
  const [resolvePromise, setResolvePromise] = useState(null);

  /**
   * Show confirmation dialog and return a Promise<boolean>
   * @param {Object} opts - Configuration options
   * @param {string} opts.title - Modal title
   * @param {string} opts.message - Modal message
   * @param {string} opts.confirmText - Confirm button text
   * @param {string} opts.cancelText - Cancel button text
   * @param {string} opts.variant - 'default' or 'danger'
   * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
   */
  const confirm = useCallback((opts = {}) => {
    return new Promise((resolve) => {
      setOptions({
        title: opts.title || 'Confirm',
        message: opts.message || 'Are you sure?',
        confirmText: opts.confirmText || 'Confirm',
        cancelText: opts.cancelText || 'Cancel',
        variant: opts.variant || 'default',
      });
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(true);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(false);
      setResolvePromise(null);
    }
  }, [resolvePromise]);

  const value = {
    confirm,
  };

  return (
    <ConfirmContext.Provider value={value}>
      {children}
      <ConfirmModal
        isOpen={isOpen}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title={options.title}
        message={options.message}
        confirmText={options.confirmText}
        cancelText={options.cancelText}
        variant={options.variant}
      />
    </ConfirmContext.Provider>
  );
};

/**
 * Hook to use the confirmation dialog
 * @returns {{ confirm: (opts: Object) => Promise<boolean> }}
 */
export const useConfirm = () => {
  const context = useContext(ConfirmContext);
  if (context === undefined) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context;
};

export default ConfirmContext;
