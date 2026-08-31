import React, { useState, useEffect } from 'react';
import { Calendar, Users, Hotel, Search, Loader2 } from 'lucide-react';
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
  const [, setRoomTypesList] = useState([]);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [props, types] = await Promise.all([
          getPropertiesApi(),
          getRoomTypesApi(),
        ]);
        setPropertiesList(props || []);
        setRoomTypesList(types || []);
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
      setFormError('Please select an arrival (check-in) date.');
      return;
    }
    if (!checkOut) {
      setFormError('Please select a departure (check-out) date.');
      return;
    }
    if (checkIn >= checkOut) {
      setFormError('Check-out date must be strictly after the check-in date.');
      return;
    }
    if (Number(guestsCount) < 1 || Number(guestsCount) > 20) {
      setFormError('Number of guests must be between 1 and 20.');
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
    <div className="bg-white rounded-2xl border border-[#E6DFD5] p-5 sm:p-7 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#E6DFD5]">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-[#8A6240]" />
          <h2 className="text-xs uppercase font-bold tracking-[0.2em] text-[#8A6240]">
            Stay Details & Dates
          </h2>
        </div>
        <span className="text-[11px] text-[#7A857F] hidden sm:inline-block">
          Guaranteed real-time room lock
        </span>
      </div>

      <ErrorMessage message={formError} onDismiss={() => setFormError('')} />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
        
        {/* 1. Property Selector (3 cols) */}
        <div className="lg:col-span-3 space-y-1.5">
          <label className="block text-[10px] font-bold text-[#8A6240] uppercase tracking-wider">
            Destination / Retreat
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#7A857F]">
              <Hotel className="w-3.5 h-3.5" />
            </div>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className="w-full pl-8.5 pr-3 py-2.5 bg-[#FBF9F5] border border-[#D8D0C5] rounded-xl text-xs sm:text-[13px] font-medium text-[#16231E] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all cursor-pointer truncate"
            >
              <option value="">All Riverside Stays</option>
              {propertiesList.map((p) => (
                <option key={p.property_id} value={p.property_id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 2. Check-In Date (3 cols) */}
        <div className="lg:col-span-3 space-y-1.5">
          <label className="block text-[10px] font-bold text-[#8A6240] uppercase tracking-wider">
            Check-In Date *
          </label>
          <input
            type="date"
            required
            value={checkIn}
            onChange={(e) => {
              setCheckIn(e.target.value);
              setFormError('');
            }}
            className="w-full px-3 py-2.5 bg-[#FBF9F5] border border-[#D8D0C5] rounded-xl text-xs sm:text-[13px] font-medium text-[#16231E] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all [color-scheme:light]"
          />
        </div>

        {/* 3. Check-Out Date (3 cols) */}
        <div className="lg:col-span-3 space-y-1.5">
          <label className="block text-[10px] font-bold text-[#8A6240] uppercase tracking-wider">
            Check-Out Date *
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
            className="w-full px-3 py-2.5 bg-[#FBF9F5] border border-[#D8D0C5] rounded-xl text-xs sm:text-[13px] font-medium text-[#16231E] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all [color-scheme:light]"
          />
        </div>

        {/* 4. Guests Count (1 col on lg, 1 col on sm) */}
        <div className="lg:col-span-1 space-y-1.5">
          <label className="block text-[10px] font-bold text-[#8A6240] uppercase tracking-wider">
            Guests *
          </label>
          <div className="relative">
            <input
              type="number"
              min={1}
              max={20}
              required
              value={guestsCount}
              onChange={(e) => setGuestsCount(e.target.value)}
              className="w-full px-3 py-2.5 bg-[#FBF9F5] border border-[#D8D0C5] rounded-xl text-xs sm:text-[13px] font-medium text-[#16231E] focus:outline-none focus:ring-2 focus:ring-[#253B33]/20 focus:border-[#253B33] transition-all text-center"
            />
          </div>
        </div>

        {/* 5. Search Action Button (2 cols on lg) */}
        <div className="lg:col-span-2">
          <button
            type="submit"
            disabled={isSearching}
            className="w-full h-[42px] px-4 rounded-xl text-xs sm:text-[13px] font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-60 cursor-pointer shadow-sm"
          >
            {isSearching ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <>
                <Search className="w-3.5 h-3.5 text-amber-200" />
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
