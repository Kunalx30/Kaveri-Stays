import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, MessageSquare, ArrowLeft, Loader2, AlertCircle,
  CheckCircle2, Hotel,
} from 'lucide-react';
import { getBookingByIdApi } from '../api/bookings';
import { createReviewApi, listReviewsApi } from '../api/reviews';
import { InteractiveStarRating } from '../components/review/ReviewRating';
import ErrorMessage from '../components/common/ErrorMessage';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
};

const CreateReview = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [existingReview, setExistingReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Form State
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const loadBookingData = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const [bData, reviewsData] = await Promise.all([
          getBookingByIdApi(Number(bookingId)),
          listReviewsApi({ booking_id: Number(bookingId) }).catch(() => []),
        ]);
        setBooking(bData);
        if (reviewsData && reviewsData.length > 0) {
          setExistingReview(reviewsData[0]);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setLoadError(`Booking #${bookingId} not found.`);
        } else if (err.response?.status === 403) {
          setLoadError('Access denied: You do not have permission to review this booking.');
        } else {
          setLoadError('Failed to load booking details. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingData();
  }, [bookingId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!rating || rating < 1 || rating > 5) {
      setSubmitError('Please select a star rating between 1 and 5.');
      return;
    }

    setSubmitError('');
    setIsSubmitting(true);

    try {
      const payload = {
        booking_id: Number(bookingId),
        rating: rating,
        comments: comments.trim() || undefined,
      };

      await createReviewApi(payload);

      navigate('/my-reviews', { state: { reviewCreated: true }, replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setSubmitError(detail);
      } else if (Array.isArray(detail)) {
        setSubmitError(detail.map((d) => d.msg || JSON.stringify(d)).join('. '));
      } else if (err.response?.status === 409) {
        setSubmitError('A review has already been submitted for this booking.');
      } else if (err.response?.status === 400) {
        setSubmitError('Reviews can only be submitted for completed (checked-out) stays.');
      } else {
        setSubmitError('Failed to submit review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-[#253B33] animate-spin" />
        <p className="text-sm font-medium text-[#5A635F]">
          Checking reservation eligibility...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[#8C3A3A] mx-auto" />
        <h2 className="font-serif text-2xl text-[#16231E]">Review Unavailable</h2>
        <p className="text-sm text-[#5A635F]">{loadError}</p>
        <Link
          to="/my-bookings"
          className="inline-block mt-4 px-6 py-2.5 bg-[#16231E] hover:bg-[#253B33] text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors"
        >
          Back to My Bookings
        </Link>
      </div>
    );
  }

  // Guard: Review already exists for this booking
  if (existingReview) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-5">
        <div className="w-14 h-14 bg-[#EAF3EE] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-[#1B4D3E]" />
        </div>
        <h2 className="font-serif text-2xl sm:text-3xl text-[#16231E]">Review Already Submitted</h2>
        <p className="text-sm text-[#5A635F] max-w-sm mx-auto leading-relaxed">
          You have already submitted a review for Booking #{bookingId}. You can update your existing review anytime.
        </p>
        <div className="pt-3 flex items-center justify-center gap-3">
          <Link
            to={`/reviews/${existingReview.review_id}/edit`}
            className="px-6 py-3 bg-[#16231E] hover:bg-[#253B33] text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors"
          >
            Edit My Review
          </Link>
          <Link
            to={`/bookings/${bookingId}`}
            className="px-6 py-3 bg-[#EDE8E1] hover:bg-[#E2DDD5] text-[#16231E] font-semibold rounded-xl text-xs sm:text-sm transition-colors"
          >
            Back to Booking
          </Link>
        </div>
      </div>
    );
  }

  // Guard: Booking is not yet checked out
  if (booking && booking.status !== 'checked_out') {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="font-serif text-2xl sm:text-3xl text-[#16231E]">Stay Not Yet Completed</h2>
        <p className="text-sm text-[#5A635F] max-w-md mx-auto leading-relaxed">
          Reviews can only be submitted for completed stays. Your booking is currently in{' '}
          <strong className="font-bold text-amber-700 uppercase">{booking.status}</strong> status.
        </p>
        <Link
          to={`/bookings/${bookingId}`}
          className="inline-block mt-4 px-6 py-2.5 bg-[#16231E] text-white font-semibold rounded-xl text-xs sm:text-sm"
        >
          Back to Booking Details
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">

        {/* Back Navigation */}
        <Link
          to={`/bookings/${bookingId}`}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#8A6240] hover:text-[#16231E] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Booking #{bookingId}</span>
        </Link>

        {/* Header */}
        <div className="pb-6 border-b border-[#E6DFD5] space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#8A6240] block">
            Verified Guest Feedback
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#16231E] tracking-tight">
            Write a Review
          </h1>
          <p className="text-sm text-[#5A635F] font-light">
            Share your experience to help future travelers discover Kaveri Stays.
          </p>
        </div>

        {/* Booking Summary Strip */}
        {booking && (
          <div className="bg-[#F4EFEA] border border-[#E6DFD5] rounded-2xl p-4 sm:p-5 flex items-center justify-between text-xs text-[#5A635F] gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center space-x-1.5 font-bold text-[#16231E] text-sm">
                <Hotel className="w-3.5 h-3.5 text-[#8A6240] shrink-0" />
                <span className="truncate">Property #{booking.property_id || '—'} · Room #{booking.room_id}</span>
              </div>
              <p className="text-[#7A857F]">
                Stay: {formatDate(booking.check_in_date)} – {formatDate(booking.check_out_date)}
                {booking.total_nights ? ` (${booking.total_nights} nights)` : ''}
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF3EE] text-[#1B4D3E] border border-[#CDE3D6] shrink-0">
              Checked Out
            </span>
          </div>
        )}

        {/* Review Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">

          {/* Star Rating */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[#8A6240]">
              Overall Rating <span className="text-red-500">*</span>
            </label>
            <InteractiveStarRating
              rating={rating}
              onChange={(val) => setRating(val)}
              disabled={isSubmitting}
            />
          </div>

          {/* Comments */}
          <div className="space-y-2 pt-2 border-t border-[#E6DFD5]">
            <div className="flex justify-between items-center">
              <label htmlFor="review-comments" className="block text-[10px] font-bold uppercase tracking-wider text-[#8A6240]">
                Your Comments{' '}
                <span className="text-[11px] font-normal text-[#7A857F] normal-case">(Optional)</span>
              </label>
              <span className="text-[11px] text-[#7A857F] font-medium">
                {comments.length} / 2000
              </span>
            </div>

            <textarea
              id="review-comments"
              rows={5}
              maxLength={2000}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="What did you love about the property, rooms, and hospitality? Any tips for future travelers?"
              className="w-full p-4 text-sm bg-[#FBF9F5] border border-[#D8D0C5] rounded-2xl text-[#16231E] placeholder:text-[#A0A8A3] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all resize-none"
            />
          </div>

          <ErrorMessage message={submitError} onDismiss={() => setSubmitError('')} />

          {/* Submit */}
          <button
            type="submit"
            id="submit-review-btn"
            disabled={isSubmitting || !rating}
            className="w-full py-3.5 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#16231E] hover:bg-[#253B33] disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Publishing Review...</span>
              </>
            ) : (
              <>
                <Star className="w-4 h-4 text-amber-300" />
                <span>Publish Review</span>
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};

export default CreateReview;
