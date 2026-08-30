import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Hotel, Grid, DoorClosed, Tag, ShieldCheck,
  ChevronRight, RefreshCw, Loader2, Sparkles, Building2,
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
    properties: 0,
    roomTypes: 0,
    rooms: 0,
    ratePlans: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [props, types, rms, plans] = await Promise.all([
        getPropertiesApi().catch(() => []),
        getRoomTypesApi().catch(() => []),
        listRoomsApi().catch(() => []),
        listRatePlansApi().catch(() => []),
      ]);

      setCounts({
        properties: props.length,
        roomTypes: types.length,
        rooms: rms.length,
        ratePlans: plans.length,
      });
    } catch (err) {
      setError('Failed to load management overview metrics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Building2 className="w-4 h-4" />
            <span>{isOwner ? 'Enterprise Owner Administration' : `Property #${user?.property_id} Manager Portal`}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Hotel Inventory & Rates Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure resort properties, room categories, inventory units, and seasonal rate plans.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          disabled={isLoading}
          className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50 self-start sm:self-auto"
          title="Refresh metrics"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Sub Navigation */}
      <ManagementNav />

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Properties Card */}
        <Link
          to="/management/properties"
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Properties</span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
              <Hotel className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{isLoading ? '—' : counts.properties}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Resort Destinations</span>
          </div>
          <div className="flex items-center space-x-1 text-xs font-bold text-blue-600 pt-2 border-t border-slate-100">
            <span>Manage Properties</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Room Types Card */}
        <Link
          to="/management/room-types"
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Room Types</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
              <Grid className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{isLoading ? '—' : counts.roomTypes}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Global Categories</span>
          </div>
          <div className="flex items-center space-x-1 text-xs font-bold text-indigo-600 pt-2 border-t border-slate-100">
            <span>Manage Categories</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Rooms Card */}
        <Link
          to="/management/rooms"
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rooms</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform">
              <DoorClosed className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{isLoading ? '—' : counts.rooms}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Inventory Units</span>
          </div>
          <div className="flex items-center space-x-1 text-xs font-bold text-emerald-600 pt-2 border-t border-slate-100">
            <span>Manage Rooms</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Rate Plans Card */}
        <Link
          to="/management/rate-plans"
          className="bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-md transition-shadow group space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Rate Plans</span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
              <Tag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{isLoading ? '—' : counts.ratePlans}</span>
            <span className="text-xs text-slate-400 block mt-0.5">Pricing Schedules</span>
          </div>
          <div className="flex items-center space-x-1 text-xs font-bold text-amber-600 pt-2 border-t border-slate-100">
            <span>Manage Rate Plans</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* Role Permissions & Operational Guidelines */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4" />
          <span>Role-Based Governance Matrix</span>
        </div>

        <h2 className="text-xl sm:text-2xl font-black text-white">
          Inventory Architecture & Authorization
        </h2>

        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
          {isOwner
            ? 'As an Owner, you possess unrestricted access to create, update, and manage properties, room types, rooms, and rate plans across all regional resorts.'
            : `As Manager of Property #${user?.property_id}, you are authorized to update property details, create/edit rooms, and configure seasonal rate plans within your assigned property.`}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="bg-white/10 rounded-xl p-3 text-xs space-y-1">
            <span className="text-blue-300 font-bold block">1. Room Isolation</span>
            <p className="text-slate-300 text-[11px]">
              Rooms strictly belong to their assigned property and cannot be re-parented once initialized.
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-xs space-y-1">
            <span className="text-emerald-300 font-bold block">2. Seasonal Rates</span>
            <p className="text-slate-300 text-[11px]">
              Active rate plans snapshot nightly pricing automatically during guest reservation checkout.
            </p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-xs space-y-1">
            <span className="text-purple-300 font-bold block">3. Safety Constraints</span>
            <p className="text-slate-300 text-[11px]">
              Properties, room types, and rooms with existing active reservations cannot be deleted.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
