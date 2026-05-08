import { supabase } from '../lib/supabase';

/**
 * Self-heal: ensure a row exists in `customers` for this user. Used by the
 * favorites flow when an INSERT fails with FK 23503 because a stale signup
 * left the `customers` row missing. Idempotent (ON CONFLICT DO NOTHING).
 */
export const ensureCustomerRow = async (userId) => {
  const { error } = await supabase
    .from('customers')
    .upsert({ id: userId }, { onConflict: 'id' });
  if (error) throw error;
};

/**
 * Update fields on the `customer_profiles` table (preferences, allergens,
 * dietary restrictions, etc.). The table keys off `user_id` referencing
 * auth.users — same UUID as profiles.id.
 */
export const updateCustomerProfile = async (userId, updates) => {
  const { error } = await supabase
    .from('customer_profiles')
    .update(updates)
    .eq('user_id', userId);
  if (error) throw error;
};

/**
 * Claim a punch-card reward via RPC. Returns whatever the RPC returns;
 * caller surfaces the user-facing message (`data.message`,
 * `data.points_awarded`, etc.).
 */
export const claimPunchCardReward = async (customerId, truckId) => {
  const { data, error } = await supabase.rpc('claim_punch_card_reward', {
    p_customer_id: customerId,
    p_truck_id: truckId,
  });
  if (error) throw error;
  return data;
};
