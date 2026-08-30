import React, { useState, useEffect } from 'react';
import { Hotel, Search, Filter, Loader2, RefreshCw } from 'lucide-react';
import { getPropertiesApi } from '../api/properties';
import PropertyCard from '../components/property/PropertyCard';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProperties = async (city = null) => {
    setLoading(true);
    setError('');
    try {
      const data = await getPropertiesApi(city || undefined);
      setProperties(data);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Failed to load properties from backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties(cityFilter);
  }, [cityFilter]);

  // Client-side text filter by name/city for fast discovery
  const filteredProperties = properties.filter((p) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q);
  });

  const cities = Array.from(new Set(properties.map((p) => p.city)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2 text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">
            <Hotel className="w-4 h-4" />
            <span>Discover Stays</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Our Properties & Resorts</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Explore verified luxury stays along the scenic river Kaveri.
          </p>
        </div>

        <button
          onClick={() => fetchProperties(cityFilter)}
          disabled={loading}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs transition-colors self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row gap-4 justify-between items-center">
        {/* Search by Name */}
        <div className="relative w-full sm:w-80">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Search by hotel name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        {/* City Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1 shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>City:</span>
          </span>
          <button
            onClick={() => setCityFilter('')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
              cityFilter === ''
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Cities
          </button>
          {cities.map((city) => (
            <button
              key={city}
              onClick={() => setCityFilter(city)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                cityFilter === city
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      <ErrorMessage message={error} onDismiss={() => setError('')} />

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16 space-y-3">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-sm font-semibold text-slate-500 animate-pulse">Loading properties...</p>
        </div>
      )}

      {/* Content: Property Grid or Empty State */}
      {!loading && !error && (
        filteredProperties.length === 0 ? (
          <EmptyState
            title="No Properties Found"
            message="No properties match your filter or search query. Try clearing the filter."
            actionLabel="View All Properties"
            onAction={() => {
              setCityFilter('');
              setSearchQuery('');
            }}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.property_id} property={property} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default Properties;
