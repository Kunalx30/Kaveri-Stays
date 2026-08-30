import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { CalendarSearch, ArrowLeft, Loader2 } from 'lucide-react';
import { searchAvailabilityApi, searchPropertyAvailabilityApi } from '../api/availability';
import { getPropertyByIdApi } from '../api/properties';
import AvailabilitySearchForm from '../components/availability/AvailabilitySearchForm';
import AvailabilityResults from '../components/availability/AvailabilityResults';
import ErrorMessage from '../components/common/ErrorMessage';

const Availability = () => {
  const { propertyId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedProperty, setSelectedProperty] = useState(null);
  const [results, setResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState('');
  const [hasSearched, setHasSearched] = useState(false);

  // Read initial values from URL query parameters
  const initialCheckIn = searchParams.get('check_in') || '';
  const initialCheckOut = searchParams.get('check_out') || '';
  const initialGuests = Number(searchParams.get('guests_count')) || 2;
  const initialRoomTypeId = searchParams.get('room_type_id') || '';

  // Load property details if propertyId is in route
  useEffect(() => {
    if (propertyId) {
      getPropertyByIdApi(propertyId)
        .then((data) => setSelectedProperty(data))
        .catch(() => setSelectedProperty(null));
    }
  }, [propertyId]);

  const executeSearch = useCallback(async (params) => {
    setIsSearching(true);
    setError('');
    setHasSearched(true);

    // Update URL query parameters
    const newParams = {
      check_in: params.check_in,
      check_out: params.check_out,
      guests_count: params.guests_count.toString(),
    };
    if (params.property_id) newParams.property_id = params.property_id.toString();
    if (params.room_type_id) newParams.room_type_id = params.room_type_id.toString();
    setSearchParams(newParams);

    try {
      let data;
      if (propertyId) {
        data = await searchPropertyAvailabilityApi(propertyId, params);
      } else {
        data = await searchAvailabilityApi(params);
      }
      setResults(data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (Array.isArray(detail)) {
        setError(detail.map((d) => d.msg || JSON.stringify(d)).join(', '));
      } else {
        setError('Failed to search room availability. Please check your dates and try again.');
      }
      setResults(null);
    } finally {
      setIsSearching(false);
    }
  }, [propertyId, setSearchParams]);

  // Trigger search on mount if dates are present in URL query
  useEffect(() => {
    if (initialCheckIn && initialCheckOut) {
      executeSearch({
        check_in: initialCheckIn,
        check_out: initialCheckOut,
        guests_count: initialGuests,
        property_id: propertyId || searchParams.get('property_id') || undefined,
        room_type_id: initialRoomTypeId || undefined,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="space-y-3">
        {propertyId && (
          <Link
            to={`/properties/${propertyId}`}
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to {selectedProperty?.name || 'Property Details'}</span>
          </Link>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-200">
          <div>
            <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
              <CalendarSearch className="w-4 h-4" />
              <span>Real-Time Room Availability</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {propertyId && selectedProperty
                ? `Check Availability: ${selectedProperty.name}`
                : 'Search Available Rooms'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Select your stay dates and guests to view live room availability and dynamic rates.
            </p>
          </div>
        </div>
      </div>

      {/* Availability Search Form */}
      <AvailabilitySearchForm
        initialPropertyId={propertyId || searchParams.get('property_id')}
        initialCheckIn={initialCheckIn}
        initialCheckOut={initialCheckOut}
        initialGuests={initialGuests}
        initialRoomTypeId={initialRoomTypeId}
        onSearch={executeSearch}
        isSearching={isSearching}
      />

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Loading Indicator */}
      {isSearching && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">
            Querying room availability from PostgreSQL database...
          </p>
        </div>
      )}

      {/* Search Results */}
      {!isSearching && results && (
        <AvailabilityResults results={results} />
      )}

      {/* Initial Guidance Prompt if not searched yet */}
      {!isSearching && !results && !hasSearched && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center space-y-2 max-w-lg mx-auto">
          <CalendarSearch className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">Choose Check-in and Check-out Dates</h3>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Click "Search Rooms" above to see real-time available inventory and dynamic seasonal rates.
          </p>
        </div>
      )}
    </div>
  );
};

export default Availability;
