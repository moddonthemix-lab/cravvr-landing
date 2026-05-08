import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../contexts/ToastContext';
import { sendAdminActionEmail } from '../../../services/email';

/**
 * Fire-and-forget email send. We never block the caller's UI on email — the
 * authoritative side effect is the in-app notification inserted by the RPC.
 */
async function notifyOwnerByEmail(truck, action, reason) {
  try {
    if (!truck) return;
    const ownerId = truck.owner_id;
    if (!ownerId) return;
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', ownerId)
      .maybeSingle();
    if (!profile?.email) return;
    await sendAdminActionEmail(profile.email, {
      ownerName: profile.name,
      truckName: truck.name,
      action,
      reason,
    });
  } catch (err) {
    console.warn('admin email send failed (non-blocking):', err);
  }
}

/**
 * Centralizes admin write operations against trucks. Every mutation goes
 * through a SECURITY DEFINER RPC defined in migration 029, which records
 * an admin_audit_log row in the same transaction.
 */
export function useTruckAdmin() {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const call = useCallback(async (rpc, args, successMsg) => {
    setBusy(true);
    try {
      const { data, error } = await supabase.rpc(rpc, args);
      if (error) throw error;
      if (successMsg) showToast(successMsg, 'success');
      return data;
    } catch (err) {
      console.error(`${rpc} failed`, err);
      showToast(err.message || `${rpc} failed`, 'error');
      throw err;
    } finally {
      setBusy(false);
    }
  }, [showToast]);

  const updateTruck = useCallback((id, patch, reason) => {
    return call('admin_update_truck', { p_id: id, p_patch: patch, p_reason: reason || null }, 'Saved');
  }, [call]);

  const softDelete = useCallback(async (id, reason) => {
    const truck = await call('admin_soft_delete_truck', { p_id: id, p_reason: reason || null }, 'Truck moved to trash');
    notifyOwnerByEmail(truck, 'deleted', reason);
    return truck;
  }, [call]);

  const restore = useCallback(async (id, reason) => {
    const truck = await call('admin_restore_truck', { p_id: id, p_reason: reason || null }, 'Truck restored');
    notifyOwnerByEmail(truck, 'restored', reason);
    return truck;
  }, [call]);

  const suspend = useCallback(async (id, reason) => {
    const truck = await call('admin_suspend_truck', { p_id: id, p_reason: reason || null }, 'Truck suspended');
    notifyOwnerByEmail(truck, 'suspended', reason);
    return truck;
  }, [call]);

  const transferOwner = useCallback(async (id, newOwnerId, reason) => {
    const truck = await call('admin_transfer_truck_owner', {
      p_id: id,
      p_new_owner_id: newOwnerId,
      p_reason: reason || null,
    }, 'Owner transferred');
    // Email both old and new owners. The RPC returned the post-transfer row,
    // so call the email helper twice with appropriate actions.
    if (truck) {
      // New owner: "received"
      notifyOwnerByEmail(truck, 'received', reason);
      // Old owner: need to look them up since the row now points to new owner.
      // We had the old owner_id available from the audit log path; here we
      // refetch via the audit log row written by the RPC.
      try {
        const { data: lastAudit } = await supabase
          .from('admin_audit_log')
          .select('before')
          .eq('entity_type', 'food_truck')
          .eq('entity_id', id)
          .eq('action', 'transfer_owner')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        const oldOwnerId = lastAudit?.before?.owner_id;
        if (oldOwnerId && oldOwnerId !== truck.owner_id) {
          notifyOwnerByEmail({ ...truck, owner_id: oldOwnerId }, 'transferred', reason);
        }
      } catch { /* best-effort */ }
    }
    return truck;
  }, [call]);

  const setFlag = useCallback((id, flag, value, reason) => {
    return call('admin_update_truck', {
      p_id: id,
      p_patch: { [flag]: value },
      p_reason: reason || `set ${flag}=${value}`,
    });
  }, [call]);

  const hideReview = useCallback((id, hide, reason) => {
    return call('admin_hide_review', {
      p_id: id,
      p_hide: hide,
      p_reason: reason || null,
    }, hide ? 'Review hidden' : 'Review restored');
  }, [call]);

  const forceCancelOrder = useCallback((id, reason) => {
    return call('admin_force_cancel_order', { p_id: id, p_reason: reason }, 'Order cancelled');
  }, [call]);

  return {
    busy,
    updateTruck,
    softDelete,
    restore,
    suspend,
    transferOwner,
    setFlag,
    hideReview,
    forceCancelOrder,
  };
}
