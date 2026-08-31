import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, RefreshCw } from 'lucide-react';
import { getPropertiesApi } from '../api/properties';
import PropertyCard from '../components/property/PropertyCard';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

// ── Skeleton card shown while loading ────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden border border-[#E6DFD5] bg-[#FBF9F5] animate-pulse">
    <div className="bg-[#EDE8E1]" style={{ aspectRatio: '4/3' }} />
    <div className="p-5 space-y-3">
      <div className="h-5 bg-[#EDE8E1] rounded w-3/4" />
      <div className="h-3.5 bg-[#EDE8E1] rounded w-1/2" />
      <div className="h-px bg-[#E6DFD5] mt-4" />
      <div className="flex justify-between pt-1">
        <div className="h-4 bg-[#EDE8E1] rounded w-20" />
        <div className="h-8 bg-[#EDE8E1] rounded-lg w-32" />
      </div>
    </div>
  </div>
);

// ── Main page ────────────────────────────────────────────────────────────────
const Properties = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCity = searchParams.get('city') || '';

  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cityFilter, setCityFilter] = useState(initialCity);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProperties = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getPropertiesApi();
      setProperties(data || []);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to load properties from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  // Synchronize city filter if URL search param changes
  useEffect(() => {
    const urlCity = searchParams.get('city');
    if (urlCity !== null) {
      setCityFilter(urlCity);
    }
  }, [searchParams]);

  const handleCitySelect = (city) => {
    setCityFilter(city);
    if (city) {
      setSearchParams({ city });
    } else {
      setSearchParams({});
    }
  };

  // Distinct destination cities from all loaded properties
  const cities = Array.from(
    new Set(properties.map((p) => p.city?.trim()).filter(Boolean))
  );

  // Client-side text & destination filter for instant, seamless discovery
  const filteredProperties = properties.filter((p) => {
    const matchesCity =
      !cityFilter ||
      p.city?.trim().toLowerCase() === cityFilter.trim().toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      p.name?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q);
    return matchesCity && matchesQuery;
  });

  return (
    <div className="bg-[#FBF9F5] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ══════════════════════════════════════════════════════════
            SECTION 1 — EDITORIAL PAGE HEADER
            ══════════════════════════════════════════════════════════ */}
        <div className="pt-14 pb-10 sm:pt-16 sm:pb-12 border-b border-[#E6DFD5]">
          <p className="text-[10px] uppercase tracking-[0.26em] font-bold text-[#8A6240] mb-4">
            Discover Kaveri Stays
          </p>

          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div className="max-w-xl">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#16231E] leading-[1.15] tracking-tight">
                Find your next stay,<br />
                <span className="italic font-light text-[#5A635F]">somewhere unforgettable.</span>
              </h1>
              <p className="mt-4 text-sm sm:text-[15px] text-[#7A857F] leading-relaxed max-w-lg">
                From riverside retreats to quiet hillside escapes — thoughtfully selected stays designed around comfort, character, and lasting memories.
              </p>
            </div>

            {/* Refresh — subtle secondary action */}
            <div className="flex items-center gap-4 lg:shrink-0">
              {!loading && (
                <span className="text-[13px] text-[#7A857F]">
                  {filteredProperties.length === 1
                    ? '1 curated property'
                    : `${filteredProperties.length} curated properties`}
                </span>
              )}
              <button
                type="button"
                onClick={fetchProperties}
                disabled={loading}
                aria-label="Refresh property collection"
                className="inline-flex items-center space-x-1.5 text-[12px] font-medium text-[#5A635F] hover:text-[#16231E] transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 2 — SEARCH + DESTINATION FILTERS
            ══════════════════════════════════════════════════════════ */}
        <div className="py-7 flex flex-col sm:flex-row sm:items-center gap-5 border-b border-[#E6DFD5]">

          {/* Search input */}
          <div className="relative sm:w-72 lg:w-80 shrink-0">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A8B5AE] pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Search by property or destination"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search properties by name or destination"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#D8D0C5] rounded-xl text-[13px] text-[#16231E] placeholder:text-[#A8B5AE] focus:outline-none focus:ring-2 focus:ring-[#253B33]/30 focus:border-[#253B33] transition-all"
            />
          </div>

          {/* Destination filter tabs */}
          <div className="flex-1 overflow-hidden">
            <div
              className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-hide"
              role="group"
              aria-label="Filter by destination"
            >
              <span className="text-[11px] text-[#A8B5AE] uppercase tracking-widest font-semibold shrink-0 mr-2 hidden sm:block">
                Destination
              </span>
              <DestinationTab
                label="All Stays"
                active={cityFilter === ''}
                onClick={() => handleCitySelect('')}
              />
              {cities.map((city) => (
                <DestinationTab
                  key={city}
                  label={city}
                  active={cityFilter.toLowerCase() === city.toLowerCase()}
                  onClick={() => handleCitySelect(city)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Error */}
        <div className="pt-4">
          <ErrorMessage message={error} onDismiss={() => setError('')} />
        </div>

        {/* ══════════════════════════════════════════════════════════
            SECTION 3 — PROPERTY GRID
            ══════════════════════════════════════════════════════════ */}
        <div className="pt-8 pb-20">

          {/* Loading — skeleton grid */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredProperties.length === 0 && (
            <EmptyState
              title="No properties found"
              message="No stays match your current search or destination filter. Try clearing the search or selecting a different destination."
              actionLabel="View all stays"
              onAction={() => {
                handleCitySelect('');
                setSearchQuery('');
              }}
            />
          )}

          {/* Property grid */}
          {!loading && !error && filteredProperties.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-7">
              {filteredProperties.map((property) => (
                <PropertyCard key={property.property_id} property={property} />
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

// ── Destination Tab ───────────────────────────────────────────────────────────
const DestinationTab = ({ label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`shrink-0 px-3.5 py-1.5 text-[12px] font-medium rounded-lg transition-all duration-150 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#253B33] focus-visible:ring-offset-1 ${
      active
        ? 'bg-[#16231E] text-white shadow-xs'
        : 'text-[#5A635F] hover:text-[#16231E] hover:bg-[#EDE8E1]'
    }`}
  >
    {label}
  </button>
);

export default Properties;
