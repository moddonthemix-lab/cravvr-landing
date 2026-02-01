import React from 'react';
import { Icons } from '../common/Icons';
import { useRating } from '../../hooks/useRating';
import StarRatingInput from '../common/StarRatingInput';
import './ReviewModal.css';

/**
 * Unified Rating Modal for both trucks and menu items
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {Function} props.onClose - Close callback
 * @param {string} props.type - 'truck' or 'menuItem'
 * @param {Object} props.target - The truck or menu item being rated
 * @param {string} props.userId - Current user ID
 * @param {Object} props.existingRating - Existing rating/review if any
 * @param {Function} props.onSuccess - Success callback
 */
const RatingModal = ({
  isOpen,
  onClose,
  type = 'truck',
  target,
  userId,
  existingRating,
  onSuccess
}) => {
  const {
    rating,
    setRating,
    comment,
    setComment,
    loading,
    error,
    success,
    handleSubmit,
    isUpdate,
    isValid
  } = useRating({
    type,
    target,
    userId,
    existingRating,
    onSuccess,
    onClose
  });

  if (!isOpen) return null;

  const isTruck = type === 'truck';
  const maxLength = isTruck ? 500 : 200;

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
            <p>Your {isTruck ? 'review' : 'rating'} has been {isUpdate ? 'updated' : 'submitted'}</p>
          </div>
        ) : (
          // Rating Form
          <form onSubmit={handleSubmit}>
            <div className="review-modal-header">
              {isTruck ? (
                // Truck Review Header
                <>
                  <div className="header-icon">
                    {Icons.star}
                  </div>
                  <h2>{isUpdate ? 'Edit Your Review' : 'Rate Your Experience'}</h2>
                  <p className="truck-name">{target?.name}</p>
                </>
              ) : (
                // Menu Item Rating Header
                <div className="item-header-row">
                  {target?.image && (
                    <img src={target.image} alt={target.name} className="item-thumb" />
                  )}
                  <div className="item-details">
                    <h3>{target?.name}</h3>
                    <span className="item-price">{target?.price || target?.priceFormatted}</span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="review-error">
                {error}
              </div>
            )}

            <div className="review-form-content">
              {/* Star Rating */}
              <div className="rating-section">
                {isTruck && <label>How was your experience?</label>}
                <StarRatingInput
                  value={rating}
                  onChange={setRating}
                  size="lg"
                  showLabel
                />
              </div>

              {/* Comment */}
              <div className="comment-section">
                {isTruck && <label>Share your thoughts (optional)</label>}
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder={isTruck ? "Tell others about your experience..." : "Add a comment (optional)"}
                  rows={isTruck ? 4 : 2}
                  maxLength={maxLength}
                />
                <span className="char-count">{comment.length}/{maxLength}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="review-submit-btn"
              disabled={loading || !isValid}
            >
              {loading ? (
                <>
                  <span className="btn-loader">{Icons.loader}</span>
                  {isTruck ? 'Submitting...' : 'Saving...'}
                </>
              ) : (
                isUpdate
                  ? `Update ${isTruck ? 'Review' : 'Rating'}`
                  : `Submit ${isTruck ? 'Review' : 'Rating'}`
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default RatingModal;
