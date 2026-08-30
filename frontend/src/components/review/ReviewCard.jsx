import React from 'react';
import { Link } from 'react-router-dom';
import { User, Calendar, Edit3, Trash2, Hotel, CheckCircle } from 'lucide-react';
import { StarRating } from './ReviewRating';
import { useAuth } from '../../context/AuthContext';

const formatDatetime = (dtStr) => {
  if (!dtStr) return '—';
  return new Date(dtStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * ReviewCard — displays a single guest review with rating, commentary, and management actions.
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

  // Ownership / permissions check for Edit / Delete
  const isGuestAuthor = user?.role === 'guest' && user?.guest_id && user.guest_id === guest_id;
  const isOwner = user?.role === 'owner';
  const isManagerForProp = user?.role === 'manager' && user?.property_id === property_id;

  const canEdit = isGuestAuthor || isOwner || isManagerForProp;
  const canDelete = isGuestAuthor || isOwner || isManagerForProp;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:shadow-sm transition-shadow space-y-3.5 flex flex-col justify-between">
      <div className="space-y-2.5">
        {/* Top Bar: Reviewer Info + Actions */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0">
              {guest_name ? guest_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs font-bold text-slate-900">
                  {guest_name || `Guest #${guest_id || 'Verified'}`}
                </span>
                <span className="inline-flex items-center space-x-0.5 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                  <CheckCircle className="w-2.5 h-2.5" />
                  <span>Verified Stay</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{formatDatetime(reviewed_at)}</span>
              </span>
            </div>
          </div>

          {/* Action Buttons (Edit / Delete) */}
          <div className="flex items-center space-x-1">
            {canEdit && (
              <Link
                to={`/reviews/${review_id}/edit`}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                title="Edit Review"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </Link>
            )}

            {canDelete && onDelete && (
              <button
                type="button"
                onClick={() => onDelete(review_id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                title="Delete Review"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Star Rating */}
        <div className="flex items-center space-x-2">
          <StarRating rating={rating} size="sm" showNumeric />
        </div>

        {/* Commentary */}
        {comments ? (
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
            "{comments}"
          </p>
        ) : (
          <p className="text-xs text-slate-400 italic">
            No commentary provided with this rating.
          </p>
        )}
      </div>

      {/* Property / Booking Meta Bar */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        {showPropertyLink && property_id ? (
          <Link
            to={`/properties/${property_id}`}
            className="flex items-center space-x-1 text-blue-600 hover:underline font-semibold"
          >
            <Hotel className="w-3 h-3 text-slate-400" />
            <span>Property #{property_id}</span>
          </Link>
        ) : (
          <span className="text-slate-400">Review #{review_id}</span>
        )}

        <Link
          to={`/bookings/${booking_id}`}
          className="text-slate-400 hover:text-blue-600 font-medium"
        >
          Booking #{booking_id}
        </Link>
      </div>
    </div>
  );
};

export default ReviewCard;
