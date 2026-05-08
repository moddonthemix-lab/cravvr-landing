import { supabase } from '../lib/supabase';

/**
 * Fetch a customer's check-ins joined to truck name. Used by the punch-card
 * UI in CustomerProfile.
 */
export const fetchUserCheckIns = async (customerId) => {
  const { data, error } = await supabase
    .from('check_ins')
    .select('*, food_trucks:truck_id(name)')
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((ci) => ({
    ...ci,
    truck_name: ci.food_trucks?.name || 'Food Truck',
  }));
};
