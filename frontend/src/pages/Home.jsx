import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  ArrowRight,
  Loader2,
  MapPin,
  Star,
  Sparkles,
  ArrowUpRight,
  Compass,
  Coffee,
  CheckCircle2,
  Waves,
  ShieldCheck,
} from 'lucide-react';
import { getPropertiesApi } from '../api/properties';
import { checkHealth } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { getPropertyCardImage } from '../data/propertyMedia';
import { getPropertyContent } from '../data/propertyContent';

const DESTINATION_LANDSCAPES = [
  {
    city: 'Coorg & Srirangapatna',
    tagline: 'River Islands & Coffee Valleys',
    description: 'Lush coffee plantations, ancient fort islands, and morning mist drifting across rocky river rapids.',
    image: '/images/hotel1.png',
    propertyId: 1,
  },
  {
    city: 'Ooty & Nilgiri Hills',
    tagline: 'Highland Pine & Mountain Air',
    description: 'Cool mountain breezes, heritage stonework, and tranquil forest trails overlooking cascading tributaries.',
    image: '/images/hotel2.png',
    propertyId: 2,
  },
  {
    city: 'Alleppey & Backwaters',
    tagline: 'Palm Lagoons & Canal Sanctuary',
    description: 'Gentle canal waterways, private wooden docks, and tranquil sunsets where the waters fan into serene lagoons.',
    image: '/images/hotel3.png',
    propertyId: 3,
  },
];

const EXPERIENCES = [
  {
    title: 'The Morning Current',
    tagline: 'NATURAL RHYTHM',
    description: 'Awaken to low mist over private riverbanks, dawn birdcalls from surrounding canopies, and unhurried coffee on wooden decks.',
    icon: Waves,
  },
  {
    title: 'PostgreSQL-Locked Dates',
    tagline: 'ZERO OVERLAPS',
    description: 'Our engine enforces true database-level range locking. When you reserve a room, it is genuinely yours — no double-bookings, ever.',
    icon: ShieldCheck,
  },
  {
    title: 'Plantation & River Flavors',
    tagline: 'REGIONAL TASTE',
    description: 'Farm-fresh Malnad coffee, traditional South Indian banana-leaf meals, and evening dining lit by warm waterside lanterns.',
    icon: Coffee,
  },
  {
    title: 'Inspected by Hand',
    tagline: 'VERIFIED CALM',
    description: 'Every property is visited in person and inspected each season. Transparent pricing with verified guest reviews left untouched.',
    icon: Compass,
  },
];

