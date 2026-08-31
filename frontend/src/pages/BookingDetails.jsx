import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  CheckCircle2, Hotel, Users, CalendarCheck,
  FileText, Clock, ArrowLeft, Loader2, AlertCircle,
  CreditCard, ChevronRight, Star, MessageSquare, Edit3,
  ShieldCheck,
} from 'lucide-react';
import { getBookingByIdApi, cancelBookingApi } from '../api/bookings';
import { getBookingPaymentSummaryApi } from '../api/payments';
import { listReviewsApi } from '../api/reviews';
import BookingStatus, { canGuestCancel } from '../components/booking/BookingStatus';
import CancelBookingDialog from '../components/booking/CancelBookingDialog';
import { PaymentSettlementBadge, PaymentMethodBadge } from '../components/payment/PaymentStatus';
import StarRating from '../components/review/ReviewRating';
import ErrorMessage from '../components/common/ErrorMessage';

const formatINR = (val) => {
  if (val == null) return '—';
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const formatDatetime = (dtStr) => {
  if (!dtStr) return '—';
  return new Date(dtStr).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * BookingDetails Page
 *
 * Route: /bookings/:bookingId
 */
const BookingDetails = () => {
  const { bookingId } = useParams();
  const location = useLocation();

  const [booking, setBooking] = useState(location.state?.booking || null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [bookingReview, setBookingReview] = useState(null);
  const [isLoading, setIsLoading] = useState(!location.state?.booking);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const justCreated = location.state?.bookingCreated === true;

  const loadBookingAndData = useCallback(async () => {
    setIsLoading(true);
    setLoadError('');
    try {
      const [bookingData, summaryData, reviewsData] = await Promise.all([
        getBookingByIdApi(Number(bookingId)),
        getBookingPaymentSummaryApi(Number(bookingId)).catch(() => null),
        listReviewsApi({ booking_id: Number(bookingId) }).catch(() => []),
      ]);
      setBooking(bookingData);
      setPaymentSummary(summaryData);
      if (reviewsData.length > 0) {
        setBookingReview(reviewsData[0]);
      } else {
        setBookingReview(null);
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setLoadError('Reservation not found. It may have been modified or removed.');
      } else if (err.response?.status === 403) {
        setLoadError('Access denied: You do not have permission to view this reservation.');
      } else if (err.response?.status === 401) {
        setLoadError('Please sign in to view your reservation details.');
      } else {
        setLoadError('Failed to load reservation details. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    loadBookingAndData();
  }, [loadBookingAndData]);

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
        setActionError('This reservation cannot be cancelled. It may already be cancelled or checked in.');
      } else if (err.response?.status === 403) {
        setActionError('You do not have permission to cancel this reservation.');
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
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-[#253B33] animate-spin" />
        <p className="text-sm font-medium text-[#5A635F]">Loading your reservation details...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[#8C3A3A] mx-auto" />
        <h2 className="font-serif text-2xl text-[#16231E]">Reservation Not Available</h2>
        <p className="text-sm text-[#5A635F]">{loadError}</p>
        <Link
          to="/my-bookings"
          className="inline-block mt-4 px-6 py-2.5 bg-[#16231E] hover:bg-[#253B33] text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors"
        >
          Return to My Bookings
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

  const showCancelButton = canGuestCancel(status);

  // Payment is allowed if booking is active (confirmed or checked_in) and not fully paid
  const isPayable = (status === 'confirmed' || status === 'checked_in') && (!paymentSummary || !paymentSummary.is_fully_paid);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      {showCancelDialog && (
        <CancelBookingDialog
          bookingId={booking_id}
          onConfirm={handleCancelConfirm}
          onDismiss={() => setShowCancelDialog(false)}
          isCancelling={isCancelling}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/my-bookings"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#8A6240] hover:text-[#16231E] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to My Bookings</span>
          </Link>

          {paymentSummary && (
            <Link
              to="/my-payments"
              className="text-xs font-semibold text-[#5A635F] hover:text-[#16231E] transition-colors"
            >
              Payment History →
            </Link>
          )}
        </div>

        {/* Success Banner (when arriving fresh from booking creation) */}
        {justCreated && (
          <div className="bg-[#EAF3EE] border border-[#CDE3D6] rounded-2xl p-5 flex items-start space-x-3 text-[#1B4D3E]">
            <CheckCircle2 className="w-5 h-5 text-[#1B4D3E] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="text-sm font-bold">Your reservation is confirmed!</p>
              <p className="text-xs text-[#2A6E59] leading-relaxed">
                Your room has been locked in the registry. You can settle your payment now or upon arrival.
              </p>
            </div>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#E6DFD5]">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#8A6240] block">
              Reservation Details
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#16231E] tracking-tight">
              Booking #{booking_id}
            </h1>
            {created_at && (
              <p className="text-xs text-[#7A857F] flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-[#8A6240]" />
                <span>Reserved on {formatDatetime(created_at)}</span>
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

        {/* ══════════════════════════════════════════════════════════
            MAIN CONTENT: TWO-COLUMN LAYOUT (DESKTOP)
            ══════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ── LEFT COLUMN: STAY ITINERARY & PROPERTY SPECS (8 cols) ── */}
          <div className="lg:col-span-8 space-y-6">

            {/* 1. Stay Itinerary Card */}
            <section className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
                <h2 className="text-xs font-bold text-[#8A6240] uppercase tracking-[0.2em] flex items-center space-x-2">
                  <CalendarCheck className="w-4 h-4 text-[#8A6240]" />
                  <span>Stay Itinerary</span>
                </h2>
                {total_nights != null && (
                  <span className="text-xs font-semibold text-[#16231E]">
                    {total_nights} {total_nights === 1 ? 'Night' : 'Nights'} Duration
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#FBF9F5] border border-[#E6DFD5] rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-[#8A6240] uppercase tracking-wider block">
                    Check-in (Arrival)
                  </span>
                  <p className="font-serif text-lg font-semibold text-[#16231E]">
                    {formatDate(check_in_date)}
                  </p>
                  <p className="text-[11px] text-[#7A857F]">From 2:00 PM onwards</p>
                </div>

                <div className="bg-[#FBF9F5] border border-[#E6DFD5] rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-[#8A6240] uppercase tracking-wider block">
                    Check-out (Departure)
                  </span>
                  <p className="font-serif text-lg font-semibold text-[#16231E]">
                    {formatDate(check_out_date)}
                  </p>
                  <p className="text-[11px] text-[#7A857F]">Until 11:00 AM</p>
                </div>
              </div>

              {nightly_rate && (
                <div className="pt-2 text-xs text-[#5A635F] flex items-center justify-between">
                  <span>Nightly Rate Snapshot</span>
                  <span className="font-semibold text-[#16231E]">{formatINR(nightly_rate)} / night</span>
                </div>
              )}
            </section>

            {/* 2. Property & Accommodation Specs */}
            <section className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-5">
              <div className="pb-3 border-b border-[#E6DFD5]">
                <h2 className="text-xs font-bold text-[#8A6240] uppercase tracking-[0.2em] flex items-center space-x-2">
                  <Hotel className="w-4 h-4 text-[#8A6240]" />
                  <span>Accommodation & Property</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div className="space-y-0.5">
                  <p className="text-[10px] text-[#7A857F] uppercase tracking-wider font-bold">Property</p>
                  <p className="font-semibold text-[#16231E]">#{property_id ?? '1'}</p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[10px] text-[#7A857F] uppercase tracking-wider font-bold">Assigned Room</p>
                  <p className="font-semibold text-[#16231E]">Room #{room_id}</p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[10px] text-[#7A857F] uppercase tracking-wider font-bold">Guest ID</p>
                  <p className="font-semibold text-[#16231E]">#{guest_id}</p>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[10px] text-[#7A857F] uppercase tracking-wider font-bold">Guests Count</p>
                  <p className="font-semibold text-[#16231E] flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-[#8A6240]" />
                    <span>{guests_count}</span>
                  </p>
                </div>
              </div>
            </section>

            {/* 3. Special Requests / Notes */}
            {notes && (
              <section className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-3">
                <h2 className="text-xs font-bold text-[#8A6240] uppercase tracking-[0.2em] flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-[#8A6240]" />
                  <span>Special Requests & Notes</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#5A635F] italic bg-[#FBF9F5] border border-[#E6DFD5] rounded-2xl p-4 leading-relaxed">
                  "{notes}"
                </p>
              </section>
            )}

            {/* 4. Post-Stay Guest Review Section (if completed stay) */}
            {status === 'checked_out' && (
              <section className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
                  <h2 className="text-xs font-bold text-[#8A6240] uppercase tracking-[0.2em] flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4 text-[#8A6240]" />
                    <span>Guest Experience & Feedback</span>
                  </h2>
                  {bookingReview && (
                    <Link
                      to={`/reviews/${bookingReview.review_id}/edit`}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-[#16231E] hover:text-[#8A6240] transition-colors"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Review</span>
                    </Link>
                  )}
                </div>

                {bookingReview ? (
                  <div className="bg-[#FBF9F5] border border-[#E6DFD5] rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <StarRating rating={bookingReview.rating} size="sm" showNumeric />
                      <span className="text-[11px] text-[#7A857F]">
                        Reviewed on {new Date(bookingReview.reviewed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    </div>
                    {bookingReview.comments ? (
                      <p className="text-xs sm:text-sm text-[#5A635F] italic leading-relaxed">
                        "{bookingReview.comments}"
                      </p>
                    ) : (
                      <p className="text-xs text-[#7A857F] italic">No comment provided with rating.</p>
                    )}
                  </div>
                ) : (
                  <div className="bg-[#F4EFEA] border border-[#E6DFD5] rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#8A6240]">How was your stay?</p>
                      <p className="text-xs text-[#5A635F]">
                        Your stay is complete. Share your impressions to guide fellow travelers.
                      </p>
                    </div>

                    <Link
                      to={`/bookings/${booking_id}/review`}
                      className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors self-start sm:self-auto shrink-0 shadow-xs"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-300" />
                      <span>Write a Review</span>
                    </Link>
                  </div>
                )}
              </section>
            )}

            {/* 5. Payments History Section */}
            {paymentSummary && paymentSummary.payments.length > 0 && (
              <section className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
                  <h2 className="text-xs font-bold text-[#8A6240] uppercase tracking-[0.2em] flex items-center space-x-2">
                    <CreditCard className="w-4 h-4 text-[#8A6240]" />
                    <span>Transactions ({paymentSummary.payments.length})</span>
                  </h2>
                  <Link
                    to="/my-payments"
                    className="text-xs font-semibold text-[#8A6240] hover:text-[#16231E] transition-colors"
                  >
                    All Payments →
                  </Link>
                </div>

                <div className="divide-y divide-[#E6DFD5]">
                  {paymentSummary.payments.map((p) => (
                    <div key={p.payment_id} className="py-3.5 flex items-center justify-between text-xs">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-[#16231E]">Txn #{p.payment_id}</span>
                          <PaymentMethodBadge method={p.method} size="sm" />
                        </div>
                        <p className="text-[11px] text-[#7A857F]">{formatDatetime(p.paid_at)}</p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <span className="font-serif text-base font-semibold text-[#16231E]">{formatINR(p.amount)}</span>
                        <Link
                          to={`/payments/${p.payment_id}`}
                          className="p-1.5 rounded-lg text-[#7A857F] hover:text-[#16231E] hover:bg-[#F4EFEA] transition-colors"
                          title="View Receipt"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* ── RIGHT COLUMN: STICKY FINANCIAL SUMMARY & ACTIONS (4 cols) ── */}
          <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24">
            
            {/* Financial Card */}
            <div className="bg-[#16231E] text-white rounded-3xl p-6 sm:p-7 shadow-md space-y-6">
              <div className="space-y-1 pb-4 border-b border-white/15">
                <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300">
                  Total Reservation Cost
                </span>
                <div className="font-serif text-3xl font-normal text-white">
                  {paymentSummary ? formatINR(paymentSummary.total_booking_amount) : formatINR(total_amount)}
                </div>
                <p className="text-xs text-white/60">
                  All retreat amenities and local taxes included
                </p>
              </div>

              {/* Balance Breakdown */}
              {paymentSummary && (
                <div className="space-y-3 text-xs pt-1">
                  <div className="flex items-center justify-between text-white/70">
                    <span>Paid to Date:</span>
                    <span className="font-semibold text-emerald-400">{formatINR(paymentSummary.total_paid)}</span>
                  </div>

                  <div className="flex items-center justify-between text-white/70">
                    <span>Remaining Balance:</span>
                    <span className="font-semibold text-amber-300">{formatINR(paymentSummary.remaining_balance)}</span>
                  </div>
                </div>
              )}

              {/* Action: Settle Payment if Remaining */}
              {isPayable && paymentSummary && Number(paymentSummary.remaining_balance) > 0 && (
                <div className="pt-2">
                  <Link
                    to={`/bookings/${booking_id}/payment`}
                    id="pay-now-btn"
                    className="w-full px-5 py-3.5 rounded-xl font-semibold text-xs sm:text-sm bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md transition-all flex items-center justify-center space-x-2 text-center"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay Remaining {formatINR(paymentSummary.remaining_balance)}</span>
                  </Link>
                </div>
              )}

              {/* Guaranteed Status Indicator */}
              <div className="pt-2 flex items-center space-x-2 text-[11px] text-white/60">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Protected by verified date-range reservation</span>
              </div>
            </div>

            {/* Cancel Action if allowed */}
            {showCancelButton && (
              <div className="p-5 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD5] space-y-3">
                <p className="text-xs text-[#5A635F]">
                  Need to change your travel plans? You can cancel your stay before check-in.
                </p>
                <button
                  type="button"
                  id="cancel-booking-btn"
                  onClick={() => setShowCancelDialog(true)}
                  className="w-full px-4 py-2.5 rounded-xl text-xs font-semibold text-[#8C3A3A] hover:text-white border border-[#EACDCD] hover:bg-[#8C3A3A] transition-colors cursor-pointer"
                >
                  Cancel Reservation
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default BookingDetails;
