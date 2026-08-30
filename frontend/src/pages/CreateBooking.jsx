import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Hotel, CalendarCheck, CalendarX, Users, Bed, ArrowLeft,
  Hash, FileText, AlertCircle, Loader2, ShieldCheck,
} from 'lucide-react';
import { createBookingApi } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/common/ErrorMessage';

/**
 * Formats a decimal/string amount as INR.
 */
const formatINR = (val) => {
  if (val == null) return '—';
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
  });
};

/**
 * CreateBooking Page
 *
 * Protected route: /bookings/create
 *
 * Reads booking intent from router location.state.bookingIntent (passed from AvailabilityResults).
 * All final pricing and validation is performed by the backend on POST /bookings.
 *
 * POST /bookings schema:
 *   room_id (int, required)
 *   check_in_date (YYYY-MM-DD, required)
 *   check_out_date (YYYY-MM-DD, required)
 *   guests_count (int 1-20, required)
 *   notes (string, optional)
 *   guest_id: NOT sent for Guest role — auto-inferred from JWT
 */
const CreateBooking = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const bookingIntent = location.state?.bookingIntent;

  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Guard: booking intent must be present (came from availability search flow)
  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Authentication Required</h2>
        <p className="text-sm text-slate-500">Please sign in to create a booking.</p>
        <Link to="/login" className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm">
          Sign In
        </Link>
      </div>
    );
  }

  if (!bookingIntent) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <Bed className="w-10 h-10 text-slate-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">No Room Selected</h2>
        <p className="text-sm text-slate-500">
          Please search for availability and select a room first.
        </p>
        <Link to="/availability" className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm">
          Search Availability
        </Link>
      </div>
    );
  }

  const {
    room_id,
    room_number,
    room_type_name,
    max_occupancy,
    property_name,
    property_city,
    property_star_rating,
    check_in_date,
    check_out_date,
    guests_count,
    nightly_rate,
  } = bookingIntent;

  // Display-only estimate (backend resolves authoritative rate on creation)
  const nights = (() => {
    const a = new Date(check_in_date);
    const b = new Date(check_out_date);
    return Math.max(1, Math.ceil((b - a) / (1000 * 60 * 60 * 24)));
  })();

  const displayEstimate = nightly_rate ? Number(nightly_rate) * nights : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);

    // Build payload — guest_id is NOT included for guest role (auto-inferred from JWT)
    const payload = {
      room_id: room_id,
      check_in_date: check_in_date,
      check_out_date: check_out_date,
      guests_count: guests_count,
    };

    if (notes.trim()) {
      payload.notes = notes.trim();
    }

    try {
      const booking = await createBookingApi(payload);
      // Success: redirect to booking details page
      navigate(`/bookings/${booking.booking_id}`, {
        state: { bookingCreated: true, booking },
        replace: true,
      });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg || JSON.stringify(d)).join('. '));
      } else if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to make this booking.');
      } else if (err.response?.status === 409) {
        setError('This room is no longer available for the selected dates. Another guest may have just booked it. Please search again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Back Navigation */}
      <Link
        to="/availability"
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Availability Search</span>
      </Link>

      {/* Page Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Step 2 of 2</div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Confirm Your Booking</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review your selection below and confirm to create the reservation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Booking Summary Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
          <h2 className="text-sm font-extrabold text-slate-800 flex items-center space-x-2">
            <Hotel className="w-4 h-4 text-blue-500" />
            <span>Booking Summary</span>
          </h2>

          {/* Property */}
          <div className="flex items-center justify-between text-sm">
            <div>
              <p className="font-bold text-slate-900">{property_name}</p>
              <p className="text-xs text-slate-500">{property_city} • {property_star_rating}★ Hotel</p>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-4 grid grid-cols-2 gap-4 text-xs">
            {/* Room */}
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                <Bed className="w-3 h-3" />
                <span>Room</span>
              </div>
              <p className="font-bold text-slate-800">{room_type_name}</p>
              <p className="text-slate-500">Room #{room_number}</p>
            </div>

            {/* Guests */}
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                <Users className="w-3 h-3" />
                <span>Guests</span>
              </div>
              <p className="font-bold text-slate-800">{guests_count} Guest{guests_count !== 1 ? 's' : ''}</p>
              <p className="text-slate-500">Max {max_occupancy} capacity</p>
            </div>

            {/* Check-in */}
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                <CalendarCheck className="w-3 h-3" />
                <span>Check-in</span>
              </div>
              <p className="font-bold text-slate-800">{formatDate(check_in_date)}</p>
              <p className="text-slate-400 text-[10px]">From 14:00</p>
            </div>

            {/* Check-out */}
            <div className="space-y-0.5">
              <div className="flex items-center space-x-1.5 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
                <CalendarX className="w-3 h-3" />
                <span>Check-out</span>
              </div>
              <p className="font-bold text-slate-800">{formatDate(check_out_date)}</p>
              <p className="text-slate-400 text-[10px]">By 11:00</p>
            </div>
          </div>

          {/* Pricing Estimate */}
          <div className="border-t border-slate-200 pt-4 space-y-1.5">
            <div className="flex justify-between text-xs text-slate-600">
              <span>Nightly Rate (from availability)</span>
              <span className="font-semibold">{formatINR(nightly_rate)}/night</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600">
              <span>Duration</span>
              <span className="font-semibold">{nights} night{nights !== 1 ? 's' : ''}</span>
            </div>
            {displayEstimate != null && (
              <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-100">
                <span>Estimated Total</span>
                <span>{formatINR(displayEstimate)}</span>
              </div>
            )}
            <p className="text-[10px] text-slate-400 italic">
              * Final amount is calculated and confirmed by the server at booking time.
            </p>
          </div>
        </div>

        {/* Guest Info (from JWT — read-only display) */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center space-x-2 text-xs text-blue-700 font-bold">
            <Hash className="w-3.5 h-3.5" />
            <span>Booking as: {user?.full_name || user?.email}</span>
          </div>
          <p className="text-[10px] text-blue-500">
            Your guest profile is automatically linked via your JWT session.
          </p>
        </div>

        {/* Special Requests / Notes (optional) */}
        <div className="space-y-2">
          <label htmlFor="booking-notes" className="block text-sm font-bold text-slate-700">
            Special Requests <span className="text-xs font-normal text-slate-400">(Optional)</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
            <textarea
              id="booking-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="e.g. Late check-in requested, anniversary decoration, extra pillows..."
              className="w-full pl-9 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 resize-none transition-shadow"
            />
          </div>
          <p className="text-[10px] text-slate-400 text-right">{notes.length}/500</p>
        </div>

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* Security Notice */}
        <div className="flex items-start space-x-2 text-[10px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
          <span>
            All booking data is validated by the Kaveri Stays server. Room availability is re-verified at submission time.
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          id="confirm-booking-btn"
          disabled={isSubmitting}
          className="w-full py-3.5 rounded-xl font-black text-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors flex items-center justify-center space-x-2 shadow-sm shadow-blue-500/20 cursor-pointer"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Creating Reservation...</span>
            </>
          ) : (
            <span>Confirm Booking</span>
          )}
        </button>
      </form>
    </div>
  );
};

export default CreateBooking;
