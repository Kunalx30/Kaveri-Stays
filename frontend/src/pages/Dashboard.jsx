import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Shield, Mail, Key, Building2, RefreshCw, LogOut, CheckCircle2,
  Sparkles, ArrowRight, Hotel, Calendar, CreditCard, Star,
  BarChart3, Layers, Lock, MapPin, Leaf, Clock, Users,
  ShieldCheck, BadgeCheck, Zap, Globe
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ErrorMessage from '../components/common/ErrorMessage';

// Role-specific privilege descriptions
const ROLE_PRIVILEGES = {
  owner: [
    { icon: Globe, label: 'Full Portfolio Access', desc: 'View, edit and manage all 3 resort properties across Coorg, Ooty and Alleppey.' },
    { icon: BarChart3, label: 'Revenue & Analytics', desc: 'Real-time revenue dashboards, occupancy trends and seasonal rate performance.' },
    { icon: Users, label: 'Team Management', desc: 'Assign and oversee property managers and front-desk operations staff.' },
    { icon: ShieldCheck, label: 'Unrestricted System Access', desc: 'All backend endpoints, all mutations, and all administrative controls.' },
  ],
  manager: [
    { icon: Hotel, label: 'Property Management', desc: 'Edit room inventory, amenities, and pricing for your assigned property.' },
    { icon: Calendar, label: 'Booking Oversight', desc: 'Monitor active reservations, approve check-ins and manage guest requests.' },
    { icon: BarChart3, label: 'Property Analytics', desc: 'Occupancy rates, revenue metrics and guest review trends for your property.' },
    { icon: Users, label: 'Staff Coordination', desc: 'Coordinate front-desk team schedules, task assignments and operational notes.' },
  ],
  staff: [
    { icon: Calendar, label: 'Reservation Handling', desc: 'View upcoming arrivals, process check-ins and mark departures with ease.' },
    { icon: Clock, label: 'Shift Operations', desc: 'Access live operational booking queue for your shift and property.' },
    { icon: BadgeCheck, label: 'Guest Verification', desc: 'Verify booking references, guest identity, and room assignment on arrival.' },
    { icon: Zap, label: 'Quick Status Updates', desc: 'Mark bookings as checked-in, in-house or checked-out directly from the front desk portal.' },
  ],
  guest: [
    { icon: Calendar, label: 'Easy Reservations', desc: 'Browse real-time availability across all 3 destinations and book with transparent pricing.' },
    { icon: Star, label: 'Share Your Experience', desc: 'Write and manage verified stay reviews that help future guests choose better.' },
    { icon: CreditCard, label: 'Secure Payments', desc: 'All transactions are encrypted and logged. Full invoice history available anytime.' },
    { icon: Leaf, label: 'Thoughtful Hospitality', desc: 'Each stay is hand-inspected by our team for comfort, cleanliness, and genuine warmth.' },
  ],
};

const STAY_PROMISE = [
  {
    icon: ShieldCheck,
    title: 'Zero Double-Booking Guarantee',
    desc: 'Our PostgreSQL engine locks reservation date ranges at the database level the moment you confirm. No overlap is physically possible — your room is exclusively yours.',
  },
  {
    icon: Leaf,
    title: 'Hand-Inspected Every Season',
    desc: 'Our team personally inspects each of the 3 properties before every peak season. Bed quality, river access, dining freshness, and water quality are checked in person.',
  },
  {
    icon: Star,
    title: 'Authentic Unedited Reviews',
    desc: 'Every guest review on Kaveri Stays is published as written. We do not remove, edit, or bury negative feedback. Transparent ratings build genuine trust.',
  },
  {
    icon: Clock,
    title: 'Live Inventory, Real Time',
    desc: 'Room availability reflects actual backend state at the moment you view it — no stale cache, no delays, no "call to confirm" workarounds.',
  },
];

