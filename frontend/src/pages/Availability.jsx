import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, MapPin, Star, Sparkles } from 'lucide-react';
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
        setError('Unable to check room availability. Please verify your travel dates and try again.');
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
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">

        {/* ══════════════════════════════════════════════════════════
            SECTION 1: CONTEXT & EDITORIAL HEADER
            ══════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          {propertyId && (
            <Link
              to={`/properties/${propertyId}`}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-[#8A6240] hover:text-[#16231E] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {selectedProperty?.name || 'Property Details'}</span>
            </Link>
          )}

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-[#E6DFD5]">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>
                  {propertyId && selectedProperty
                    ? 'Property Reservations'
                    : 'Live Stays Discovery'}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-[#16231E] leading-[1.15]">
                {propertyId && selectedProperty ? (
                  <>
                    Reserve your stay at <br className="hidden sm:inline" />
                    <span className="italic text-[#253B33]">{selectedProperty.name}</span>
                  </>
                ) : (
                  <>
                    Find your sanctuary, <br className="hidden sm:inline" />
                    <span className="italic text-[#253B33]">where the river slows down.</span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-[15px] text-[#5A635F] leading-relaxed max-w-2xl font-light">
                {propertyId && selectedProperty
                  ? `Select your dates and party size to explore live available rooms and seasonal rates for ${selectedProperty.name} in ${selectedProperty.city}.`
                  : 'Select your preferred dates and number of guests to view live room availability and seasonal rates across all Kaveri Stays retreats.'}
              </p>
            </div>

            {propertyId && selectedProperty && (
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#F4EFEA] border border-[#E6DFD5] self-start lg:self-auto shrink-0">
                <div className="text-right">
                  <p className="text-xs font-bold text-[#16231E] flex items-center justify-end gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#8A6240]" />
                    <span>{selectedProperty.city}</span>
                  </p>
                  <p className="text-[11px] text-[#7A857F] flex items-center justify-end gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{selectedProperty.star_rating}.0 Star Luxury</span>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2: SEARCH PANEL
            ══════════════════════════════════════════════════════════ */}
        <div className="space-y-4">
          <AvailabilitySearchForm
            initialPropertyId={propertyId || searchParams.get('property_id')}
            initialCheckIn={initialCheckIn}
            initialCheckOut={initialCheckOut}
            initialGuests={initialGuests}
            initialRoomTypeId={initialRoomTypeId}
            onSearch={executeSearch}
            isSearching={isSearching}
          />
        </div>

        {/* Error message */}
        <ErrorMessage message={error} onDismiss={() => setError('')} />

        {/* ══════════════════════════════════════════════════════════
            SECTION 3: LOADING & RESULTS
            ══════════════════════════════════════════════════════════ */}
        {isSearching && (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <Loader2 className="w-8 h-8 text-[#253B33] animate-spin" />
            <p className="text-sm font-medium text-[#5A635F]">
              Checking live room availability and seasonal rates...
            </p>
          </div>
        )}

        {/* Search Results */}
        {!isSearching && results && (
          <AvailabilityResults results={results} />
        )}

        {/* Initial Guidance Prompt (before any search is submitted) */}
        {!isSearching && !results && !hasSearched && (
          <div className="rounded-2xl border border-[#E6DFD5] bg-[#F4EFEA] p-10 sm:p-14 text-center space-y-4 max-w-xl mx-auto">
            <div className="w-12 h-12 rounded-full bg-white border border-[#E6DFD5] flex items-center justify-center mx-auto text-[#8A6240]">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-bold tracking-[0.24em] text-[#8A6240]">
                Live Reservations
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-normal text-[#16231E]">
                Select your arrival and departure dates
              </h3>
              <p className="text-xs sm:text-sm text-[#5A635F] leading-relaxed max-w-md mx-auto font-light">
                Enter your travel dates above to view available accommodations, room layouts, and verified rates.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Availability;
