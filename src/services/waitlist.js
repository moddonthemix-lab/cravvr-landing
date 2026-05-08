import { supabase } from '../lib/supabase';

/**
 * Insert a waitlist signup. Returns `{ ok }` on success, or
 * `{ ok: false, errorCode }` for the two known error states. The component
 * renders user-facing copy; this layer just classifies.
 */
export const joinWaitlist = async ({ name, email, type }) => {
  const { error } = await supabase
    .from('waitlist')
    .insert([{ name, email, type, status: 'pending' }]);

  if (!error) return { ok: true };
  if (error.code === '23505') return { ok: false, errorCode: 'duplicate' };
  return { ok: false, errorCode: 'unknown', rawError: error };
};
