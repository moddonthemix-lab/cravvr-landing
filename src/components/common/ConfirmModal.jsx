import React, { useEffect, useRef, useCallback } from 'react';
import { Icons } from './Icons';
import './ConfirmModal.css';

/**
 * ConfirmModal - A reusable confirmation dialog to replace window.confirm()
 *
 * @param {boolean} isOpen - Whether the modal is visible
 * @param {function} onClose - Called when modal should close (cancel action)
 * @param {function} onConfirm - Called when user confirms the action
 * @param {string} title - Modal title
 * @param {string} message - Modal message/description
 * @param {string} confirmText - Text for confirm button (default: "Confirm")
 * @param {string} cancelText - Text for cancel button (default: "Cancel")
 * @param {string} variant - 'default' or 'danger' (red confirm button)
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}) => {
  const modalRef = useRef(null);
  const confirmButtonRef = useRef(null);

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm();
    }
  }, [isOpen, onClose, onConfirm]);

  // Handle click outside
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Add/remove keyboard listener
  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the confirm button when modal opens for accessibility
      setTimeout(() => {
        confirmButtonRef.current?.focus();
      }, 100);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="confirm-modal-overlay"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-message"
    >
      <div className="confirm-modal" ref={modalRef}>
        {/* Icon */}
        <div className={`confirm-modal-icon ${variant}`}>
          {variant === 'danger' ? Icons.alertCircle : Icons.info}
        </div>

        {/* Title */}
        <h2 id="confirm-modal-title" className="confirm-modal-title">
          {title}
        </h2>

        {/* Message */}
        <p id="confirm-modal-message" className="confirm-modal-message">
          {message}
        </p>

        {/* Actions */}
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-modal-btn cancel"
            onClick={onClose}
          >
            {cancelText}
          </button>
          <button
            type="button"
            ref={confirmButtonRef}
            className={`confirm-modal-btn confirm ${variant}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
