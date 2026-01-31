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
 * Fetch menu items for a truck
 */
export const fetchMenuItems = async (truckId) => {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('truck_id', truckId);

  if (error) throw error;
  return data?.map(transformMenuItem) || [];
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
 * Update menu item rating (recalculate from reviews)
 */
export const updateMenuItemRating = async (itemId) => {
  const { data: reviews } = await supabase
    .from('menu_item_reviews')
    .select('rating')
    .eq('menu_item_id', itemId);

  if (reviews && reviews.length > 0) {
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await supabase
      .from('menu_items')
      .update({
        average_rating: Math.round(avgRating * 10) / 10,
        review_count: reviews.length
      })
      .eq('id', itemId);
  }
};
