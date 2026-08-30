import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Hotel, MapPin, Star, Calendar, ArrowLeft, Users, ShieldCheck,
  Waves, Coffee, Wifi, Sparkles, Loader2, MessageSquare, SlidersHorizontal,
} from 'lucide-react';
import { getPropertyByIdApi, getRoomTypesApi } from '../api/properties';
import { listReviewsApi, deleteReviewApi } from '../api/reviews';
import StarRating from '../components/review/ReviewRating';
import ReviewCard from '../components/review/ReviewCard';
import DeleteReviewDialog from '../components/review/DeleteReviewDialog';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const RATING_FILTERS = [
  { label: 'All Reviews', value: '' },
  { label: '5 ★', value: 5 },
  { label: '4 ★', value: 4 },
  { label: '3 ★', value: 3 },
  { label: '2 ★', value: 2 },
  { label: '1 ★', value: 1 },
];

const PropertyDetails = () => {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  // Delete Review State
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        const [propData, typesData] = await Promise.all([
          getPropertyByIdApi(propertyId),
          getRoomTypesApi(),
        ]);
        setProperty(propData);
        setRoomTypes(typesData);
      } catch (err) {
        const detail = err.response?.data?.detail;
        setError(typeof detail === 'string' ? detail : `Property with ID #${propertyId} could not be found.`);
      } finally {
        setLoading(false);
      }
    };

    if (propertyId) {
      fetchDetails();
    }
  }, [propertyId]);

  const fetchReviews = async () => {
    setReviewsLoading(true);
    try {
      const params = { property_id: Number(propertyId) };
      if (ratingFilter) params.rating = ratingFilter;
      const data = await listReviewsApi(params);
      setReviews(data);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (propertyId) {
      fetchReviews();
    }
  }, [propertyId, ratingFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteReview = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);
    try {
      await deleteReviewApi(deleteTargetId);
      setReviews((prev) => prev.filter((r) => r.review_id !== deleteTargetId));
      setDeleteTargetId(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete review.');
      setDeleteTargetId(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate display-only review average if reviews exist
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {deleteTargetId && (
        <DeleteReviewDialog
          reviewId={deleteTargetId}
          onConfirm={handleDeleteReview}
          onDismiss={() => setDeleteTargetId(null)}
          isDeleting={isDeleting}
        />
      )}

      {/* Back Button */}
      <div>
        <Link
          to="/properties"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Properties</span>
        </Link>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {loading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading property details...</p>
        </div>
      )}

      {!loading && error && (
        <EmptyState
          title="Property Not Found"
          message={`Unable to load property details for ID #${propertyId}. It may have been removed or does not exist.`}
          actionLabel="Browse All Properties"
          onAction={() => window.location.assign('/properties')}
        />
      )}

      {!loading && property && (
        <div className="space-y-10">
          {/* Main Hero Header Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-10 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  <Hotel className="w-3.5 h-3.5" />
                  <span>Kaveri Stays Certified Resort</span>
                </div>

                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                  {property.name}
                </h1>

                <p className="text-sm text-slate-500 flex items-center space-x-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>{property.city}, Karnataka</span>
                </p>
              </div>

              {/* Star Rating Badge */}
              <div className="flex items-center space-x-1.5 bg-amber-50 border border-amber-200 px-4 py-2 rounded-2xl self-start sm:self-auto">
                <Star className="w-5 h-5 fill-amber-400 text-amber-500" />
                <span className="text-lg font-black text-amber-900">{property.star_rating}.0</span>
                <span className="text-xs text-amber-700 font-semibold">/ 5 Star Luxury</span>
              </div>
            </div>

            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">
              Nestled on the serene banks of the river Kaveri, <strong>{property.name}</strong> blends timeless regional architecture with modern luxury. Enjoy picturesque water views, manicured gardens, fine dining, and warm hospitality.
            </p>

            {/* Property Highlights */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl">
                <Waves className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Riverfront View</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl">
                <Wifi className="w-4 h-4 text-indigo-500 shrink-0" />
                <span>High-Speed WiFi</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl">
                <Coffee className="w-4 h-4 text-amber-500 shrink-0" />
                <span>Gourmet Breakfast</span>
              </div>
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-600 bg-slate-50 p-3 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>24/7 Security</span>
              </div>
            </div>

            {/* Check Availability CTA */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-2xl">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2 justify-center sm:justify-start">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Planning your vacation?</span>
                </h3>
                <p className="text-xs text-blue-100/80">
                  Search live available rooms and view dynamic seasonal rates for your preferred dates.
                </p>
              </div>

              <Link
                to={`/properties/${property.property_id}/availability`}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl font-bold text-xs sm:text-sm text-blue-900 bg-white hover:bg-blue-50 shadow-md shadow-black/10 transition-all hover:scale-105 shrink-0"
              >
                <Calendar className="w-4 h-4" />
                <span>Check Availability at this Hotel</span>
              </Link>
            </div>
          </div>

          {/* Room Categories & Types Section */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-black text-slate-900">Room Categories & Accommodations</h2>
              <p className="text-xs text-slate-500">
                Explore the room types offered across our properties.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {roomTypes.map((rt) => (
                <div
                  key={rt.room_type_id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold text-slate-900">{rt.name}</h3>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      Category #{rt.room_type_id}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-xs text-slate-500">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Up to <strong>{rt.max_occupancy}</strong> Guests Capacity</span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    Thoughtfully designed with plush bedding, private balcony access, and climate control.
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Guest Reviews & Ratings Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center space-x-1.5 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
                  <MessageSquare className="w-4 h-4" />
                  <span>Verified Guest Feedback</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                  Guest Reviews & Ratings
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Real experiences shared by guests who completed their stay at {property.name}.
                </p>
              </div>

              {/* Star Rating Filters */}
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

            {reviewsLoading ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                <p className="text-xs text-slate-400">Loading guest reviews...</p>
              </div>
            ) : reviews.length === 0 ? (
              <EmptyState
                title={ratingFilter ? `No ${ratingFilter}-Star Reviews` : 'No Reviews Yet'}
                message={
                  ratingFilter
                    ? 'No reviews match this specific star rating filter.'
                    : `Be the first guest to share your experience after completing your stay at ${property.name}!`
                }
              />
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                  <span>Showing {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                  {avgRating && (
                    <div className="flex items-center space-x-1.5">
                      <span>Average Score:</span>
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-black text-[11px]">
                        ★ {avgRating} / 5.0
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((rev) => (
                    <ReviewCard
                      key={rev.review_id}
                      review={rev}
                      onDelete={(id) => setDeleteTargetId(id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyDetails;
