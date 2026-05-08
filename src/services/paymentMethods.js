import { supabase } from '../lib/supabase';

// `payment_methods.user_id` references auth.users(id) — see migration 005.

/** Fetch saved payment methods for a user, default first. */
export const fetchPaymentMethods = async (userId) => {
  const { data, error } = await supabase
    .from('payment_methods')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

/** Insert a new payment method. Caller passes the row including `user_id`. */
export const createPaymentMethod = async (method) => {
  const { error } = await supabase.from('payment_methods').insert([method]);
  if (error) throw error;
};

/** Update an existing payment method. */
export const updatePaymentMethod = async (id, updates) => {
  const { error } = await supabase.from('payment_methods').update(updates).eq('id', id);
  if (error) throw error;
};

/** Delete a payment method. */
export const deletePaymentMethod = async (id) => {
  const { error } = await supabase.from('payment_methods').delete().eq('id', id);
  if (error) throw error;
};
