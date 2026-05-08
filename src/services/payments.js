import { supabase } from '../lib/supabase';

/**
 * Fetch payments for a set of trucks, joined with order_number + truck name.
 * Used by the owner-side payments dashboard.
 *
 * `range` is one of 'today' | 'week' | 'month' | 'all' and translates to a
 * `created_at >= ...` filter. `limit` defaults to 100.
 */
export const fetchOwnerPayments = async (truckIds, { range = 'week', limit = 100 } = {}) => {
  if (!truckIds || truckIds.length === 0) return [];

  let query = supabase
    .from('payments')
    .select('*, orders(order_number), food_trucks(name)')
    .in('truck_id', truckIds)
    .order('created_at', { ascending: false });

  const now = Date.now();
  if (range === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    query = query.gte('created_at', start.toISOString());
  } else if (range === 'week') {
    query = query.gte('created_at', new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString());
  } else if (range === 'month') {
    query = query.gte('created_at', new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString());
  }

  const { data, error } = await query.limit(limit);
  if (error) throw error;
  return data || [];
};
