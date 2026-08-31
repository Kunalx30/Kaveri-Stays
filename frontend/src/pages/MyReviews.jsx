import React, { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Star, Loader2, RefreshCw, SlidersHorizontal, CheckCircle2, MessageSquare, Sparkles,
} from 'lucide-react';
import { listReviewsApi, deleteReviewApi } from '../api/reviews';
import { useAuth } from '../context/AuthContext';
import ReviewCard from '../components/review/ReviewCard';
import DeleteReviewDialog from '../components/review/DeleteReviewDialog';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';

const RATING_FILTERS = [
  { label: 'All Ratings', value: '' },
  { label: '5 ★', value: 5 },
  { label: '4 ★', value: 4 },
  { label: '3 ★', value: 3 },
  { label: '2 ★', value: 2 },
  { label: '1 ★', value: 1 },
];

/**
 * MyReviews Page
 *
 * Route: /my-reviews
 *
 * Lists reviews for the authenticated user based on role:
 *   - Guest: Reviews submitted by the current guest (backend isolates).
 *   - Manager / Staff: Reviews for their assigned property (backend isolates).
 *   - Owner: All reviews across all properties (backend isolates).
 *
 * Backend authorization is the source of truth.
 * No client-side role filtering is applied to the returned data.
 */
const MyReviews = () => {
  const { user } = useAuth();
  const location = useLocation();

  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  // Delete State
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success messages from navigation state or delete action
  const [actionSuccess, setActionSuccess] = useState(
    location.state?.reviewCreated ? 'Review submitted successfully!' :
    location.state?.reviewUpdated ? 'Review updated successfully!' : ''
  );

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (ratingFilter !== '') params.rating = ratingFilter;
      const data = await listReviewsApi(params);
      setReviews(data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else {
        setError('Failed to load reviews. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId || isDeleting) return;
    setIsDeleting(true);
    setError('');
    try {
      await deleteReviewApi(deleteTargetId);
      setReviews((prev) => prev.filter((r) => r.review_id !== deleteTargetId));
      setDeleteTargetId(null);
      setActionSuccess('Review deleted successfully.');
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to delete review. Please try again.');
      setDeleteTargetId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getRoleDescription = () => {
    switch (user?.role) {
      case 'guest':
        return 'Reviews and star ratings you have submitted for completed stays.';
      case 'manager':
        return 'Guest reviews submitted for your assigned retreat.';
      case 'staff':
        return 'Guest reviews for your assigned retreat.';
      case 'owner':
        return 'All guest reviews across all Kaveri Stays properties.';
      default:
        return 'Your review history.';
    }
  };

  const pageTitle = user?.role === 'guest' ? 'My Reviews' : 'Property Reviews';

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <DeleteReviewDialog
          reviewId={deleteTargetId}
          onConfirm={handleDeleteConfirm}
          onDismiss={() => setDeleteTargetId(null)}
          isDeleting={isDeleting}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">

        {/* ════════════════════════════════════════════════════
            HEADER
            ════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E6DFD5]">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Guest Feedback</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#16231E] leading-[1.15]">
              {pageTitle}
            </h1>

            <p className="text-sm sm:text-[15px] text-[#5A635F] leading-relaxed font-light">
              {getRoleDescription()}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <Link
              to="/my-bookings"
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors shadow-2xs"
            >
              My Bookings
            </Link>

            <button
              onClick={fetchReviews}
              disabled={isLoading}
              className="p-2.5 rounded-xl text-[#5A635F] hover:text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh reviews"
              aria-label="Refresh reviews"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════
            SUCCESS BANNER
            ════════════════════════════════════════════════════ */}
        {actionSuccess && (
          <div className="bg-[#EAF3EE] border border-[#CDE3D6] rounded-2xl p-4 flex items-center justify-between text-[#1B4D3E]">
            <div className="flex items-center space-x-2.5 text-sm">
              <CheckCircle2 className="w-4 h-4 text-[#1B4D3E] shrink-0" />
              <span className="font-semibold">{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess('')}
              className="text-[#2A6E59] hover:text-[#1B4D3E] font-bold ml-3 text-lg leading-none"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            SUMMARY + FILTERS STRIP
            ════════════════════════════════════════════════════ */}
        {!isLoading && !error && reviews.length > 0 && (
          <div className="p-5 sm:p-6 rounded-2xl bg-[#F4EFEA] border border-[#E6DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#7A857F]">
                Showing
              </span>
              <p className="text-sm font-semibold text-[#16231E]">
                {reviews.length} {reviews.length === 1 ? 'review' : 'reviews'}
                {ratingFilter ? ` · ${ratingFilter}-star filter active` : ''}
              </p>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#8A6240] shrink-0 mr-1" />
              {RATING_FILTERS.map((f) => {
                const isActive = ratingFilter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setRatingFilter(f.value)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#16231E] text-white shadow-xs'
                        : 'bg-white text-[#5A635F] hover:text-[#16231E] hover:bg-[#EDE8E1] border border-[#E6DFD5]'
                    }`}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* ════════════════════════════════════════════════════
            LOADING STATE
            ════════════════════════════════════════════════════ */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-[#253B33] animate-spin" />
            <p className="text-sm text-[#5A635F] font-medium">Loading reviews...</p>
          </div>
        )}

        {/* ════════════════════════════════════════════════════
            REVIEWS GRID
            ════════════════════════════════════════════════════ */}
        {!isLoading && !error && (
          reviews.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={MessageSquare}
                title={ratingFilter ? `No ${ratingFilter}-Star Reviews` : 'No Reviews Yet'}
                message={
                  ratingFilter
                    ? 'Try selecting a different rating filter above.'
                    : user?.role === 'guest'
                    ? 'You have not reviewed any completed stays yet. Once your stay is checked out, you can share your feedback.'
                    : 'No reviews have been submitted for your property yet.'
                }
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.review_id}
                  review={review}
                  onDelete={(id) => setDeleteTargetId(id)}
                  showPropertyLink={user?.role !== 'guest'}
                />
              ))}
            </div>
          )
        )}

      </div>
    </div>
  );
};

export default MyReviews;
