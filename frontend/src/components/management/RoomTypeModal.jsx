import React, { useState, useEffect } from 'react';
import { Grid, X, Loader2, Users } from 'lucide-react';
import ErrorMessage from '../common/ErrorMessage';

const RoomTypeModal = ({
  isOpen,
  roomType = null, // null for Create, object for Edit
  onSave,
  onDismiss,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    max_occupancy: 2,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (roomType) {
      setFormData({
        name: roomType.name || '',
        max_occupancy: roomType.max_occupancy || 2,
      });
    } else {
      setFormData({
        name: '',
        max_occupancy: 2,
      });
    }
    setError('');
  }, [roomType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = formData.name.trim();
    const occ = Number(formData.max_occupancy);

    if (trimmedName.length < 2 || trimmedName.length > 50) {
      setError('Room type name must be between 2 and 50 characters.');
      return;
    }
    if (occ < 1 || occ > 20) {
      setError('Maximum occupancy must be between 1 and 20 guests.');
      return;
    }

    try {
      await onSave({
        name: trimmedName,
        max_occupancy: occ,
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save room type.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="room-type-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Grid className="w-5 h-5" />
            </div>
            <h2 id="room-type-modal-title" className="text-base font-black text-slate-900">
              {roomType ? `Edit Room Type #${roomType.room_type_id}` : 'Create New Room Type'}
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
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Category Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Deluxe Riverside Suite"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Maximum Guest Capacity <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min="1"
                max="20"
                value={formData.max_occupancy}
                onChange={(e) => setFormData({ ...formData, max_occupancy: e.target.value })}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all text-xs"
                required
                disabled={isLoading}
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Number of guests this room type can accommodate (1 - 20).</p>
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
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{roomType ? 'Update Category' : 'Create Category'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoomTypeModal;
