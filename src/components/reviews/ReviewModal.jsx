import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { submitTruckReview } from '../../services/reviews';
import { Icons } from '../common/Icons';
import StarRatingInput from '../common/StarRatingInput';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, truck, userId, existingReview, onSuccess }) => {
  const { showToast } = useToast();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment || '');
    } else {
      setRating(0);
      setComment('');
    }
    setError('');
    setSuccess(false);
  }, [existingReview, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await submitTruckReview({
        truckId: truck.id,
        userId,
        rating,
        comment,
        existingReviewId: existingReview?.id,
      });

      setSuccess(true);
      showToast(
        existingReview
          ? 'Review updated! Thanks for your feedback.'
          : 'Review submitted! Thanks for your feedback.',
        'success'
      );
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Error submitting review:', err);
      setError('Failed to submit review. Please try again.');
      showToast('Failed to submit review', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="review-modal-overlay" onClick={onClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button className="review-modal-close" onClick={onClose}>
          {Icons.x}
        </button>

        {success ? (
          // Success State
          <div className="review-success">
            <div className="success-icon">
              {Icons.check}
            </div>
            <h2>Thank you!</h2>
            <p>Your review has been {existingReview ? 'updated' : 'submitted'}</p>
          </div>
        ) : (
          // Review Form
          <form onSubmit={handleSubmit}>
            <div className="review-modal-header">
              <div className="header-icon">
                {Icons.star}
              </div>
              <h2>{existingReview ? 'Edit Your Review' : 'Rate Your Experience'}</h2>
              <p className="truck-name">{truck.name}</p>
            </div>

            {error && (
              <div className="review-error">
                {error}
              </div>
            )}

            <div className="review-form-content">
              {/* Star Rating */}
              <div className="rating-section">
                <label>How was your experience?</label>
                <StarRatingInput
                  value={rating}
                  onChange={setRating}
                  size="lg"
                  showLabel
                />
              </div>

              {/* Comment */}
              <div className="comment-section">
                <label>Share your thoughts (optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell others about your experience..."
                  rows={4}
                  maxLength={500}
                />
                <span className="char-count">{comment.length}/500</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="review-submit-btn"
              disabled={loading || rating === 0}
            >
              {loading ? (
                <>
                  <span className="btn-loader">{Icons.loader}</span>
                  Submitting...
                </>
              ) : (
                existingReview ? 'Update Review' : 'Submit Review'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReviewModal;
