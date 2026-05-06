import React, { useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Icons } from '../../../components/common/Icons';
import { useToast } from '../../../contexts/ToastContext';
import { useTruckAdmin } from '../hooks/useTruckAdmin';
import OwnerReassignModal from '../components/OwnerReassignModal';

const UNDO_MS = 10000;

const DangerZone = () => {
  const { truck, refetch } = useOutletContext();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { softDelete, restore, suspend, busy } = useTruckAdmin();
  const [showReassign, setShowReassign] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null); // { reason, timer }
  const undoRef = useRef(false);

  const handleSoftDelete = () => {
    const reason = window.prompt('Reason for deleting this truck (audit log):');
    if (reason === null) return;
    undoRef.current = false;
    showToast('Deleting in 10s — click here to undo', 'info');
    const timer = setTimeout(async () => {
      if (undoRef.current) return;
      try {
        await softDelete(truck.id, reason);
        navigate('/admin/trucks');
      } catch (e) { /* toasted */ }
      setPendingDelete(null);
    }, UNDO_MS);
    setPendingDelete({ reason, timer });
  };

  const cancelPending = () => {
    if (!pendingDelete) return;
    undoRef.current = true;
    clearTimeout(pendingDelete.timer);
    setPendingDelete(null);
    showToast('Delete cancelled', 'success');
  };

  const handleSuspend = async () => {
    const reason = window.prompt('Reason for suspension (visible in audit log):');
    if (!reason) return;
    await suspend(truck.id, reason);
    refetch();
  };

  const handleRestore = async () => {
    await restore(truck.id, 'restored from danger zone');
    refetch();
  };

  return (
    <div className="admin-tab-form">
      <h2>Danger zone</h2>

      <section className="danger-section">
        <h3>Suspend</h3>
        <p className="cell-sub">Hides the truck from public listings. Reversible.</p>
        {truck.suspended_at ? (
          <p>
            <span className="admin-badge admin-badge-warning">Suspended</span>{' '}
            {truck.suspension_reason && <span className="cell-sub">— {truck.suspension_reason}</span>}
          </p>
        ) : null}
        <div className="form-actions">
          {!truck.suspended_at ? (
            <button type="button" className="btn-secondary danger" disabled={busy} onClick={handleSuspend}>
              Suspend truck
            </button>
          ) : (
            <button type="button" className="btn-secondary" disabled={busy} onClick={handleRestore}>
              Lift suspension
            </button>
          )}
        </div>
      </section>

      <section className="danger-section">
        <h3>Transfer ownership</h3>
        <p className="cell-sub">Reassign this truck to a different owner profile.</p>
        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={() => setShowReassign(true)} disabled={busy}>
            Reassign owner
          </button>
        </div>
      </section>

      <section className="danger-section">
        <h3>Soft delete</h3>
        <p className="cell-sub">Hides the truck everywhere; recoverable from Trash for 30 days.</p>
        {truck.deleted_at ? (
          <>
            <p><span className="admin-badge admin-badge-danger">Deleted</span> on {new Date(truck.deleted_at).toLocaleString()}</p>
            <div className="form-actions">
              <button type="button" className="btn-primary" disabled={busy} onClick={handleRestore}>
                Restore from trash
              </button>
            </div>
          </>
        ) : pendingDelete ? (
          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={cancelPending}>
              {Icons.x} Undo delete (10s)
            </button>
          </div>
        ) : (
          <div className="form-actions">
            <button type="button" className="btn-primary danger" disabled={busy} onClick={handleSoftDelete}>
              {Icons.trash} Delete truck
            </button>
          </div>
        )}
      </section>

      {showReassign && (
        <OwnerReassignModal
          truck={truck}
          onClose={() => setShowReassign(false)}
          onTransferred={refetch}
        />
      )}
    </div>
  );
};

export default DangerZone;
