import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Static star rating display (1-5 stars).
 */
export const StarRating = ({ rating = 0, size = 'sm', showNumeric = false }) => {
  const stars = [1, 2, 3, 4, 5];

  const sizeClass = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  }[size] || 'w-3.5 h-3.5';

  return (
    <div className="flex items-center space-x-1">
      <div className="flex items-center space-x-0.5">
        {stars.map((s) => (
          <Star
            key={s}
            className={`${sizeClass} ${
              s <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-100 text-slate-300'
            }`}
          />
        ))}
      </div>
      {showNumeric && (
        <span className="text-xs font-bold text-slate-700 ml-1">
          {rating}.0
        </span>
      )}
    </div>
  );
};

/**
 * Interactive 5-star rating selector for forms.
 */
export const InteractiveStarRating = ({ rating, onChange, disabled = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const stars = [1, 2, 3, 4, 5];

  const ratingLabels = {
    1: 'Poor (1 / 5)',
    2: 'Fair (2 / 5)',
    3: 'Good (3 / 5)',
    4: 'Very Good (4 / 5)',
    5: 'Exceptional (5 / 5)',
  };

  const activeRating = hoverRating || rating || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-1.5">
        {stars.map((s) => (
          <button
            type="button"
            key={s}
            disabled={disabled}
            onClick={() => onChange(s)}
            onMouseEnter={() => setHoverRating(s)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none cursor-pointer disabled:cursor-not-allowed"
            aria-label={`Rate ${s} stars`}
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                s <= activeRating
                  ? 'fill-amber-400 text-amber-400'
                  : 'fill-slate-100 text-slate-300 hover:text-amber-300'
              }`}
            />
          </button>
        ))}
      </div>

      <div className="text-xs font-bold text-slate-600 min-h-[18px]">
        {activeRating > 0 ? ratingLabels[activeRating] : 'Select a star rating (1-5)'}
      </div>
    </div>
  );
};

export default StarRating;
