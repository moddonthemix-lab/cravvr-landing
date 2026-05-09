import React, { useState } from 'react';
import { cn } from '@/lib/utils';

const StarIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const SIZE_PRESETS = {
  sm: { star: 'h-5 w-5', gap: 'gap-1', label: 'text-xs' },
  md: { star: 'h-7 w-7', gap: 'gap-1.5', label: 'text-sm' },
  lg: { star: 'h-10 w-10', gap: 'gap-2', label: 'text-base' },
};

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

const StarRatingInput = ({
  value = 0,
  onChange,
  size = 'md',
  readonly = false,
  showLabel = false,
}) => {
  const [hoverValue, setHoverValue] = useState(0);
  const preset = SIZE_PRESETS[size] || SIZE_PRESETS.md;
  const displayValue = hoverValue || value;

  const handleClick = (rating) => {
    if (!readonly && onChange) onChange(rating);
  };
  const handleMouseEnter = (rating) => {
    if (!readonly) setHoverValue(rating);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={cn('flex items-center', preset.gap)}
        onMouseLeave={() => setHoverValue(0)}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = star <= displayValue;
          return (
            <button
              key={star}
              type="button"
              onClick={() => handleClick(star)}
              onMouseEnter={() => handleMouseEnter(star)}
              disabled={readonly}
              aria-label={`Rate ${star} out of 5 stars`}
              className={cn(
                'transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-md',
                preset.star,
                isFilled ? 'text-warning' : 'text-muted-foreground/40',
                !readonly && 'hover:scale-110 active:scale-95',
                readonly && 'cursor-default'
              )}
            >
              <StarIcon filled={isFilled} />
            </button>
          );
        })}
      </div>
      {showLabel && (
        <span
          className={cn(
            'font-medium',
            preset.label,
            value > 0 ? 'text-warning' : 'text-muted-foreground'
          )}
        >
          {value > 0 ? RATING_LABELS[value] : !readonly ? 'Tap to rate' : ''}
        </span>
      )}
    </div>
  );
};

export default StarRatingInput;
