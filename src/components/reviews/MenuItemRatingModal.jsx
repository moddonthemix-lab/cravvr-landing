import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Icons } from '../common/Icons';
import StarRatingInput from '../common/StarRatingInput';
import './MenuItemRatingModal.css';

const MenuItemRatingModal = ({ isOpen, onClose, item, userId, existingRating, onSuccess }) => {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [comment, setComment] = useState(existingRating?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
  }, [existingRating, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upsert the rating
      const { error: upsertError } = await supabase
        .from('menu_item_reviews')
        .upsert({
          menu_item_id: item.id,
          customer_id: userId,
          rating,
          comment: comment.trim() || null
        }, {
          onConflict: 'menu_item_id,customer_id'
        });

      if (upsertError) throw upsertError;

      // Update item's average rating
      await updateItemRating(item.id);

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1200);

    } catch (err) {
      console.error('Error submitting rating:', err);
      setError('Failed to submit rating. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateItemRating = async (itemId) => {
    // Calculate new average rating
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

  if (!isOpen) return null;

  return (
    <div className="item-rating-overlay" onClick={onClose}>
      <div className="item-rating-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="item-rating-close" onClick={onClose}>
          {Icons.x}
        </button>

        {success ? (
          // Success State
          <div className="item-rating-success">
            <div className="success-icon">
              {Icons.check}
            </div>
            <p>Rating saved!</p>
          </div>
        ) : (
          // Rating Form
          <form onSubmit={handleSubmit}>
            {/* Item Info */}
            <div className="item-rating-header">
              {item.image && (
                <img src={item.image} alt={item.name} className="item-image" />
              )}
              <div className="item-details">
                <h3>{item.name}</h3>
                <span className="item-price">{item.price}</span>
              </div>
            </div>

            {error && (
              <div className="item-rating-error">
                {error}
              </div>
            )}

            {/* Star Rating */}
            <div className="rating-input-section">
              <StarRatingInput
                value={rating}
                onChange={setRating}
                size="lg"
                showLabel
              />
            </div>

            {/* Optional Comment */}
            <div className="comment-input-section">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment (optional)"
                rows={2}
                maxLength={200}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="item-rating-submit"
              disabled={loading || rating === 0}
            >
              {loading ? (
                <>
                  <span className="btn-loader">{Icons.loader}</span>
                  Saving...
                </>
              ) : (
                existingRating ? 'Update Rating' : 'Submit Rating'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default MenuItemRatingModal;