const Dashboard = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setSuccessMsg('');
    setErrorMsg('');
    try {
      await refreshUser();
      setSuccessMsg('Session verified. Your profile details have been refreshed from the server.');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch {
      setErrorMsg('Failed to refresh user profile. Please try again or sign in again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'owner':   return { label: 'Executive Owner',    style: 'bg-[#F4EFEA] text-[#8A6240] border-[#E6DFD5]' };
      case 'manager': return { label: 'Property Manager',   style: 'bg-[#EBF2F7] text-[#2C5282] border-[#D0E0EC]' };
      case 'staff':   return { label: 'Operations Staff',   style: 'bg-[#EAF3EE] text-[#1B4D3E] border-[#CDE3D6]' };
      default:        return { label: 'Valued Guest',       style: 'bg-[#FDF6EC] text-[#B45309] border-[#FCE2C1]' };
    }
  };

  const getAssociationLabel = () => {
    if (user?.guest_id)   return `Guest Account #${user.guest_id}`;
    if (user?.property_id) return `Property #${user.property_id}`;
    return 'Full Portfolio Access';
  };

  const getAssociationDetail = () => {
    if (user?.guest_id)   return 'Personal reservation and review profile linked to your guest record';
    if (user?.property_id) return 'Dedicated resort management assignment for your assigned property';
    return 'Unrestricted access to all 3 Kaveri Stays properties and full system controls';
  };

  const roleInfo = getRoleBadge(user?.role);
  const privileges = ROLE_PRIVILEGES[user?.role] || ROLE_PRIVILEGES.guest;

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-[#1A1E1C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-10">

        {/* ── Welcome Header Card ── */}
        <div className="relative overflow-hidden bg-white border border-[#E6DFD5] rounded-3xl p-6 sm:p-10 shadow-xs space-y-6">
          {/* Subtle decorative element */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#F4EFEA] rounded-full -translate-y-1/2 translate-x-1/2 opacity-40 pointer-events-none" />

          <div className="relative flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4EFEA] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-[0.2em] text-[#8A6240]">
                  <Sparkles className="w-3 h-3 text-amber-600" />
                  <span>Kaveri Account Hub</span>
                </span>
                {user?.role && (
                  <span className={`inline-block px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full border ${roleInfo.style}`}>
                    {roleInfo.label}
                  </span>
                )}
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#16231E] tracking-tight">
                Welcome back,<br className="hidden sm:block" />{' '}
                <span className="text-[#2D453B]">{user?.full_name || 'Valued Guest'}</span>
              </h1>
              <p className="text-sm sm:text-base text-[#5A635F] font-light leading-relaxed">
                This is your personal command centre for the Kaveri Stays platform. From here you can manage your stay reservations, view payment records, leave guest reviews, and access role-specific portals for hotel management, analytics, and front-desk operations.
              </p>
              <div className="flex flex-wrap gap-4 pt-1 text-xs font-medium text-[#5A635F]">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Live session authenticated</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Account active &amp; verified</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#8A6240]" />
                  <span>3 Kaveri Stays destinations available</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 self-start shrink-0">
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-[#16231E] bg-[#F4EFEA] hover:bg-[#EDE8E1] border border-[#E6DFD5] transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh session details"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh Session</span>
              </button>

              <button
                onClick={handleLogout}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors cursor-pointer"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="bg-[#EAF3EE] border border-[#CDE3D6] rounded-2xl p-4 flex items-center justify-between text-xs text-[#1B4D3E]">
              <div className="flex items-center space-x-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#1B4D3E] shrink-0" />
                <span>{successMsg}</span>
              </div>
              <button onClick={() => setSuccessMsg('')} className="text-[#2A6E59] hover:text-[#1B4D3E] font-bold text-base leading-none cursor-pointer" aria-label="Dismiss">
                &times;
              </button>
            </div>
          )}

          <ErrorMessage message={errorMsg} onDismiss={() => setErrorMsg('')} />
        </div>

        {/* ── Profile & Role Association Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Email */}
          <div className="bg-white border border-[#E6DFD5] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A857F]">Identity &amp; Email</span>
              <div className="w-9 h-9 rounded-2xl bg-[#EBF2F7] flex items-center justify-center text-[#2C5282]">
                <Mail className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="font-serif text-xl font-normal text-[#16231E] truncate" title={user?.email}>{user?.email}</p>
              <p className="text-xs text-[#7A857F] font-light">Unique Account ID: <span className="font-semibold text-[#5A635F]">#{user?.user_id}</span></p>
              <p className="text-xs text-[#7A857F] font-light leading-relaxed">
                This is the email address linked to your Kaveri Stays account. All booking confirmations, payment receipts, and session notifications are sent to this address.
              </p>
            </div>
          </div>

          {/* Role */}
          <div className="bg-white border border-[#E6DFD5] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A857F]">Role Assignment</span>
              <div className="w-9 h-9 rounded-2xl bg-[#F4EFEA] flex items-center justify-center text-[#8A6240]">
                <Shield className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="font-serif text-xl font-normal text-[#16231E] capitalize">{user?.role} Tier</p>
              <div className="flex items-center space-x-1.5 text-xs text-[#1B4D3E] font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>{user?.is_active ? 'Active &amp; Verified Account' : 'Inactive'}</span>
              </div>
              <p className="text-xs text-[#7A857F] font-light leading-relaxed">
                Your role controls which sections of the platform you can access. Role assignments are managed server-side and cannot be self-modified.
              </p>
            </div>
          </div>

          {/* Scope */}
          <div className="bg-white border border-[#E6DFD5] rounded-3xl p-6 shadow-xs space-y-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#7A857F]">System Scope</span>
              <div className="w-9 h-9 rounded-2xl bg-[#EAF3EE] flex items-center justify-center text-[#1B4D3E]">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="space-y-1.5">
              <p className="font-serif text-xl font-normal text-[#16231E]">{getAssociationLabel()}</p>
              <p className="text-xs text-[#7A857F] font-light leading-relaxed">{getAssociationDetail()}</p>
            </div>
          </div>
        </div>

        {/* ── Role-Based Privileges Panel ── */}
        <div className="space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8A6240]">
              Your Access Privileges — {roleInfo.label}
            </span>
            <p className="text-sm text-[#5A635F] mt-1 font-light">
              The following capabilities are active for your current role and session.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {privileges.map((priv, i) => {
              const Icon = priv.icon;
              return (
                <div key={i} className="bg-white border border-[#E6DFD5] rounded-3xl p-6 shadow-xs space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F4EFEA] flex items-center justify-center text-[#8A6240]">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-semibold text-sm text-[#16231E]">{priv.label}</h3>
                    <p className="text-xs text-[#5A635F] leading-relaxed font-light">{priv.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Quick Navigation Shortcuts Hub ── */}
        <div className="space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8A6240]">Account Shortcuts &amp; Portals</span>
            <p className="text-sm text-[#5A635F] mt-1 font-light">Jump directly to any section available to your role.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {(user?.role === 'owner' || user?.role === 'manager') && (
              <Link to="/management" className="group bg-white border border-[#E6DFD5] hover:border-[#8A6240]/50 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#F4EFEA] flex items-center justify-center text-[#8A6240]"><Hotel className="w-5 h-5" /></div>
                  <ArrowRight className="w-4 h-4 text-[#A8B5AE] group-hover:text-[#16231E] group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-normal text-[#16231E]">Hotel Management</h3>
                  <p className="text-xs text-[#5A635F] font-light leading-relaxed">Manage properties, room types, room inventory, and seasonal rate plans across all assigned destinations.</p>
                </div>
              </Link>
            )}

            {(user?.role === 'owner' || user?.role === 'manager') && (
              <Link to="/analytics" className="group bg-white border border-[#E6DFD5] hover:border-[#8A6240]/50 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#EBF2F7] flex items-center justify-center text-[#2C5282]"><BarChart3 className="w-5 h-5" /></div>
                  <ArrowRight className="w-4 h-4 text-[#A8B5AE] group-hover:text-[#16231E] group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-normal text-[#16231E]">Business Analytics</h3>
                  <p className="text-xs text-[#5A635F] font-light leading-relaxed">Revenue reports, occupancy heatmaps, booking trends, and review sentiment analysis in real time.</p>
                </div>
              </Link>
            )}

            {(user?.role === 'staff' || user?.role === 'manager' || user?.role === 'owner') && (
              <Link to="/staff" className="group bg-white border border-[#E6DFD5] hover:border-[#8A6240]/50 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-[#EAF3EE] flex items-center justify-center text-[#1B4D3E]"><Layers className="w-5 h-5" /></div>
                  <ArrowRight className="w-4 h-4 text-[#A8B5AE] group-hover:text-[#16231E] group-hover:translate-x-0.5 transition-all" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-normal text-[#16231E]">Front Desk Hub</h3>
                  <p className="text-xs text-[#5A635F] font-light leading-relaxed">Process guest arrivals, manage active check-ins, mark departures, and handle operational booking requests for your property.</p>
                </div>
              </Link>
            )}

            <Link to="/my-bookings" className="group bg-white border border-[#E6DFD5] hover:border-[#8A6240]/50 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#FDF6EC] flex items-center justify-center text-[#B45309]"><Calendar className="w-5 h-5" /></div>
                <ArrowRight className="w-4 h-4 text-[#A8B5AE] group-hover:text-[#16231E] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-normal text-[#16231E]">My Bookings</h3>
                <p className="text-xs text-[#5A635F] font-light leading-relaxed">View all confirmed, pending, and past reservations. Cancel upcoming stays or check booking reference numbers.</p>
              </div>
            </Link>

            <Link to="/my-payments" className="group bg-white border border-[#E6DFD5] hover:border-[#8A6240]/50 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#F4EFEA] flex items-center justify-center text-[#8A6240]"><CreditCard className="w-5 h-5" /></div>
                <ArrowRight className="w-4 h-4 text-[#A8B5AE] group-hover:text-[#16231E] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-normal text-[#16231E]">Payment History</h3>
                <p className="text-xs text-[#5A635F] font-light leading-relaxed">Access complete transaction records, payment status, invoice amounts, and method details for all completed bookings.</p>
              </div>
            </Link>

            <Link to="/my-reviews" className="group bg-white border border-[#E6DFD5] hover:border-[#8A6240]/50 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#FFF8EB] flex items-center justify-center text-amber-500"><Star className="w-5 h-5" /></div>
                <ArrowRight className="w-4 h-4 text-[#A8B5AE] group-hover:text-[#16231E] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-normal text-[#16231E]">My Reviews</h3>
                <p className="text-xs text-[#5A635F] font-light leading-relaxed">Read, edit or delete feedback you've shared about past stays. Your unedited reviews help future guests choose with confidence.</p>
              </div>
            </Link>

            <Link to="/properties" className="group bg-white border border-[#E6DFD5] hover:border-[#8A6240]/50 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-2xl bg-[#EAF3EE] flex items-center justify-center text-[#1B4D3E]"><Hotel className="w-5 h-5" /></div>
                <ArrowRight className="w-4 h-4 text-[#A8B5AE] group-hover:text-[#16231E] group-hover:translate-x-0.5 transition-all" />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-normal text-[#16231E]">Explore Stays</h3>
                <p className="text-xs text-[#5A635F] font-light leading-relaxed">Browse Kaveri Riverside (Coorg), Kaveri Hilltop (Ooty), and Kaveri Backwaters (Alleppey) with live room availability.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* ── The Kaveri Stay Promise ── */}
        <div className="space-y-5">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#8A6240]">The Kaveri Stays Promise</span>
            <p className="text-sm text-[#5A635F] mt-1 font-light">
              Four commitments that underpin every reservation made on this platform.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {STAY_PROMISE.map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="bg-white border border-[#E6DFD5] rounded-3xl p-7 shadow-xs flex gap-5 items-start">
                  <div className="w-11 h-11 rounded-2xl bg-[#F4EFEA] flex items-center justify-center text-[#8A6240] shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-semibold text-sm text-[#16231E]">{item.title}</h3>
                    <p className="text-xs text-[#5A635F] leading-relaxed font-light">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Session Security Card ── */}
        <div className="relative overflow-hidden bg-[#16231E] rounded-3xl p-6 sm:p-10 text-white shadow-md">
          <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-amber-300 text-xs font-bold uppercase tracking-[0.2em]">
                <Lock className="w-4 h-4 text-amber-300" />
                <span>Cryptographic Session Security</span>
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white leading-snug">
                Protected Enterprise Authentication Active
              </h2>
              <p className="text-sm text-[#A8B5AE] leading-relaxed font-light">
                All protected API requests are securely authenticated using signed JWT Bearer tokens injected through the Axios client interceptor on every outgoing request.
              </p>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                {[
                  { label: 'Token Rotation', detail: 'On access token expiry, the client silently calls /auth/refresh and retries the original request without interrupting the user.' },
                  { label: 'Session Invalidation', detail: 'If token refresh fails (expired refresh token or server rejection), the session is fully cleared and the user is redirected to sign in.' },
                  { label: 'Role-Scoped API Access', detail: 'Backend endpoints enforce role checks independently of the frontend. Even direct API calls without a valid role claim are rejected with 403.' },
                ].map((item, i) => (
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-1">
                    <p className="text-xs font-bold text-amber-200 uppercase tracking-wider">{item.label}</p>
                    <p className="text-xs text-[#A8B5AE] leading-relaxed font-light">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