const Home = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [properties, setProperties] = useState([]);
  const [loadingProps, setLoadingProps] = useState(true);
  const [backendStatus, setBackendStatus] = useState({ healthy: false, checking: true });

  // Booking search bar states
  const todayStr = new Date().toISOString().split('T')[0];
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + 2);
  const nextDateStr = nextDate.toISOString().split('T')[0];

  const [searchPropertyId, setSearchPropertyId] = useState('');
  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(nextDateStr);
  const [guestsCount, setGuestsCount] = useState('2');

  useEffect(() => {
    // 1. Fetch backend health
    checkHealth()
      .then((res) => setBackendStatus({ healthy: res.status === 'healthy', checking: false }))
      .catch(() => setBackendStatus({ healthy: false, checking: false }));

    // 2. Fetch live properties for curated showcase
    getPropertiesApi()
      .then((data) => setProperties(data || []))
      .catch(() => setProperties([]))
      .finally(() => setLoadingProps(false));
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.append('check_in', checkIn);
    if (checkOut) params.append('check_out', checkOut);
    if (guestsCount) params.append('guests_count', guestsCount);
    if (searchPropertyId) params.append('property_id', searchPropertyId);
    navigate(`/availability?${params.toString()}`);
  };

  const primaryProperty = properties[0];
  const secondaryProperties = properties.slice(1, 3);

  return (
    <div className="bg-[#FBF9F5] text-[#1A1E1C] font-sans antialiased selection:bg-[#2D453B] selection:text-[#FBF9F5]">
      
      {/* =========================================================================
          SECTION 1: HERO / FIRST SCREEN
          Uses the exact uploaded riverside resort photograph as full-bleed background
         ========================================================================= */}
      <section className="relative min-h-screen flex flex-col justify-between overflow-hidden">
        {/* Full-bleed Hero Background Image — Navbar overlays this via fixed positioning */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hotel1.png"
            alt="Kaveri Stays riverside resort terrace overlooking mountain forests with warm evening deck lighting"
            className="w-full h-full object-cover object-[center_35%]"
          />
          {/* Ambient gradient for contrast without losing warmth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/15 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/25" />
        </div>

        {/* Hero Central Content */}
        <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 my-auto text-white">
          <div className="max-w-3xl space-y-4 sm:space-y-6">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-amber-200">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span className="tracking-widest uppercase text-[11px]">Boutique Riverside Sanctuaries</span>
            </div>

            <h1 className="font-serif text-4xl sm:text-6xl lg:text-[68px] font-normal leading-[1.08] tracking-tight text-white">
              Stay where the river <br />
              <span className="italic font-normal text-amber-100">slows down.</span>
            </h1>

            <p className="text-base sm:text-lg text-white/85 font-light leading-relaxed max-w-xl">
              Tranquil riverside villas, heritage hill sanctuaries, and serene water retreats.
              Hand-inspected properties with real-time room availability.
            </p>
          </div>
        </div>

        {/* Hero Booking & Search Panel Bar */}
        <div className="relative z-20 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12">
          <form
            onSubmit={handleSearchSubmit}
            className="bg-[#1C2D27]/95 backdrop-blur-xl border border-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xl shadow-black/40 text-white grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 sm:gap-4 items-center"
          >
            {/* Field 1: Destination / Property */}
            <div className="lg:col-span-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-4 py-3 border border-white/10">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-amber-300/90 mb-1 flex items-center space-x-1">
                <MapPin className="w-3 h-3 text-amber-300" />
                <span>Destination / Retreat</span>
              </label>
              <select
                value={searchPropertyId}
                onChange={(e) => setSearchPropertyId(e.target.value)}
                className="w-full bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer [&>option]:bg-[#1C2D27] [&>option]:text-white"
              >
                <option value="">All Riverside Destinations</option>
                {properties.map((p) => (
                  <option key={p.property_id} value={p.property_id}>
                    {p.name} — {p.city}
                  </option>
                ))}
              </select>
            </div>

            {/* Field 2: Check-in */}
            <div className="lg:col-span-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-4 py-3 border border-white/10">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-amber-300/90 mb-1 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-amber-300" />
                <span>Check-in</span>
              </label>
              <input
                type="date"
                value={checkIn}
                min={todayStr}
                onChange={(e) => setCheckIn(e.target.value)}
                className="w-full bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer [color-scheme:dark]"
                required
              />
            </div>

            {/* Field 3: Check-out */}
            <div className="lg:col-span-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl px-4 py-3 border border-white/10">
              <label className="block text-[10px] uppercase font-bold tracking-wider text-amber-300/90 mb-1 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-amber-300" />
                <span>Check-out</span>
              </label>
              <input
                type="date"
                value={checkOut}
                min={checkIn || todayStr}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer [color-scheme:dark]"
                required
              />
            </div>

            {/* Field 4: Search Button */}
            <div className="lg:col-span-2 flex items-center">
              <button
                type="submit"
                className="w-full h-full min-h-[52px] rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm tracking-wide transition-all shadow-md hover:shadow-amber-500/30 flex items-center justify-center space-x-2 cursor-pointer active:scale-[0.98]"
              >
                <span>Find Stays</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          {/* Subtle Live Badge Below Bar */}
          <div className="mt-3 flex items-center justify-between text-[11px] text-white/70 px-2">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${backendStatus.healthy ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`} />
              <span>
                Engine status:{' '}
                <strong className="font-semibold text-white">
                  {backendStatus.checking ? 'Connecting…' : backendStatus.healthy ? 'Live availability active' : 'Offline'}
                </strong>
              </span>
            </div>
            <span className="hidden sm:inline-block font-light text-white/60">
              Guaranteed PostgreSQL date-range lock on all reservations
            </span>
          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 2: INTRODUCTION / BRAND STORY
          Editorial transition with generous whitespace and controlled asymmetry
         ========================================================================= */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-[#E6DFD5]">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
            
            {/* Left Column: Large Editorial Heading & Philosophy */}
            <div className="lg:col-span-7 space-y-6">
              <p className="text-xs uppercase tracking-[0.24em] font-bold text-[#8A6240]">
                Kaveri Stays · The Philosophy
              </p>
              
              <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#16231E] leading-[1.18] tracking-tight">
                Thoughtful architecture, unbroken riverbanks, and stays designed around the water.
              </h2>

              <p className="text-base sm:text-lg text-[#5A635F] leading-relaxed font-light">
                We believe travel along the sacred river Kaveri should feel unhurried. Each retreat is chosen for its direct relationship to the water — private river decks, natural stone bathing ghats, and open skies filtered through ancient rain trees.
              </p>

              <div className="pt-2 flex items-center space-x-6 text-sm font-medium text-[#16231E]">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Zero double-booking guarantee</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>100% In-person verified</span>
                </div>
              </div>
            </div>

            {/* Right Column: Key Narrative Highlights */}
            <div className="lg:col-span-5 bg-[#F4EFEA] border border-[#E6DFD5] rounded-3xl p-8 sm:p-10 space-y-8 shadow-sm">
              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest font-mono text-[#8A6240]">01 / DIRECT ACCESS</span>
                <h3 className="font-serif text-xl font-bold text-[#16231E]">Private River Frontage</h3>
                <p className="text-sm text-[#5A635F] leading-relaxed">
                  Every property sits right on the water’s edge — giving guests uninterrupted views and direct access to gentle currents.
                </p>
              </div>

              <div className="h-px bg-[#E6DFD5]" />

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest font-mono text-[#8A6240]">02 / ATOMIC PRECISION</span>
                <h3 className="font-serif text-xl font-bold text-[#16231E]">Real-Time Database Sync</h3>
                <p className="text-sm text-[#5A635F] leading-relaxed">
                  No spreadsheets, no delayed approvals. When a room is shown as available on Kaveri Stays, it is locked directly in the system.
                </p>
              </div>

              <div className="h-px bg-[#E6DFD5]" />

              <div className="space-y-2">
                <span className="text-xs uppercase tracking-widest font-mono text-[#8A6240]">03 / AUTHENTIC HOSPITALITY</span>
                <h3 className="font-serif text-xl font-bold text-[#16231E]">Curated Regional Cuisine</h3>
                <p className="text-sm text-[#5A635F] leading-relaxed">
                  Plantation coffees, local river specialties, and quiet courtyards designed for mindful dining.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* =========================================================================
          SECTION 3: CURATED FEATURED STAYS
          Real property data fetched from existing backend with editorial cards
         ========================================================================= */}
      <section className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#E6DFD5]">
        <div className="max-w-7xl mx-auto space-y-12">
          
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 pb-4 border-b border-[#E6DFD5]">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-[0.24em] font-bold text-[#8A6240]">
                Featured Destinations
              </span>
              <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#16231E] tracking-tight">
                Curated River Sanctuaries
              </h2>
              <p className="text-sm text-[#5A635F] max-w-xl">
                Direct live inventory pulled from the Kaveri Stays database with transparent seasonal rates.
              </p>
            </div>

            <Link
              to="/properties"
              className="inline-flex items-center space-x-2 text-xs font-bold text-[#16231E] hover:text-[#8A6240] transition-colors group self-start sm:self-auto border-b border-[#16231E] pb-1"
            >
              <span>Explore All {properties.length} Stays</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loadingProps ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-[#2D453B] animate-spin" />
              <p className="text-xs text-[#5A635F] font-mono">Connecting to live property registry…</p>
            </div>
          ) : properties.length === 0 ? (
            <div className="text-center py-16 bg-[#FBF9F5] rounded-3xl border border-[#E6DFD5]">
              <p className="font-serif text-xl text-[#16231E]">No properties currently loaded</p>
              <p className="text-xs text-[#5A635F] mt-1">Please check backend connectivity.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Primary Showcase Card (Large Asymmetric Layout) */}
              {primaryProperty && (
                <div className="group bg-[#FBF9F5] border border-[#E6DFD5] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all grid grid-cols-1 lg:grid-cols-12">
                  <div className="lg:col-span-7 relative min-h-[340px] sm:min-h-[420px] overflow-hidden">
                    <img
                      src={getPropertyCardImage(primaryProperty.property_id)}
                      alt={primaryProperty.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    />
                    <div className="absolute top-4 left-4">
                      <span className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-[#16231E] shadow-sm flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-amber-500" />
                        <span>Signature Retreat</span>
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#8A6240] flex items-center space-x-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span>{primaryProperty.city}</span>
                        </span>
                        <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200/60 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span>{primaryProperty.star_rating}.0 Star</span>
                        </div>
                      </div>

                      <h3 className="font-serif text-2xl sm:text-3xl font-bold text-[#16231E] group-hover:text-[#2D453B] transition-colors">
                        {primaryProperty.name}
                      </h3>

                      <p className="text-sm text-[#5A635F] leading-relaxed">
                        {getPropertyContent(primaryProperty.property_id).property_story}
                      </p>

                      <div className="flex flex-wrap gap-2 pt-2">
                        <span className="text-[11px] font-medium bg-[#E8EFEA] text-[#253B33] px-2.5 py-1 rounded-lg">
                          Direct Riverfront
                        </span>
                        <span className="text-[11px] font-medium bg-[#E8EFEA] text-[#253B33] px-2.5 py-1 rounded-lg">
                          Private Decks
                        </span>
                        <span className="text-[11px] font-medium bg-[#E8EFEA] text-[#253B33] px-2.5 py-1 rounded-lg">
                          South Indian Dining
                        </span>
                      </div>
                    </div>

                    <div className="pt-6 border-t border-[#E6DFD5] flex items-center justify-between gap-3">
                      <Link
                        to={`/properties/${primaryProperty.property_id}`}
                        className="text-xs font-bold text-[#16231E] hover:text-[#8A6240] transition-colors flex items-center space-x-1"
                      >
                        <span>View Retreat Details</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </Link>

                      <Link
                        to={`/properties/${primaryProperty.property_id}/availability`}
                        className="px-5 py-2.5 rounded-xl bg-[#253B33] hover:bg-[#16231E] text-white text-xs font-bold transition-all shadow-sm"
                      >
                        Check Dates
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {/* Secondary Properties Grid */}
              {secondaryProperties.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {secondaryProperties.map((prop) => (
                    <div
                      key={prop.property_id}
                      className="group bg-[#FBF9F5] border border-[#E6DFD5] rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div className="relative h-64 overflow-hidden">
                        <img
                          src={getPropertyCardImage(prop.property_id)}
                          alt={prop.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute top-4 left-4">
                          <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-[#16231E] shadow-sm flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-[#8A6240]" />
                            <span>{prop.city}</span>
                          </span>
                        </div>
                      </div>

                      <div className="p-6 sm:p-8 space-y-4 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <h4 className="font-serif text-xl sm:text-2xl font-bold text-[#16231E] group-hover:text-[#2D453B] transition-colors">
                              {prop.name}
                            </h4>
                            <div className="flex items-center space-x-1 text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full text-xs font-bold border border-amber-200/50">
                              <Star className="w-3 h-3 fill-current" />
                              <span>{prop.star_rating}.0</span>
                            </div>
                          </div>
                          <p className="text-xs sm:text-sm text-[#5A635F] leading-relaxed">
                            {getPropertyContent(prop.property_id).short_description}
                          </p>
                        </div>

                        <div className="pt-4 border-t border-[#E6DFD5] flex items-center justify-between">
                          <Link
                            to={`/properties/${prop.property_id}`}
                            className="text-xs font-bold text-[#16231E] hover:text-[#8A6240] transition-colors"
                          >
                            Explore Property →
                          </Link>
                          <Link
                            to={`/properties/${prop.property_id}/availability`}
                            className="px-4 py-2 rounded-xl bg-white hover:bg-[#F4EFEA] text-[#16231E] border border-[#E6DFD5] text-xs font-bold transition-all"
                          >
                            Check Availability
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* =========================================================================
          SECTION 4: THE EXPERIENCE / WHY STAY HERE
          Editorial storytelling highlighting nature, stillness, and comfort
         ========================================================================= */}
      <section id="experience" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 bg-[#16231E] text-white">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="max-w-2xl space-y-4">
            <span className="text-xs uppercase tracking-[0.24em] font-bold text-amber-300">
              The Experience
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal leading-tight tracking-tight text-white">
              Designed around the peace of natural water.
            </h2>
            <p className="text-base text-white/75 font-light leading-relaxed">
              We curate our sanctuaries for visitors seeking stillness, wholesome living, and genuine hospitality away from crowded tourist centers.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {EXPERIENCES.map((exp, idx) => {
              const Icon = exp.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-3xl p-8 space-y-5 hover:bg-white/10 transition-colors"
                >
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center text-amber-300">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-300/80 block mb-1">
                      {exp.tagline}
                    </span>
                    <h3 className="font-serif text-xl font-bold text-white mb-2">
                      {exp.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/70 leading-relaxed font-light">
                      {exp.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Editorial Quote Banner */}
          <div className="border-t border-white/15 pt-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <blockquote className="font-serif italic text-lg sm:text-2xl text-amber-100/90 max-w-2xl leading-snug">
              “The water never stops moving, but here, time seems to pause entirely.”
            </blockquote>
            <span className="text-xs uppercase tracking-widest text-white/60 font-mono">
              — Verified Guest, Kaveri Riverside Villa
            </span>
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 5: DESTINATIONS & ATMOSPHERE
          Visual storytelling of the river landscape ecosystems
         ========================================================================= */}
      <section id="destinations" className="py-24 sm:py-32 px-4 sm:px-6 lg:px-8 border-b border-[#E6DFD5]">
        <div className="max-w-7xl mx-auto space-y-16">
          
          <div className="max-w-3xl space-y-3">
            <span className="text-xs uppercase tracking-[0.24em] font-bold text-[#8A6240]">
              The Landscapes
            </span>
            <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#16231E] tracking-tight">
              Three Distinct River Ecosystems
            </h2>
            <p className="text-sm sm:text-base text-[#5A635F] leading-relaxed">
              From rocky island rapids in Karnataka to cool highland slopes and palm backwaters in the south.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {DESTINATION_LANDSCAPES.map((dest, idx) => (
              <Link
                key={idx}
                to={`/properties/${dest.propertyId}`}
                className="group bg-white border border-[#E6DFD5] rounded-3xl overflow-hidden shadow-xs hover:shadow-lg transition-all flex flex-col justify-between"
              >
                <div className="relative h-72 overflow-hidden">
                  <img
                    src={dest.image}
                    alt={dest.city}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-amber-200 block">
                      {dest.tagline}
                    </span>
                    <h3 className="font-serif text-2xl font-bold text-white mt-0.5">
                      {dest.city}
                    </h3>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-4 flex-1 flex flex-col justify-between">
                  <p className="text-xs sm:text-sm text-[#5A635F] leading-relaxed">
                    {dest.description}
                  </p>
                  <div className="pt-4 border-t border-[#E6DFD5] flex items-center justify-between text-xs font-bold text-[#16231E] group-hover:text-[#8A6240]">
                    <span>View Destination Sanctuary</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            ))}
          </div>

        </div>
      </section>

      {/* =========================================================================
          SECTION 6: SIMPLE BOOKING CALL TO ACTION
          Calm, warm closing banner connecting to live availability flow
         ========================================================================= */}
      <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#F4EFEA]">
        <div className="max-w-5xl mx-auto text-center space-y-6">
          <span className="text-xs uppercase tracking-[0.24em] font-bold text-[#8A6240]">
            Begin Your Journey
          </span>

          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-[#16231E] leading-tight">
            Ready to find your sanctuary by the water?
          </h2>

          <p className="text-base sm:text-lg text-[#5A635F] max-w-xl mx-auto leading-relaxed font-light">
            Instant online reservations with transparent pricing, live room inventory, and dedicated hosts waiting to welcome you.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <Link
              to="/availability"
              className="px-8 py-4 rounded-full bg-[#16231E] hover:bg-[#253B33] text-white text-sm font-bold tracking-wide transition-all shadow-md flex items-center space-x-2"
            >
              <Calendar className="w-4 h-4 text-amber-300" />
              <span>Check Live Room Dates</span>
            </Link>

            <Link
              to="/properties"
              className="px-8 py-4 rounded-full bg-white hover:bg-[#FBF9F5] border border-[#E6DFD5] text-[#16231E] text-sm font-bold tracking-wide transition-all shadow-sm flex items-center space-x-2"
            >
              <span>Explore All Stays</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
