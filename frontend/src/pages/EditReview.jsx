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
          setLoadError('Failed to load review. Please try again.');
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-[#253B33] animate-spin" />
        <p className="text-sm font-medium text-[#5A635F]">Loading review...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[#8C3A3A] mx-auto" />
        <h2 className="font-serif text-2xl text-[#16231E]">Cannot Edit Review</h2>
        <p className="text-sm text-[#5A635F]">{loadError}</p>
        <Link
          to="/my-reviews"
          className="inline-block mt-4 px-6 py-2.5 bg-[#16231E] hover:bg-[#253B33] text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors"
        >
          Back to My Reviews
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">

        {/* Back Navigation */}
        <Link
          to="/my-reviews"
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#8A6240] hover:text-[#16231E] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to My Reviews</span>
        </Link>

        {/* Header */}
        <div className="pb-6 border-b border-[#E6DFD5] space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#8A6240] block">
            Review Management
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#16231E] tracking-tight">
            Edit Your Review
          </h1>
          <p className="text-sm text-[#5A635F] font-light">
            Update your star rating and written feedback for Booking #{review?.booking_id}.
          </p>
        </div>

        {/* Form */}
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
              <label htmlFor="edit-comments" className="block text-[10px] font-bold uppercase tracking-wider text-[#8A6240]">
                Your Comments
              </label>
              <span className="text-[11px] text-[#7A857F] font-medium">
                {comments.length} / 2000
              </span>
            </div>

            <textarea
              id="edit-comments"
              rows={5}
              maxLength={2000}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Update your thoughts about this stay..."
              className="w-full p-4 text-sm bg-[#FBF9F5] border border-[#D8D0C5] rounded-2xl text-[#16231E] placeholder:text-[#A0A8A3] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all resize-none"
            />
          </div>

          <ErrorMessage message={submitError} onDismiss={() => setSubmitError('')} />

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Link
              to="/my-reviews"
              className="flex-1 py-3 px-4 rounded-xl text-center text-xs sm:text-sm font-semibold text-[#16231E] bg-[#EDE8E1] hover:bg-[#E2DDD5] border border-[#D8D0C5] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              id="save-review-btn"
              disabled={isSubmitting || !rating}
              className="flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#16231E] hover:bg-[#253B33] disabled:opacity-50 transition-colors flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
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
    </div>
  );
};

export default EditReview;
