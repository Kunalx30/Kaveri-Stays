import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Hash, Hotel, Users, CalendarCheck, CalendarX, FileText,
  Clock, ArrowLeft, Loader2, AlertCircle, LogIn, LogOut,
  AlertTriangle, CreditCard, ChevronRight, ShieldCheck, CheckCircle2,
} from 'lucide-react';
import {
  getStaffBookingByIdApi, checkInBookingApi, checkOutBookingApi, markNoShowApi,
} from '../../api/staff';
import { getBookingPaymentSummaryApi } from '../../api/payments';
import BookingStatus from '../../components/booking/BookingStatus';
import { PaymentSettlementBadge, PaymentMethodBadge } from '../../components/payment/PaymentStatus';
import OperationalActionDialog from '../../components/staff/OperationalActionDialog';
import ErrorMessage from '../../components/common/ErrorMessage';

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

  const fetchDetails = async () => {
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
        setError('Failed to load operational booking details.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [bookingId]);

  const handleActionConfirm = async () => {
    const { actionType } = actionDialog;
    setIsActionLoading(true);
    setError('');
    try {
      if (actionType === 'check_in') {
        const updated = await checkInBookingApi(Number(bookingId));
        setBooking(updated);
        setActionSuccess('Guest checked in successfully!');
      } else if (actionType === 'check_out') {
        const updated = await checkOutBookingApi(Number(bookingId));
        setBooking(updated);
        setActionSuccess('Guest checked out successfully!');
      } else if (actionType === 'no_show') {
        const updated = await markNoShowApi(Number(bookingId));
        setBooking(updated);
        setActionSuccess('Reservation marked as No-Show.');
      }

      setActionDialog({ isOpen: false, actionType: 'check_in' });
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to perform ${actionType.replace('_', ' ')}.`);
      setActionDialog({ isOpen: false, actionType: 'check_in' });
    } finally {
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500 animate-pulse">
          Loading operational record...
        </p>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-slate-800">Booking Record Unavailable</h2>
        <p className="text-sm text-slate-500">{error}</p>
        <Link
          to="/staff/bookings"
          className="inline-block mt-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl text-sm"
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {actionDialog.isOpen && (
        <OperationalActionDialog
          actionType={actionDialog.actionType}
          bookingId={booking_id}
          onConfirm={handleActionConfirm}
          onDismiss={() => setActionDialog({ isOpen: false, actionType: 'check_in' })}
          isLoading={isActionLoading}
        />
      )}

      {/* Back Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/staff/bookings"
          className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Staff Bookings</span>
        </Link>

        <Link
          to="/staff"
          className="text-xs font-bold text-blue-600 hover:underline"
        >
          Staff Dashboard →
        </Link>
      </div>

      {/* Action Success Alert */}
      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
          <button
            onClick={() => setActionSuccess('')}
            className="text-emerald-500 hover:text-emerald-700 font-bold ml-3"
          >
            &times;
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
            <Hash className="w-3.5 h-3.5" />
            <span>Operational File #{booking_id}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Room #{room_id} Reservation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Created on {formatDatetime(created_at)}
          </p>
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

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Operational Actions Toolbar Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Front Desk Actions
        </h2>

        <div className="flex flex-wrap items-center gap-3">
          {/* Check-In Action (Only when Confirmed) */}
          {status === 'confirmed' && (
            <button
              type="button"
              id="staff-checkin-btn"
              onClick={() => setActionDialog({ isOpen: true, actionType: 'check_in' })}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Perform Check-In</span>
            </button>
          )}

          {/* Check-Out Action (Only when Checked In) */}
          {status === 'checked_in' && (
            <button
              type="button"
              id="staff-checkout-btn"
              onClick={() => setActionDialog({ isOpen: true, actionType: 'check_out' })}
              className="px-5 py-2.5 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 transition-all flex items-center space-x-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Perform Check-Out</span>
            </button>
          )}

          {/* No-Show Action (Only when Confirmed) */}
          {status === 'confirmed' && (
            <button
              type="button"
              id="staff-noshow-btn"
              onClick={() => setActionDialog({ isOpen: true, actionType: 'no_show' })}
              className="px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Mark No-Show</span>
            </button>
          )}

          {/* Record Payment Action */}
          <Link
            to={`/bookings/${booking_id}/payment`}
            className="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors flex items-center space-x-1.5"
          >
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>Record / View Payments</span>
          </Link>
        </div>

        {/* Terminal Status Notices */}
        {status === 'checked_out' && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
            Guest has completed stay and checked out. Room is queued for turnover.
          </div>
        )}
        {status === 'no_show' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
            This reservation was marked as a No-Show. Room inventory has been returned to stock.
          </div>
        )}
        {status === 'cancelled' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700">
            This reservation was cancelled.
          </div>
        )}
      </div>

      {/* Guest & Stay Metadata Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Reservation & Guest Profile
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold block">Guest ID</span>
            <span className="font-bold text-slate-800">#{guest_id}</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold block">Assigned Room</span>
            <span className="font-bold text-slate-800">Room #{room_id}</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold block">Property ID</span>
            <span className="font-bold text-slate-800">#{property_id || '1'}</span>
          </div>
          <div>
            <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold block">Occupancy</span>
            <span className="font-bold text-slate-800">{guests_count} Guests</span>
          </div>
        </div>

        <div className="border-t border-slate-100" />

        {/* Itinerary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <CalendarCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Arrival (Check-In)</span>
            </div>
            <p className="text-sm font-bold text-slate-800">{formatDate(check_in_date)}</p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-semibold uppercase tracking-wider">
              <CalendarX className="w-3.5 h-3.5 text-blue-600" />
              <span>Departure (Check-Out)</span>
            </div>
            <p className="text-sm font-bold text-slate-800">{formatDate(check_out_date)}</p>
          </div>
        </div>

        {/* Special Requests */}
        {notes && (
          <>
            <div className="border-t border-slate-100" />
            <div className="space-y-1.5">
              <span className="text-slate-400 text-xs uppercase tracking-wider font-semibold flex items-center space-x-1">
                <FileText className="w-3 h-3" />
                <span>Guest Notes & Requests</span>
              </span>
              <p className="text-xs text-slate-700 italic bg-slate-50 p-3 rounded-xl">
                "{notes}"
              </p>
            </div>
          </>
        )}
      </div>

      {/* Financial Ledger Section */}
      {paymentSummary && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Financial Breakdown & Settlement
            </h2>
            <Link
              to={`/bookings/${booking_id}/payment`}
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Open Payment Terminal →
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs bg-slate-50 p-4 rounded-2xl">
            <div>
              <span className="text-slate-400 block">Total Rate</span>
              <span className="text-sm font-black text-slate-900">{formatINR(paymentSummary.total_booking_amount)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Paid</span>
              <span className="text-sm font-black text-emerald-700">{formatINR(paymentSummary.total_paid)}</span>
            </div>
            <div>
              <span className="text-slate-400 block">Remaining</span>
              <span className="text-sm font-black text-blue-700">{formatINR(paymentSummary.remaining_balance)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffBookingDetails;
