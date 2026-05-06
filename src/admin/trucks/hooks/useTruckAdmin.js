import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useToast } from '../../../contexts/ToastContext';

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

  const softDelete = useCallback((id, reason) => {
    return call('admin_soft_delete_truck', { p_id: id, p_reason: reason || null }, 'Truck moved to trash');
  }, [call]);

  const restore = useCallback((id, reason) => {
    return call('admin_restore_truck', { p_id: id, p_reason: reason || null }, 'Truck restored');
  }, [call]);

  const suspend = useCallback((id, reason) => {
    return call('admin_suspend_truck', { p_id: id, p_reason: reason || null }, 'Truck suspended');
  }, [call]);

  const transferOwner = useCallback((id, newOwnerId, reason) => {
    return call('admin_transfer_truck_owner', {
      p_id: id,
      p_new_owner_id: newOwnerId,
      p_reason: reason || null,
    }, 'Owner transferred');
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
