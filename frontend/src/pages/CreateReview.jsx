import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, MessageSquare, ArrowLeft, Loader2, AlertCircle,
  CheckCircle2, Hotel, CalendarCheck, FileText,
} from 'lucide-react';
import { getBookingByIdApi } from '../api/bookings';
import { createReviewApi, listReviewsApi } from '../api/reviews';
import { InteractiveStarRating } from '../components/review/ReviewRating';
import ErrorMessage from '../components/common/ErrorMessage';

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
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
        if (reviewsData.length > 0) {
          setExistingReview(reviewsData[0]);
        }
      } catch (err) {
        if (err.response?.status === 404) {
          setLoadError(`Booking #${bookingId} not found.`);
        } else if (err.response?.status === 403) {
          setLoadError('Access denied: You do not have permission to review this booking.');
        } else {
          setLoadError('Failed to load booking details.');
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

      // Redirect to My Reviews page with success flag
      navigate('/my-reviews', { state: { reviewCreated: true }, replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setSubmitError(detail);
      } else if (Array.isArray(detail)) {
        setSubmitError(detail.map((d) => d.msg || JSON.stringify(d)).join('. '));
      } else if (err.response?.status === 400) {
        setSubmitError(detail || 'Reviews can only be submitted for completed (checked-out) stays.');
      } else if (err.response?.status === 409) {
        setSubmitError('A review already exists for this booking.');
      } else {
        setSubmitError('Failed to submit review. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Checking reservation eligibility...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Review Unavailable</h2>
        <p className="text-sm text-slate-500">{loadError}</p>
        <Link
          to="/my-bookings"
          className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm"
        >
          Back to My Bookings
        </Link>
      </div>
    );
  }

  // Check 1: Review already submitted for this booking
  if (existingReview) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Review Already Submitted</h2>
        <p className="text-sm text-slate-600 max-w-sm mx-auto">
          You have already submitted a review for Booking #{bookingId}. You can update your existing review anytime.
        </p>
        <div className="pt-2 flex items-center justify-center space-x-3">
          <Link
            to={`/reviews/${existingReview.review_id}/edit`}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors"
          >
            Edit My Review
          </Link>
          <Link
            to={`/bookings/${bookingId}`}
            className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-sm hover:bg-slate-200 transition-colors"
          >
            Back to Booking
          </Link>
        </div>
      </div>
    );
  }

  // Check 2: Booking is not in checked_out status
  if (booking && booking.status !== 'checked_out') {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-black text-slate-900">Stay Not Completed Yet</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Reviews can only be submitted for completed stays (checked-out reservations). Current booking status is{' '}
          <strong className="font-bold text-amber-700 uppercase">'{booking.status}'</strong>.
        </p>
        <div className="pt-2">
          <Link
            to={`/bookings/${bookingId}`}
            className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm hover:bg-blue-700 transition-colors inline-block"
          >
            Back to Booking Details
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Back Navigation */}
      <Link
        to={`/bookings/${bookingId}`}
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Booking #{bookingId}</span>
      </Link>

      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
          Verified Guest Feedback
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Write a Review
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Share your experience to help fellow travelers discover Kaveri Stays.
        </p>
      </div>

      {/* Booking Summary Box */}
      {booking && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs text-slate-700">
          <div className="space-y-0.5">
            <div className="flex items-center space-x-1.5 font-bold text-slate-900">
              <Hotel className="w-3.5 h-3.5 text-blue-600" />
              <span>Property #{booking.property_id || '1'} • Room #{booking.room_id}</span>
            </div>
            <p className="text-slate-500">
              Stay: {formatDate(booking.check_in_date)} to {formatDate(booking.check_out_date)} ({booking.total_nights || 1} nights)
            </p>
          </div>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            Checked Out
          </span>
        </div>
      )}

      {/* Review Form */}
      <form onSubmit={handleSubmit} className="space-y-6 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
        {/* Star Rating Section */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            Overall Rating <span className="text-red-500">*</span>
          </label>
          <InteractiveStarRating
            rating={rating}
            onChange={(val) => setRating(val)}
            disabled={isSubmitting}
          />
        </div>

        {/* Comments Section */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label htmlFor="review-comments" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Review Commentary <span className="text-xs font-normal text-slate-400">(Optional)</span>
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {comments.length} / 2000
            </span>
          </div>

          <div className="relative">
            <textarea
              id="review-comments"
              rows={5}
              maxLength={2000}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="What did you love about the property, rooms, hospitality, and riverside scenery? Any tips for future travelers?"
              className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        <ErrorMessage message={submitError} onDismiss={() => setSubmitError('')} />

        {/* Submit Button */}
        <button
          type="submit"
          id="submit-review-btn"
          disabled={isSubmitting || !rating}
          className="w-full py-3.5 px-4 rounded-xl text-sm font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Publishing Review...</span>
            </>
          ) : (
            <>
              <Star className="w-4 h-4" />
              <span>Publish Review</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateReview;
