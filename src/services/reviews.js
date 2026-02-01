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
  customerName: review.customers?.profiles?.name || 'Anonymous',
  customerAvatar: review.customers?.avatar_url,
  _raw: review,
});

/**
 * Fetch reviews for a truck
 */
export const fetchTruckReviews = async (truckId) => {
  const { data, error } = await supabase
    .from('reviews')
    .select(`
      *,
      customers!customer_id(
        avatar_url,
        profiles(name)
      )
    `)
    .eq('truck_id', truckId)
    .order('created_at', { ascending: false });

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
 * Fetch a user's rating for a menu item
 */
export const fetchUserMenuItemRating = async (itemId, userId) => {
  const { data, error } = await supabase
    .from('menu_item_reviews')
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
export const submitMenuItemRating = async ({ itemId, userId, rating, comment }) => {
  const { error } = await supabase
    .from('menu_item_reviews')
    .upsert({
      menu_item_id: itemId,
      customer_id: userId,
      rating,
      comment: comment?.trim() || null
    }, {
      onConflict: 'menu_item_id,customer_id'
    });

  if (error) throw error;
  await updateMenuItemRating(itemId);
};
