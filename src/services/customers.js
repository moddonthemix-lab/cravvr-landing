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
 * Update customer-editable profile fields. Storage is split:
 *   - `name`, `avatar_url` live on `profiles` (keyed by id)
 *   - `phone`, `points` live on `customers` (keyed by id)
 * Caller passes a flat object; we route each field to the right table.
 */
export const updateCustomerProfile = async (userId, updates) => {
  const profileFields = {};
  const customerFields = {};
  if ('name' in updates) profileFields.name = updates.name;
  if ('avatar_url' in updates) profileFields.avatar_url = updates.avatar_url;
  if ('phone' in updates) customerFields.phone = updates.phone;

  if (Object.keys(profileFields).length) {
    const { error } = await supabase
      .from('profiles')
      .update(profileFields)
      .eq('id', userId);
    if (error) throw error;
  }
  if (Object.keys(customerFields).length) {
    const { error } = await supabase
      .from('customers')
      .update(customerFields)
      .eq('id', userId);
    if (error) throw error;
  }
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
