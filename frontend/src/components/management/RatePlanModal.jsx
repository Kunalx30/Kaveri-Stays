import React, { useState, useEffect } from 'react';
import { Tag, X, Loader2, Hotel, Grid } from 'lucide-react';
import ErrorMessage from '../common/ErrorMessage';

const RatePlanModal = ({
  isOpen,
  ratePlan = null, // null for Create, object for Edit
  properties = [],
  roomTypes = [],
  defaultPropertyId = null,
  isOwner = false,
  onSave,
  onDismiss,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    property_id: defaultPropertyId || properties[0]?.property_id || null,
    room_type_id: roomTypes[0]?.room_type_id || null,
    season_name: '',
    valid_from: '',
    valid_to: '',
    nightly_rate: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (ratePlan) {
      setFormData({
        property_id: ratePlan.property_id,
        room_type_id: ratePlan.room_type_id,
        season_name: ratePlan.season_name || '',
        valid_from: ratePlan.valid_from || '',
        valid_to: ratePlan.valid_to || '',
        nightly_rate: ratePlan.nightly_rate || '',
      });
    } else {
      const today = new Date();
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);

      setFormData({
        property_id: defaultPropertyId || properties[0]?.property_id || null,
        room_type_id: roomTypes[0]?.room_type_id || null,
        season_name: 'Standard Seasonal Plan',
        valid_from: today.toISOString().split('T')[0],
        valid_to: nextMonth.toISOString().split('T')[0],
        nightly_rate: '4500.00',
      });
    }
    setError('');
  }, [ratePlan, defaultPropertyId, properties, roomTypes, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedSeason = formData.season_name.trim();
    const rate = Number(formData.nightly_rate);

    if (trimmedSeason && (trimmedSeason.length < 2 || trimmedSeason.length > 50)) {
      setError('Season label must be between 2 and 50 characters.');
      return;
    }
    if (!formData.valid_from || !formData.valid_to) {
      setError('Both valid_from and valid_to dates are required.');
      return;
    }
    if (formData.valid_from >= formData.valid_to) {
      setError('Valid from date must be strictly earlier than Valid to date.');
      return;
    }
    if (isNaN(rate) || rate <= 0) {
      setError('Nightly rate must be a valid positive amount.');
      return;
    }

    // Validate that required lookups are present before submitting
    if (!ratePlan && !formData.property_id) {
      setError('No property available. Please ensure at least one property exists.');
      return;
    }
    if (!formData.room_type_id) {
      setError('No room type available. Please ensure at least one room type exists.');
      return;
    }

    try {
      if (ratePlan) {
        // Update payload
        await onSave({
          season_name: trimmedSeason || undefined,
          room_type_id: Number(formData.room_type_id),
          valid_from: formData.valid_from,
          valid_to: formData.valid_to,
          nightly_rate: rate,
        });
      } else {
        // Create payload
        await onSave({
          property_id: Number(formData.property_id),
          room_type_id: Number(formData.room_type_id),
          season_name: trimmedSeason || undefined,
          valid_from: formData.valid_from,
          valid_to: formData.valid_to,
          nightly_rate: rate,
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save rate plan.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rate-plan-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600">
              <Tag className="w-5 h-5" />
            </div>
            <h2 id="rate-plan-modal-title" className="text-base font-black text-slate-900">
              {ratePlan ? `Edit Rate Plan #${ratePlan.rate_plan_id}` : 'Create Seasonal Rate Plan'}
            </h2>
          </div>
          <button
            onClick={onDismiss}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <ErrorMessage message={error} onDismiss={() => setError('')} />

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Property Selector */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Hotel className="w-3.5 h-3.5 text-slate-400" />
              <span>Target Property <span className="text-red-500">*</span></span>
            </label>
            {ratePlan ? (
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700 font-semibold border border-slate-200">
                Property #{ratePlan.property_id} (Immutable)
              </div>
            ) : (
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: Number(e.target.value) })}
                disabled={isLoading || !isOwner}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-xs disabled:opacity-60"
              >
                {properties.map((p) => (
                  <option key={p.property_id} value={p.property_id}>
                    #{p.property_id} - {p.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Room Type */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Grid className="w-3.5 h-3.5 text-slate-400" />
              <span>Room Type Classification <span className="text-red-500">*</span></span>
            </label>
            <select
              value={formData.room_type_id}
              onChange={(e) => setFormData({ ...formData, room_type_id: Number(e.target.value) })}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-xs"
            >
              {roomTypes.map((rt) => (
                <option key={rt.room_type_id} value={rt.room_type_id}>
                  {rt.name} (Max {rt.max_occupancy} guests)
                </option>
              ))}
            </select>
          </div>

          {/* Season Name / Label */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Season Label / Plan Name
            </label>
            <input
              type="text"
              value={formData.season_name}
              onChange={(e) => setFormData({ ...formData, season_name: e.target.value })}
              placeholder="e.g. Monsoon Peak, Weekend Special"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-xs"
              disabled={isLoading}
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Valid From (Start) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.valid_from}
                onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-xs"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Valid To (End) <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.valid_to}
                onChange={(e) => setFormData({ ...formData, valid_to: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-xs"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Nightly Rate */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nightly Price (₹ INR) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <span className="text-slate-400 font-bold absolute left-3 top-1/2 -translate-y-1/2">₹</span>
              <input
                type="number"
                step="0.01"
                min="1"
                value={formData.nightly_rate}
                onChange={(e) => setFormData({ ...formData, nightly_rate: e.target.value })}
                placeholder="4500.00"
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-xs font-bold"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onDismiss}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{ratePlan ? 'Update Plan' : 'Create Plan'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatePlanModal;
