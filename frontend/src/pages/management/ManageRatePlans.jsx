import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Pencil, Trash2, RefreshCw, Loader2, Calendar, IndianRupee, Grid, Sparkles, Hotel } from 'lucide-react';
import {
  listRatePlansApi,
  createRatePlanApi,
  updateRatePlanApi,
  deleteRatePlanApi,
} from '../../api/ratePlans';
import { getPropertiesApi } from '../../api/properties';
import { listRoomTypesApi } from '../../api/roomTypes';
import { useAuth } from '../../context/AuthContext';
import ManagementNav from '../../components/management/ManagementNav';
import RatePlanModal from '../../components/management/RatePlanModal';
import ConfirmDeleteDialog from '../../components/management/ConfirmDeleteDialog';
import ErrorMessage from '../../components/common/ErrorMessage';

const formatDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

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

const isActivePlan = (plan) => {
  const today = new Date().toISOString().slice(0, 10);
  return plan.valid_from <= today && plan.valid_to > today;
};

const ManageRatePlans = () => {
  const { user } = useAuth();
  const isOwner = user?.role === 'owner';
  const canMutate = isOwner || user?.role === 'manager';

  const [ratePlans, setRatePlans] = useState([]);
  const [properties, setProperties] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [filterPropertyId, setFilterPropertyId] = useState('');
  const [filterRoomTypeId, setFilterRoomTypeId] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRatePlans = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const params = {};
      if (filterPropertyId) params.property_id = Number(filterPropertyId);
      if (filterRoomTypeId) params.room_type_id = Number(filterRoomTypeId);
      const data = await listRatePlansApi(params);
      setRatePlans(data || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load rate plans.');
    } finally {
      setIsLoading(false);
    }
  }, [filterPropertyId, filterRoomTypeId]);

  const fetchLookups = useCallback(async () => {
    try {
      const [props, types] = await Promise.all([
        getPropertiesApi().catch(() => []),
        listRoomTypesApi().catch(() => []),
      ]);
      setProperties(props || []);
      setRoomTypes(types || []);
    } catch {
      // non-fatal
    }
  }, []);

  useEffect(() => { fetchLookups(); }, [fetchLookups]);
  useEffect(() => { fetchRatePlans(); }, [fetchRatePlans]);

  const handleSave = async (payload) => {
    setIsSaving(true);
    try {
      if (editTarget) {
        await updateRatePlanApi(editTarget.rate_plan_id, payload);
      } else {
        await createRatePlanApi(payload);
      }
      setModalOpen(false);
      setEditTarget(null);
      fetchRatePlans();
    } catch (err) {
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteRatePlanApi(deleteTarget.rate_plan_id);
      setDeleteTarget(null);
      fetchRatePlans();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete rate plan.');
      setDeleteTarget(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const getPropertyName = (id) => properties.find((p) => p.property_id === id)?.name || `Property #${id}`;
  const getRoomTypeName = (id) => roomTypes.find((rt) => rt.room_type_id === id)?.name || `Type #${id}`;

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
        
        {/* ── Page Header ── */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E6DFD5]">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
              <Sparkles className="w-3 h-3 text-amber-600" />
              <span>Pricing Architecture</span>
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#16231E]">
              Seasonal Rate Plans
            </h1>
            <p className="text-sm text-[#5A635F] font-light max-w-2xl leading-relaxed">
              Configure dynamic seasonal pricing schedules and validity dates across room categories and destinations.
              {!canMutate && ' (View-only for your current role)'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start lg:self-auto shrink-0">
            <button
              onClick={fetchRatePlans}
              disabled={isLoading}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#16231E] bg-white hover:bg-[#F4EFEA] border border-[#E6DFD5] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              title="Refresh rate plans"
              aria-label="Refresh rate plans"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            {canMutate && (
              <button
                onClick={() => { setEditTarget(null); setModalOpen(true); }}
                className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Rate Plan</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Sub Navigation ── */}
        <ManagementNav />

        {/* ── Filters Bar ── */}
        <div className="bg-[#F4EFEA] p-4 sm:p-5 rounded-3xl border border-[#E6DFD5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
              Pricing Filters
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-[11px] font-semibold text-[#5A635F] uppercase tracking-wider whitespace-nowrap">
                Property:
              </label>
              <select
                value={filterPropertyId}
                onChange={(e) => setFilterPropertyId(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 bg-white border border-[#D8D0C5] rounded-xl text-xs text-[#16231E] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all cursor-pointer sm:min-w-[180px]"
              >
                <option value="">All Properties</option>
                {properties.map((p) => (
                  <option key={p.property_id} value={p.property_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-[11px] font-semibold text-[#5A635F] uppercase tracking-wider whitespace-nowrap">
                Category:
              </label>
              <select
                value={filterRoomTypeId}
                onChange={(e) => setFilterRoomTypeId(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2 bg-white border border-[#D8D0C5] rounded-xl text-xs text-[#16231E] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all cursor-pointer sm:min-w-[180px]"
              >
                <option value="">All Room Types</option>
                {roomTypes.map((rt) => (
                  <option key={rt.room_type_id} value={rt.room_type_id}>
                    {rt.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* ── Content ── */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-[#F4EFEA] border border-[#E6DFD5] flex items-center justify-center">
              <Loader2 className="w-7 h-7 animate-spin text-[#8A6240]" />
            </div>
            <p className="text-xs font-semibold text-[#7A857F] uppercase tracking-wider">
              Loading seasonal rate plans...
            </p>
          </div>
        ) : ratePlans.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-3xl border border-dashed border-[#D8D0C5] bg-[#FBF7EF]">
            <div className="w-20 h-20 rounded-3xl bg-white border border-[#E6DFD5] flex items-center justify-center mx-auto mb-5 shadow-sm">
              <Tag className="w-9 h-9 text-[#8A6240]" />
            </div>
            <p className="font-serif text-2xl font-normal text-[#16231E]">No Rate Plans Found</p>
            <p className="text-sm text-[#5A635F] mt-1 font-light max-w-md mx-auto">
              {canMutate
                ? 'Create a seasonal rate plan to configure special pricing windows or adjust your filters.'
                : 'No rate plans match the current filters.'}
            </p>
            {canMutate && (
              <button
                onClick={() => { setEditTarget(null); setModalOpen(true); }}
                className="mt-5 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Rate Plan</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ratePlans.map((plan) => {
              const active = isActivePlan(plan);
              return (
                <div
                  key={plan.rate_plan_id}
                  className={`group relative bg-white border rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-6 ${
                    active ? 'border-[#8A6240]/40 ring-1 ring-[#8A6240]/20' : 'border-[#E6DFD5] hover:border-[#8A6240]/30'
                  }`}
                >
                  {/* Top Badge and Status */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-xl bg-[#F4EFEA] flex items-center justify-center text-[#8A6240]">
                          <Tag className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-bold text-[#7A857F] uppercase tracking-wider">
                          Plan #{plan.rate_plan_id}
                        </span>
                      </div>

                      {active ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#EAF3EE] text-[#1B4D3E] border border-[#CDE3D6] rounded-full">
                          Active Today
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#F4EFEA] text-[#7A857F] border border-[#E6DFD5] rounded-full">
                          Scheduled
                        </span>
                      )}
                    </div>

                    {/* Plan Name */}
                    <div>
                      <h2 className="font-serif text-2xl font-normal text-[#16231E] leading-snug group-hover:text-[#8A6240] transition-colors">
                        {plan.season_name || 'Standard Seasonal Plan'}
                      </h2>
                      <div className="flex items-center space-x-2 mt-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 bg-[#EBF2F7] text-[#2C5282] border border-[#D0E0EC] rounded-full font-bold text-[10px] uppercase tracking-wider">
                          <Grid className="w-3 h-3 mr-1 text-[#2C5282]" />
                          {getRoomTypeName(plan.room_type_id)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Nightly Price Card */}
                  <div className="bg-[#FBF9F5] border border-[#E6DFD5] rounded-2xl p-4 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
                      Nightly Rate
                    </span>
                    <div className="flex items-baseline space-x-1">
                      <span className="font-serif text-3xl font-normal text-[#16231E]">
                        {formatCurrency(plan.nightly_rate)}
                      </span>
                      <span className="text-xs text-[#7A857F] font-light">/ night</span>
                    </div>
                  </div>

                  {/* Details and Actions */}
                  <div className="space-y-4 pt-4 border-t border-[#F4EFEA]">
                    <div className="space-y-2 text-xs text-[#5A635F]">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-[#8A6240] shrink-0" />
                        <span>{formatDate(plan.valid_from)} — {formatDate(plan.valid_to)}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Hotel className="w-3.5 h-3.5 text-[#8A6240] shrink-0" />
                        <span className="truncate">{getPropertyName(plan.property_id)}</span>
                      </div>
                    </div>

                    {canMutate && (
                      <div className="flex items-center space-x-2 pt-2">
                        <button
                          onClick={() => { setEditTarget(plan); setModalOpen(true); }}
                          className="flex-1 inline-flex items-center justify-center space-x-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-[#16231E] bg-[#F4EFEA] hover:bg-[#EDE8E1] border border-[#E6DFD5] transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5 text-[#8A6240]" />
                          <span>Edit Plan</span>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(plan)}
                          className="inline-flex items-center justify-center p-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors cursor-pointer"
                          title="Delete rate plan"
                          aria-label="Delete rate plan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <RatePlanModal
          isOpen={modalOpen}
          ratePlan={editTarget}
          properties={properties}
          roomTypes={roomTypes}
          onSave={handleSave}
          onDismiss={() => { setModalOpen(false); setEditTarget(null); }}
          isLoading={isSaving}
          defaultPropertyId={user?.property_id}
          isOwner={isOwner}
        />

        <ConfirmDeleteDialog
          isOpen={!!deleteTarget}
          title="Delete Rate Plan"
          description={
            deleteTarget
              ? `Delete the "${deleteTarget.season_name || 'Seasonal'}" rate plan? This will be rejected if the plan is referenced by active reservations.`
              : ''
          }
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          isLoading={isDeleting}
        />

      </div>
    </div>
  );
};

export default ManageRatePlans;
