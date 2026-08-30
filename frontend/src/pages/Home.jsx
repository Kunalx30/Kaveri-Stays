import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hotel, Sparkles, MapPin, Calendar, ArrowRight, ShieldCheck, Waves, Star, Loader2 } from 'lucide-react';
import { getPropertiesApi } from '../api/properties';
import { checkHealth, checkReadiness } from '../api/client';
import PropertyCard from '../components/property/PropertyCard';

const Home = () => {
  const [properties, setProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [backendStatus, setBackendStatus] = useState({ healthy: false, checking: true });

  useEffect(() => {
    // 1. Fetch backend health
    checkHealth()
      .then((res) => setBackendStatus({ healthy: res.status === 'healthy', checking: false }))
      .catch(() => setBackendStatus({ healthy: false, checking: false }));

    // 2. Fetch live properties for preview
    getPropertiesApi()
      .then((data) => setProperties(data))
      .catch(() => setProperties([]))
      .finally(() => setLoadingProps(false));
  }, []);

  const features = [
    {
      title: 'Riverside Scenic Escapes',
      desc: 'Handcrafted luxury properties along the sacred Kaveri with panoramic water views and tranquil surroundings.',
      icon: <Waves className="w-6 h-6 text-blue-600" />,
    },
    {
      title: 'Real-Time Availability',
      desc: 'PostgreSQL Range constraint powered engine ensuring guaranteed bookings with zero double-booking overlaps.',
      icon: <Calendar className="w-6 h-6 text-emerald-600" />,
    },
    {
      title: 'Verified Quality & Security',
      desc: 'Curated 4-star and 5-star properties with verified guest reviews and transparent seasonal pricing.',
      icon: <ShieldCheck className="w-6 h-6 text-purple-600" />,
    },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] opacity-10 [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-100">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Kaveri Stays Hospitality & Property Discovery</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight">
            Luxury Stays Along the <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-white to-amber-200">
              Sacred River Kaveri
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-blue-100/90 font-normal leading-relaxed">
            Discover tranquil riverside villas, heritage hill retreats, and scenic backwater resorts. Experience world-class hospitality and seamless online room discovery.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/properties"
              className="px-6 py-3.5 rounded-xl font-extrabold text-sm bg-white text-blue-950 hover:bg-blue-50 shadow-lg shadow-black/10 transition-all hover:scale-105 flex items-center space-x-2"
            >
              <Hotel className="w-4 h-4 text-blue-600" />
              <span>Browse Properties</span>
            </Link>

            <Link
              to="/availability"
              className="px-6 py-3.5 rounded-xl font-bold text-sm bg-blue-800/70 hover:bg-blue-800 border border-white/20 text-white backdrop-blur-md transition-all flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>Check Room Dates</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Backend Status Live Badge */}
          <div className="pt-4 flex items-center justify-center space-x-2 text-xs text-blue-200">
            <span
              className={`w-2 h-2 rounded-full ${
                backendStatus.healthy ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            ></span>
            <span>
              Backend API Status:{' '}
              <strong className="font-bold">
                {backendStatus.checking ? 'Connecting...' : backendStatus.healthy ? 'Operational' : 'Unavailable'}
              </strong>
            </span>
          </div>
        </div>
      </section>

      {/* Featured Properties Discovery Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Featured Destinations</span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Explore Our Signature Resorts
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Live inventory loaded directly from the Kaveri Stays database.
            </p>
          </div>

          <Link
            to="/properties"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 transition-colors self-start sm:self-auto"
          >
            <span>View All Properties ({properties.length})</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loadingProps ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-2">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            <p className="text-xs text-slate-400">Loading live properties...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {properties.slice(0, 3).map((property) => (
              <PropertyCard key={property.property_id} property={property} />
            ))}
          </div>
        )}
      </section>

      {/* Hospitality Platform Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div key={idx} className="space-y-3">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  {feat.icon}
                </div>
                <h3 className="text-lg font-bold text-white">{feat.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
