import React, { useState, useEffect } from 'react';
import { Calendar, Users, Hotel, Layers, Search, Loader2 } from 'lucide-react';
import { getPropertiesApi, getRoomTypesApi } from '../../api/properties';
import ErrorMessage from '../common/ErrorMessage';

const AvailabilitySearchForm = ({
  initialPropertyId = null,
  initialCheckIn = '',
  initialCheckOut = '',
  initialGuests = 2,
  initialRoomTypeId = '',
  onSearch,
  isSearching = false,
}) => {
  // Helper to format date as YYYY-MM-DD
  const getTodayPlusDays = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [propertyId, setPropertyId] = useState(initialPropertyId || '');
  const [checkIn, setCheckIn] = useState(initialCheckIn || getTodayPlusDays(1));
  const [checkOut, setCheckOut] = useState(initialCheckOut || getTodayPlusDays(3));
  const [guestsCount, setGuestsCount] = useState(initialGuests || 2);
  const [roomTypeId, setRoomTypeId] = useState(initialRoomTypeId || '');

  const [propertiesList, setPropertiesList] = useState([]);
  const [roomTypesList, setRoomTypesList] = useState([]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [props, types] = await Promise.all([
          getPropertiesApi(),
          getRoomTypesApi(),
        ]);
        setPropertiesList(props);
        setRoomTypesList(types);
      } catch {
        // Fallback silently if options fetch fails
      }
    };
    fetchOptions();
  }, []);

  useEffect(() => {
    if (initialPropertyId) {
      setPropertyId(initialPropertyId);
    }
  }, [initialPropertyId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError('');

    // Client-side validation
    if (!checkIn) {
      setFormError('Please select a Check-in date.');
      return;
    }
    if (!checkOut) {
      setFormError('Please select a Check-out date.');
      return;
    }
    if (checkIn >= checkOut) {
      setFormError('Check-out date must be strictly after the Check-in date.');
      return;
    }
    if (Number(guestsCount) < 1 || Number(guestsCount) > 20) {
      setFormError('Guest count must be between 1 and 20.');
      return;
    }

    onSearch({
      check_in: checkIn,
      check_out: checkOut,
      guests_count: Number(guestsCount),
      property_id: propertyId ? Number(propertyId) : undefined,
      room_type_id: roomTypeId ? Number(roomTypeId) : undefined,
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
      <div className="flex items-center space-x-2 text-slate-800 pb-2 border-b border-slate-100">
        <Calendar className="w-5 h-5 text-blue-600" />
        <h2 className="text-base font-extrabold">Search Room Availability</h2>
      </div>

      <ErrorMessage message={formError} onDismiss={() => setFormError('')} />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        {/* 1. Property Selector */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Property / Resort
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Hotel className="w-4 h-4" />
            </div>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            >
              <option value="">All Kaveri Properties</option>
              {propertiesList.map((p) => (
                <option key={p.property_id} value={p.property_id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Check-In Date */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Check-In *
          </label>
          <input
            type="date"
            required
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              setFormError('');
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* 3. Check-Out Date */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Check-Out *
          </label>
          <input
            type="date"
            required
            min={checkIn}
            value={checkOut}
            onChange={(e) => {
              setCheckOut(e.target.value);
              setFormError('');
            }}
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* 4. Guests & Room Type */}
        <div className="space-y-1">
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
            Guests (Max 20) *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Users className="w-4 h-4" />
            </div>
            <input
              type="number"
              min={1}
              max={20}
              required
              value={guestsCount}
              onChange={(e) => setGuestsCount(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* 5. Submit Search Button */}
        <div>
          <button
            type="submit"
            disabled={isSearching}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer h-[42px]"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Search Rooms</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AvailabilitySearchForm;
