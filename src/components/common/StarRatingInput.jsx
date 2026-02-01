import React, { useState } from 'react';
import './StarRatingInput.css';

const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const StarRatingInput = ({
  value = 0,
  onChange,
  size = 'md',
  readonly = false,
  showLabel = false
}) => {
  const [hoverValue, setHoverValue] = useState(0);

  const handleClick = (rating) => {
    if (!readonly && onChange) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating) => {
    if (!readonly) {
      setHoverValue(rating);
    }
  };

  const handleMouseLeave = () => {
    setHoverValue(0);
  };

  const displayValue = hoverValue || value;

  return (
    <div className={`star-rating-input ${size} ${readonly ? 'readonly' : ''}`}>
      <div className="stars-container" onMouseLeave={handleMouseLeave}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`star-btn ${star <= displayValue ? 'filled' : ''}`}
            onClick={() => handleClick(star)}
            onMouseEnter={() => handleMouseEnter(star)}
            disabled={readonly}
            aria-label={`Rate ${star} out of 5 stars`}
          >
            <StarIcon filled={star <= displayValue} />
          </button>
        ))}
      </div>
      {showLabel && !readonly && value === 0 && (
        <span className="rating-label">Tap to rate</span>
      )}
      {showLabel && value > 0 && (
        <span className="rating-label selected">
          {value === 1 && 'Poor'}
          {value === 2 && 'Fair'}
          {value === 3 && 'Good'}
          {value === 4 && 'Very Good'}
          {value === 5 && 'Excellent'}
        </span>
      )}
    </div>
  );
};

export default StarRatingInput;
