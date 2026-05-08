import { supabase } from '../lib/supabase';

/**
 * Transform raw Supabase menu item to app format
 */
export const transformMenuItem = (item) => ({
  id: item.id,
  name: item.name,
  description: item.description || 'A delicious menu item.',
  price: item.price,
  priceFormatted: `$${item.price?.toFixed(2) || '0.00'}`,
  image: item.image_url || 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=400&q=80',
  popular: item.popular || false,
  featured: item.featured || false,
  emoji: item.emoji || '🍽️',
  category: item.category || 'Other',
  averageRating: item.average_rating || 0,
  reviewCount: item.review_count || 0,
  truckId: item.truck_id,
  available: item.available !== false,
  _raw: item,
});

/**
 * Fetch menu items for a truck. Pass `limit` to cap the number of rows.
 */
export const fetchMenuItems = async (truckId, { limit } = {}) => {
  let query = supabase
    .from('menu_items')
    .select('*')
    .eq('truck_id', truckId);
  if (limit && limit > 0) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;
  return data?.map(transformMenuItem) || [];
};

/**
 * Fetch raw menu_items rows ordered for an admin/owner editor — preserves
 * `display_order` and the canonical schema shape (no transformMenuItem).
 */
export const fetchMenuItemsRaw = async (truckId) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('truck_id', truckId)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
};

/**
 * Fetch a single menu item by ID
 */
export const fetchMenuItemById = async (id) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? transformMenuItem(data) : null;
};

/**
 * Fetch popular menu items across all trucks
 */
export const fetchPopularMenuItems = async (limit = 10) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('popular', true)
    .limit(limit);

  if (error) throw error;
  return data?.map(transformMenuItem) || [];
};

/**
 * Create a new menu item
 */
export const createMenuItem = async (menuItem) => {
  const { data, error } = await supabase
    .from('menu_items')
    .insert(menuItem)
    .select()
    .single();

  if (error) throw error;
  return data ? transformMenuItem(data) : null;
};

/**
 * Update a menu item
 */
export const updateMenuItem = async (id, updates) => {
  const { data, error } = await supabase
    .from('menu_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data ? transformMenuItem(data) : null;
};

/**
 * Delete a menu item
 */
export const deleteMenuItem = async (id) => {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

/**
 * Bulk update display_order on a list of menu items. Issues parallel writes —
 * not atomic; if any fails the others still apply. Caller should refetch.
 */
export const reorderMenuItems = async (updates) => {
  await Promise.all(
    updates.map((u) =>
      supabase.from('menu_items').update({ display_order: u.display_order }).eq('id', u.id)
    )
  );
};

/**
 * Bulk-insert menu items (used by the admin CSV importer). Caller is
 * responsible for shaping rows.
 */
export const bulkCreateMenuItems = async (rows) => {
  const { error } = await supabase.from('menu_items').insert(rows);
  if (error) throw error;
};

/**
 * Toggle a menu item's availability flag.
 */
export const setMenuItemAvailability = async (id, isAvailable) => {
  const { error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable })
    .eq('id', id);
  if (error) throw error;
};

/**
 * Update menu item rating (recalculate from menu_item_ratings).
 *
 * Reads from `menu_item_ratings` (the canonical per supabase-schema.sql:329).
 * A previous version of this function read from `menu_item_reviews` which
 * does not exist — recomputed averages were silently a no-op.
 */
export const updateMenuItemRating = async (itemId) => {
  const { data: ratings } = await supabase
    .from('menu_item_ratings')
    .select('rating')
    .eq('menu_item_id', itemId);

  if (ratings && ratings.length > 0) {
    const avgRating = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;

    await supabase
      .from('menu_items')
      .update({
        average_rating: Math.round(avgRating * 10) / 10,
        review_count: ratings.length
      })
      .eq('id', itemId);
  }
};
