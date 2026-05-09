import { useState, useEffect, useCallback } from 'react';
import { submitTruckReview, submitMenuItemRating } from '../services/reviews';

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

  // Handle form submission. Routes through services so the canonical menu_item_ratings
  // table is used (the prior inline path wrote to a non-existent menu_item_reviews table).
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
        await submitTruckReview({
          truckId: target.id,
          userId,
          rating,
          comment,
          existingReviewId: existingRating?.id,
        });
      } else if (type === 'menuItem') {
        await submitMenuItemRating({ itemId: target.id, userId, rating });
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
  }, [type, target, userId, rating, comment, existingRating, onSuccess, onClose]);

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
