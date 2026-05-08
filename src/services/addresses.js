import { supabase } from '../lib/supabase';

// `addresses.user_id` references auth.users(id) — see migration 005.

/** Fetch all saved addresses for a user, default first. */
export const fetchAddresses = async (userId) => {
  const { data, error } = await supabase
    .from('addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

/** Insert a new address. Caller passes the row including `user_id`. */
export const createAddress = async (address) => {
  const { error } = await supabase.from('addresses').insert([address]);
  if (error) throw error;
};

/** Update fields on an address. */
export const updateAddress = async (id, updates) => {
  const { error } = await supabase.from('addresses').update(updates).eq('id', id);
  if (error) throw error;
};

/** Delete an address. */
export const deleteAddress = async (id) => {
  const { error } = await supabase.from('addresses').delete().eq('id', id);
  if (error) throw error;
};
