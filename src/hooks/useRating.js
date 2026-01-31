import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Hook for managing rating state and submission
 * Works for both truck reviews and menu item ratings
 *
 * @param {Object} options
 * @param {string} options.type - 'truck' or 'menuItem'
 * @param {Object} options.target - The truck or menu item object
 * @param {string} options.userId - Current user ID
 * @param {Object} options.existingRating - Existing rating/review if any
 * @param {Function} options.onSuccess - Callback on successful submission
 * @param {Function} options.onClose - Callback to close modal
 */
export const useRating = ({
  type,
  target,
  userId,
  existingRating,
  onSuccess,
  onClose
}) => {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Reset form when modal opens/closes or existing rating changes
  useEffect(() => {
    if (existingRating) {
      setRating(existingRating.rating);
      setComment(existingRating.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
    setError('');
    setSuccess(false);
  }, [existingRating]);

  // Update truck's average rating
  const updateTruckRating = useCallback(async (truckId) => {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('truck_id', truckId);

    if (reviews && reviews.length > 0) {
      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      await supabase
        .from('food_trucks')
        .update({
          rating: Math.round(avgRating * 10) / 10,
          review_count: reviews.length
        })
        .eq('id', truckId);
    }
  }, []);

  // Update menu item's average rating
  const updateItemRating = useCallback(async (itemId) => {
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
  }, []);

  // Handle form submission
  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (type === 'truck') {
        // Handle truck review
        if (existingRating) {
          const { error: updateError } = await supabase
            .from('reviews')
            .update({
              rating,
              comment: comment.trim() || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRating.id);

          if (updateError) throw updateError;
        } else {
          const { error: insertError } = await supabase
            .from('reviews')
            .insert({
              truck_id: target.id,
              customer_id: userId,
              rating,
              comment: comment.trim() || null
            });

          if (insertError) throw insertError;
        }

        await updateTruckRating(target.id);

      } else if (type === 'menuItem') {
        // Handle menu item rating
        const { error: upsertError } = await supabase
          .from('menu_item_reviews')
          .upsert({
            menu_item_id: target.id,
            customer_id: userId,
            rating,
            comment: comment.trim() || null
          }, {
            onConflict: 'menu_item_id,customer_id'
          });

        if (upsertError) throw upsertError;

        await updateItemRating(target.id);
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose?.();
      }, 1200);

    } catch (err) {
      console.error(`Error submitting ${type} rating:`, err);
      setError(`Failed to submit ${type === 'truck' ? 'review' : 'rating'}. Please try again.`);
    } finally {
      setLoading(false);
    }
  }, [type, target, userId, rating, comment, existingRating, updateTruckRating, updateItemRating, onSuccess, onClose]);

  // Reset the form
  const reset = useCallback(() => {
    setRating(0);
    setComment('');
    setError('');
    setSuccess(false);
  }, []);

  return {
    // State
    rating,
    setRating,
    comment,
    setComment,
    loading,
    error,
    success,

    // Actions
    handleSubmit,
    reset,

    // Helpers
    isUpdate: !!existingRating,
    isValid: rating > 0,
  };
};

export default useRating;
