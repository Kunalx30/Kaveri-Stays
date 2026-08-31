import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, RefreshCw, Loader2, Hotel, DoorClosed,
  Calendar, CreditCard, Star, Percent,
  ArrowUpRight, BookOpen, IndianRupee, Target, Sparkles,
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
  if (isNaN(num)) return '₹0';
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
  <div className="bg-white border border-[#E6DFD5] rounded-3xl p-6 space-y-4 shadow-xs hover:shadow-md transition-all duration-200">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-bold text-[#7A857F] uppercase tracking-[0.18em]">{label}</span>
      <div className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <div>
      <p className={`font-serif text-3xl sm:text-4xl font-normal tracking-tight ${accentColor ?? 'text-[#16231E]'}`}>{value}</p>
      {sub && <p className="text-xs text-[#7A857F] mt-1 font-light">{sub}</p>}
    </div>
  </div>
);

const BookingStatusBar = ({ breakdown, total }) => {
  if (!breakdown || total === 0) return null;
  const statuses = [
    { key: 'confirmed', label: 'Confirmed', color: 'bg-blue-500' },
    { key: 'checked_in', label: 'Checked In', color: 'bg-emerald-600' },
    { key: 'checked_out', label: 'Checked Out', color: 'bg-indigo-500' },
    { key: 'cancelled', label: 'Cancelled', color: 'bg-rose-500' },
    { key: 'no_show', label: 'No Show', color: 'bg-slate-400' },
  ];
  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden gap-1 bg-[#F4EFEA] p-0.5 border border-[#E6DFD5]">
        {statuses.map((s) => {
          const pct = total > 0 ? (breakdown[s.key] / total) * 100 : 0;
          return pct > 0 ? (
            <div key={s.key} className={`${s.color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
          ) : null;
        })}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
        {statuses.map((s) => (
          <div key={s.key} className="flex items-center space-x-2">
            <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
            <span className="text-xs text-[#5A635F] font-medium">
              {s.label}: <strong className="text-[#16231E] font-semibold">{breakdown[s.key] ?? 0}</strong>
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
      <span className="w-14 shrink-0 font-medium text-[#5A635F] text-right">{label}</span>
      <div className="flex-1 h-2.5 bg-[#F4EFEA] border border-[#E6DFD5]/60 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 shrink-0 font-semibold text-[#16231E]">{count}</span>
      <span className="w-8 shrink-0 text-[#7A857F] text-right font-light">{pct}%</span>
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
      setProperties(data || []);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => { fetchProperties(); }, [fetchProperties]);
  useEffect(() => { fetchAll(); }, [fetchAll]);

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E6DFD5]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Business Intelligence</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#16231E]">
              Analytics & Reporting
            </h1>
            <p className="text-sm text-[#5A635F] font-light max-w-2xl leading-relaxed">
              {isOwner
                ? 'Executive performance metrics, occupancy tracking, and revenue intelligence across all resort destinations.'
                : `Operational analytics for your assigned property (Property #${user?.property_id}).`}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <button
              onClick={fetchAll}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Refresh analytics"
              aria-label="Refresh analytics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Filter Controls Bar ── */}
        <div className="bg-[#F4EFEA] p-4 sm:p-5 rounded-3xl border border-[#E6DFD5] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
              Reporting Filters
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
            {isOwner && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <label className="text-[11px] font-semibold text-[#5A635F] uppercase tracking-wider whitespace-nowrap">
                  Property:
                </label>
                <select
                  value={filterPropertyId}
                  onChange={(e) => setFilterPropertyId(e.target.value)}
                  className="w-full sm:w-auto px-3.5 py-2 bg-white border border-[#D8D0C5] rounded-xl text-xs text-[#16231E] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all cursor-pointer sm:min-w-[160px]"
                >
                  <option value="">All Properties</option>
                  {properties.map((p) => (
                    <option key={p.property_id} value={p.property_id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-[11px] font-semibold text-[#5A635F] uppercase tracking-wider whitespace-nowrap">
                From:
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 bg-white border border-[#D8D0C5] rounded-xl text-xs text-[#16231E] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all cursor-pointer"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-[11px] font-semibold text-[#5A635F] uppercase tracking-wider whitespace-nowrap">
                To:
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 bg-white border border-[#D8D0C5] rounded-xl text-xs text-[#16231E] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all cursor-pointer"
              />
            </div>

            <button
              onClick={fetchAll}
              disabled={isLoading}
              className="inline-flex items-center justify-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors disabled:opacity-60 cursor-pointer shadow-sm"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Target className="w-3.5 h-3.5" />}
              <span>Apply</span>
            </button>
          </div>
        </div>

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F4EFEA] border border-[#E6DFD5] flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-[#8A6240]" />
            </div>
            <p className="text-xs font-semibold text-[#7A857F] uppercase tracking-wider">
              Compiling business intelligence...
            </p>
          </div>
        ) : (
          <>
            {/* ── KPI Overview Cards ── */}
            {summary && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8A6240]">
                    Portfolio Performance Summary
                  </span>
                  <span className="text-xs text-[#7A857F] font-light">All-time lifetime metrics</span>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                  <KpiCard
                    icon={Hotel}
                    iconBg="bg-[#F4EFEA]"
                    iconColor="text-[#8A6240]"
                    label="Properties"
                    value={summary.total_properties}
                    sub="Active destinations"
                  />
                  <KpiCard
                    icon={DoorClosed}
                    iconBg="bg-[#EAF3EE]"
                    iconColor="text-[#1B4D3E]"
                    label="Rooms"
                    value={summary.total_rooms}
                    sub="Inventory units"
                  />
                  <KpiCard
                    icon={BookOpen}
                    iconBg="bg-[#EBF2F7]"
                    iconColor="text-[#2C5282]"
                    label="Bookings"
                    value={summary.total_bookings}
                    sub="Reservations"
                  />
                  <KpiCard
                    icon={CreditCard}
                    iconBg="bg-[#FDF6EC]"
                    iconColor="text-[#B45309]"
                    label="Revenue"
                    value={formatCurrency(summary.total_payments_amount)}
                    sub={`${summary.total_payment_transactions} payments`}
                    accentColor="text-[#B45309]"
                  />
                  <KpiCard
                    icon={Star}
                    iconBg="bg-[#FFF8EB]"
                    iconColor="text-amber-500"
                    label="Reviews"
                    value={summary.total_reviews}
                    sub={summary.average_review_rating
                      ? `Avg ${summary.average_review_rating.toFixed(1)} ★`
                      : 'No reviews yet'}
                  />
                  <KpiCard
                    icon={IndianRupee}
                    iconBg="bg-[#F4EFEA]"
                    iconColor="text-[#8A6240]"
                    label="Avg Ticket"
                    value={summary.total_payment_transactions > 0
                      ? formatCurrency(parseFloat(summary.total_payments_amount) / summary.total_payment_transactions)
                      : '—'}
                    sub="Per transaction"
                  />
                </div>
              </section>
            )}

            {/* ── Booking Analytics ── */}
            {bookingAnalytics && (
              <section className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F4EFEA]">
                  <div>
                    <div className="flex items-center space-x-2 text-[11px] font-bold text-[#2C5282] uppercase tracking-[0.2em] mb-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Booking Volume Analytics</span>
                    </div>
                    <p className="text-xs text-[#5A635F] font-light">
                      Total: <strong className="font-semibold text-[#16231E]">{bookingAnalytics.total_bookings} bookings</strong>
                      {bookingAnalytics.filter_start_date && (
                        <> between {bookingAnalytics.filter_start_date} and {bookingAnalytics.filter_end_date}</>
                      )}
                    </p>
                  </div>
                  <span className="font-serif text-4xl font-normal text-[#2C5282]">{bookingAnalytics.total_bookings}</span>
                </div>

                <BookingStatusBar
                  breakdown={bookingAnalytics.booking_status_breakdown}
                  total={bookingAnalytics.total_bookings}
                />

                {/* Status breakdown grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                  {[
                    { key: 'confirmed', label: 'Confirmed', color: 'text-blue-700 bg-blue-50/70 border-blue-100' },
                    { key: 'checked_in', label: 'Checked In', color: 'text-emerald-800 bg-emerald-50/70 border-emerald-100' },
                    { key: 'checked_out', label: 'Checked Out', color: 'text-indigo-800 bg-indigo-50/70 border-indigo-100' },
                    { key: 'cancelled', label: 'Cancelled', color: 'text-rose-800 bg-rose-50/70 border-rose-100' },
                    { key: 'no_show', label: 'No Show', color: 'text-slate-700 bg-slate-100/70 border-slate-200' },
                  ].map((s) => (
                    <div key={s.key} className={`rounded-2xl p-4 border text-center ${s.color}`}>
                      <p className="font-serif text-3xl font-normal">{bookingAnalytics.booking_status_breakdown?.[s.key] ?? 0}</p>
                      <p className="text-[10px] font-bold uppercase tracking-wider mt-1">{s.label}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ── Revenue Analytics ── */}
            {revenueAnalytics && (
              <section className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F4EFEA]">
                  <div>
                    <div className="flex items-center space-x-2 text-[11px] font-bold text-[#B45309] uppercase tracking-[0.2em] mb-1">
                      <IndianRupee className="w-3.5 h-3.5" />
                      <span>Revenue & Payments Analytics</span>
                    </div>
                    <p className="text-xs text-[#5A635F] font-light">
                      {revenueAnalytics.payment_count} processed transaction{revenueAnalytics.payment_count !== 1 ? 's' : ''}
                      {revenueAnalytics.filter_start_date && (
                        <> from {revenueAnalytics.filter_start_date} to {revenueAnalytics.filter_end_date}</>
                      )}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="font-serif text-3xl sm:text-4xl font-normal text-[#B45309]">
                      {formatCurrency(revenueAnalytics.total_payment_amount)}
                    </p>
                    <p className="text-[10px] text-[#7A857F] font-bold uppercase tracking-wider mt-1">Period Revenue</p>
                  </div>
                </div>

                {revenueAnalytics.revenue_by_property?.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <p className="text-[11px] font-bold text-[#8A6240] uppercase tracking-[0.2em]">Revenue Distribution by Property</p>
                    <div className="space-y-3">
                      {revenueAnalytics.revenue_by_property.map((item) => {
                        const pct = parseFloat(revenueAnalytics.total_payment_amount) > 0
                          ? Math.round((parseFloat(item.total_payment_amount) / parseFloat(revenueAnalytics.total_payment_amount)) * 100)
                          : 0;
                        return (
                          <div key={item.property_id} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs">
                            <div className="flex items-center justify-between sm:w-48 shrink-0">
                              <span className="font-serif text-sm font-normal text-[#16231E] truncate">{item.property_name}</span>
                              <span className="text-[11px] text-[#7A857F] sm:hidden font-light">{pct}%</span>
                            </div>
                            <div className="flex-1 h-2.5 bg-[#F4EFEA] border border-[#E6DFD5]/60 rounded-full overflow-hidden min-w-[60px]">
                              <div className="h-full bg-[#B45309] rounded-full transition-all" style={{ width: `${pct}%` }} />
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                              <span className="font-serif text-sm font-normal text-[#16231E]">
                                {formatCurrency(item.total_payment_amount)}
                              </span>
                              <span className="text-[11px] text-[#7A857F] hidden sm:inline w-10 text-right font-light">{pct}%</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ── Occupancy + Reviews Side-by-Side ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Occupancy */}
              <section className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-[11px] font-bold text-[#1B4D3E] uppercase tracking-[0.2em]">
                    <Percent className="w-3.5 h-3.5" />
                    <span>Occupancy Rate Analytics</span>
                  </div>

                  {/* Period controls */}
                  <div className="flex flex-wrap items-center gap-3 bg-[#FBF9F5] p-3.5 rounded-2xl border border-[#E6DFD5]">
                    <div className="flex items-center space-x-2">
                      <label className="text-[10px] font-bold text-[#7A857F] uppercase tracking-wider">Start:</label>
                      <input
                        type="date"
                        value={occStart}
                        onChange={(e) => setOccStart(e.target.value)}
                        className="px-2.5 py-1 text-xs bg-white border border-[#D8D0C5] rounded-lg text-[#16231E] focus:outline-none focus:ring-1 focus:ring-[#253B33] cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center space-x-2">
                      <label className="text-[10px] font-bold text-[#7A857F] uppercase tracking-wider">End:</label>
                      <input
                        type="date"
                        value={occEnd}
                        onChange={(e) => setOccEnd(e.target.value)}
                        className="px-2.5 py-1 text-xs bg-white border border-[#D8D0C5] rounded-lg text-[#16231E] focus:outline-none focus:ring-1 focus:ring-[#253B33] cursor-pointer"
                      />
                    </div>
                  </div>

                  {occupancy ? (
                    <div className="space-y-5 pt-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-serif text-4xl sm:text-5xl font-normal text-[#1B4D3E]">
                            {occupancy.occupancy_rate_percent != null
                              ? `${occupancy.occupancy_rate_percent.toFixed(1)}%`
                              : '—'}
                          </p>
                          <p className="text-xs text-[#7A857F] mt-1 font-light">Average Occupancy</p>
                        </div>

                        {/* Progress Wheel */}
                        <div className="w-24 h-24 relative">
                          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                            <circle cx="18" cy="18" r="15.9" fill="none" stroke="#F4EFEA" strokeWidth="3.5" />
                            <circle
                              cx="18" cy="18" r="15.9"
                              fill="none"
                              stroke="#1B4D3E"
                              strokeWidth="3.5"
                              strokeDasharray={`${occupancy.occupancy_rate_percent ?? 0} 100`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xs font-bold text-[#1B4D3E]">
                              {occupancy.occupancy_rate_percent != null
                                ? `${Math.round(occupancy.occupancy_rate_percent)}%`
                                : '—'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#F4EFEA]">
                        {[
                          { label: 'Total Rooms', value: occupancy.total_rooms },
                          { label: 'Occupied Nights', value: occupancy.occupied_room_nights },
                          { label: 'Available Nights', value: occupancy.total_available_room_nights },
                        ].map((s) => (
                          <div key={s.label} className="text-center p-3 rounded-2xl bg-[#FBF9F5] border border-[#E6DFD5]/60">
                            <p className="font-serif text-xl font-normal text-[#16231E]">{s.value}</p>
                            <p className="text-[10px] text-[#7A857F] font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-[#7A857F] font-light">No occupancy metrics available for this period.</p>
                  )}
                </div>
              </section>

              {/* Review Analytics */}
              <section className="bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-8 shadow-xs space-y-5 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 text-[11px] font-bold text-amber-600 uppercase tracking-[0.2em]">
                    <Star className="w-3.5 h-3.5" />
                    <span>Guest Satisfaction & Rating Breakdown</span>
                  </div>

                  {reviewAnalytics ? (
                    <div className="space-y-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-baseline space-x-2">
                            <p className="font-serif text-4xl sm:text-5xl font-normal text-[#16231E]">
                              {reviewAnalytics.average_rating != null
                                ? reviewAnalytics.average_rating.toFixed(1)
                                : '—'}
                            </p>
                            <span className="text-sm font-normal text-[#7A857F]">/ 5.0</span>
                          </div>
                          <p className="text-xs text-[#7A857F] mt-1 font-light">
                            Based on {reviewAnalytics.total_reviews} verified guest reviews
                          </p>
                        </div>

                        <div className="flex space-x-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-5 h-5 ${
                                reviewAnalytics.average_rating && s <= Math.round(reviewAnalytics.average_rating)
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-[#E6DFD5] fill-[#E6DFD5]'
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2.5 pt-4 border-t border-[#F4EFEA]">
                        {[
                          { label: '5 Stars', count: reviewAnalytics.rating_distribution.five_stars, color: 'bg-emerald-600' },
                          { label: '4 Stars', count: reviewAnalytics.rating_distribution.four_stars, color: 'bg-emerald-400' },
                          { label: '3 Stars', count: reviewAnalytics.rating_distribution.three_stars, color: 'bg-amber-400' },
                          { label: '2 Stars', count: reviewAnalytics.rating_distribution.two_stars, color: 'bg-orange-400' },
                          { label: '1 Star', count: reviewAnalytics.rating_distribution.one_star, color: 'bg-rose-400' },
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
                    <p className="text-xs text-[#7A857F] font-light">No guest reviews recorded yet.</p>
                  )}
                </div>
              </section>
            </div>

            {/* ── Property Performance Table ── */}
            {propertyPerf && propertyPerf.properties?.length > 0 && (
              <section className="bg-white border border-[#E6DFD5] rounded-3xl shadow-xs overflow-hidden space-y-0">
                <div className="p-6 sm:p-8 border-b border-[#F4EFEA]">
                  <div className="flex items-center space-x-2 text-[11px] font-bold text-[#2C5282] uppercase tracking-[0.2em] mb-1">
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Comparative Performance</span>
                  </div>
                  <p className="text-xs text-[#5A635F] font-light">
                    Direct breakdown across {propertyPerf.total_properties} active resort propert{propertyPerf.total_properties === 1 ? 'y' : 'ies'}.
                  </p>
                </div>

                {/* Mobile Cards */}
                <div className="grid grid-cols-1 gap-4 p-4 md:hidden">
                  {propertyPerf.properties.map((p) => (
                    <div key={p.property_id} className="rounded-2xl border border-[#E6DFD5] bg-[#FBF9F5] p-5 space-y-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#7A857F]">Property #{p.property_id}</p>
                        <h3 className="font-serif text-xl font-normal text-[#16231E]">{p.property_name}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-[#7A857F] font-light">Rooms</p>
                          <p className="font-serif text-lg font-normal text-[#16231E]">{p.room_count}</p>
                        </div>
                        <div>
                          <p className="text-[#7A857F] font-light">Bookings</p>
                          <p className="font-serif text-lg font-normal text-[#16231E]">{p.total_bookings}</p>
                        </div>
                        <div>
                          <p className="text-[#7A857F] font-light">Revenue</p>
                          <p className="font-serif text-lg font-normal text-[#B45309]">{formatCurrency(p.total_payment_amount)}</p>
                        </div>
                        <div>
                          <p className="text-[#7A857F] font-light">Reviews</p>
                          <p className="font-serif text-lg font-normal text-[#16231E]">{p.review_count}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-[#E6DFD5] pt-3 text-xs">
                        <span className="text-[#5A635F]">Transactions: <strong className="text-[#16231E]">{p.payment_count}</strong></span>
                        <span className="text-[#5A635F]">
                          Rating:{' '}
                          <strong className="text-amber-600">
                            {p.average_review_rating != null ? `${p.average_review_rating.toFixed(1)} ★` : 'No reviews'}
                          </strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#F4EFEA] border-b border-[#E6DFD5]">
                        {['Resort Destination', 'Rooms', 'Bookings', 'Total Revenue', 'Payments', 'Reviews', 'Avg Rating'].map((h) => (
                          <th key={h} className="text-left px-6 py-4 font-bold text-[#7A857F] uppercase tracking-[0.18em] whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F4EFEA]">
                      {propertyPerf.properties.map((p) => (
                        <tr key={p.property_id} className="hover:bg-[#FBF9F5] transition-colors">
                          <td className="px-6 py-4 font-serif text-base font-normal text-[#16231E]">
                            {p.property_name}
                          </td>
                          <td className="px-6 py-4 text-[#5A635F]">{p.room_count}</td>
                          <td className="px-6 py-4 text-[#5A635F]">{p.total_bookings}</td>
                          <td className="px-6 py-4 font-serif text-base font-normal text-[#B45309]">
                            {formatCurrency(p.total_payment_amount)}
                          </td>
                          <td className="px-6 py-4 text-[#5A635F]">{p.payment_count}</td>
                          <td className="px-6 py-4 text-[#5A635F]">{p.review_count}</td>
                          <td className="px-6 py-4">
                            {p.average_review_rating != null ? (
                              <div className="flex items-center space-x-1 text-amber-600 font-semibold">
                                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                <span>{p.average_review_rating.toFixed(1)}</span>
                              </div>
                            ) : (
                              <span className="text-[#A8B5AE]">—</span>
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
    </div>
  );
};

export default AnalyticsDashboard;
