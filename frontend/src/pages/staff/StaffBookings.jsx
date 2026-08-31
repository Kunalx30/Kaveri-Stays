import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Loader2, Search, SlidersHorizontal,
  CheckCircle2, Sparkles,
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

const parseErrorDetail = (err, fallbackMsg) => {
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join('. ');
  }
  return fallbackMsg;
};

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

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await listStaffBookingsApi(params);
      setBookings(data || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied: You do not have permission to view staff bookings.');
      } else {
        setError(parseErrorDetail(err, 'Failed to load bookings. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleActionTrigger = (actionType, bookingId) => {
    if (isActionLoading) return;
    setActionDialog({
      isOpen: true,
      actionType,
      bookingId,
    });
  };

  const handleActionConfirm = async () => {
    const { actionType, bookingId } = actionDialog;
    if (!bookingId || isActionLoading) return;

    setIsActionLoading(true);
    setError('');
    setActionFeedback('');
    try {
      if (actionType === 'check_in') {
        await checkInBookingApi(bookingId);
        setActionFeedback(`Booking #${bookingId} successfully Checked In.`);
      } else if (actionType === 'check_out') {
        await checkOutBookingApi(bookingId);
        setActionFeedback(`Booking #${bookingId} successfully Checked Out.`);
      } else if (actionType === 'no_show') {
        await markNoShowApi(bookingId);
        setActionFeedback(`Booking #${bookingId} marked as No-Show.`);
      }

      setActionDialog({ isOpen: false, actionType: 'check_in', bookingId: null });
      await fetchBookings();
    } catch (err) {
      setError(parseErrorDetail(err, `Failed to perform ${actionType.replace('_', ' ')}.`));
      setActionDialog({ isOpen: false, actionType: 'check_in', bookingId: null });
    } finally {
      setIsActionLoading(false);
    }
  };

  const cleanSearch = searchTerm.trim().toLowerCase();
  const filteredBookings = cleanSearch
    ? bookings.filter(
        (b) =>
          String(b.booking_id ?? '').toLowerCase().includes(cleanSearch) ||
          String(b.room_id ?? '').toLowerCase().includes(cleanSearch) ||
          String(b.guest_id ?? '').toLowerCase().includes(cleanSearch)
      )
    : bookings;

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E6DFD5]">
          <div className="space-y-3">
            <Link
              to="/staff"
              className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#8A6240] hover:text-[#16231E] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Staff Operations</span>
            </Link>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#16231E]">
              Property Bookings Registry
            </h1>
            <p className="text-sm text-[#5A635F] font-light">
              Full operational logs of confirmed arrivals, in-house guests, and completed departures.
            </p>
          </div>

          <button
            onClick={fetchBookings}
            disabled={isLoading}
            className="p-2.5 rounded-xl text-[#5A635F] hover:text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors cursor-pointer disabled:opacity-50 self-start lg:self-auto shrink-0 shadow-2xs"
            title="Refresh bookings"
            aria-label="Refresh bookings"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Action Success Feedback Banner */}
        {actionFeedback && (
          <div className="bg-[#EAF3EE] border border-[#CDE3D6] rounded-2xl p-4 flex items-center justify-between text-xs text-[#1B4D3E]">
            <div className="flex items-center space-x-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-[#1B4D3E] shrink-0" />
              <span>{actionFeedback}</span>
            </div>
            <button
              onClick={() => setActionFeedback('')}
              className="text-[#2A6E59] hover:text-[#1B4D3E] font-bold ml-3 text-lg leading-none"
              aria-label="Dismiss feedback"
            >
              &times;
            </button>
          </div>
        )}

        {/* Controls Bar: Filters & Search */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F4EFEA] p-4 sm:p-5 rounded-2xl border border-[#E6DFD5]">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide text-xs">
            <SlidersHorizontal className="w-4 h-4 text-[#8A6240] shrink-0 mr-1" />
            {STATUS_FILTERS.map((f) => {
              const isActive = statusFilter === f.value;
              return (
                <button
                  key={f.value}
                  onClick={() => setStatusFilter(f.value)}
                  className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-[#16231E] text-white shadow-xs'
                      : 'bg-white text-[#5A635F] hover:text-[#16231E] hover:bg-[#EDE8E1] border border-[#E6DFD5]'
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-[#7A857F] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Booking, Room, Guest ID..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D8D0C5] rounded-xl text-xs text-[#16231E] placeholder:text-[#A0A8A3] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all"
            />
          </div>
        </div>

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-[#253B33] animate-spin" />
            <p className="text-sm font-medium text-[#5A635F]">Loading reservation records...</p>
          </div>
        )}

        {/* Bookings Grid */}
        {!isLoading && !error && (
          filteredBookings.length === 0 ? (
            <div className="py-8">
              <EmptyState
                title={
                  searchTerm
                    ? `No bookings match "${searchTerm}"`
                    : statusFilter
                    ? `No ${statusFilter.replace('_', ' ')} bookings found`
                    : 'No Bookings Recorded'
                }
                message="Try adjusting your status filter or search query."
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-[#7A857F] px-1">
                Showing {filteredBookings.length} {filteredBookings.length === 1 ? 'reservation' : 'reservations'}
                {statusFilter && ` · Status: ${statusFilter.replace('_', ' ')}`}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
    </div>
  );
};

export default StaffBookings;
