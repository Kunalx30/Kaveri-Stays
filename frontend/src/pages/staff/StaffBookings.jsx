import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Hotel, ArrowLeft, RefreshCw, Loader2, Search, SlidersHorizontal,
  Layers, CheckCircle2,
} from 'lucide-react';
import {
  listStaffBookingsApi, checkInBookingApi, checkOutBookingApi, markNoShowApi,
} from '../../api/staff';
import StaffBookingCard from '../../components/staff/StaffBookingCard';
import OperationalActionDialog from '../../components/staff/OperationalActionDialog';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

const STATUS_FILTERS = [
  { label: 'All Statuses', value: '' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Checked In', value: 'checked_in' },
  { label: 'Checked Out', value: 'checked_out' },
  { label: 'Cancelled', value: 'cancelled' },
  { label: 'No Show', value: 'no_show' },
];

const StaffBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Action Dialog State
  const [actionDialog, setActionDialog] = useState({
    isOpen: false,
    actionType: 'check_in',
    bookingId: null,
  });
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionFeedback, setActionFeedback] = useState('');

  const fetchBookings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await listStaffBookingsApi(params);
      setBookings(data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied: You do not have permission to view staff bookings.');
      } else {
        setError('Failed to load bookings.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleActionTrigger = (actionType, bookingId) => {
    setActionDialog({
      isOpen: true,
      actionType,
      bookingId,
    });
  };

  const handleActionConfirm = async () => {
    const { actionType, bookingId } = actionDialog;
    if (!bookingId) return;

    setIsActionLoading(true);
    setError('');
    try {
      if (actionType === 'check_in') {
        await checkInBookingApi(bookingId);
        setActionFeedback(`Booking #${bookingId} successfully Checked In!`);
      } else if (actionType === 'check_out') {
        await checkOutBookingApi(bookingId);
        setActionFeedback(`Booking #${bookingId} successfully Checked Out!`);
      } else if (actionType === 'no_show') {
        await markNoShowApi(bookingId);
        setActionFeedback(`Booking #${bookingId} marked as No-Show.`);
      }

      setActionDialog({ isOpen: false, actionType: 'check_in', bookingId: null });
      await fetchBookings();
    } catch (err) {
      setError(err.response?.data?.detail || `Failed to perform ${actionType.replace('_', ' ')}.`);
      setActionDialog({ isOpen: false, actionType: 'check_in', bookingId: null });
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredBookings = searchTerm
    ? bookings.filter(
        (b) =>
          String(b.booking_id).includes(searchTerm.trim()) ||
          String(b.room_id).includes(searchTerm.trim()) ||
          String(b.guest_id).includes(searchTerm.trim())
      )
    : bookings;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {actionDialog.isOpen && (
        <OperationalActionDialog
          actionType={actionDialog.actionType}
          bookingId={actionDialog.bookingId}
          onConfirm={handleActionConfirm}
          onDismiss={() =>
            setActionDialog({ isOpen: false, actionType: 'check_in', bookingId: null })
          }
          isLoading={isActionLoading}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <Link
            to="/staff"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Staff Dashboard</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Property Bookings Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Complete records of active, upcoming, and historical bookings.
          </p>
        </div>

        <button
          onClick={fetchBookings}
          disabled={isLoading}
          className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          title="Refresh bookings"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Action Success Feedback */}
      {actionFeedback && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center space-x-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
          <button
            onClick={() => setActionFeedback('')}
            className="text-emerald-500 hover:text-emerald-700 font-bold ml-3"
          >
            &times;
          </button>
        </div>
      )}

      {/* Controls Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide text-xs">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors cursor-pointer ${
                statusFilter === f.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Booking, Room, Guest ID..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
          />
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 space-y-2">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-xs font-semibold text-slate-500 animate-pulse">
            Loading property bookings...
          </p>
        </div>
      )}

      {/* Bookings List */}
      {!isLoading && !error && (
        filteredBookings.length === 0 ? (
          <EmptyState
            title={
              searchTerm
                ? `No bookings match "${searchTerm}"`
                : statusFilter
                ? `No ${statusFilter.replace('_', ' ')} bookings found`
                : 'No Bookings Recorded'
            }
            message="Try adjusting your status filter or search keywords."
          />
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-slate-500 font-semibold px-1">
              Showing <strong>{filteredBookings.length}</strong> reservation{filteredBookings.length !== 1 ? 's' : ''}
              {statusFilter && ` (${statusFilter.replace('_', ' ')})`}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredBookings.map((b) => (
                <StaffBookingCard
                  key={b.booking_id}
                  booking={b}
                  onActionTrigger={handleActionTrigger}
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default StaffBookings;
