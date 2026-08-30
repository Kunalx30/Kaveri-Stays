import React, { useState, useEffect } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2, Hash, Hotel, Users, CalendarCheck, CalendarX,
  FileText, Clock, ArrowLeft, Loader2, AlertCircle, XCircle,
  CreditCard, ChevronRight, ShieldCheck,
} from 'lucide-react';
import { getBookingByIdApi, cancelBookingApi } from '../api/bookings';
import { getBookingPaymentSummaryApi } from '../api/payments';
import { useAuth } from '../context/AuthContext';
import BookingStatus, { canGuestCancel } from '../components/booking/BookingStatus';
import CancelBookingDialog from '../components/booking/CancelBookingDialog';
import { PaymentSettlementBadge, PaymentMethodBadge } from '../components/payment/PaymentStatus';
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
 * BookingDetails Page (with Phase F5 Payment Integration)
 *
 * Route: /bookings/:bookingId
 *
 * Displays:
 *   - Booking metadata and room info
 *   - Financial balance & settlement status from GET /api/v1/payments/booking/:id/summary
 *   - "Pay Now" action button when remaining balance > 0 and status is payable
 *   - List of previous payment transactions with links to receipts
 *   - Cancel Booking button (for confirmed status)
 */
const BookingDetails = () => {
  const { bookingId } = useParams();
  const location = useLocation();
  const { user } = useAuth();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(!location.state?.booking);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const justCreated = location.state?.bookingCreated === true;

  const loadBookingAndPayments = async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [bookingData, summaryData] = await Promise.all([
        getBookingByIdApi(Number(bookingId)),
        getBookingPaymentSummaryApi(Number(bookingId)).catch(() => null),
      ]);
      setBooking(bookingData);
      setPaymentSummary(summaryData);
    } catch (err) {
      if (err.response?.status === 404) {
        setLoadError('Booking not found. It may have been deleted.');
      } else if (err.response?.status === 403) {
        setLoadError('Access denied: You do not have permission to view this booking.');
      } else if (err.response?.status === 401) {
        setLoadError('Please sign in to view booking details.');
      } else {
        setLoadError('Failed to load booking. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBookingAndPayments();
  }, [bookingId]);

  const handleCancelConfirm = async () => {
    setIsCancelling(true);
    setActionError('');
    try {
      const updated = await cancelBookingApi(Number(bookingId));
      setBooking(updated);
      setShowCancelDialog(false);
      // Reload payment summary after status change
      getBookingPaymentSummaryApi(Number(bookingId)).then(setPaymentSummary).catch(() => {});
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
        <p className="text-sm text-slate-500 animate-pulse">Loading booking and payment details...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Booking Not Available</h2>
        <p className="text-sm text-slate-500">{loadError}</p>
        <Link
          to="/my-bookings"
          className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm"
        >
          Back to My Bookings
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
  const showCancelButton = canGuestCancel(status);

  // Payment is allowed if booking is active (confirmed or checked_in) and not fully paid
  const isPayable = (status === 'confirmed' || status === 'checked_in') && (!paymentSummary || !paymentSummary.is_fully_paid);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {showCancelDialog && (
        <CancelBookingDialog
          bookingId={booking_id}
          onConfirm={handleCancelConfirm}
          onDismiss={() => setShowCancelDialog(false)}
          isCancelling={isCancelling}
        />
      )}

      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/my-bookings"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Bookings</span>
        </Link>

        {paymentSummary && (
          <Link
            to="/my-payments"
            className="text-xs font-bold text-slate-600 hover:text-blue-600 transition-colors"
          >
            Payment History →
          </Link>
        )}
      </div>

      {/* Success Banner (shown after creating a booking) */}
      {justCreated && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start space-x-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-emerald-800">Your reservation has been created!</p>
            <p className="text-xs text-emerald-600 mt-0.5">
              Your room is reserved. You can complete the payment below now or at check-in.
            </p>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Hash className="w-3.5 h-3.5" />
            <span>Reservation #{booking_id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Booking Details
          </h1>
          {created_at && (
            <p className="text-xs text-slate-400 mt-1 flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Booked on {formatDatetime(created_at)}</span>
            </p>
          )}
        </div>

        <div className="flex items-center space-x-2">
          <BookingStatus status={status} size="md" />
          {paymentSummary && (
            <PaymentSettlementBadge
              isFullyPaid={paymentSummary.is_fully_paid}
              totalPaid={paymentSummary.total_paid}
              size="md"
            />
          )}
        </div>
      </div>

      <ErrorMessage message={actionError} onDismiss={() => setActionError('')} />

      {/* Financial & Payment Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-7 shadow-md space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <span className="text-xs font-bold uppercase tracking-widest text-blue-300">
              Payment & Settlement Status
            </span>
            <div className="text-2xl sm:text-3xl font-black text-white">
              {paymentSummary ? formatINR(paymentSummary.total_booking_amount) : formatINR(total_amount)}
              <span className="text-xs font-normal text-blue-200 ml-2">Total Stay Due</span>
            </div>
          </div>

          {/* Pay Button if balance remains */}
          {isPayable && paymentSummary && Number(paymentSummary.remaining_balance) > 0 && (
            <Link
              to={`/bookings/${booking_id}/payment`}
              id="pay-now-btn"
              className="px-5 py-3 rounded-xl font-black text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-900/30 transition-all flex items-center justify-center space-x-2 self-start sm:self-auto shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              <span>Pay Remaining {formatINR(paymentSummary.remaining_balance)}</span>
            </Link>
          )}
        </div>

        {/* Balance Stats Row */}
        {paymentSummary && (
          <div className="grid grid-cols-3 gap-4 text-xs pt-1">
            <div className="space-y-1">
              <span className="text-slate-400 uppercase tracking-wider font-semibold text-[10px]">Total Due</span>
              <p className="font-extrabold text-white text-sm">{formatINR(paymentSummary.total_booking_amount)}</p>
            </div>

            <div className="space-y-1">
              <span className="text-emerald-400 uppercase tracking-wider font-semibold text-[10px]">Paid to Date</span>
              <p className="font-extrabold text-emerald-300 text-sm">{formatINR(paymentSummary.total_paid)}</p>
            </div>

            <div className="space-y-1">
              <span className="text-amber-400 uppercase tracking-wider font-semibold text-[10px]">Outstanding</span>
              <p className="font-extrabold text-amber-300 text-sm">{formatINR(paymentSummary.remaining_balance)}</p>
            </div>
          </div>
        )}
      </div>

      {/* Main Reservation Info Card */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-6">
        {/* Property & Room Section */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
            <Hotel className="w-3.5 h-3.5 text-slate-400" />
            <span>Property & Accommodation</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Property</p>
              <p className="font-bold text-slate-800">#{property_id ?? '1'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Assigned Room</p>
              <p className="font-bold text-slate-800">Room #{room_id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Guest ID</p>
              <p className="font-bold text-slate-800">#{guest_id}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Guests Count</p>
              <p className="font-bold text-slate-800 flex items-center space-x-1">
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
            <CalendarCheck className="w-3.5 h-3.5 text-slate-400" />
            <span>Stay Itinerary</span>
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
              Length of stay: {total_nights} night{total_nights !== 1 ? 's' : ''} • Rate snapshot: {formatINR(nightly_rate)}/night
            </p>
          )}
        </div>

        {/* Notes */}
        {notes && (
          <>
            <div className="border-t border-slate-100" />
            <div className="space-y-2">
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Special Requests</span>
              </h2>
              <p className="text-sm text-slate-700 italic bg-slate-50 rounded-xl p-3">"{notes}"</p>
            </div>
          </>
        )}
      </div>

      {/* Transaction History Section */}
      {paymentSummary && paymentSummary.payments.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span>Payments Recorded ({paymentSummary.payments.length})</span>
            </h2>
            <Link
              to="/my-payments"
              className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              View Full History →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {paymentSummary.payments.map((p) => (
              <div key={p.payment_id} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-800">Txn #{p.payment_id}</span>
                    <PaymentMethodBadge method={p.method} size="sm" />
                  </div>
                  <p className="text-[11px] text-slate-400">{formatDatetime(p.paid_at)}</p>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="font-black text-slate-900 text-sm">{formatINR(p.amount)}</span>
                  <Link
                    to={`/payments/${p.payment_id}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-50 transition-colors"
                    title="View Receipt"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancel Reservation Action */}
      {showCancelButton && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            id="cancel-booking-btn"
            onClick={() => setShowCancelDialog(true)}
            className="inline-flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 transition-colors cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>Cancel Reservation</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default BookingDetails;
