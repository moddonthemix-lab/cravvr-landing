import { supabase } from '../lib/supabase';
import { updateTruckRating } from './trucks';
import { updateMenuItemRating } from './menu';

/**
 * Transform raw review data to app format
 */
export const transformReview = (review) => ({
  id: review.id,
  truckId: review.truck_id,
  customerId: review.customer_id,
  rating: review.rating,
  comment: review.comment,
  createdAt: review.created_at,
  updatedAt: review.updated_at,
  // reviews.customer_id is FK to profiles(id) after the Clerk migration;
  // we then embed customers (which itself FKs to profiles.id) for avatar.
  customerName: review.profiles?.name || 'Anonymous',
  customerAvatar: review.profiles?.customers?.avatar_url,
  _raw: review,
});

/**
 * Fetch reviews for a truck. Pass `limit` to cap the number of rows.
 */
export const fetchTruckReviews = async (truckId, { limit } = {}) => {
  let query = supabase
    .from('reviews')
    .select(`
      *,
      profiles!customer_id(
        name,
        customers(avatar_url)
      )
    `)
    .eq('truck_id', truckId)
    .order('created_at', { ascending: false });

  if (limit && limit > 0) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data?.map(transformReview) || [];
};

/**
 * Fetch a user's review for a truck
 */
export const fetchUserTruckReview = async (truckId, userId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('truck_id', truckId)
    .eq('customer_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

/**
 * Submit or update a truck review
 */
export const submitTruckReview = async ({ truckId, userId, rating, comment, existingReviewId }) => {
  if (existingReviewId) {
    const { error } = await supabase
      .from('reviews')
      .update({
        rating,
        comment: comment?.trim() || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingReviewId);

    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('reviews')
      .insert({
        truck_id: truckId,
        customer_id: userId,
        rating,
        comment: comment?.trim() || null
      });

    if (error) throw error;
  }

  await updateTruckRating(truckId);
};

/**
 * Delete a truck review
 */
export const deleteTruckReview = async (reviewId, truckId) => {
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', reviewId);

  if (error) throw error;
  await updateTruckRating(truckId);
};

/**
 * Submit a review for a specific order, marking the order as reviewed in a
 * second write. Used by CustomerProfile's "leave review on past order" flow.
 *
 * NOT atomic — the order update can leave the review without the has_review
 * flag if it fails. Keeps existing behavior; promote to an RPC if it matters.
 */
export const submitOrderReview = async ({ truckId, customerId, orderId, rating, comment }) => {
  const { error: reviewError } = await supabase
    .from('reviews')
    .insert([{
      customer_id: customerId,
      truck_id: truckId,
      order_id: orderId,
      rating,
      comment: comment?.trim() || null,
    }]);
  if (reviewError) throw reviewError;

  const { error: orderError } = await supabase
    .from('orders')
    .update({ has_review: true })
    .eq('id', orderId);
  if (orderError) throw orderError;

  await updateTruckRating(truckId);
};

/**
 * Fetch a user's rating for a menu item
 */
export const fetchUserMenuItemRating = async (itemId, userId) => {
  const { data, error } = await supabase
    .from('menu_item_ratings')
    .select('*')
    .eq('menu_item_id', itemId)
    .eq('customer_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data || null;
};

/**
 * Submit or update a menu item rating
 */
export const submitMenuItemRating = async ({ itemId, userId, rating }) => {
  const { error } = await supabase
    .from('menu_item_ratings')
    .upsert({
      menu_item_id: itemId,
      customer_id: userId,
      rating
    }, {
      onConflict: 'menu_item_id,customer_id'
    });

  if (error) throw error;
  await updateMenuItemRating(itemId);
};
