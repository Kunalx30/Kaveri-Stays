import React, { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Pencil, Trash2, RefreshCw, Loader2, Calendar, IndianRupee, Grid } from 'lucide-react';
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
  const num = parseFloat(amount);
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
      if (filterPropertyId) params.property_id = filterPropertyId;
      if (filterRoomTypeId) params.room_type_id = filterRoomTypeId;
      const data = await listRatePlansApi(params);
      setRatePlans(data);
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
      setProperties(props);
      setRoomTypes(types);
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

  const getPropertyName = (id) => properties.find((p) => p.property_id === id)?.name || `#${id}`;
  const getRoomTypeName = (id) => roomTypes.find((rt) => rt.room_type_id === id)?.name || `Type #${id}`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-amber-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Tag className="w-4 h-4" />
            <span>Rate Plans Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Seasonal Rate Plans
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure seasonal pricing for each room type per property.
            {!canMutate && ' View-only access for staff.'}
          </p>
        </div>
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={fetchRatePlans}
            disabled={isLoading}
            className="p-2.5 rounded-xl text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          {canMutate && (
            <button
              onClick={() => { setEditTarget(null); setModalOpen(true); }}
              className="flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors shadow-sm shadow-amber-500/20 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Rate Plan</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Navigation */}
      <ManagementNav />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filter by Property
          </label>
          <select
            value={filterPropertyId}
            onChange={(e) => setFilterPropertyId(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-700 cursor-pointer min-w-[160px]"
          >
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p.property_id} value={p.property_id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Filter by Room Type
          </label>
          <select
            value={filterRoomTypeId}
            onChange={(e) => setFilterRoomTypeId(e.target.value)}
            className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 text-slate-700 cursor-pointer min-w-[160px]"
          >
            <option value="">All Room Types</option>
            {roomTypes.map((rt) => (
              <option key={rt.room_type_id} value={rt.room_type_id}>{rt.name}</option>
            ))}
          </select>
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-7 h-7 animate-spin text-amber-500" />
        </div>
      ) : ratePlans.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-amber-400" />
          </div>
          <p className="text-lg font-bold text-slate-800">No rate plans found</p>
          <p className="text-sm text-slate-500 mt-1">
            {canMutate ? 'Create a rate plan to configure seasonal pricing.' : 'No rate plans found.'}
          </p>
          {canMutate && (
            <button
              onClick={() => { setEditTarget(null); setModalOpen(true); }}
              className="mt-4 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer"
            >
              Create Rate Plan
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {ratePlans.map((plan) => {
            const active = isActivePlan(plan);
            return (
              <div
                key={plan.rate_plan_id}
                className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition-shadow space-y-3 ${
                  active ? 'border-amber-300 ring-1 ring-amber-200' : 'border-slate-200'
                }`}
              >
                {/* Top row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan #{plan.rate_plan_id}</p>
                      <h2 className="text-sm font-black text-slate-900 truncate">
                        {plan.season_name || 'Unnamed Season'}
                      </h2>
                    </div>
                  </div>
                  {active && (
                    <span className="shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full">
                      Active
                    </span>
                  )}
                </div>

                {/* Rate */}
                <div className="flex items-center space-x-1.5 text-base font-black text-slate-900">
                  <IndianRupee className="w-4 h-4 text-amber-500" />
                  <span>{formatCurrency(plan.nightly_rate)}</span>
                  <span className="text-xs font-normal text-slate-400">/ night</span>
                </div>

                {/* Info rows */}
                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Grid className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{getRoomTypeName(plan.room_type_id)}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{formatDate(plan.valid_from)} — {formatDate(plan.valid_to)}</span>
                  </div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-0.5">
                    {getPropertyName(plan.property_id)}
                  </div>
                </div>

                {/* Actions */}
                {canMutate && (
                  <div className="flex items-center space-x-2 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => { setEditTarget(plan); setModalOpen(true); }}
                      className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors cursor-pointer border border-amber-100"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setDeleteTarget(plan)}
                      className="flex-1 flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 transition-colors cursor-pointer border border-red-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                )}
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
        currentUser={user}
      />

      <ConfirmDeleteDialog
        isOpen={!!deleteTarget}
        title="Delete Rate Plan"
        description={
          deleteTarget
            ? `Delete the "${deleteTarget.season_name || 'Unnamed'}" rate plan? Rate plans with active bookings referencing them cannot be deleted.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default ManageRatePlans;
