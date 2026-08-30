import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Hotel, ShieldCheck, Sparkles, MapPin, CheckCircle2, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import apiClient from '../api/client';

const Home = () => {
  const { user, isAuthenticated } = useAuth();
  const [backendStatus, setBackendStatus] = useState({ healthy: false, service: '', checking: true });

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const res = await apiClient.get('/health');
        setBackendStatus({ healthy: res.data.status === 'healthy', service: res.data.service, checking: false });
      } catch {
        setBackendStatus({ healthy: false, service: 'Unavailable', checking: false });
      }
    };
    checkBackend();
  }, []);

  const features = [
    {
      title: 'Multi-Property Management',
      desc: 'Seamlessly explore and manage luxury properties across scenic Karnataka & Kerala riverside destinations.',
      icon: <Hotel className="w-6 h-6 text-brand-600" />,
    },
    {
      title: 'Real-Time Availability',
      desc: 'Accurate booking dates backed by PostgreSQL Range constraints ensuring zero double-booking conflicts.',
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-600" />,
    },
    {
      title: 'Role-Based Security',
      desc: 'Tailored portals for Guests, Staff, Managers, and Owners with strict property-level isolation.',
      icon: <ShieldCheck className="w-6 h-6 text-indigo-600" />,
    },
  ];

  const featuredLocations = [
    { name: 'Kaveri Riverside Resort', city: 'Kushalnagar, Coorg', rating: 5, tag: 'Riverside Luxury' },
    { name: 'Kaveri Hilltop Heritage', city: 'Madikeri, Coorg', rating: 4, tag: 'Hilltop Scenic' },
    { name: 'Kaveri Backwater Retreat', city: 'Kabini, Mysore', rating: 5, tag: 'Wildlife Sanctuary' },
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative gradient-hero text-white py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] opacity-10 [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-brand-100">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Welcome to Kaveri Stays Hospitality Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Luxury Stays Along the <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-200 via-white to-amber-200">
              Sacred River Kaveri
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-brand-100/90 font-normal leading-relaxed">
            Experience serene riverfront villas, tranquil hill retreats, and world-class hospitality managed by our enterprise hotel booking engine.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            {isAuthenticated ? (
              <div className="bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-xl text-sm font-semibold">
                Welcome back, <span className="text-amber-300">{user?.full_name}</span> ({user?.role})
              </div>
            ) : (
              <>
                <Link
                  to="/register"
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-white text-brand-900 hover:bg-brand-50 shadow-lg shadow-black/10 transition-all hover:scale-105"
                >
                  Create Guest Account
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-xl font-bold text-sm bg-brand-700/60 hover:bg-brand-700 border border-white/20 text-white backdrop-blur-md transition-all flex items-center space-x-2"
                >
                  <span>Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </>
            )}
          </div>

          {/* Backend Status Indicator */}
          <div className="pt-6 flex items-center justify-center space-x-2 text-xs text-brand-200">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                backendStatus.healthy ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'
              }`}
            ></span>
            <span>
              Backend API Status:{' '}
              <strong>{backendStatus.checking ? 'Connecting...' : backendStatus.healthy ? 'Connected & Operational' : 'Offline'}</strong>
            </span>
          </div>
        </div>
      </section>

      {/* Featured Properties Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Our Signature Destinations
          </h2>
          <p className="text-sm text-slate-500 max-w-xl mx-auto">
            Discover curated properties designed for tranquility, nature exploration, and memorable vacations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredLocations.map((prop, idx) => (
            <div
              key={idx}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="space-y-3">
                <span className="inline-block px-2.5 py-1 rounded-md text-[11px] font-bold tracking-wide uppercase bg-brand-50 text-brand-700 border border-brand-200">
                  {prop.tag}
                </span>
                <h3 className="text-lg font-bold text-slate-900">{prop.name}</h3>
                <p className="text-xs text-slate-500 flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{prop.city}</span>
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center text-amber-500 text-xs font-bold">
                  {'★'.repeat(prop.rating)}
                  <span className="text-slate-400 text-[11px] ml-1 font-normal">({prop.rating}-Star Luxury)</span>
                </div>
                <span className="text-xs font-semibold text-brand-600">Available</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Features Section */}
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
