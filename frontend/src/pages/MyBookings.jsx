import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays, Loader2, RefreshCw, SlidersHorizontal, Plus, Sparkles,
} from 'lucide-react';
import { listBookingsApi } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import BookingCard from '../components/booking/BookingCard';
import EmptyState from '../components/common/EmptyState';
import ErrorMessage from '../components/common/ErrorMessage';

/**
 * Booking status filter options (matching actual backend BookingStatus enum values)
 */
const STATUS_FILTERS = [
  { label: 'All Stays', value: '' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Checked In', value: 'checked_in' },
  { label: 'Completed', value: 'checked_out' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No Show', value: 'no_show' },
];

/**
 * MyBookings Page
 *
 * Protected route: /my-bookings
 */
const MyBookings = () => {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchBookings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await listBookingsApi(params);
      setBookings(data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else {
        setError('Failed to load your reservations. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const getRoleDescription = () => {
    switch (user?.role) {
      case 'guest':
        return 'Review upcoming stays, manage your reservations, and revisit your Kaveri Stays experiences.';
      case 'manager':
        return 'Bookings within your assigned retreat are organized below.';
      case 'staff':
        return 'Current guest reservations for your property.';
      case 'owner':
        return 'All reservations across the Kaveri Stays retreat network.';
      default:
        return 'Review upcoming stays, manage your reservations, and revisit your Kaveri Stays experiences.';
    }
  };

  // Calculate high-level stats from current loaded list
  const totalCount = bookings.length;
  const upcomingCount = bookings.filter((b) => b.status === 'confirmed' || b.status === 'checked_in').length;
  const completedCount = bookings.filter((b) => b.status === 'checked_out').length;
  const cancelledCount = bookings.filter((b) => b.status === 'cancelled').length;

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">
        
        {/* ══════════════════════════════════════════════════════════
            SECTION 1: EDITORIAL HEADER
            ══════════════════════════════════════════════════════════ */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E6DFD5]">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Your Stays</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#16231E] leading-[1.15]">
              Your reservations, <br className="hidden sm:inline" />
              <span className="italic text-[#253B33]">beautifully organised.</span>
            </h1>

            <p className="text-sm sm:text-[15px] text-[#5A635F] leading-relaxed font-light">
              {getRoleDescription()}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <Link
              to="/availability"
              className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 text-amber-200" />
              <span>Explore New Stays</span>
            </Link>

            <button
              onClick={fetchBookings}
              disabled={isLoading}
              className="p-2.5 rounded-xl text-[#5A635F] hover:text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh reservations"
              aria-label="Refresh reservations"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2: SUMMARY STATS STRIP
            ══════════════════════════════════════════════════════════ */}
        {!isLoading && !error && bookings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-5 rounded-2xl bg-[#F4EFEA] border border-[#E6DFD5]">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#7A857F]">Total Stays</span>
              <p className="font-serif text-2xl font-normal text-[#16231E]">{totalCount}</p>
            </div>

            <div className="space-y-0.5 sm:border-l sm:border-[#E6DFD5] sm:pl-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#1B4D3E]">Upcoming / Active</span>
              <p className="font-serif text-2xl font-normal text-[#1B4D3E]">{upcomingCount}</p>
            </div>

            <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-[#E6DFD5] pt-3 sm:pt-0 sm:pl-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#555E58]">Completed</span>
              <p className="font-serif text-2xl font-normal text-[#555E58]">{completedCount}</p>
            </div>

            <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-[#E6DFD5] pt-3 sm:pt-0 sm:pl-4">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C3A3A]">Cancelled</span>
              <p className="font-serif text-2xl font-normal text-[#8C3A3A]">{cancelledCount}</p>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            SECTION 3: STATUS FILTERS
            ══════════════════════════════════════════════════════════ */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex items-center gap-1.5 text-xs text-[#8A6240] font-semibold uppercase tracking-wider pr-2 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
          </div>

          {STATUS_FILTERS.map((f) => {
            const isActive = statusFilter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#16231E] text-white shadow-xs'
                    : 'bg-white text-[#5A635F] hover:text-[#16231E] hover:bg-[#F4EFEA] border border-[#E6DFD5]'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        {/* Error Notification */}
        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* ══════════════════════════════════════════════════════════
            SECTION 4: LOADING & BOOKINGS LIST
            ══════════════════════════════════════════════════════════ */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-[#253B33] animate-spin" />
            <p className="text-sm text-[#5A635F] font-medium">Finding your reservations...</p>
          </div>
        )}

        {!isLoading && !error && (
          bookings.length === 0 ? (
            <div className="py-8">
              <EmptyState
                icon={CalendarDays}
                title="No stays booked yet"
                message="Your next Kaveri Stays experience is waiting to be discovered."
                actionLabel="Explore Stays"
                onAction={() => window.location.assign('/properties')}
              />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-[#7A857F]">
                <span>
                  Your Reservations · {bookings.length} {bookings.length === 1 ? 'Booking' : 'Bookings'}
                </span>
                {statusFilter && (
                  <span className="text-[#8A6240]">
                    Filtered: {statusFilter.replace(/_/g, ' ')}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bookings.map((booking) => (
                  <BookingCard key={booking.booking_id} booking={booking} />
                ))}
              </div>
            </div>
          )
        )}

      </div>
    </div>
  );
};

export default MyBookings;
