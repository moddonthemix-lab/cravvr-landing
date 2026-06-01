import { supabase } from '../lib/supabase';
import { track } from '../services/analytics';

/**
 * Insert a waitlist signup. Returns `{ ok }` on success, or
 * `{ ok: false, errorCode }` for the two known error states. The component
 * renders user-facing copy; this layer just classifies.
 *
 * Fires a `waitlist_lead` event on success (single chokepoint for both the
 * inline /eat form and the /waitlist page) which mirrors to Meta `Lead`.
 */
export const joinWaitlist = async ({ name, email, type, metadata = null }) => {
  const row = { name, email, type, status: 'pending' };
  if (metadata) row.metadata = metadata;
  const { error } = await supabase.from('waitlist').insert([row]);

  if (!error) {
    track('waitlist_lead', { audience: type });
    return { ok: true };
  }
  if (error.code === '23505') return { ok: false, errorCode: 'duplicate' };
  return { ok: false, errorCode: 'unknown', rawError: error };
};
