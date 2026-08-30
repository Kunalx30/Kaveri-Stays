import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Hotel, LogIn, LogOut, Users, AlertTriangle, Calendar,
  RefreshCw, Loader2, CheckCircle2, ChevronRight, Layers,
  Search, ShieldAlert,
} from 'lucide-react';
import {
  listStaffBookingsApi, checkInBookingApi, checkOutBookingApi, markNoShowApi,
} from '../../api/staff';
import { useAuth } from '../../context/AuthContext';
import StaffBookingCard from '../../components/staff/StaffBookingCard';
import OperationalActionDialog from '../../components/staff/OperationalActionDialog';
import EmptyState from '../../components/common/EmptyState';
import ErrorMessage from '../../components/common/ErrorMessage';

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

  const fetchBookings = async () => {
    setIsLoading(true);
    setError('');
    try {
      const data = await listStaffBookingsApi();
      setBookings(data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError('Access denied: You do not have permission to view staff operational data.');
      } else {
        setError('Failed to load operational bookings.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

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
  const filteredBookings = searchTerm
    ? currentTabList.filter(
        (b) =>
          String(b.booking_id).includes(searchTerm.trim()) ||
          String(b.room_id).includes(searchTerm.trim()) ||
          String(b.guest_id).includes(searchTerm.trim())
      )
    : currentTabList;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
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
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Hotel className="w-4 h-4" />
            <span>
              {user?.role === 'staff'
                ? `Property #${user?.property_id} Staff Portal`
                : user?.role === 'manager'
                ? `Property #${user?.property_id} Operations Hub`
                : 'Central Operations Hub'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Staff Operations Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage daily check-ins, departures, in-house guests, and room turnover.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <Link
            to="/staff/bookings"
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors flex items-center space-x-1.5"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Bookings</span>
          </Link>

          <button
            onClick={fetchBookings}
            disabled={isLoading}
            className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh operations"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
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

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Operational Metric KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Arrivals */}
        <button
          type="button"
          onClick={() => setActiveTab('arrivals')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'arrivals'
              ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Arrivals
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
              <LogIn className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{todayArrivals.length}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Due for check-in</span>
          </div>
        </button>

        {/* Today's Departures */}
        <button
          type="button"
          onClick={() => setActiveTab('departures')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'departures'
              ? 'bg-emerald-50/80 border-emerald-400 ring-2 ring-emerald-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Departures
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
              <LogOut className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{todayDepartures.length}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Due for check-out</span>
          </div>
        </button>

        {/* In-House Guests */}
        <button
          type="button"
          onClick={() => setActiveTab('in_house')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'in_house'
              ? 'bg-indigo-50/80 border-indigo-400 ring-2 ring-indigo-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              In-House Active
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{currentlyInHouse.length}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Currently checked in</span>
          </div>
        </button>

        {/* Overdue / Attention */}
        <button
          type="button"
          onClick={() => setActiveTab('overdue')}
          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer ${
            activeTab === 'overdue'
              ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-500/20 shadow-xs'
              : 'bg-white border-slate-200 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Overdue Check-ins
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-black text-slate-900">{overdueArrivals.length}</span>
            <span className="text-xs text-slate-400 block mt-0.5">No-show candidates</span>
          </div>
        </button>
      </div>

      {/* Operational Task List Section */}
      <div className="space-y-4">
        {/* Navigation Tabs + Search Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 md:pb-0 scrollbar-hide text-xs">
            <button
              onClick={() => setActiveTab('arrivals')}
              className={`px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'arrivals' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Arrivals ({todayArrivals.length})
            </button>
            <button
              onClick={() => setActiveTab('departures')}
              className={`px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'departures' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Departures ({todayDepartures.length})
            </button>
            <button
              onClick={() => setActiveTab('in_house')}
              className={`px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'in_house' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              In-House ({currentlyInHouse.length})
            </button>
            <button
              onClick={() => setActiveTab('overdue')}
              className={`px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'overdue' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Overdue ({overdueArrivals.length})
            </button>
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'upcoming' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Upcoming ({upcomingConfirmed.length})
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 rounded-xl font-bold transition-colors cursor-pointer shrink-0 ${
                activeTab === 'all' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              All Property Bookings ({bookings.length})
            </button>
          </div>

          {/* Search */}
          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search Booking, Room, Guest ID..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Loading Spinner */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-2">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            <p className="text-xs font-semibold text-slate-500 animate-pulse">
              Loading operational reservations...
            </p>
          </div>
        )}

        {/* Bookings Grid */}
        {!isLoading && !error && (
          filteredBookings.length === 0 ? (
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
              message="Check back as upcoming reservation dates approach or use the All Bookings tab to browse complete records."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
  );
};

export default StaffDashboard;
