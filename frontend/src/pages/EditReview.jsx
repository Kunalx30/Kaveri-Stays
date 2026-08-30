import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Star, ArrowLeft, Loader2, AlertCircle, Edit3,
} from 'lucide-react';
import { getReviewByIdApi, updateReviewApi } from '../api/reviews';
import { InteractiveStarRating } from '../components/review/ReviewRating';
import ErrorMessage from '../components/common/ErrorMessage';

const EditReview = () => {
  const { reviewId } = useParams();
  const navigate = useNavigate();

  const [review, setReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  useEffect(() => {
    const fetchReview = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const data = await getReviewByIdApi(Number(reviewId));
        setReview(data);
        setRating(data.rating || 5);
        setComments(data.comments || '');
      } catch (err) {
        if (err.response?.status === 404) {
          setLoadError(`Review #${reviewId} not found.`);
        } else if (err.response?.status === 403) {
          setLoadError('Access denied: You do not have permission to modify this review.');
        } else {
          setLoadError('Failed to load review.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchReview();
  }, [reviewId]);

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
        rating: rating,
        comments: comments.trim() || undefined,
      };

      await updateReviewApi(Number(reviewId), payload);

      navigate('/my-reviews', { state: { reviewUpdated: true }, replace: true });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setSubmitError(detail);
      } else if (Array.isArray(detail)) {
        setSubmitError(detail.map((d) => d.msg || JSON.stringify(d)).join('. '));
      } else if (err.response?.status === 403) {
        setSubmitError('Access denied: You can only update your own reviews.');
      } else {
        setSubmitError('Failed to update review. Please try again.');
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
          Loading review...
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Cannot Edit Review</h2>
        <p className="text-sm text-slate-500">{loadError}</p>
        <Link
          to="/my-reviews"
          className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm"
        >
          Back to My Reviews
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Back Navigation */}
      <Link
        to="/my-reviews"
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to My Reviews</span>
      </Link>

      {/* Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
          Review Management
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Edit Review #{reviewId}
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Update your star rating and feedback for Booking #{review?.booking_id}.
        </p>
      </div>

      {/* Form */}
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
            <label htmlFor="edit-comments" className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Your Review Commentary
            </label>
            <span className="text-[11px] text-slate-400 font-medium">
              {comments.length} / 2000
            </span>
          </div>

          <div className="relative">
            <textarea
              id="edit-comments"
              rows={5}
              maxLength={2000}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full p-4 text-sm bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>
        </div>

        <ErrorMessage message={submitError} onDismiss={() => setSubmitError('')} />

        {/* Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <Link
            to="/my-reviews"
            className="flex-1 py-3 px-4 rounded-xl text-center text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            id="save-review-btn"
            disabled={isSubmitting || !rating}
            className="flex-1 py-3 px-4 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 shadow-md shadow-blue-500/20 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Edit3 className="w-4 h-4" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditReview;
