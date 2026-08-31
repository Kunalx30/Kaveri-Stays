import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Hotel, LogIn, LogOut, Users, AlertTriangle,
  RefreshCw, Loader2, CheckCircle2, Layers,
  Search, Sparkles,
} from 'lucide-react';
import {
  listStaffBookingsApi, checkInBookingApi, checkOutBookingApi, markNoShowApi,
} from '../../api/staff';
import { useAuth } from '../../context/AuthContext';
import StaffBookingCard from '../../components/staff/StaffBookingCard';
import OperationalActionDialog from '../../components/staff/OperationalActionDialog';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

const parseErrorDetail = (err, fallbackMsg) => {
  const detail = err.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => (typeof d === 'string' ? d : d.msg || JSON.stringify(d))).join('. ');
  }
  return fallbackMsg;
};

const StaffDashboard = () => {
  const { user } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('arrivals');
  const [searchTerm, setSearchTerm] = useState('');

  // Operational Action State
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
      const data = await listStaffBookingsApi();
      setBookings(data || []);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied: You do not have permission to view staff operational records.');
      } else {
        setError(parseErrorDetail(err, 'Failed to load operational bookings. Please try again.'));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

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

  // Operational Date Calculations
  const todayStr = new Date().toISOString().split('T')[0];

  const todayArrivals = bookings.filter(
    (b) => b.check_in_date === todayStr && b.status === 'confirmed'
  );
  const todayDepartures = bookings.filter(
    (b) => b.check_out_date === todayStr && b.status === 'checked_in'
  );
  const currentlyInHouse = bookings.filter((b) => b.status === 'checked_in');
  const upcomingConfirmed = bookings.filter(
    (b) => b.check_in_date > todayStr && b.status === 'confirmed'
  );
  const overdueArrivals = bookings.filter(
    (b) => b.check_in_date < todayStr && b.status === 'confirmed'
  );

  // Tab Selection Data
  const getTabBookings = () => {
    switch (activeTab) {
      case 'arrivals':
        return todayArrivals;
      case 'departures':
        return todayDepartures;
      case 'in_house':
        return currentlyInHouse;
      case 'overdue':
        return overdueArrivals;
      case 'upcoming':
        return upcomingConfirmed;
      case 'all':
        return bookings;
      default:
        return todayArrivals;
    }
  };

  const currentTabList = getTabBookings();
  const cleanSearch = searchTerm.trim().toLowerCase();
  const filteredBookings = cleanSearch
    ? currentTabList.filter(
        (b) =>
          String(b.booking_id ?? '').toLowerCase().includes(cleanSearch) ||
          String(b.room_id ?? '').toLowerCase().includes(cleanSearch) ||
          String(b.guest_id ?? '').toLowerCase().includes(cleanSearch)
      )
    : currentTabList;

  const portalScopeLabel = () => {
    if (user?.role === 'staff') {
      return `Property #${user?.property_id || '1'} Operations`;
    }
    if (user?.role === 'manager') {
      return `Property #${user?.property_id || '1'} Management Hub`;
    }
    return 'Central Operations Hub';
  };

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
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>{portalScopeLabel()}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#16231E]">
              Front Desk Operations
            </h1>
            <p className="text-sm text-[#5A635F] font-light">
              Manage daily arrivals, departures, in-house guests, and room turnover.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <Link
              to="/staff/bookings"
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors shadow-2xs"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5 text-[#8A6240]" />
              <span>All Bookings</span>
            </Link>

            <button
              onClick={fetchBookings}
              disabled={isLoading}
              className="p-2.5 rounded-xl text-[#5A635F] hover:text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Refresh operations"
              aria-label="Refresh operations"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Action Success Feedback */}
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

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* Operational Metric KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Today's Arrivals */}
          <button
            type="button"
            onClick={() => setActiveTab('arrivals')}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              activeTab === 'arrivals'
                ? 'bg-[#16231E] text-white border-[#16231E] shadow-sm'
                : 'bg-white border-[#E6DFD5] hover:bg-[#F4EFEA]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === 'arrivals' ? 'text-amber-200' : 'text-[#7A857F]'}`}>
                Today's Arrivals
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'arrivals' ? 'bg-white/10 text-amber-200' : 'bg-[#F4EFEA] text-[#8A6240]'}`}>
                <LogIn className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className={`font-serif text-3xl font-normal ${activeTab === 'arrivals' ? 'text-white' : 'text-[#16231E]'}`}>
                {todayArrivals.length}
              </span>
              <span className={`text-xs block mt-0.5 ${activeTab === 'arrivals' ? 'text-white/70' : 'text-[#7A857F]'}`}>
                Due for check-in
              </span>
            </div>
          </button>

          {/* Today's Departures */}
          <button
            type="button"
            onClick={() => setActiveTab('departures')}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              activeTab === 'departures'
                ? 'bg-[#16231E] text-white border-[#16231E] shadow-sm'
                : 'bg-white border-[#E6DFD5] hover:bg-[#F4EFEA]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === 'departures' ? 'text-amber-200' : 'text-[#7A857F]'}`}>
                Today's Departures
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'departures' ? 'bg-white/10 text-amber-200' : 'bg-[#EAF3EE] text-[#1B4D3E]'}`}>
                <LogOut className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className={`font-serif text-3xl font-normal ${activeTab === 'departures' ? 'text-white' : 'text-[#16231E]'}`}>
                {todayDepartures.length}
              </span>
              <span className={`text-xs block mt-0.5 ${activeTab === 'departures' ? 'text-white/70' : 'text-[#7A857F]'}`}>
                Due for check-out
              </span>
            </div>
          </button>

          {/* In-House Guests */}
          <button
            type="button"
            onClick={() => setActiveTab('in_house')}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              activeTab === 'in_house'
                ? 'bg-[#16231E] text-white border-[#16231E] shadow-sm'
                : 'bg-white border-[#E6DFD5] hover:bg-[#F4EFEA]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === 'in_house' ? 'text-amber-200' : 'text-[#7A857F]'}`}>
                In-House Guests
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'in_house' ? 'bg-white/10 text-amber-200' : 'bg-[#F4EFEA] text-[#8A6240]'}`}>
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className={`font-serif text-3xl font-normal ${activeTab === 'in_house' ? 'text-white' : 'text-[#16231E]'}`}>
                {currentlyInHouse.length}
              </span>
              <span className={`text-xs block mt-0.5 ${activeTab === 'in_house' ? 'text-white/70' : 'text-[#7A857F]'}`}>
                Currently checked in
              </span>
            </div>
          </button>

          {/* Overdue Check-ins */}
          <button
            type="button"
            onClick={() => setActiveTab('overdue')}
            className={`p-5 rounded-3xl border text-left transition-all cursor-pointer ${
              activeTab === 'overdue'
                ? 'bg-[#16231E] text-white border-[#16231E] shadow-sm'
                : 'bg-white border-[#E6DFD5] hover:bg-[#F4EFEA]'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-[10px] uppercase font-bold tracking-wider ${activeTab === 'overdue' ? 'text-amber-200' : 'text-[#7A857F]'}`}>
                Overdue Arrivals
              </span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === 'overdue' ? 'bg-white/10 text-amber-200' : 'bg-[#FBF0E4] text-[#8C581E]'}`}>
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className={`font-serif text-3xl font-normal ${activeTab === 'overdue' ? 'text-white' : 'text-[#16231E]'}`}>
                {overdueArrivals.length}
              </span>
              <span className={`text-xs block mt-0.5 ${activeTab === 'overdue' ? 'text-white/70' : 'text-[#7A857F]'}`}>
                No-show candidates
              </span>
            </div>
          </button>
        </div>

        {/* Operational Task List Section */}
        <div className="space-y-6">
          {/* Navigation Tabs + Search Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#F4EFEA] p-4 sm:p-5 rounded-2xl border border-[#E6DFD5]">
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide text-xs">
              <button
                onClick={() => setActiveTab('arrivals')}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'arrivals' ? 'bg-[#16231E] text-white shadow-xs' : 'bg-white text-[#5A635F] hover:text-[#16231E] hover:bg-[#EDE8E1] border border-[#E6DFD5]'
                }`}
              >
                Arrivals ({todayArrivals.length})
              </button>
              <button
                onClick={() => setActiveTab('departures')}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'departures' ? 'bg-[#16231E] text-white shadow-xs' : 'bg-white text-[#5A635F] hover:text-[#16231E] hover:bg-[#EDE8E1] border border-[#E6DFD5]'
                }`}
              >
                Departures ({todayDepartures.length})
              </button>
              <button
                onClick={() => setActiveTab('in_house')}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'in_house' ? 'bg-[#16231E] text-white shadow-xs' : 'bg-white text-[#5A635F] hover:text-[#16231E] hover:bg-[#EDE8E1] border border-[#E6DFD5]'
                }`}
              >
                In-House ({currentlyInHouse.length})
              </button>
              <button
                onClick={() => setActiveTab('overdue')}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'overdue' ? 'bg-[#16231E] text-white shadow-xs' : 'bg-white text-[#5A635F] hover:text-[#16231E] hover:bg-[#EDE8E1] border border-[#E6DFD5]'
                }`}
              >
                Overdue ({overdueArrivals.length})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'upcoming' ? 'bg-[#16231E] text-white shadow-xs' : 'bg-white text-[#5A635F] hover:text-[#16231E] hover:bg-[#EDE8E1] border border-[#E6DFD5]'
                }`}
              >
                Upcoming ({upcomingConfirmed.length})
              </button>
              <button
                onClick={() => setActiveTab('all')}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === 'all' ? 'bg-[#16231E] text-white shadow-xs' : 'bg-white text-[#5A635F] hover:text-[#16231E] hover:bg-[#EDE8E1] border border-[#E6DFD5]'
                }`}
              >
                All Records ({bookings.length})
              </button>
            </div>

            {/* Search Input */}
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

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <Loader2 className="w-8 h-8 text-[#253B33] animate-spin" />
              <p className="text-sm font-medium text-[#5A635F]">
                Loading operational reservations...
              </p>
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
                      : activeTab === 'arrivals'
                      ? 'No Check-Ins Scheduled Today'
                      : activeTab === 'departures'
                      ? 'No Check-Outs Scheduled Today'
                      : activeTab === 'in_house'
                      ? 'No Guests Currently In-House'
                      : activeTab === 'overdue'
                      ? 'No Overdue Check-Ins'
                      : 'No Bookings Found'
                  }
                  message="Check back as upcoming reservation dates approach or use the All Records tab to browse complete history."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBookings.map((b) => (
                  <StaffBookingCard
                    key={b.booking_id}
                    booking={b}
                    onActionTrigger={handleActionTrigger}
                  />
                ))}
              </div>
            )
          )}
        </div>

      </div>
    </div>
  );
};

export default StaffDashboard;
