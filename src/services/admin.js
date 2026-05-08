import { supabase } from '../lib/supabase';

/**
 * Admin RPC wrappers. Each is a thin pass-through to the corresponding
 * SECURITY DEFINER function. The DB enforces is_admin() / has_admin_permission()
 * before mutating; these wrappers keep direct supabase imports out of the
 * admin component tree.
 */

export const adminCreateTruck = async (ownerId, patch, reason = null) => {
  const { data, error } = await supabase.rpc('admin_create_truck', {
    p_owner_id: ownerId,
    p_patch: patch,
    p_reason: reason,
  });
  if (error) throw error;
  return data;
};

export const adminUpdateOwner = async (ownerId, patch, reason = null) => {
  const { error } = await supabase.rpc('admin_update_owner', {
    p_id: ownerId,
    p_patch: patch,
    p_reason: reason,
  });
  if (error) throw error;
};

export const refreshCohortPerformance = async () => {
  const { error } = await supabase.rpc('refresh_cohort_performance');
  if (error) throw error;
};

/**
 * Search owner profiles by partial name or email. Used by admin "create truck"
 * and "reassign owner" flows. RLS for admins permits this read.
 */
export const searchOwnerProfiles = async (query, { limit = 20 } = {}) => {
  if (!query || query.length < 2) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .eq('role', 'owner')
    .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(limit);
  if (error) throw error;
  return data || [];
};

/**
 * Read the editable subset of an owner row (for admin's owner-profile tab).
 */
export const fetchOwnerForAdmin = async (ownerId) => {
  const { data, error } = await supabase
    .from('owners')
    .select('business_name, tax_id, business_address, phone, notification_preferences')
    .eq('id', ownerId)
    .maybeSingle();
  if (error) throw error;
  return data;
};

/**
 * Upsert an ad_spend row for cohort/CAC analytics. Conflict key matches the
 * existing UNIQUE on (day, source, medium, campaign).
 */
export const upsertAdSpend = async (row) => {
  const { error } = await supabase
    .from('ad_spend')
    .upsert(row, { onConflict: 'day,source,medium,campaign' });
  if (error) throw error;
};

/**
 * Fetch all food_trucks rows with owner profile fields hydrated. Admin-only;
 * RLS admin policy + admin role on profiles makes this work.
 *
 * Two queries (trucks → profiles by id IN (...)). Returns trucks with
 * `owner_name` and `owner_email` joined.
 */
export const fetchAdminTrucksWithOwners = async () => {
  const { data: trucks, error } = await supabase
    .from('food_trucks')
    .select('*')
    .order('updated_at', { ascending: false, nullsFirst: false });
  if (error) throw error;

  const ownerIds = [...new Set((trucks || []).map((t) => t.owner_id).filter(Boolean))];
  let owners = {};
  if (ownerIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name, email')
      .in('id', ownerIds);
    (profiles || []).forEach((p) => { owners[p.id] = p; });
  }
  return (trucks || []).map((t) => ({
    ...t,
    owner_name: owners[t.owner_id]?.name || '—',
    owner_email: owners[t.owner_id]?.email || '',
  }));
};

/** Fetch a single truck row + owner profile for admin detail view. */
export const fetchAdminTruckById = async (truckId) => {
  const { data: truck, error } = await supabase
    .from('food_trucks')
    .select('*')
    .eq('id', truckId)
    .maybeSingle();
  if (error) throw error;
  if (!truck) return { truck: null, owner: null };

  let owner = null;
  if (truck.owner_id) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, name, email')
      .eq('id', truck.owner_id)
      .maybeSingle();
    owner = prof || null;
  }
  return { truck, owner };
};

/**
 * Fetch a set of profiles by id. Admin-only; used to hydrate audit log /
 * reviews tabs that surface user names.
 */
export const fetchProfilesByIds = async (ids) => {
  if (!ids?.length) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email')
    .in('id', ids);
  if (error) throw error;
  return data || [];
};

/**
 * Truck-scoped analytics for the admin analytics tab. Returns { orders, reviews }
 * where each is the relevant column subset since the given ISO timestamp.
 */
export const fetchAdminTruckAnalytics = async (truckId, sinceIso) => {
  const [ordersRes, reviewsRes] = await Promise.all([
    supabase
      .from('orders')
      .select('id, total, status, payment_status, created_at')
      .eq('truck_id', truckId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true }),
    supabase
      .from('reviews')
      .select('id, rating, created_at, hidden_at, is_hidden')
      .eq('truck_id', truckId)
      .gte('created_at', sinceIso)
      .order('created_at', { ascending: true }),
  ]);
  if (ordersRes.error) throw ordersRes.error;
  if (reviewsRes.error) throw reviewsRes.error;
  return { orders: ordersRes.data || [], reviews: reviewsRes.data || [] };
};

/**
 * Page through admin_audit_log entries for a given truck.
 */
export const fetchAdminAuditLog = async (truckId, { page = 0, pageSize = 25 } = {}) => {
  const from = page * pageSize;
  const to = from + pageSize - 1;
  const { data, error } = await supabase
    .from('admin_audit_log')
    .select('*')
    .eq('entity_type', 'food_truck')
    .eq('entity_id', truckId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (error) throw error;
  return data || [];
};

/**
 * Admin orders list for a truck, optionally filtered by status.
 */
export const fetchAdminTruckOrders = async (truckId, { status = 'all', limit = 100 } = {}) => {
  let query = supabase
    .from('orders')
    .select('*')
    .eq('truck_id', truckId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
};

/**
 * Admin reviews list for a truck — includes hidden reviews so admins can
 * moderate them.
 */
export const fetchAdminTruckReviews = async (truckId, { limit = 200 } = {}) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('truck_id', truckId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

/**
 * Check whether a slug is taken by some OTHER truck. Returns true when the
 * slug is available (or unchanged from `excludeId`'s current slug).
 */
export const isTruckSlugAvailable = async (slug, excludeId) => {
  if (!slug) return false;
  const { data } = await supabase
    .from('food_trucks')
    .select('id')
    .eq('slug', slug)
    .neq('id', excludeId)
    .maybeSingle();
  return !data;
};
