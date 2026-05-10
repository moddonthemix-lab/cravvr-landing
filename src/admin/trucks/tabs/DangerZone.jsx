import React, { useRef, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Icons } from '../../../components/common/Icons';
import { useToast } from '../../../contexts/ToastContext';
import { useConfirm } from '../../../contexts/ConfirmContext';
import { useAuth } from '../../../components/auth/AuthContext';
import { useTruckAdmin } from '../hooks/useTruckAdmin';
import OwnerReassignModal from '../components/OwnerReassignModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const UNDO_MS = 10000;

const DangerSection = ({ title, hint, children }) => (
  <Card className="border-destructive/30">
    <CardContent className="p-5 space-y-3">
      <div>
        <h3 className="text-base font-bold text-destructive">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </div>
      {children}
    </CardContent>
  </Card>
);

const DangerZone = () => {
  const { truck, refetch } = useOutletContext();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { prompt } = useConfirm();
  const { softDelete, restore, suspend, busy } = useTruckAdmin();
  const { hasAdminPermission } = useAuth();
  const canSuspend = hasAdminPermission('truck.suspend');
  const canDelete = hasAdminPermission('truck.delete');
  const canTransfer = hasAdminPermission('truck.transfer_owner');
  const [showReassign, setShowReassign] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const undoRef = useRef(false);

  const handleSoftDelete = async () => {
    const reason = await prompt({
      title: 'Delete truck',
      message: 'This soft-deletes the truck. It will be hard-deleted in 30 days unless restored.',
      confirmText: 'Delete',
      variant: 'danger',
      inputLabel: 'Reason (audit log)',
      inputPlaceholder: 'e.g. owner request, fraudulent listing',
    });
    if (!reason) return;
    undoRef.current = false;
    showToast('Deleting in 10s — click Undo to cancel', 'info');
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
    const reason = await prompt({
      title: 'Suspend truck',
      message: 'Hides the truck from public listings. Reversible.',
      confirmText: 'Suspend',
      variant: 'danger',
      inputLabel: 'Reason (visible in audit log)',
    });
    if (!reason) return;
    await suspend(truck.id, reason);
    refetch();
  };

  const handleRestore = async () => {
    await restore(truck.id, 'restored from danger zone');
    refetch();
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6 space-y-5">
      <h2 className="text-xl font-bold tracking-tight">Danger zone</h2>

      {canSuspend && (
        <DangerSection
          title="Suspend"
          hint="Hides the truck from public listings. Reversible."
        >
          {truck.suspended_at && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="warning">Suspended</Badge>
              {truck.suspension_reason && (
                <span className="text-xs text-muted-foreground">— {truck.suspension_reason}</span>
              )}
            </div>
          )}
          <div className="flex justify-end">
            {!truck.suspended_at ? (
              <Button
                variant="outline"
                disabled={busy}
                onClick={handleSuspend}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/30"
              >
                Suspend truck
              </Button>
            ) : (
              <Button variant="outline" disabled={busy} onClick={handleRestore}>
                Lift suspension
              </Button>
            )}
          </div>
        </DangerSection>
      )}

      {canTransfer && (
        <DangerSection
          title="Transfer ownership"
          hint="Reassign this truck to a different owner profile."
        >
          <div className="flex justify-end">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setShowReassign(true)}
            >
              Reassign owner
            </Button>
          </div>
        </DangerSection>
      )}

      {canDelete && (
        <DangerSection
          title="Soft delete"
          hint="Hides the truck everywhere; recoverable from Trash for 30 days."
        >
          {truck.deleted_at ? (
            <>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="destructive">Deleted</Badge>
                <span className="text-xs text-muted-foreground">
                  on {new Date(truck.deleted_at).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-end">
                <Button disabled={busy} onClick={handleRestore}>
                  Restore from trash
                </Button>
              </div>
            </>
          ) : pendingDelete ? (
            <div className="flex justify-end">
              <Button variant="outline" onClick={cancelPending} className="gap-1.5">
                <span className="h-4 w-4">{Icons.x}</span>
                Undo delete (10s)
              </Button>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button
                disabled={busy}
                onClick={handleSoftDelete}
                className="gap-1.5 bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                <span className="h-4 w-4">{Icons.trash}</span>
                Delete truck
              </Button>
            </div>
          )}
        </DangerSection>
      )}

      {!canSuspend && !canTransfer && !canDelete && (
        <Card>
          <CardContent className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            You don't have permissions for any actions on this page.
          </CardContent>
        </Card>
      )}

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
