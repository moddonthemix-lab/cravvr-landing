import { supabase } from '../lib/supabase';

/**
 * Cravvr subscription service. The DB has two tables:
 *   - cravvr_subscriptions  (one row per owner; status, plan_code, etc.)
 *   - cravvr_plans          (catalog of available plans)
 *
 * Used by useCravvrSubscription. Edge functions for checkout/portal live in
 * supabase/functions/cravvr-{checkout-session,customer-portal}.
 */

/** Read the owner's subscription row. */
export const fetchOwnerSubscription = async (ownerId) => {
  const { data, error } = await supabase
    .from('cravvr_subscriptions')
    .select('*')
    .eq('owner_id', ownerId)
    .maybeSingle();
  if (error) throw error;
  return data || null;
};

/** Read the active plans catalog, ordered for display. */
export const fetchActiveCravvrPlans = async () => {
  const { data, error } = await supabase
    .from('cravvr_plans')
    .select('*')
    .eq('is_active', true)
    .order('display_order');
  if (error) throw error;
  return data || [];
};
