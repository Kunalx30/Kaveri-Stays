import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays, Loader2, RefreshCw, SlidersHorizontal,
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
  { label: 'All', value: '' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Checked In', value: 'checked_in' },
  { label: 'Checked Out', value: 'checked_out' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No Show', value: 'no_show' },
];

/**
 * MyBookings Page
 *
 * Protected route: /my-bookings
 *
 * Fetches bookings from GET /api/v1/bookings.
 * For Guest role: backend returns only their own bookings (ownership enforced server-side).
 * For Manager/Staff: backend returns only their assigned property's bookings.
 * For Owner: returns all bookings.
 *
 * Frontend status filter is purely UI (no security logic here — backend enforces ownership).
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
      setBookings(data);
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else {
        setError('Failed to load bookings. Please try again.');
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
        return 'Your personal hotel reservations are listed below.';
      case 'manager':
        return 'Bookings within your assigned property are listed below.';
      case 'staff':
        return 'Bookings for your assigned property are listed below.';
      case 'owner':
        return 'All bookings across all properties are listed below.';
      default:
        return 'Your bookings are listed below.';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <CalendarDays className="w-4 h-4" />
            <span>My Reservations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">My Bookings</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{getRoleDescription()}</p>
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/availability"
            className="px-4 py-2 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors"
          >
            + New Booking
          </Link>

          <button
            onClick={fetchBookings}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Status Filter Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-hide">
        <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
              statusFilter === f.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-2">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
          <p className="text-sm text-slate-400 animate-pulse">Loading your bookings...</p>
        </div>
      )}

      {/* Bookings Grid */}
      {!isLoading && !error && (
        bookings.length === 0 ? (
          <EmptyState
            title={
              statusFilter
                ? `No ${statusFilter.replace(/_/g, ' ')} bookings found`
                : 'No Bookings Found'
            }
            message={
              statusFilter
                ? 'Try selecting a different status filter above.'
                : 'Your upcoming hotel reservations will appear here. Search availability to make your first booking!'
            }
          />
        ) : (
          <>
            <p className="text-xs text-slate-500 font-semibold">
              Showing <strong>{bookings.length}</strong> booking{bookings.length !== 1 ? 's' : ''}
              {statusFilter && ` · Filtered: ${statusFilter.replace(/_/g, ' ')}`}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {bookings.map((booking) => (
                <BookingCard key={booking.booking_id} booking={booking} />
              ))}
            </div>
          </>
        )
      )}
    </div>
  );
};

export default MyBookings;
