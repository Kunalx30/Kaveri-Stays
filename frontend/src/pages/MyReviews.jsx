import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Star, Loader2, RefreshCw, SlidersHorizontal, CheckCircle2, MessageSquare,
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
 *   - Guest: Reviews submitted by the current guest.
 *   - Manager / Staff: Reviews for their assigned property.
 *   - Owner: All reviews across properties.
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
  const [actionSuccess, setActionSuccess] = useState(
    location.state?.reviewCreated ? 'Review submitted successfully!' :
    location.state?.reviewUpdated ? 'Review updated successfully!' : ''
  );

  const fetchReviews = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (ratingFilter) params.rating = ratingFilter;
      const data = await listReviewsApi(params);

      // If user is guest, filter to guest's reviews (backend returns all public reviews for guest query unless filtered)
      if (user?.role === 'guest' && user?.guest_id) {
        setReviews(data.filter((r) => r.guest_id === user.guest_id));
      } else {
        setReviews(data);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else {
        setError('Failed to load reviews. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [ratingFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    setError('');
    try {
      await deleteReviewApi(deleteTargetId);
      setReviews((prev) => prev.filter((r) => r.review_id !== deleteTargetId));
      setDeleteTargetId(null);
      setActionSuccess('Review deleted successfully.');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete review.');
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
        return 'Guest reviews submitted for your assigned property.';
      case 'staff':
        return 'Guest reviews for your assigned property.';
      case 'owner':
        return 'All guest reviews across all Kaveri Stays properties.';
      default:
        return 'Your review history.';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {deleteTargetId && (
        <DeleteReviewDialog
          reviewId={deleteTargetId}
          onConfirm={handleDeleteConfirm}
          onDismiss={() => setDeleteTargetId(null)}
          isDeleting={isDeleting}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <MessageSquare className="w-4 h-4" />
            <span>Guest Feedback</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {user?.role === 'guest' ? 'My Reviews' : 'Property Reviews'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{getRoleDescription()}</p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/my-bookings"
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
          >
            My Bookings
          </Link>

          <button
            onClick={fetchReviews}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh reviews"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess('')}
            className="text-emerald-500 hover:text-emerald-700 font-bold ml-3"
          >
            &times;
          </button>
        </div>
      )}

      {/* Rating Filters */}
      {!isLoading && !error && (
        <div className="flex items-center justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="text-xs text-slate-600">
            <span>Total Reviews: <strong>{reviews.length}</strong></span>
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
            {RATING_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setRatingFilter(f.value)}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                  ratingFilter === f.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-2">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-400 animate-pulse">Loading reviews...</p>
        </div>
      )}

      {/* Reviews Grid */}
      {!isLoading && !error && (
        reviews.length === 0 ? (
          <EmptyState
            title={ratingFilter ? `No ${ratingFilter}-Star Reviews` : 'No Reviews Found'}
            message={
              ratingFilter
                ? 'Try selecting a different rating filter above.'
                : user?.role === 'guest'
                ? 'You have not reviewed any completed stays yet. Once you complete a check-out, you can share your feedback!'
                : 'No reviews found for this property.'
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {reviews.map((review) => (
              <ReviewCard
                key={review.review_id}
                review={review}
                onDelete={(id) => setDeleteTargetId(id)}
                showPropertyLink={true}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default MyReviews;
