import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Hash, Users, CalendarCheck, CalendarX, FileText,
  ArrowLeft, Loader2, AlertCircle, LogIn, LogOut,
  AlertTriangle, CreditCard, CheckCircle2, BedDouble, MapPin,
} from 'lucide-react';
import {
  getStaffBookingByIdApi, checkInBookingApi, checkOutBookingApi, markNoShowApi,
} from '../../api/staff';
import { getBookingPaymentSummaryApi } from '../../api/payments';
import BookingStatus from '../../components/booking/BookingStatus';
import { PaymentSettlementBadge } from '../../components/payment/PaymentStatus';
import OperationalActionDialog from '../../components/staff/OperationalActionDialog';
import ErrorMessage from '../../components/common/ErrorMessage';

const formatINR = (val) => {
  if (val == null) return '—';
  return `₹${Number(val).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

const formatDatetime = (dtStr) => {
  if (!dtStr) return '—';
  return new Date(dtStr).toLocaleString('en-US', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  });
};

const parseErrorDetail = (err, fallbackMsg) => {
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join('. ');
  }
  return fallbackMsg;
};

const StaffBookingDetails = () => {
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // Action Dialog State
  const [actionDialog, setActionDialog] = useState({
    isOpen: false,
    actionType: 'check_in',
  });
  const [isActionLoading, setIsActionLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const [bookingData, summaryData] = await Promise.all([
        getStaffBookingByIdApi(Number(bookingId)),
        getBookingPaymentSummaryApi(Number(bookingId)).catch(() => null),
      ]);
      setBooking(bookingData);
      setPaymentSummary(summaryData);
    } catch (err) {
      if (err.response?.status === 404) {
        setError(`Booking #${bookingId} not found.`);
      } else if (err.response?.status === 403) {
        setError('Access denied: You do not have permission to view this property booking.');
      } else {
        setError(parseErrorDetail(err, 'Failed to load operational booking details.'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  const handleActionConfirm = async () => {
    const { actionType } = actionDialog;
    if (isActionLoading) return;

    setIsActionLoading(true);
    setError('');
    setActionSuccess('');
    try {
      if (actionType === 'check_in') {
        const updated = await checkInBookingApi(Number(bookingId));
        setBooking(updated);
        setActionSuccess('Guest checked in successfully.');
      } else if (actionType === 'check_out') {
        const updated = await checkOutBookingApi(Number(bookingId));
        setBooking(updated);
        setActionSuccess('Guest checked out successfully. Room queued for turnover.');
      } else if (actionType === 'no_show') {
        const updated = await markNoShowApi(Number(bookingId));
        setBooking(updated);
        setActionSuccess('Reservation marked as No-Show. Inventory released.');
      }

      setActionDialog({ isOpen: false, actionType: 'check_in' });
    } catch (err) {
      setError(parseErrorDetail(err, `Failed to perform ${actionType.replace('_', ' ')}.`));
      setActionDialog({ isOpen: false, actionType: 'check_in' });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-[#253B33] animate-spin" />
        <p className="text-sm font-medium text-[#5A635F]">
          Loading operational record...
        </p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-[#8C3A3A] mx-auto" />
        <h2 className="font-serif text-2xl text-[#16231E]">Booking Record Unavailable</h2>
        <p className="text-sm text-[#5A635F]">{error}</p>
        <Link
          to="/staff/bookings"
          className="inline-block mt-4 px-6 py-2.5 bg-[#16231E] hover:bg-[#253B33] text-white font-semibold rounded-xl text-xs sm:text-sm transition-colors"
        >
          Back to Staff Bookings
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

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      {actionDialog.isOpen && (
        <OperationalActionDialog
          actionType={actionDialog.actionType}
          bookingId={booking_id}
          onConfirm={handleActionConfirm}
          onDismiss={() => setActionDialog({ isOpen: false, actionType: 'check_in' })}
          isLoading={isActionLoading}
        />
      )}

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* Back Navigation */}
        <div className="flex items-center justify-between">
          <Link
            to="/staff/bookings"
            className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#8A6240] hover:text-[#16231E] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Staff Bookings</span>
          </Link>

          <Link
            to="/staff"
            className="text-xs font-semibold text-[#5A635F] hover:text-[#16231E] transition-colors"
          >
            Staff Dashboard →
          </Link>
        </div>

        {/* Action Success Alert */}
        {actionSuccess && (
          <div className="bg-[#EAF3EE] border border-[#CDE3D6] rounded-2xl p-4 flex items-center justify-between text-xs text-[#1B4D3E]">
            <div className="flex items-center space-x-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#1B4D3E] shrink-0" />
              <span>{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess('')}
              className="text-[#2A6E59] hover:text-[#1B4D3E] font-bold ml-3 text-lg leading-none"
              aria-label="Dismiss message"
            >
              &times;
            </button>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E6DFD5]">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#8A6240] block">
              Operational File #{booking_id}
            </span>
            <h1 className="font-serif text-3xl sm:text-4xl font-normal text-[#16231E] tracking-tight">
              Room #{room_id} Reservation
            </h1>
            <p className="text-xs text-[#7A857F]">
              Booked on {formatDatetime(created_at)}
            </p>
          </div>

          <div className="flex items-center space-x-2.5 self-start sm:self-auto">
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

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* Operational Actions Toolbar Card */}
        <div className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
            Front Desk Actions
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            {/* Check-In Action (Only when Confirmed) */}
            {status === 'confirmed' && (
              <button
                type="button"
                id="staff-checkin-btn"
                onClick={() => setActionDialog({ isOpen: true, actionType: 'check_in' })}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-[#16231E] hover:bg-[#253B33] text-white shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <LogIn className="w-4 h-4 text-amber-200" />
                <span>Perform Check-In</span>
              </button>
            )}

            {/* Check-Out Action (Only when Checked In) */}
            {status === 'checked_in' && (
              <button
                type="button"
                id="staff-checkout-btn"
                onClick={() => setActionDialog({ isOpen: true, actionType: 'check_out' })}
                className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-[#1B4D3E] hover:bg-[#143B30] text-white shadow-xs transition-colors flex items-center space-x-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-emerald-200" />
                <span>Perform Check-Out</span>
              </button>
            )}

            {/* No-Show Action (Only when Confirmed) */}
            {status === 'confirmed' && (
              <button
                type="button"
                id="staff-noshow-btn"
                onClick={() => setActionDialog({ isOpen: true, actionType: 'no_show' })}
                className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-[#FBF0E4] hover:bg-[#F5E2CC] text-[#8C581E] border border-[#EAD2BA] transition-colors flex items-center space-x-1.5 cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Mark No-Show</span>
              </button>
            )}

            {/* Record Payment Action */}
            <Link
              to={`/bookings/${booking_id}/payment`}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm bg-[#EDE8E1] hover:bg-[#E2DDD5] text-[#16231E] border border-[#D8D0C5] transition-colors flex items-center space-x-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#8A6240]" />
              <span>Record / View Payments</span>
            </Link>
          </div>

          {/* Terminal Status Notices */}
          {status === 'checked_out' && (
            <div className="bg-[#F4EFEA] border border-[#E6DFD5] rounded-2xl p-3.5 text-xs text-[#5A635F]">
              Guest has completed their stay and checked out. Room is queued for housekeeping turnover.
            </div>
          )}
          {status === 'no_show' && (
            <div className="bg-[#FBF0E4] border border-[#EAD2BA] rounded-2xl p-3.5 text-xs text-[#8C581E]">
              This reservation was marked as a No-Show. Room inventory has been returned to stock.
            </div>
          )}
          {status === 'cancelled' && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3.5 text-xs text-rose-800">
              This reservation was cancelled.
            </div>
          )}
        </div>

        {/* Guest & Stay Metadata Card */}
        <div className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-6">
          <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
            Reservation & Guest Profile
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-[#7A857F] text-[10px] uppercase tracking-wider font-bold block">Guest ID</span>
              <span className="font-semibold text-[#16231E] mt-0.5 block">#{guest_id}</span>
            </div>
            <div>
              <span className="text-[#7A857F] text-[10px] uppercase tracking-wider font-bold block">Assigned Room</span>
              <span className="font-semibold text-[#16231E] mt-0.5 block">Room #{room_id}</span>
            </div>
            <div>
              <span className="text-[#7A857F] text-[10px] uppercase tracking-wider font-bold block">Property</span>
              <span className="font-semibold text-[#16231E] mt-0.5 block">Property #{property_id || '1'}</span>
            </div>
            <div>
              <span className="text-[#7A857F] text-[10px] uppercase tracking-wider font-bold block">Party Size</span>
              <span className="font-semibold text-[#16231E] mt-0.5 block">{guests_count} Guests</span>
            </div>
          </div>

          <div className="border-t border-[#E6DFD5]" />

          {/* Itinerary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#FBF9F5] border border-[#E6DFD5] rounded-2xl p-4 space-y-1">
              <div className="flex items-center space-x-1.5 text-[10px] text-[#8A6240] font-bold uppercase tracking-wider">
                <CalendarCheck className="w-3.5 h-3.5" />
                <span>Arrival (Check-In)</span>
              </div>
              <p className="text-sm font-semibold text-[#16231E]">{formatDate(check_in_date)}</p>
            </div>

            <div className="bg-[#FBF9F5] border border-[#E6DFD5] rounded-2xl p-4 space-y-1">
              <div className="flex items-center space-x-1.5 text-[10px] text-[#8A6240] font-bold uppercase tracking-wider">
                <CalendarX className="w-3.5 h-3.5" />
                <span>Departure (Check-Out)</span>
              </div>
              <p className="text-sm font-semibold text-[#16231E]">{formatDate(check_out_date)}</p>
            </div>
          </div>

          {/* Special Requests */}
          {notes && (
            <>
              <div className="border-t border-[#E6DFD5]" />
              <div className="space-y-1.5">
                <span className="text-[#7A857F] text-[10px] uppercase tracking-wider font-bold flex items-center space-x-1">
                  <FileText className="w-3 h-3 text-[#8A6240]" />
                  <span>Guest Notes & Requests</span>
                </span>
                <p className="text-xs text-[#5A635F] italic bg-[#FBF9F5] border border-[#E6DFD5] p-3.5 rounded-xl">
                  "{notes}"
                </p>
              </div>
            </>
          )}
        </div>

        {/* Financial Breakdown Section */}
        {paymentSummary && (
          <div className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
                Financial Settlement Breakdown
              </h2>
              <Link
                to={`/bookings/${booking_id}/payment`}
                className="text-xs font-semibold text-[#16231E] hover:text-[#8A6240] transition-colors"
              >
                Open Payment Terminal →
              </Link>
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs bg-[#F4EFEA] border border-[#E6DFD5] p-4 sm:p-5 rounded-2xl">
              <div>
                <span className="text-[#7A857F] block text-[10px] uppercase font-bold">Total Cost</span>
                <span className="font-serif text-lg sm:text-xl font-normal text-[#16231E] block mt-0.5">{formatINR(paymentSummary.total_booking_amount)}</span>
              </div>
              <div>
                <span className="text-[#1B4D3E] block text-[10px] uppercase font-bold">Settled</span>
                <span className="font-serif text-lg sm:text-xl font-normal text-[#1B4D3E] block mt-0.5">{formatINR(paymentSummary.total_paid)}</span>
              </div>
              <div>
                <span className="text-[#8A6240] block text-[10px] uppercase font-bold">Remaining</span>
                <span className="font-serif text-lg sm:text-xl font-normal text-[#8A6240] block mt-0.5">{formatINR(paymentSummary.remaining_balance)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffBookingDetails;
