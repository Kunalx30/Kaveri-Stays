import React, { useState, useEffect } from 'react';
import { DoorClosed, X, Loader2, Hotel, Grid } from 'lucide-react';
import ErrorMessage from '../common/ErrorMessage';

const RoomModal = ({
  isOpen,
  room = null, // null for Create, object for Edit
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
    room_number: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (room) {
      setFormData({
        property_id: room.property_id,
        room_type_id: room.room_type_id,
        room_number: room.room_number || '',
      });
    } else {
      setFormData({
        property_id: defaultPropertyId || properties[0]?.property_id || null,
        room_type_id: roomTypes[0]?.room_type_id || null,
        room_number: '',
      });
    }
    setError('');
  }, [room, defaultPropertyId, properties, roomTypes, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedNum = formData.room_number.trim();
    if (!trimmedNum) {
      setError('Room number cannot be blank.');
      return;
    }
    if (trimmedNum.length > 10) {
      setError('Room number must be at most 10 characters.');
      return;
    }

    // Validate that required lookups are present before submitting
    if (!room && !formData.property_id) {
      setError('No property available. Please ensure at least one property exists.');
      return;
    }
    if (!formData.room_type_id) {
      setError('No room type available. Please ensure at least one room type exists.');
      return;
    }

    try {
      if (room) {
        // Update only allows room_number and room_type_id
        await onSave({
          room_number: trimmedNum,
          room_type_id: Number(formData.room_type_id),
        });
      } else {
        // Create requires property_id, room_number, room_type_id
        await onSave({
          property_id: Number(formData.property_id),
          room_number: trimmedNum,
          room_type_id: Number(formData.room_type_id),
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save room.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600">
              <DoorClosed className="w-5 h-5" />
            </div>
            <h2 id="room-modal-title" className="text-base font-black text-slate-900">
              {room ? `Edit Room #${room.room_number}` : 'Add New Room'}
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
          {/* Property Selector (only editable on Create and if Owner) */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Hotel className="w-3.5 h-3.5 text-slate-400" />
              <span>Assigned Property <span className="text-red-500">*</span></span>
            </label>
            {room ? (
              <div className="p-2.5 bg-slate-100 rounded-xl text-slate-700 font-semibold border border-slate-200">
                {properties.find((p) => p.property_id === room.property_id)?.name || `Property #${room.property_id}`}{' '}
                <span className="text-xs font-normal text-slate-500">(Immutable)</span>
              </div>
            ) : (
              <select
                value={formData.property_id}
                onChange={(e) => setFormData({ ...formData, property_id: Number(e.target.value) })}
                disabled={isLoading || !isOwner}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-xs disabled:opacity-60"
              >
                {properties.map((p) => (
                  <option key={p.property_id} value={p.property_id}>
                    #{p.property_id} - {p.name} ({p.city})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Room Number */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Room Number / Identifier <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.room_number}
              onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
              placeholder="e.g. 101, 204B, Villa-1"
              maxLength={10}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-xs"
              required
              disabled={isLoading}
            />
          </div>

          {/* Room Type Classification */}
          <div>
            <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
              <Grid className="w-3.5 h-3.5 text-slate-400" />
              <span>Room Type Category <span className="text-red-500">*</span></span>
            </label>
            <select
              value={formData.room_type_id}
              onChange={(e) => setFormData({ ...formData, room_type_id: Number(e.target.value) })}
              disabled={isLoading}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all text-xs"
            >
              {roomTypes.map((rt) => (
                <option key={rt.room_type_id} value={rt.room_type_id}>
                  {rt.name} (Max {rt.max_occupancy} guests)
                </option>
              ))}
            </select>
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
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{room ? 'Update Room' : 'Create Room'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomModal;
