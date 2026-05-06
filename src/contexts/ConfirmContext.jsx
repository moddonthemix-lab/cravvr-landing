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

const DEFAULT_OPTIONS = {
  title: 'Confirm',
  message: 'Are you sure?',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  variant: 'default',
  inputLabel: null,
  inputPlaceholder: '',
  inputRequired: false,
};

export const ConfirmProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [resolvePromise, setResolvePromise] = useState(null);

  const open = useCallback((opts) => {
    setOptions({ ...DEFAULT_OPTIONS, ...opts });
    return new Promise((resolve) => {
      setResolvePromise(() => resolve);
      setIsOpen(true);
    });
  }, []);

  /**
   * Show confirmation dialog. Returns Promise<boolean>.
   */
  const confirm = useCallback((opts = {}) => open({ ...opts, inputLabel: null }), [open]);

  /**
   * Show confirmation dialog with a text input. Returns Promise<string|null>.
   * Resolves to the input string on confirm, or null on cancel.
   */
  const prompt = useCallback((opts = {}) => open({
    ...opts,
    inputLabel: opts.inputLabel || 'Reason',
    inputRequired: opts.inputRequired !== false,
  }), [open]);

  const handleConfirm = useCallback((value) => {
    setIsOpen(false);
    if (resolvePromise) {
      // For prompt: resolve with the input value; for confirm: resolve true.
      resolvePromise(options.inputLabel ? value : true);
      setResolvePromise(null);
    }
  }, [resolvePromise, options.inputLabel]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    if (resolvePromise) {
      resolvePromise(options.inputLabel ? null : false);
      setResolvePromise(null);
    }
  }, [resolvePromise, options.inputLabel]);

  const value = { confirm, prompt };

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
        inputLabel={options.inputLabel}
        inputPlaceholder={options.inputPlaceholder}
        inputRequired={options.inputRequired}
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
