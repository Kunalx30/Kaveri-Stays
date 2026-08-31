import React from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, Edit3, Trash2, Hotel, CheckCircle } from 'lucide-react';
import { StarRating } from './ReviewRating';
import { useAuth } from '../../context/AuthContext';

const formatDatetime = (dtStr) => {
  if (!dtStr) return '—';
  return new Date(dtStr).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * ReviewCard — displays a single guest review with rating, commentary, and management actions.
 *
 * Permission logic:
 *   - Guest: can edit/delete their own reviews (matched by guest_id)
 *   - Manager: can edit/delete reviews within their assigned property
 *   - Owner: can edit/delete any review
 *   - Staff: read-only (no edit/delete)
 *
 * @param {{
 *   review: ReviewResponse,
 *   onDelete?: (reviewId: number) => void,
 *   showPropertyLink?: boolean
 * }} props
 */
const ReviewCard = ({ review, onDelete, showPropertyLink = false }) => {
  const { user } = useAuth();
  const {
    review_id,
    booking_id,
    rating,
    comments,
    reviewed_at,
    property_id,
    guest_id,
    guest_name,
  } = review;

  // Permission checks — UI visibility only; backend is the authoritative source
  const isGuestAuthor = user?.role === 'guest' && user?.guest_id != null && user.guest_id === guest_id;
  const isOwner = user?.role === 'owner';
  const isManagerForProp = user?.role === 'manager' && user?.property_id != null && user.property_id === property_id;

  const canEdit = isGuestAuthor || isOwner || isManagerForProp;
  const canDelete = isGuestAuthor || isOwner || isManagerForProp;

  const initials = guest_name ? guest_name.charAt(0).toUpperCase() : null;

  return (
    <article className="bg-white border border-[#E6DFD5] rounded-3xl p-5 sm:p-6 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
      <div className="space-y-3">

        {/* Top Bar: Reviewer info + Action buttons */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] flex items-center justify-center text-[#8A6240] font-bold text-xs shrink-0">
              {initials || <User className="w-3.5 h-3.5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-bold text-[#16231E] truncate">
                  {guest_name || `Guest #${guest_id || 'Verified'}`}
                </span>
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#1B4D3E] bg-[#EAF3EE] px-1.5 py-0.5 rounded-full border border-[#CDE3D6] shrink-0">
                  <CheckCircle className="w-2.5 h-2.5" />
                  <span>Verified Stay</span>
                </span>
              </div>
              <span className="text-[11px] text-[#7A857F] flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                <span>{formatDatetime(reviewed_at)}</span>
              </span>
            </div>
          </div>

          {/* Edit / Delete action buttons */}
          <div className="flex items-center gap-1 shrink-0">
            {canEdit && (
              <Link
                to={`/reviews/${review_id}/edit`}
                className="p-1.5 rounded-lg text-[#8A6240] hover:text-[#16231E] hover:bg-[#F4EFEA] transition-colors"
                title="Edit this review"
                aria-label="Edit review"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Link>
            )}

            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(review_id)}
                className="p-1.5 rounded-lg text-[#7A857F] hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Delete this review"
                aria-label="Delete review"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-2">
          <StarRating rating={rating} size="sm" showNumeric />
        </div>

        {/* Commentary */}
        {comments ? (
          <p className="text-xs sm:text-sm text-[#3A4240] leading-relaxed italic">
            &ldquo;{comments}&rdquo;
          </p>
        ) : (
          <p className="text-xs text-[#8A9490] italic">
            No written commentary provided with this rating.
          </p>
        )}
      </div>

      {/* Property / Booking Meta Bar */}
      <div className="pt-3 border-t border-[#E6DFD5] flex items-center justify-between text-[11px] text-[#7A857F]">
        {showPropertyLink && property_id ? (
          <Link
            to={`/properties/${property_id}`}
            className="flex items-center gap-1 text-[#8A6240] hover:text-[#16231E] font-semibold transition-colors"
          >
            <Hotel className="w-3 h-3 text-[#8A6240]" />
            <span>Property #{property_id}</span>
          </Link>
        ) : (
          <span className="text-[#7A857F]">Review #{review_id}</span>
        )}

        <Link
          to={`/bookings/${booking_id}`}
          className="text-[#7A857F] hover:text-[#16231E] font-medium transition-colors"
        >
          Booking #{booking_id}
        </Link>
      </div>
    </article>
  );
};

export default ReviewCard;
