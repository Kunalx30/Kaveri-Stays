import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Hash, Hotel, Bed, Users, CalendarCheck, CalendarX,
  FileText, Clock, ArrowLeft, Loader2, AlertCircle, XCircle,
} from 'lucide-react';
import { getBookingByIdApi, cancelBookingApi } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import BookingStatus, { canGuestCancel } from '../components/booking/BookingStatus';
import CancelBookingDialog from '../components/booking/CancelBookingDialog';
import ErrorMessage from '../components/common/ErrorMessage';

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

const formatDatetime = (dtStr) => {
  if (!dtStr) return '—';
  return new Date(dtStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

/**
 * BookingDetails Page
 *
 * Route: /bookings/:bookingId
 *
 * Fetches booking from the actual backend GET /bookings/:id.
 * Does NOT rely only on navigation state (supports browser refresh).
 * Shows success message if navigated here after booking creation.
 * Shows cancellation dialog with confirmation before calling backend.
 *
 * Authorization (enforced by backend):
 *   - Guest: can only view their own booking (403 otherwise)
 *   - Manager/Staff: only within their assigned property
 *   - Owner: any booking
 */
const BookingDetails = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [isLoading, setIsLoading] = useState(!location.state?.booking);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const justCreated = location.state?.bookingCreated === true;

  // Always fetch from backend to support refresh (do not rely solely on state)
  useEffect(() => {
    const fetchBooking = async () => {
      setIsLoading(true);
      setLoadError('');
      try {
        const data = await getBookingByIdApi(Number(bookingId));
        setBooking(data);
      } catch (err) {
        if (err.response?.status === 404) {
          setLoadError('Booking not found. It may have been deleted.');
        } else if (err.response?.status === 403) {
          setLoadError('Access denied. You do not have permission to view this booking.');
        } else if (err.response?.status === 401) {
          setLoadError('Please sign in to view booking details.');
        } else {
          setLoadError('Failed to load booking. Please try again.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

  const handleCancelConfirm = async () => {
    setIsCancelling(true);
    setActionError('');
    try {
      const updated = await cancelBookingApi(Number(bookingId));
      setBooking(updated);
      setShowCancelDialog(false);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setActionError(detail);
      } else if (err.response?.status === 400) {
        setActionError('This booking cannot be cancelled. It may already be cancelled or checked in.');
      } else if (err.response?.status === 403) {
        setActionError('You do not have permission to cancel this booking.');
      } else {
        setActionError('Cancellation failed. Please try again.');
      }
      setShowCancelDialog(false);
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-7 h-7 text-blue-600 animate-spin" />
        <p className="text-sm text-slate-500 animate-pulse">Loading booking details...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Booking Not Available</h2>
        <p className="text-sm text-slate-500">{loadError}</p>
        <Link to="/my-bookings" className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm">
          My Bookings
        </Link>
      </div>
    );
  }

  if (!booking) return null;

  const {
    booking_id, guest_id, room_id, property_id,
    check_in_date, check_out_date, total_nights, guests_count,
    nightly_rate, total_amount, status, notes, created_at,
  } = booking;

  const isGuest = user?.role === 'guest';
  const guestCanCancel = isGuest && canGuestCancel(status);
  const nonGuestCanCancel = !isGuest && canGuestCancel(status);
  const showCancelButton = guestCanCancel || nonGuestCanCancel;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {showCancelDialog && (
        <CancelBookingDialog
          bookingId={booking_id}
          onConfirm={handleCancelConfirm}
          onDismiss={() => setShowCancelDialog(false)}
          isCancelling={isCancelling}
        />
      )}

      {/* Back Navigation */}
      <Link
        to="/my-bookings"
        className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>My Bookings</span>
      </Link>

      {/* Success Banner (shown after just creating a booking) */}
      {justCreated && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Your booking has been created successfully!</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Your reservation is confirmed. Payment is handled separately.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex items-start justify-between pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Hash className="w-3.5 h-3.5" />
            <span>Booking #{booking_id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Booking Details
          </h1>
          {created_at && (
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Created {formatDatetime(created_at)}</span>
            </p>
          )}
        </div>
        <BookingStatus status={status} size="md" />
      </div>

      <ErrorMessage message={actionError} onDismiss={() => setActionError('')} />

      {/* Main Details Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-6">
        {/* Property & Room */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
            <Hotel className="w-3.5 h-3.5" />
            <span>Property & Room</span>
          </h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Property ID</p>
              <p className="font-bold text-slate-800">{property_id ?? '—'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Room ID</p>
              <p className="font-bold text-slate-800">#{room_id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Guest ID</p>
              <p className="font-bold text-slate-800">{guest_id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Guests Staying</p>
              <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>{guests_count}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Stay Dates */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Stay Dates</span>
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-3 space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-in</p>
              <p className="text-sm font-bold text-slate-800">{formatDate(check_in_date)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 space-y-0.5">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Check-out</p>
              <p className="text-sm font-bold text-slate-800">{formatDate(check_out_date)}</p>
            </div>
          </div>
          {total_nights != null && (
            <p className="text-xs text-slate-500 font-semibold">
              Duration: {total_nights} night{total_nights !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        <div className="border-t border-slate-100" />

        {/* Pricing */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pricing</h2>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Nightly Rate</span>
              <span className="font-semibold">{formatINR(nightly_rate)}</span>
            </div>
            {total_nights != null && (
              <div className="flex justify-between text-slate-600">
                <span>Duration</span>
                <span className="font-semibold">{total_nights} night{total_nights !== 1 ? 's' : ''}</span>
              </div>
            )}
            {total_amount != null && (
              <div className="flex justify-between font-black text-slate-900 pt-2 border-t border-slate-100 text-base">
                <span>Total Amount</span>
                <span>{formatINR(total_amount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        {notes && (
          <>
            <div className="border-t border-slate-100" />
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5" />
                <span>Special Requests</span>
              </h2>
              <p className="text-sm text-slate-700 italic bg-slate-50 rounded-xl p-3">"{notes}"</p>
            </div>
          </>
        )}
      </div>

      {/* Cancel Button (only for confirmed bookings) */}
      {showCancelButton && (
        <div className="flex justify-end">
          <button
            type="button"
            id="cancel-booking-btn"
            onClick={() => setShowCancelDialog(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel Booking</span>
          </button>
        </div>
      )}

      {/* Payment Note */}
      <div className="text-center text-[11px] text-slate-400 pb-2">
        Payment processing is handled separately. Contact the hotel or use the payment portal.
      </div>
    </div>
  );
};

export default BookingDetails;
