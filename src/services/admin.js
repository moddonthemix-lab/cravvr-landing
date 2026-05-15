import { supabase } from '../lib/supabase';

/**
 * Admin RPC wrappers. Each is a thin pass-through to the corresponding
 * SECURITY DEFINER function. The DB enforces is_admin() / has_admin_permission()
 * before mutating; these wrappers keep direct supabase imports out of the
 * admin component tree.
 */

// ---- Playbook state -------------------------------------------------------

/** Fetch all playbook state rows as a map keyed by item_key. */
export const fetchPlaybookState = async () => {
  const { data, error } = await supabase
    .from('playbook_state')
    .select('item_key, done, done_at, done_by_user_id, notes, updated_at');
  if (error) throw error;
  const map = {};
  for (const row of data || []) map[row.item_key] = row;
  return map;
};

/** Toggle an item done/undone. Returns the upserted row. */
export const setPlaybookItem = async (item_key, done, notes = null) => {
  const { data, error } = await supabase
    .from('playbook_state')
    .upsert(
      { item_key, done, ...(notes != null ? { notes } : {}) },
      { onConflict: 'item_key' }
    )
    .select()
    .single();
  if (error) throw error;
  return data;
};

/** Update notes on a playbook item without changing done state. */
export const setPlaybookNotes = async (item_key, notes) => {
  const { data, error } = await supabase
    .from('playbook_state')
    .upsert({ item_key, notes }, { onConflict: 'item_key' })
    .select()
    .single();
  if (error) throw error;
  return data;
};


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

// ─────────────────────────────────────────────────────────────────────────────
// Waitlist (admin-side CRUD — public submissions are handled in services/waitlist.js)
// ─────────────────────────────────────────────────────────────────────────────

export const fetchWaitlistEntries = async () => {
  const { data, error } = await supabase
    .from('waitlist')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const updateWaitlistEntry = async (id, updates) => {
  const { error } = await supabase.from('waitlist').update(updates).eq('id', id);
  if (error) throw error;
};

export const updateWaitlistEntries = async (ids, updates) => {
  const { error } = await supabase.from('waitlist').update(updates).in('id', ids);
  if (error) throw error;
};

export const deleteWaitlistEntry = async (id) => {
  const { error } = await supabase.from('waitlist').delete().eq('id', id);
  if (error) throw error;
};

export const insertWaitlistEntry = async ({ name, email, type, status = 'pending' }) => {
  const { error } = await supabase
    .from('waitlist')
    .insert([{ name, email, type, status }]);
  if (error) {
    return { ok: false, code: error.code, error };
  }
  return { ok: true };
};

// ─────────────────────────────────────────────────────────────────────────────
// Users management (admin profiles list + edit)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all profiles with the role-specific embedded rows (customers + owners).
 */
export const fetchAdminUsers = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      *,
      customers (phone, points, avatar_url),
      owners (subscription_type)
    `)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map((profile) => ({
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role,
    created_at: profile.created_at,
    phone: profile.customers?.phone || '',
    points: profile.customers?.points || 0,
    avatar_url: profile.customers?.avatar_url || '',
    subscription_type: profile.owners?.subscription_type || '',
  }));
};

export const updateAdminUserProfile = async (userId, { name, role, phone }) => {
  const { error } = await supabase
    .from('profiles')
    .update({ name, role })
    .eq('id', userId);
  if (error) throw error;
  if (role === 'customer' && phone !== undefined) {
    await supabase.from('customers').update({ phone }).eq('id', userId);
  }
};

export const deleteAdminUser = async (userId) => {
  const { error } = await supabase.from('profiles').delete().eq('id', userId);
  if (error) throw error;
};

// ─────────────────────────────────────────────────────────────────────────────
// Orders management (admin global orders view)
// ─────────────────────────────────────────────────────────────────────────────

export const fetchAdminAllOrders = async ({ limit = 50 } = {}) => {
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      profiles:customer_id(name, email),
      food_trucks:truck_id(name),
      order_items(name, quantity, price)
    `)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

// ─────────────────────────────────────────────────────────────────────────────
// Test data (admin Settings → developer tools)
// ─────────────────────────────────────────────────────────────────────────────

export const fetchAdminCustomersForTestOrder = async ({ limit = 30 } = {}) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, email, role')
    .in('role', ['customer', 'admin'])
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data || [];
};

export const fetchAdminTrucksForTestOrder = async () => {
  const { data, error } = await supabase
    .from('food_trucks')
    .select('id, name')
    .order('name');
  if (error) throw error;
  return data || [];
};

/** Fetch up to N available menu items for a truck (admin test-order seed). */
export const fetchTruckAvailableMenuSample = async (truckId, { limit = 3 } = {}) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('id, name, price')
    .eq('truck_id', truckId)
    .eq('is_available', true)
    .limit(limit);
  if (error) throw error;
  return data || [];
};

/** Insert a fully-formed test order + its items. Used in admin Settings. */
export const createAdminTestOrder = async ({
  customerId, truckId, orderNumber, subtotal, tax, total, items,
}) => {
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      customer_id: customerId,
      truck_id: truckId,
      order_number: orderNumber,
      status: 'completed',
      order_type: 'pickup',
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2),
      completed_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (orderError) throw orderError;

  const orderItems = items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.id,
    name: item.name,
    price: parseFloat(item.price) || 9.99,
    quantity: 1,
  }));
  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
  if (itemsError) throw itemsError;
  return order;
};

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard stats (admin home — single batch fetch)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch all the parallel stats the admin home page renders. Returns the raw
 * shape — caller does aggregation (so the existing chart-prep logic stays put
 * inside the AdminDashboard for now).
 */
export const fetchAdminDashboardStats = async ({ thirtyDaysAgoIso, oneYearAgoIso }) => {
  const [
    usersResult,
    trucksResult,
    reviewsResult,
    checkInsResult,
    recentCheckInsResult,
    recentReviewsResult,
    checkInsLast30Result,
    reviewsLast30Result,
    usersWithDatesResult,
  ] = await Promise.all([
    supabase.from('profiles').select('id, role', { count: 'exact' }),
    supabase.from('food_trucks').select('id, cuisine', { count: 'exact' }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('check_ins').select('*', { count: 'exact', head: true }),
    supabase.from('check_ins')
      .select('id, customer_id, truck_id, points_earned, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('reviews')
      .select('id, customer_id, truck_id, rating, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('check_ins')
      .select('created_at')
      .gte('created_at', thirtyDaysAgoIso),
    supabase.from('reviews')
      .select('created_at')
      .gte('created_at', thirtyDaysAgoIso),
    supabase.from('profiles')
      .select('created_at')
      .gte('created_at', oneYearAgoIso),
  ]);

  return {
    usersResult,
    trucksResult,
    reviewsResult,
    checkInsResult,
    recentCheckInsResult,
    recentReviewsResult,
    checkInsLast30Result,
    reviewsLast30Result,
    usersWithDatesResult,
  };
};

/** Fetch profile names by id (admin recent-activity hydration). */
export const fetchProfileNamesByIds = async (ids) => {
  if (!ids?.length) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name')
    .in('id', ids);
  if (error) throw error;
  return data || [];
};

/** Fetch truck names by id (admin recent-activity hydration). */
export const fetchTruckNamesByIds = async (ids) => {
  if (!ids?.length) return [];
  const { data, error } = await supabase
    .from('food_trucks')
    .select('id, name')
    .in('id', ids);
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
