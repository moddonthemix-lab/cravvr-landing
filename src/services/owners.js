import { supabase } from '../lib/supabase';

/**
 * Owner self-edit helpers. RLS allows owners to read/write their own row.
 * For admin-side reads/writes use services/admin.js (those go through
 * SECURITY DEFINER RPCs and an audit trail).
 */

/** Read the current user's own owner row. */
export const fetchOwnerSelf = async (ownerId) => {
  const { data, error } = await supabase
    .from('owners')
    .select('*')
    .eq('id', ownerId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

/** Patch the current user's own owner row. */
export const updateOwnerSelf = async (ownerId, updates) => {
  const { error } = await supabase.from('owners').update(updates).eq('id', ownerId);
  if (error) throw error;
};
