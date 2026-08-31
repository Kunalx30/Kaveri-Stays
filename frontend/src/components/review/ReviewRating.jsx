import React, { useState } from 'react';
import { Star } from 'lucide-react';

/**
 * StarRating — Static star rating display (1-5 stars).
 *
 * @param {{ rating: number, size?: 'xs'|'sm'|'md'|'lg'|'xl', showNumeric?: boolean }} props
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
        <span className="text-xs font-bold text-[#16231E] ml-1">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
};

/**
 * InteractiveStarRating — 5-star selector for review forms.
 *
 * Rating labels:
 *   1 — Poor
 *   2 — Fair
 *   3 — Good
 *   4 — Very Good
 *   5 — Exceptional
 *
 * @param {{ rating: number, onChange: (v: number) => void, disabled?: boolean }} props
 */
export const InteractiveStarRating = ({ rating, onChange, disabled = false }) => {
  const [hoverRating, setHoverRating] = useState(0);
  const stars = [1, 2, 3, 4, 5];

  const ratingLabels = {
    1: 'Poor — 1 / 5',
    2: 'Fair — 2 / 5',
    3: 'Good — 3 / 5',
    4: 'Very Good — 4 / 5',
    5: 'Exceptional — 5 / 5',
  };

  const activeRating = hoverRating || rating || 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-1">
        {stars.map((s) => (
          <button
            type="button"
            key={s}
            disabled={disabled}
            onClick={() => onChange(s)}
            onMouseEnter={() => setHoverRating(s)}
            onMouseLeave={() => setHoverRating(0)}
            className="p-1 rounded-lg hover:scale-110 transition-transform focus:outline-none cursor-pointer disabled:cursor-not-allowed"
            aria-label={`Rate ${s} star${s !== 1 ? 's' : ''}`}
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

      <div className="text-xs font-semibold text-[#5A635F] min-h-[18px]">
        {activeRating > 0 ? ratingLabels[activeRating] : 'Select a rating (1–5 stars)'}
      </div>
    </div>
  );
};

export default StarRating;
