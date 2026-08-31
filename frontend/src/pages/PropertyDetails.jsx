import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  BedDouble,
  Calendar,
  Hotel,
  Loader2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { getPropertyByIdApi, getRoomTypesApi } from '../api/properties';
import { listReviewsApi, deleteReviewApi } from '../api/reviews';
import ReviewCard from '../components/review/ReviewCard';
import DeleteReviewDialog from '../components/review/DeleteReviewDialog';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import { PROPERTY_IMAGES, FALLBACK_IMAGES, IMAGE_LABELS, getPropertyImages } from '../config/propertyImages';

const RATING_FILTERS = [
  { label: 'All Reviews', value: '' },
  { label: '5 ★', value: 5 },
  { label: '4 ★', value: 4 },
  { label: '3 ★', value: 3 },
  { label: '2 ★', value: 2 },
  { label: '1 ★', value: 1 },
];

const getRoomPrice = (roomType) => (
  roomType.base_price
  || roomType.nightly_rate
  || roomType.price_per_night
  || roomType.rate
  || null
);

const formatINR = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  if (Number.isNaN(amount)) return null;
  return `₹${amount.toLocaleString('en-IN')}`;
};

const PropertyDetails = () => {
  const { propertyId } = useParams();
  const [property, setProperty] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [error, setError] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');

  // Interactive gallery state
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset active image on property navigation
  useEffect(() => {
    setActiveImageIndex(0);
  }, [propertyId]);

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
      setReviews(data || []);
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

  // Dedicated property image gallery dynamically selected from config
  const images = property ? (PROPERTY_IMAGES[property.property_id] || FALLBACK_IMAGES) : FALLBACK_IMAGES;
  const currentMainImage = images[activeImageIndex] || images[0] || FALLBACK_IMAGES[0];
  const availabilityPath = property ? `/properties/${property.property_id}/availability` : '/availability';

  const handlePrevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNextImage = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };
  
  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBF9F5] text-[#1A1E1C]">
      {deleteTargetId && (
        <DeleteReviewDialog
          reviewId={deleteTargetId}
          onConfirm={handleDeleteReview}
          onDismiss={() => setDeleteTargetId(null)}
          isDeleting={isDeleting}
        />
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <Loader2 className="h-9 w-9 animate-spin text-[#253B33]" />
          <p className="mt-4 text-sm font-semibold tracking-widest text-[#8A6240] uppercase">
            Preparing property details...
          </p>
        </div>
      )}

      {/* Error / Not Found state */}
      {!loading && !property && error && (
        <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <Link
            to="/properties"
            className="mb-8 inline-flex items-center gap-2 text-xs font-semibold text-[#5A635F] hover:text-[#16231E] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to All Properties
          </Link>
          <ErrorMessage message={error} onDismiss={() => setError('')} />
          <EmptyState
            title="Property Not Found"
            message={`Unable to load property details for ID #${propertyId}. It may have been removed or does not exist.`}
            actionLabel="Browse All Properties"
            onAction={() => window.location.assign('/properties')}
          />
        </main>
      )}

      {/* Main content when property is loaded */}
      {!loading && property && (
        <>
          {/* ══════════════════════════════════════════════════════════
              SECTION 1: HERO & INTERACTIVE PROPERTY GALLERY
              ══════════════════════════════════════════════════════════ */}
          <section className="relative min-h-[65vh] sm:min-h-[70vh] lg:min-h-[75vh] flex flex-col justify-between overflow-hidden">
            {/* Displayed main image */}
            <div className="absolute inset-0 z-0">
              <img
                src={currentMainImage}
                alt={`${property.name} - ${IMAGE_LABELS[activeImageIndex] || 'Gallery View'}`}
                className="w-full h-full object-cover object-[center_35%] transition-all duration-500 ease-in-out"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-black/80" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/30" />
            </div>

            {/* Top Navigation Overlay */}
            <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pt-6 flex items-center justify-between">
              <Link
                to="/properties"
                className="inline-flex items-center gap-2 border border-white/20 bg-black/30 hover:bg-white/15 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-widest text-white backdrop-blur-md transition-all"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>All Properties</span>
              </Link>

              {/* Gallery Image Counter */}
              <div className="bg-black/40 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-xl text-xs font-medium flex items-center space-x-2">
                <span className="text-amber-300 font-bold">{activeImageIndex + 1}</span>
                <span className="text-white/60">/</span>
                <span>{images.length}</span>
                <span className="text-white/40">·</span>
                <span className="text-white/90 hidden sm:inline-block font-semibold">
                  {IMAGE_LABELS[activeImageIndex] || 'Photo'}
                </span>
              </div>
            </div>

            {/* Interactive Image Gallery Carousel Arrows */}
            <button
              type="button"
              onClick={handlePrevImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleNextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all cursor-pointer"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Bottom Content & Interactive Thumbnails Overlay */}
            <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 mt-auto text-white space-y-6">
              <div className="max-w-3xl space-y-2.5">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[11px] font-bold uppercase tracking-[0.2em] text-amber-300">
                  <Sparkles className="w-3 h-3" />
                  <span>Kaveri Stays Collection</span>
                </div>

                <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal leading-[1.1] tracking-tight">
                  {property.name}
                </h1>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs sm:text-sm text-white/90 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-amber-300" />
                    {property.city}, Karnataka
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Star className="h-4 w-4 fill-amber-300 text-amber-300" />
                    {property.star_rating}.0 Star Luxury Retreat
                  </span>
                </div>
              </div>

              {/* Dedicated Gallery Thumbnails Row (Strictly for this Property) */}
              <div className="pt-2">
                <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
                  {images.map((imgSrc, idx) => {
                    const isActive = activeImageIndex === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative shrink-0 w-20 h-14 sm:w-24 sm:h-16 rounded-xl overflow-hidden border-2 transition-all cursor-pointer group ${
                          isActive
                            ? 'border-amber-400 ring-2 ring-amber-400/40 scale-105 shadow-md'
                            : 'border-white/30 opacity-70 hover:opacity-100 hover:border-white'
                        }`}
                        aria-label={`View photo ${idx + 1}: ${IMAGE_LABELS[idx] || 'Room'}`}
                      >
                        <img
                          src={imgSrc}
                          alt={IMAGE_LABELS[idx] || `Photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {isActive && (
                          <div className="absolute inset-0 bg-amber-500/10 pointer-events-none" />
                        )}
                        <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white py-0.5 text-center truncate px-1">
                          {IMAGE_LABELS[idx] ? IMAGE_LABELS[idx].split(' ')[0] : `Photo ${idx + 1}`}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════
              SECTION 2: QUICK INFORMATION STRIP
              ══════════════════════════════════════════════════════════ */}
          <section className="bg-[#F4EFEA] border-b border-[#E6DFD5]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
              <div className="grid grid-cols-1 divide-y divide-[#E6DFD5] sm:grid-cols-2 lg:grid-cols-4 sm:divide-y-0 sm:gap-6 lg:gap-8 text-sm">
                
                <div className="flex items-center gap-3 py-3 sm:py-0">
                  <MapPin className="h-4.5 w-4.5 text-[#8A6240] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#7A857F]">Location</p>
                    <p className="font-semibold text-[#16231E] mt-0.5">{property.city}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3 sm:py-0 sm:border-l sm:border-[#E6DFD5] sm:pl-6 lg:pl-8">
                  <Star className="h-4.5 w-4.5 fill-[#8A6240] text-[#8A6240] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#7A857F]">Rating</p>
                    <p className="font-semibold text-[#16231E] mt-0.5">{property.star_rating}.0 Star Luxury</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3 sm:py-0 lg:border-l lg:border-[#E6DFD5] lg:pl-8">
                  <BedDouble className="h-4.5 w-4.5 text-[#8A6240] shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#7A857F]">Room Types</p>
                    <p className="font-semibold text-[#16231E] mt-0.5">{roomTypes.length} Collections</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 py-3 sm:py-0 sm:border-l sm:border-[#E6DFD5] sm:pl-6 lg:pl-8">
                  <ShieldCheck className="h-4.5 w-4.5 text-emerald-800 shrink-0" />
                  <div>
                    <p className="text-[10px] uppercase font-bold tracking-widest text-[#7A857F]">Availability</p>
                    <p className="font-semibold text-emerald-950 mt-0.5">Live Database Locked</p>
                  </div>
                </div>

              </div>
            </div>
          </section>

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              <ErrorMessage message={error} onDismiss={() => setError('')} />
            </div>

            {/* ══════════════════════════════════════════════════════════
                SECTION 3: ABOUT THE STAY (EDITORIAL)
                ══════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 border-b border-[#E6DFD5]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
                <div className="lg:col-span-5 space-y-4">
                  <span className="text-xs uppercase tracking-[0.24em] font-bold text-[#8A6240]">
                    About the Stay
                  </span>
                  <h2 className="font-serif text-3xl sm:text-4xl font-normal leading-tight text-[#16231E]">
                    A calm retreat shaped by water, warm service, and regional character.
                  </h2>
                </div>
                <div className="lg:col-span-7 space-y-6 text-[#5A635F] text-[15px] sm:text-base leading-relaxed font-light">
                  <p>
                    Set in the historical landscapes of {property.city}, <strong className="font-semibold text-[#16231E]">{property.name}</strong> brings together generous South Indian hospitality, restful accommodations, quiet outdoor spaces, and a direct visual relationship to the river.
                  </p>
                  <p>
                    The experience here is deliberately unhurried: morning plantation coffee on wooden decks, garden walks underneath ancient rain trees, and traditional dining spaces shaped around regional flavors.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[#E6DFD5]">
                    {[
                      ['Verified', 'In-person reviewed stay'],
                      ['Calm', 'Nature-led resort rhythm'],
                      ['Direct', 'Clear availability check'],
                    ].map(([label, desc]) => (
                      <div key={label} className="border-l-2 border-[#8A6240] pl-4">
                        <p className="text-xs font-bold uppercase tracking-wider text-[#8A6240]">{label}</p>
                        <p className="mt-1 text-xs sm:text-sm text-[#16231E] font-medium">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                SECTION 4: STAY IMAGE GALLERY (BEDROOM & BATHROOM)
                ══════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 border-b border-[#E6DFD5]">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-10">
                <div>
                  <span className="text-xs uppercase tracking-[0.24em] font-bold text-[#8A6240]">
                    The Stay
                  </span>
                  <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#16231E] mt-2">
                    Rooms with quiet intention.
                  </h2>
                </div>
                <p className="text-[#5A635F] max-w-sm text-sm sm:text-[15px] leading-relaxed">
                  Natural textures, soft evening lighting, and thoughtful comforts designed for peaceful rest.
                </p>
              </div>

              {/* Composition using Hotel's dedicated bedroom and bathroom photos */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left: Master Suite Image */}
                <div className="lg:col-span-7 group">
                  <div className="aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-2xl border border-[#E6DFD5] bg-[#F4EFEA]">
                    <img
                      src={images[1] || images[0]}
                      alt={`${property.name} Bedroom & Suite`}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="pt-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A6240]">
                      MASTER SUITE
                    </p>
                    <p className="text-xs sm:text-sm text-[#5A635F] mt-1">
                      Thoughtfully designed spaces for slow mornings and peaceful evenings at {property.name}.
                    </p>
                  </div>
                </div>

                {/* Right: Bathing & Lounge Details */}
                <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  
                  {/* Bathroom suite */}
                  <div className="group">
                    <div className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/10] overflow-hidden rounded-2xl border border-[#E6DFD5] bg-[#F4EFEA]">
                      <img
                        src={images[2] || images[0]}
                        alt={`${property.name} Bathroom Suite`}
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A6240]">
                        BATHING SANCTUARY
                      </p>
                      <p className="text-xs text-[#5A635F] mt-0.5">
                        Calm bathing spaces shaped for restoration after long days outdoors.
                      </p>
                    </div>
                  </div>

                  {/* Exterior / Balcony View */}
                  <div className="group">
                    <div className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[16/10] overflow-hidden rounded-2xl border border-[#E6DFD5] bg-[#F4EFEA]">
                      <img
                        src={images[0]}
                        alt={`${property.name} Exterior Sanctuary`}
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A6240]">
                        RESORT AMBIANCE
                      </p>
                      <p className="text-xs text-[#5A635F] mt-0.5">
                        Lush greenery and calm architectural lines welcoming every stay.
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                SECTION 5: DINING & SOCIAL SPACES
                ══════════════════════════════════════════════════════════ */}
            <section className="-mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-[#EFECE6] border-y border-[#E6DFD5]">
              <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12 items-start">
                  <div className="lg:col-span-5 space-y-3">
                    <span className="text-xs uppercase tracking-[0.24em] font-bold text-[#8A6240]">
                      Dining & Evenings
                    </span>
                    <h2 className="font-serif text-2xl sm:text-4xl font-normal leading-tight text-[#16231E]">
                      Local meals, unhurried service, and evenings by the water.
                    </h2>
                  </div>
                  <p className="text-sm sm:text-[15px] leading-relaxed text-[#5A635F] lg:col-span-7 lg:pt-8 font-light">
                    Dining at {property.name} is shaped around regional recipes, freshly brewed plantation roasts, and open-air spaces designed for quiet moments.
                  </p>
                </div>

                {/* Asymmetric gallery with hotel's dining & bar images */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Left: Dining Image */}
                  <div className="lg:col-span-7 group">
                    <div className="aspect-[3/4] sm:aspect-[4/3] lg:aspect-[3/4] overflow-hidden rounded-2xl border border-[#DCD6CD] bg-[#EDE8E1]">
                      <img
                        src={images[3] || images[0]}
                        alt={`${property.name} Dining Setup`}
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A6240]">
                        PLANTATION & REGIONAL FLAVOURS
                      </p>
                    </div>
                  </div>

                  {/* Right: Bar & Evening Lounge */}
                  <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                    
                    {/* Bar Photo */}
                    <div className="group">
                      <div className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[1.5/1] overflow-hidden rounded-2xl border border-[#DCD6CD] bg-[#EDE8E1]">
                        <img
                          src={images[5] || images[3] || images[0]}
                          alt={`${property.name} Lounge Bar`}
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="pt-3">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A6240]">
                          EVENING LOUNGE & BAR
                        </p>
                      </div>
                    </div>

                    {/* Leisure moment */}
                    <div className="group">
                      <div className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[1.5/1] overflow-hidden rounded-2xl border border-[#DCD6CD] bg-[#EDE8E1]">
                        <img
                          src={images[4] || images[0]}
                          alt={`${property.name} Relaxing Area`}
                          className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="pt-3">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A6240]">
                          SUNSET CONVERSATIONS
                        </p>
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                SECTION 6: POOL & LEISURE
                ══════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 border-b border-[#E6DFD5]">
              <div className="max-w-3xl mb-12 space-y-3">
                <span className="text-xs uppercase tracking-[0.24em] font-bold text-[#8A6240]">
                  More Than A Stay
                </span>
                <h2 className="font-serif text-2xl sm:text-4xl font-normal leading-tight text-[#16231E]">
                  Space to swim, relax outdoors, and let the day stretch out.
                </h2>
              </div>

              {/* Asymmetric composition */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Left: Swimming pool image */}
                <div className="lg:col-span-8 group">
                  <div className="aspect-[3/4] sm:aspect-[16/10] lg:aspect-[4/3] overflow-hidden rounded-2xl border border-[#E6DFD5] bg-[#F4EFEA]">
                    <img
                      src={images[4] || images[0]}
                      alt={`${property.name} Swimming Pool`}
                      className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="pt-3">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A6240]">
                      INFINITY RESORT POOL
                    </p>
                  </div>
                </div>

                {/* Right: Stacked lifestyle moments */}
                <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  
                  {/* Evening refreshment */}
                  <div className="group">
                    <div className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[1.2/1] overflow-hidden rounded-2xl border border-[#E6DFD5] bg-[#F4EFEA]">
                      <img
                        src={images[5] || images[0]}
                        alt={`${property.name} Evening Drinks`}
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A6240]">
                        SUNDOWN DRINKS
                      </p>
                    </div>
                  </div>

                  {/* Gathering space */}
                  <div className="group">
                    <div className="aspect-[4/3] sm:aspect-[16/9] lg:aspect-[1.2/1] overflow-hidden rounded-2xl border border-[#E6DFD5] bg-[#F4EFEA]">
                      <img
                        src={images[3] || images[0]}
                        alt={`${property.name} Gathering`}
                        className="w-full h-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="pt-3">
                      <p className="text-[10px] uppercase tracking-widest font-bold text-[#8A6240]">
                        OPEN-AIR GATHERINGS
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            </section>

            {/* ══════════════════════════════════════════════════════════
                SECTION 7: ROOM TYPES SECTION (THE COLLECTION)
                ══════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 border-b border-[#E6DFD5]">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-5 mb-10">
                <div>
                  <span className="text-xs uppercase tracking-[0.24em] font-bold text-[#8A6240]">
                    Accommodations
                  </span>
                  <h2 className="font-serif text-2xl sm:text-4xl font-normal text-[#16231E] mt-2">
                    The Room Collection.
                  </h2>
                </div>
                <Link
                  to={availabilityPath}
                  className="inline-flex items-center space-x-2 px-5 py-3 rounded-lg text-xs font-bold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Check Live Dates</span>
                </Link>
              </div>

              {roomTypes.length === 0 ? (
                <EmptyState
                  title="No Room Types Available"
                  message="Room type details are not available for this property yet."
                />
              ) : (
                <div className="divide-y divide-[#E6DFD5] border-y border-[#E6DFD5]">
                  {roomTypes.map((roomType, index) => {
                    const formattedPrice = formatINR(getRoomPrice(roomType));
                    return (
                      <article
                        key={roomType.room_type_id}
                        className="grid grid-cols-1 gap-5 py-8 transition-colors hover:bg-[#F4EFEA]/40 md:grid-cols-12 md:items-center md:px-4"
                      >
                        <div className="md:col-span-5">
                          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
                            Collection {String(index + 1).padStart(2, '0')}
                          </p>
                          <h3 className="mt-1 font-serif text-2xl font-normal text-[#16231E]">
                            {roomType.name}
                          </h3>
                        </div>

                        {/* Capacities / Specs */}
                        <div className="grid grid-cols-1 gap-3 text-xs sm:text-sm text-[#5A635F] sm:grid-cols-3 md:col-span-5">
                          <span className="inline-flex items-center gap-2">
                            <Users className="h-4 w-4 text-[#8A6240] shrink-0" />
                            <span>Up to {roomType.max_occupancy} Guests</span>
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <BedDouble className="h-4 w-4 text-[#8A6240] shrink-0" />
                            <span>Bespoke Linens</span>
                          </span>
                          <span className="inline-flex items-center gap-2">
                            <Hotel className="h-4 w-4 text-[#8A6240] shrink-0" />
                            <span>Type #{roomType.room_type_id}</span>
                          </span>
                        </div>

                        {/* Price & Action */}
                        <div className="flex items-center justify-between gap-4 md:col-span-2 md:justify-end">
                          <div className="text-right">
                            {formattedPrice ? (
                              <>
                                <p className="text-base sm:text-lg font-semibold text-[#16231E]">{formattedPrice}</p>
                                <p className="text-[11px] text-[#7A857F]">per night</p>
                              </>
                            ) : (
                              <p className="text-[11px] font-bold uppercase tracking-wider text-[#7A857F]">
                                Seasonal Rates
                              </p>
                            )}
                          </div>
                          
                          <Link
                            to={`${availabilityPath}?room_type_id=${roomType.room_type_id}`}
                            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#D8D0C5] text-[#16231E] hover:border-[#16231E] hover:bg-[#16231E] hover:text-white transition-all"
                            aria-label={`View availability for ${roomType.name}`}
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* ══════════════════════════════════════════════════════════
                SECTION 8: GUEST REVIEWS & FEEDBACK
                ══════════════════════════════════════════════════════════ */}
            <section className="py-16 sm:py-24 border-b border-[#E6DFD5]">
              <div className="flex flex-col gap-6 border-b border-[#E6DFD5] pb-6 mb-8 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-[#8A6240]">
                    <MessageSquare className="h-4 w-4" />
                    <span>Verified Guest Feedback</span>
                  </div>
                  <h2 className="mt-3 font-serif text-2xl sm:text-4xl font-normal text-[#16231E]">
                    Guest Reviews & Ratings
                  </h2>
                  <p className="mt-2 max-w-2xl text-xs sm:text-sm text-[#5A635F] leading-relaxed">
                    Real, unedited reviews shared by guests who completed their stay at {property.name}.
                  </p>
                </div>

                {/* Rating filter tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <SlidersHorizontal className="h-4 w-4 shrink-0 text-[#8A6240] mr-1" />
                  {RATING_FILTERS.map((f) => (
                    <button
                      key={f.value}
                      type="button"
                      onClick={() => setRatingFilter(f.value)}
                      className={`shrink-0 px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors cursor-pointer ${
                        ratingFilter === f.value
                          ? 'border-[#16231E] bg-[#16231E] text-white'
                          : 'border-[#D8D0C5] bg-transparent text-[#5A635F] hover:border-[#16231E]'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {reviewsLoading ? (
                <div className="flex flex-col items-center justify-center py-14">
                  <Loader2 className="h-7 w-7 animate-spin text-[#253B33]" />
                  <p className="mt-3 text-xs text-[#7A857F] tracking-wide">Loading reviews...</p>
                </div>
              ) : reviews.length === 0 ? (
                <EmptyState
                  title={ratingFilter ? `No ${ratingFilter} Reviews` : 'No Reviews Yet'}
                  message={
                    ratingFilter
                      ? 'No reviews match this specific rating filter.'
                      : `Be the first guest to share your experience after completing your stay at ${property.name}!`
                  }
                />
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col gap-2 text-xs sm:text-sm font-semibold text-[#5A635F] sm:flex-row sm:items-center sm:justify-between px-1">
                    <span>Showing {reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                    {avgRating && (
                      <span className="inline-flex w-fit items-center gap-1.5 border border-[#E6DFD5] bg-[#F4EFEA] px-2.5 py-1 text-xs font-bold text-[#8A6240] rounded-md">
                        <Star className="h-3.5 w-3.5 fill-[#8A6240] text-[#8A6240]" />
                        <span>Average Score: {avgRating} / 5.0</span>
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </section>

          </main>

          {/* ══════════════════════════════════════════════════════════
              SECTION 9: FINAL IMMERSIVE VISUAL OUTRO BANNER
              ══════════════════════════════════════════════════════════ */}
          <section className="relative min-h-[400px] flex flex-col justify-end overflow-hidden">
            <img
              src={images[0]}
              alt={`${property.name} dusk ambiance`}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            
            <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16 text-white text-left">
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-amber-300">
                Your time by the Kaveri awaits
              </span>
              <h2 className="mt-3 max-w-2xl font-serif text-3xl sm:text-5xl font-normal leading-tight text-white">
                Explore availability and plan your stay at {property.name}.
              </h2>
              <div className="mt-8">
                <Link
                  to={availabilityPath}
                  className="inline-flex items-center gap-2 bg-white hover:bg-[#FBF9F5] text-[#16231E] px-6 py-3.5 rounded-lg text-sm font-semibold transition-colors"
                >
                  <span>Check Availability</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default PropertyDetails;
