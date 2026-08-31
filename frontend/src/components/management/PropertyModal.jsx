import React, { useState, useEffect } from 'react';
import { Hotel, X, Loader2, Star } from 'lucide-react';
import ErrorMessage from '../common/ErrorMessage';

const PropertyModal = ({
  isOpen,
  property = null, // null for Create, object for Edit
  onSave,
  onDismiss,
  isLoading,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    star_rating: 4,
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || '',
        city: property.city || '',
        star_rating: property.star_rating ?? 4,
      });
    } else {
      setFormData({
        name: '',
        city: '',
        star_rating: 4,
      });
    }
    setError('');
  }, [property, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedName = formData.name.trim();
    const trimmedCity = formData.city.trim();
    const rating = Number(formData.star_rating);

    if (trimmedName.length < 2 || trimmedName.length > 100) {
      setError('Property name must be between 2 and 100 characters.');
      return;
    }
    if (trimmedCity.length < 2 || trimmedCity.length > 100) {
      setError('City must be between 2 and 100 characters.');
      return;
    }
    if (rating < 1 || rating > 5) {
      setError('Star rating must be an integer between 1 and 5.');
      return;
    }

    try {
      await onSave({
        name: trimmedName,
        city: trimmedCity,
        star_rating: rating,
      });
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save property.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-modal-title"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 space-y-4 animate-fadeIn">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600">
              <Hotel className="w-5 h-5" />
            </div>
            <h2 id="property-modal-title" className="text-base font-black text-slate-900">
              {property ? `Edit Property #${property.property_id}` : 'Create New Property'}
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
              Property Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Kaveri Riverside Resort"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="e.g. Srirangapatna"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-xs"
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Star Rating (1 to 5) <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setFormData({ ...formData, star_rating: star })}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    formData.star_rating === star
                      ? 'bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${formData.star_rating >= star ? 'fill-amber-400 text-amber-500' : 'text-slate-300'}`} />
                  <span>{star}</span>
                </button>
              ))}
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
              className="flex-1 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors flex items-center justify-center space-x-1.5 cursor-pointer disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>{property ? 'Update Property' : 'Create Property'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PropertyModal;
