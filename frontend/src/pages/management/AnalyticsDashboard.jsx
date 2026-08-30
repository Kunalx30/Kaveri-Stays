import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3, TrendingUp, RefreshCw, Loader2, Hotel, DoorClosed,
  Calendar, CreditCard, Star, Users, Percent, ChevronRight,
  ArrowUpRight, BookOpen, IndianRupee, Target
} from 'lucide-react';
import {
  getDashboardSummaryApi,
  getBookingAnalyticsApi,
  getRevenueAnalyticsApi,
  getOccupancyAnalyticsApi,
  getReviewAnalyticsApi,
  getPropertyPerformanceApi,
} from '../../api/analytics';
import { getPropertiesApi } from '../../api/properties';
import { useAuth } from '../../context/AuthContext';
import ErrorMessage from '../../components/common/ErrorMessage';

/* ─── Helpers ─────────────────────────────────────────────── */
const formatCurrency = (amount) => {
  const num = parseFloat(amount ?? 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const today = () => new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};
const thirtyDaysLater = () => {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
};

/* ─── Sub-components ──────────────────────────────────────── */

const KpiCard = ({ icon: Icon, iconBg, iconColor, label, value, sub, accentColor }) => (
  <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</span>
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center ${iconColor}`}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
    <div>
      <p className={`text-3xl font-black tracking-tight ${accentColor ?? 'text-slate-900'}`}>{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  </div>
);

const BookingStatusBar = ({ breakdown, total }) => {
  if (!breakdown || total === 0) return null;
  const statuses = [
    { key: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
    { key: 'checked_in', label: 'Checked In', color: 'bg-emerald-500' },
    { key: 'checked_out', label: 'Checked Out', color: 'bg-indigo-400' },
    { key: 'cancelled', label: 'Cancelled', color: 'bg-red-400' },
    { key: 'no_show', label: 'No Show', color: 'bg-slate-300' },
  ];
  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
        {statuses.map((s) => {
          const pct = total > 0 ? (breakdown[s.key] / total) * 100 : 0;
          return pct > 0 ? (
            <div key={s.key} className={`${s.color} transition-all`} style={{ width: `${pct}%` }} />
          ) : null;
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        {statuses.map((s) => (
          <div key={s.key} className="flex items-center space-x-1.5">
            <div className={`w-2 h-2 rounded-full ${s.color}`} />
            <span className="text-[10px] font-semibold text-slate-500">
              {s.label}: <span className="text-slate-800">{breakdown[s.key] ?? 0}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const RatingBar = ({ label, count, total, color }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center space-x-3 text-xs">
      <span className="w-14 shrink-0 font-semibold text-slate-600 text-right">{label}</span>
      <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 font-bold text-slate-700">{count}</span>
      <span className="w-8 shrink-0 text-slate-400">{pct}%</span>
    </div>
  );
};

/* ─── Main Component ──────────────────────────────────────── */
const AnalyticsDashboard = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [properties, setProperties] = useState([]);
  const [filterPropertyId, setFilterPropertyId] = useState('');

  const [summary, setSummary] = useState(null);
  const [bookingAnalytics, setBookingAnalytics] = useState(null);
  const [revenueAnalytics, setRevenueAnalytics] = useState(null);
  const [occupancy, setOccupancy] = useState(null);
  const [reviewAnalytics, setReviewAnalytics] = useState(null);
  const [propertyPerf, setPropertyPerf] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Date filters for booking/revenue
  const [startDate, setStartDate] = useState(thirtyDaysAgo());
  const [endDate, setEndDate] = useState(today());

  // Occupancy period
  const [occStart, setOccStart] = useState(today());
  const [occEnd, setOccEnd] = useState(thirtyDaysLater());

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const propIdParam = filterPropertyId ? { property_id: filterPropertyId } : {};

      const [sum, book, rev, occ, rev_analytics, perf] = await Promise.all([
        getDashboardSummaryApi(propIdParam).catch(() => null),
        getBookingAnalyticsApi({ ...propIdParam, start_date: startDate, end_date: endDate }).catch(() => null),
        getRevenueAnalyticsApi({ ...propIdParam, start_date: startDate, end_date: endDate }).catch(() => null),
        getOccupancyAnalyticsApi({ ...propIdParam, period_start: occStart, period_end: occEnd }).catch(() => null),
        getReviewAnalyticsApi(propIdParam).catch(() => null),
        getPropertyPerformanceApi().catch(() => null),
      ]);

      setSummary(sum);
      setBookingAnalytics(book);
      setRevenueAnalytics(rev);
      setOccupancy(occ);
      setReviewAnalytics(rev_analytics);
      setPropertyPerf(perf);
    } catch (err) {
      setError('Failed to load analytics data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [filterPropertyId, startDate, endDate, occStart, occEnd]);

  const fetchProperties = useCallback(async () => {
    try {
      const data = await getPropertiesApi();
      setProperties(data);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Analytics & Reporting</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Business Intelligence Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isOwner
              ? 'Comprehensive analytics across all resort properties.'
              : `Analytics for your assigned property (Property #${user?.property_id}).`}
          </p>
        </div>
        <button
          onClick={fetchAll}
          disabled={isLoading}
          className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          title="Refresh analytics"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap gap-4 items-end shadow-xs">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider self-center">Filters:</div>

        {isOwner && (
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Property
            </label>
            <select
              value={filterPropertyId}
              onChange={(e) => setFilterPropertyId(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer min-w-[150px]"
            >
              <option value="">All Properties</option>
              {properties.map((p) => (
                <option key={p.property_id} value={p.property_id}>{p.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Date From
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Date To
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-slate-700 cursor-pointer"
          />
        </div>
        <button
          onClick={fetchAll}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors disabled:opacity-60 cursor-pointer shadow-sm shadow-indigo-500/20 flex items-center space-x-1.5"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
          <span>Apply</span>
        </button>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {isLoading ? (
        <div className="flex items-center justify-center h-60">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <>
          {/* ── KPI Overview Cards ── */}
          {summary && (
            <section className="space-y-3">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <TrendingUp className="w-4 h-4" />
                <span>Overview Summary</span>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                  icon={Hotel}
                  iconBg="bg-blue-100"
                  iconColor="text-blue-600"
                  label="Total Properties"
                  value={summary.total_properties}
                  sub="Resort destinations"
                />
                <KpiCard
                  icon={DoorClosed}
                  iconBg="bg-emerald-100"
                  iconColor="text-emerald-600"
                  label="Total Rooms"
                  value={summary.total_rooms}
                  sub="Inventory units"
                />
                <KpiCard
                  icon={BookOpen}
                  iconBg="bg-indigo-100"
                  iconColor="text-indigo-600"
                  label="Total Bookings"
                  value={summary.total_bookings}
                  sub="All time"
                />
                <KpiCard
                  icon={CreditCard}
                  iconBg="bg-violet-100"
                  iconColor="text-violet-600"
                  label="Total Revenue"
                  value={formatCurrency(summary.total_payments_amount)}
                  sub={`${summary.total_payment_transactions} transactions`}
                  accentColor="text-violet-700"
                />
                <KpiCard
                  icon={Star}
                  iconBg="bg-amber-100"
                  iconColor="text-amber-600"
                  label="Total Reviews"
                  value={summary.total_reviews}
                  sub={summary.average_review_rating
                    ? `Avg ${summary.average_review_rating.toFixed(1)} ★`
                    : 'No reviews yet'}
                />
                <KpiCard
                  icon={IndianRupee}
                  iconBg="bg-teal-100"
                  iconColor="text-teal-600"
                  label="Avg per Transaction"
                  value={summary.total_payment_transactions > 0
                    ? formatCurrency(parseFloat(summary.total_payments_amount) / summary.total_payment_transactions)
                    : '—'}
                  sub="Average payment size"
                  accentColor="text-teal-700"
                />
              </div>
            </section>
          )}

          {/* ── Booking Analytics ── */}
          {bookingAnalytics && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Booking Analytics</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Total: <span className="font-bold text-slate-900">{bookingAnalytics.total_bookings}</span> bookings
                    {bookingAnalytics.filter_start_date && (
                      <> from {bookingAnalytics.filter_start_date} to {bookingAnalytics.filter_end_date}</>
                    )}
                  </p>
                </div>
                <span className="text-4xl font-black text-blue-600">{bookingAnalytics.total_bookings}</span>
              </div>
              <BookingStatusBar
                breakdown={bookingAnalytics.booking_status_breakdown}
                total={bookingAnalytics.total_bookings}
              />
              {/* Breakdown grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {[
                  { key: 'confirmed', label: 'Confirmed', color: 'text-blue-600 bg-blue-50 border-blue-100' },
                  { key: 'checked_in', label: 'Checked In', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  { key: 'checked_out', label: 'Checked Out', color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
                  { key: 'cancelled', label: 'Cancelled', color: 'text-red-600 bg-red-50 border-red-100' },
                  { key: 'no_show', label: 'No Show', color: 'text-slate-600 bg-slate-50 border-slate-100' },
                ].map((s) => (
                  <div key={s.key} className={`rounded-xl px-3 py-2.5 border text-center ${s.color}`}>
                    <p className="text-2xl font-black">{bookingAnalytics.booking_status_breakdown?.[s.key] ?? 0}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Revenue Analytics ── */}
          {revenueAnalytics && (
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2 text-xs font-bold text-violet-600 uppercase tracking-wider mb-1">
                    <IndianRupee className="w-4 h-4" />
                    <span>Revenue Analytics</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    {revenueAnalytics.payment_count} payment{revenueAnalytics.payment_count !== 1 ? 's' : ''} processed
                    {revenueAnalytics.filter_start_date && (
                      <> from {revenueAnalytics.filter_start_date} to {revenueAnalytics.filter_end_date}</>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-violet-700">
                    {formatCurrency(revenueAnalytics.total_payment_amount)}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Total Revenue</p>
                </div>
              </div>

              {revenueAnalytics.revenue_by_property?.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">By Property</p>
                  {revenueAnalytics.revenue_by_property.map((item) => {
                    const pct = parseFloat(revenueAnalytics.total_payment_amount) > 0
                      ? Math.round((parseFloat(item.total_payment_amount) / parseFloat(revenueAnalytics.total_payment_amount)) * 100)
                      : 0;
                    return (
                      <div key={item.property_id} className="flex items-center gap-3">
                        <span className="text-xs font-semibold text-slate-700 w-40 truncate">{item.property_name}</span>
                        <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-bold text-slate-800 w-24 text-right">
                          {formatCurrency(item.total_payment_amount)}
                        </span>
                        <span className="text-[10px] text-slate-400 w-8 text-right">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ── Occupancy + Reviews side by side ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Occupancy */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-emerald-600 uppercase tracking-wider">
                <Percent className="w-4 h-4" />
                <span>Occupancy Analytics</span>
              </div>

              {/* Occupancy period controls */}
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Period Start</label>
                  <input
                    type="date"
                    value={occStart}
                    onChange={(e) => setOccStart(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-700 cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Period End</label>
                  <input
                    type="date"
                    value={occEnd}
                    onChange={(e) => setOccEnd(e.target.value)}
                    className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 text-slate-700 cursor-pointer"
                  />
                </div>
              </div>

              {occupancy ? (
                <div className="space-y-4 pt-2">
                  {/* Big occupancy rate */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-black text-emerald-600">
                        {occupancy.occupancy_rate_percent != null
                          ? `${occupancy.occupancy_rate_percent.toFixed(1)}%`
                          : '—'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">Occupancy Rate</p>
                    </div>
                    <div className="w-24 h-24 relative">
                      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                        <circle
                          cx="18" cy="18" r="15.9"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                          strokeDasharray={`${occupancy.occupancy_rate_percent ?? 0} 100`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-black text-emerald-600">
                          {occupancy.occupancy_rate_percent != null
                            ? `${Math.round(occupancy.occupancy_rate_percent)}%`
                            : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
                    {[
                      { label: 'Rooms', value: occupancy.total_rooms },
                      { label: 'Occupied Nights', value: occupancy.occupied_room_nights },
                      { label: 'Available Nights', value: occupancy.total_available_room_nights },
                    ].map((s) => (
                      <div key={s.label} className="text-center">
                        <p className="text-xl font-black text-slate-900">{s.value}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No occupancy data available for this period.</p>
              )}
            </section>

            {/* Review Analytics */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
                <Star className="w-4 h-4" />
                <span>Review Analytics</span>
              </div>

              {reviewAnalytics ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-black text-amber-500">
                        {reviewAnalytics.average_rating != null
                          ? reviewAnalytics.average_rating.toFixed(1)
                          : '—'}
                        <span className="text-base font-bold text-slate-400 ml-1">/ 5</span>
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Average Rating · {reviewAnalytics.total_reviews} reviews
                      </p>
                    </div>
                    <div className="flex space-x-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${
                            reviewAnalytics.average_rating && s <= Math.round(reviewAnalytics.average_rating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-200 fill-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    {[
                      { label: '5 Stars', count: reviewAnalytics.rating_distribution.five_stars, color: 'bg-emerald-500' },
                      { label: '4 Stars', count: reviewAnalytics.rating_distribution.four_stars, color: 'bg-green-400' },
                      { label: '3 Stars', count: reviewAnalytics.rating_distribution.three_stars, color: 'bg-yellow-400' },
                      { label: '2 Stars', count: reviewAnalytics.rating_distribution.two_stars, color: 'bg-orange-400' },
                      { label: '1 Star', count: reviewAnalytics.rating_distribution.one_star, color: 'bg-red-400' },
                    ].map((item) => (
                      <RatingBar
                        key={item.label}
                        label={item.label}
                        count={item.count}
                        total={reviewAnalytics.total_reviews}
                        color={item.color}
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400">No review data available.</p>
              )}
            </section>
          </div>

          {/* ── Property Performance Table ── */}
          {propertyPerf && propertyPerf.properties?.length > 0 && (
            <section className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <div className="flex items-center space-x-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Property Performance</span>
                </div>
                <p className="text-xs text-slate-500">
                  Comparative breakdown across {propertyPerf.total_properties} propert{propertyPerf.total_properties === 1 ? 'y' : 'ies'}.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      {['Property', 'Rooms', 'Bookings', 'Revenue', 'Payments', 'Reviews', 'Avg Rating'].map((h) => (
                        <th key={h} className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {propertyPerf.properties.map((p) => (
                      <tr key={p.property_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900">{p.property_name}</td>
                        <td className="px-4 py-3 text-slate-600">{p.room_count}</td>
                        <td className="px-4 py-3 text-slate-600">{p.total_bookings}</td>
                        <td className="px-4 py-3 font-bold text-violet-700">{formatCurrency(p.total_payment_amount)}</td>
                        <td className="px-4 py-3 text-slate-600">{p.payment_count}</td>
                        <td className="px-4 py-3 text-slate-600">{p.review_count}</td>
                        <td className="px-4 py-3">
                          {p.average_review_rating != null ? (
                            <div className="flex items-center space-x-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="font-bold text-amber-700">{p.average_review_rating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboard;
