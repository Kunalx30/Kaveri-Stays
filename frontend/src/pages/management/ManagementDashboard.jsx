import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Hotel, Grid, DoorClosed, Tag, ShieldCheck,
  ChevronRight, RefreshCw, Building2, BarChart3,
  Sparkles, ArrowUpRight,
} from 'lucide-react';
import { getPropertiesApi, getRoomTypesApi } from '../../api/properties';
import { listRoomsApi } from '../../api/rooms';
import { listRatePlansApi } from '../../api/ratePlans';
import { useAuth } from '../../context/AuthContext';
import ManagementNav from '../../components/management/ManagementNav';
import ErrorMessage from '../../components/common/ErrorMessage';

const ManagementDashboard = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';

  const [counts, setCounts] = useState({
    properties: null,
    roomTypes: null,
    rooms: null,
    ratePlans: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError('');
    const [props, types, rms, plans] = await Promise.all([
      getPropertiesApi().catch(() => null),
      getRoomTypesApi().catch(() => null),
      listRoomsApi().catch(() => null),
      listRatePlansApi().catch(() => null),
    ]);

    // Use null to distinguish a failed API (show '—') from a genuine 0 count
    setCounts({
      properties: props !== null ? props.length : null,
      roomTypes: types !== null ? types.length : null,
      rooms: rms !== null ? rms.length : null,
      ratePlans: plans !== null ? plans.length : null,
    });

    // Show a warning if any metric failed to load
    const anyFailed = [props, types, rms, plans].some((r) => r === null);
    if (anyFailed) {
      setError("Some metrics could not be loaded. Showing '—' for unavailable data.");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchMetrics();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const KPI_CARDS = [
    {
      to: '/management/properties',
      label: 'Properties',
      sub: 'Resort destinations',
      countKey: 'properties',
      icon: Hotel,
      iconBg: 'bg-[#F4EFEA]',
      iconColor: 'text-[#8A6240]',
      borderHover: 'hover:border-[#C9A45C]',
    },
    {
      to: '/management/room-types',
      label: 'Room Types',
      sub: 'Global categories',
      countKey: 'roomTypes',
      icon: Grid,
      iconBg: 'bg-[#EBF2F7]',
      iconColor: 'text-[#2C5282]',
      borderHover: 'hover:border-[#7FA9C6]',
    },
    {
      to: '/management/rooms',
      label: 'Room Inventory',
      sub: 'Individual units',
      countKey: 'rooms',
      icon: DoorClosed,
      iconBg: 'bg-[#EAF3EE]',
      iconColor: 'text-[#1B4D3E]',
      borderHover: 'hover:border-[#6BA588]',
    },
    {
      to: '/management/rate-plans',
      label: 'Rate Plans',
      sub: 'Seasonal pricing',
      countKey: 'ratePlans',
      icon: Tag,
      iconBg: 'bg-[#FDF6EC]',
      iconColor: 'text-[#B45309]',
      borderHover: 'hover:border-[#D97706]',
    },
  ];

  const renderCount = (key) => {
    if (isLoading) return <span className="text-[#A8B5AE] font-light">—</span>;
    const val = counts[key];
    if (val === null) return <span className="text-red-500 font-sans text-2xl font-bold">!</span>;
    return val;
  };

  const portalScopeLabel = () => {
    if (isOwner) return 'Executive Portfolio Hub';
    return `Property #${user?.property_id || '1'} Operations`;
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* ── Editorial Page Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E6DFD5]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>{portalScopeLabel()}</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#16231E]">
              Hotel Management Overview
            </h1>
            <p className="text-sm text-[#5A635F] font-light max-w-2xl leading-relaxed">
              Configure resort destinations, room categories, live unit inventories, and seasonal pricing schedules.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <button
              onClick={fetchMetrics}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Refresh metrics"
              aria-label="Refresh metrics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* ── Sub Navigation ── */}
        <ManagementNav />

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* ── Primary KPI Cards Grid ── */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8A6240]">
              Inventory & Rates Portfolio
            </span>
            <span className="text-xs text-[#7A857F] hidden sm:inline">
              Live counts across system
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {KPI_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.to}
                  to={card.to}
                  className={`group relative overflow-hidden bg-white border border-[#E6DFD5] ${card.borderHover} rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-6`}
                >
                  <div className="flex items-start justify-between">
                    <div className={`w-12 h-12 rounded-2xl ${card.iconBg} flex items-center justify-center ${card.iconColor} group-hover:scale-105 transition-transform duration-200`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="w-8 h-8 rounded-full bg-[#FBF9F5] group-hover:bg-[#16231E] text-[#5A635F] group-hover:text-white flex items-center justify-center transition-colors">
                      <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </div>

                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#7A857F] mb-1">
                      {card.label}
                    </p>
                    <p className="font-serif text-4xl sm:text-5xl font-normal text-[#16231E] tracking-tight">
                      {renderCount(card.countKey)}
                    </p>
                    <p className="text-xs text-[#7A857F] mt-1 font-light">{card.sub}</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-[#F4EFEA] text-xs font-semibold text-[#16231E]">
                    <span>Manage {card.label}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-[#8A6240] group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── Quick Links & Governance Section ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link
            to="/analytics"
            className="group relative overflow-hidden bg-white border border-[#E6DFD5] hover:border-[#16231E]/30 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex items-center space-x-5"
          >
            <div className="w-14 h-14 rounded-2xl bg-[#EBF2F7] flex items-center justify-center text-[#2C5282] group-hover:scale-105 transition-transform shrink-0">
              <BarChart3 className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-base font-serif font-normal text-[#16231E]">Business Analytics</p>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2C5282] bg-[#EBF2F7] px-2 py-0.5 rounded-full">
                  Reporting
                </span>
              </div>
              <p className="text-xs text-[#5A635F] mt-1 font-light">
                Occupancy rates, revenue trends, and guest review analytics.
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[#A8B5AE] group-hover:text-[#16231E] group-hover:translate-x-1 transition-all shrink-0" />
          </Link>

          <div className="bg-white border border-[#E6DFD5] rounded-3xl p-6 shadow-xs flex items-center space-x-5">
            <div className="w-14 h-14 rounded-2xl bg-[#EAF3EE] flex items-center justify-center text-[#1B4D3E] shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <p className="text-base font-serif font-normal text-[#16231E]">
                  {isOwner ? 'Executive Role Active' : 'Property Manager Active'}
                </p>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  isOwner
                    ? 'bg-[#F4EFEA] text-[#8A6240] border-[#E6DFD5]'
                    : 'bg-[#EAF3EE] text-[#1B4D3E] border-[#CDE3D6]'
                }`}>
                  {isOwner ? 'Owner' : 'Manager'}
                </span>
              </div>
              <p className="text-xs text-[#5A635F] mt-1 font-light">
                {isOwner
                  ? 'Full governance across all properties, rates, and inventory units.'
                  : `Operational permissions scoped to Property #${user?.property_id}.`}
              </p>
            </div>
          </div>
        </section>

        {/* ── Operational Architecture Guidelines ── */}
        <section className="relative overflow-hidden bg-[#16231E] rounded-3xl p-6 sm:p-8 text-white space-y-6 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300 mb-1">
                Inventory & Rate Framework
              </p>
              <h2 className="font-serif text-xl sm:text-2xl font-normal text-white">
                System Guidelines & Operational Rules
              </h2>
            </div>
            <span className="text-[11px] text-[#A8B5AE] font-light">
              Automated integrity protections
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center space-x-2 text-amber-300">
                <Building2 className="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-wider">Property Isolation</p>
              </div>
              <p className="text-xs text-[#A8B5AE] leading-relaxed font-light">
                Rooms and rate plans are strictly bound to their assigned property. Cross-property data leakage is prevented at both UI and API levels.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-300">
                <Tag className="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-wider">Rate Automation</p>
              </div>
              <p className="text-xs text-[#A8B5AE] leading-relaxed font-light">
                Active rate plans dynamically determine the nightly price for each booking window. If no active plan matches, default category pricing applies.
              </p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-2">
              <div className="flex items-center space-x-2 text-blue-300">
                <DoorClosed className="w-4 h-4" />
                <p className="text-xs font-bold uppercase tracking-wider">Booking Integrity</p>
              </div>
              <p className="text-xs text-[#A8B5AE] leading-relaxed font-light">
                Properties, room types, and rooms with confirmed or in-house reservations are protected from accidental removal.
              </p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default ManagementDashboard;
