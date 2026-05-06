import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Icons } from './Icons';
import './ConfirmModal.css';

/**
 * ConfirmModal - A reusable confirmation dialog to replace window.confirm()
 * and window.prompt(). Pass `inputLabel` to switch into prompt mode; the
 * confirmed input string is delivered via onConfirm(value).
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
  inputLabel = null,
  inputPlaceholder = '',
  inputRequired = false,
}) => {
  const modalRef = useRef(null);
  const confirmButtonRef = useRef(null);
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) setInputValue('');
  }, [isOpen]);

  const canSubmit = !inputLabel || !inputRequired || inputValue.trim().length > 0;
  const submit = useCallback(() => {
    if (!canSubmit) return;
    onConfirm(inputLabel ? inputValue.trim() : undefined);
  }, [canSubmit, inputLabel, inputValue, onConfirm]);

  // Handle keyboard events
  const handleKeyDown = useCallback((e) => {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }, [isOpen, onClose, submit]);

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
      setTimeout(() => {
        if (inputLabel && inputRef.current) inputRef.current.focus();
        else confirmButtonRef.current?.focus();
      }, 100);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown, inputLabel]);

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

        {/* Optional input (prompt mode) */}
        {inputLabel && (
          <div className="confirm-modal-input-group">
            <label className="confirm-modal-input-label" htmlFor="confirm-modal-input">
              {inputLabel}{inputRequired ? ' *' : ''}
            </label>
            <input
              id="confirm-modal-input"
              ref={inputRef}
              type="text"
              className="confirm-modal-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={inputPlaceholder}
            />
          </div>
        )}

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
            onClick={submit}
            disabled={!canSubmit}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
