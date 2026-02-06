import React, { useState } from 'react';
import { Icons } from '../common/Icons';

const REJECT_REASONS = [
  'Kitchen is too busy right now',
  'Item(s) are no longer available',
  'Unable to fulfill special requests',
  'Truck is closing soon',
];

const RejectOrderModal = ({ order, onReject, onClose }) => {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleReject = async () => {
    const finalReason = reason === 'custom' ? customReason : reason;
    if (!finalReason) return;

    setSubmitting(true);
    try {
      await onReject(order.id, finalReason);
      onClose();
    } catch (err) {
      console.error('Failed to reject order:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content reject-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Reject Order #{order.order_number}</h3>
          <button className="modal-close" onClick={onClose}>{Icons.x}</button>
        </div>

        <div className="modal-body">
          <p className="reject-warning">This will notify the customer that their order has been rejected.</p>

          <div className="reject-reasons">
            {REJECT_REASONS.map((r) => (
              <label key={r} className={`reason-option ${reason === r ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="reason"
                  value={r}
                  checked={reason === r}
                  onChange={() => setReason(r)}
                />
                <span>{r}</span>
              </label>
            ))}
            <label className={`reason-option ${reason === 'custom' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="reason"
                value="custom"
                checked={reason === 'custom'}
                onChange={() => setReason('custom')}
              />
              <span>Other reason</span>
            </label>
          </div>

          {reason === 'custom' && (
            <textarea
              className="custom-reason-input"
              placeholder="Enter reason..."
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              rows={3}
              autoFocus
            />
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button
            className="btn-danger"
            onClick={handleReject}
            disabled={submitting || (!reason || (reason === 'custom' && !customReason))}
          >
            {submitting ? 'Rejecting...' : 'Reject Order'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectOrderModal;
