/**
 * Centralized data transformers for the Cravrr app
 *
 * Transforms raw Supabase data into consistent app-friendly formats.
 * Re-exports transformers from services for convenience.
 */

// Re-export from services
export { transformTruck } from '../services/trucks';
export { transformMenuItem } from '../services/menu';
export { transformOrder, ORDER_STATUS } from '../services/orders';

/**
 * Transform raw review data to app format
 */
export const transformReview = (review) => ({
  id: review.id,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.created_at,
  updatedAt: review.updated_at,
  customerId: review.customer_id,
  customerName: review.profiles?.full_name || 'Anonymous',
  customerAvatar: review.profiles?.avatar_url,
  truckId: review.truck_id,
  _raw: review,
});

/**
 * Transform raw user profile data to app format
 */
export const transformProfile = (profile) => ({
  id: profile.id,
  name: profile.full_name || profile.name,
  email: profile.email,
  phone: profile.phone,
  avatarUrl: profile.avatar_url,
  role: profile.role || 'customer',
  points: profile.points || 0,
  createdAt: profile.created_at,
  _raw: profile,
});

/**
 * Transform raw favorite data to app format
 */
export const transformFavorite = (favorite) => ({
  id: favorite.id,
  truckId: favorite.truck_id,
  customerId: favorite.customer_id,
  createdAt: favorite.created_at,
  truck: favorite.food_trucks ? {
    id: favorite.food_trucks.id,
    name: favorite.food_trucks.name,
    image: favorite.food_trucks.image_url,
    cuisine: favorite.food_trucks.cuisine_type,
    rating: favorite.food_trucks.rating,
  } : null,
  _raw: favorite,
});

/**
 * Transform raw menu item review data
 */
export const transformMenuItemReview = (review) => ({
  id: review.id,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.created_at,
  menuItemId: review.menu_item_id,
  customerId: review.customer_id,
  customerName: review.profiles?.full_name || 'Anonymous',
  _raw: review,
});

/**
 * Batch transform helper
 * @param {Array} items - Array of raw items
 * @param {Function} transformer - Transform function
 * @returns {Array} Transformed items
 */
export const transformMany = (items, transformer) => {
  if (!items || !Array.isArray(items)) return [];
  return items.map(transformer);
};

/**
 * Safe transform helper (returns null if input is null/undefined)
 * @param {Object} item - Raw item
 * @param {Function} transformer - Transform function
 * @returns {Object|null} Transformed item or null
 */
export const transformSafe = (item, transformer) => {
  if (!item) return null;
  return transformer(item);
};

export default {
  transformTruck: (t) => import('../services/trucks').then(m => m.transformTruck(t)),
  transformMenuItem: (m) => import('../services/menu').then(m => m.transformMenuItem(m)),
  transformOrder: (o) => import('../services/orders').then(m => m.transformOrder(o)),
  transformReview,
  transformProfile,
  transformFavorite,
  transformMenuItemReview,
  transformMany,
  transformSafe,
};
