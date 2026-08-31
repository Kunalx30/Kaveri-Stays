import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Waves, LogOut, LogIn, UserPlus,
  LayoutDashboard, CalendarDays, CreditCard, MessageSquare, Briefcase,
  Menu, X, BarChart3, Settings, ChevronDown, User as UserIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const isHomePage = location.pathname === '/';
  const accountRef = useRef(null);

  // Scroll listener — only meaningful on homepage for overlay → solid transition
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // set initial state
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsAccountOpen(false);
  }, [location.pathname]);

  // Close account dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setIsAccountOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    setIsAccountOpen(false);
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isStartsWith = (prefix) => location.pathname.startsWith(prefix);

  const isStaffRole = user && ['staff', 'manager', 'owner'].includes(user.role);
  const isManagementRole = user && ['manager', 'owner'].includes(user.role);

  // Transparent when on home and not scrolled; solid cream otherwise
  const transparent = isHomePage && !scrolled;

  const headerBg = transparent
    ? 'bg-transparent'
    : 'bg-[#FBF9F5] border-b border-[#E6DFD5]';

  const linkColor = transparent
    ? 'text-white/90 hover:text-white'
    : 'text-[#3D4640] hover:text-[#16231E]';

  const activeLinkColor = transparent
    ? 'text-white font-semibold'
    : 'text-[#16231E] font-semibold';

  const navLinkClass = (active) =>
    `text-[13px] tracking-wide transition-colors ${active ? activeLinkColor : linkColor}`;

  const getRoleBadgeStyle = (role) => {
    switch (role) {
      case 'owner':   return 'bg-[#E8D5F5] text-purple-900 border-purple-200';
      case 'manager': return 'bg-[#D5E8F5] text-blue-900 border-blue-200';
      case 'staff':   return 'bg-[#D5F0E5] text-emerald-900 border-emerald-200';
      default:        return 'bg-[#F5EDD5] text-amber-900 border-amber-200';
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${headerBg}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">

          {/* ── Brand ── */}
          <Link to="/" className="flex items-center space-x-2.5 group shrink-0" aria-label="Kaveri Stays — Home">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              transparent
                ? 'bg-white/15 border border-white/25'
                : 'bg-[#253B33]/10 border border-[#253B33]/20'
            }`}>
              <Waves className={`w-4 h-4 ${transparent ? 'text-amber-200' : 'text-[#253B33]'}`} />
            </div>
            <div className="leading-none">
              <span className={`font-serif text-xl font-bold tracking-tight block ${
                transparent ? 'text-white' : 'text-[#16231E]'
              }`}>
                Kaveri Stays
              </span>
              <span className={`text-[9px] uppercase tracking-[0.2em] font-medium mt-0.5 block ${
                transparent ? 'text-amber-200/80' : 'text-[#8A6240]'
              }`}>
                Riverside Retreats
              </span>
            </div>
          </Link>

          {/* ── Desktop Navigation ── */}
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8" aria-label="Primary navigation">
            <Link to="/properties" className={navLinkClass(isStartsWith('/properties') && !location.pathname.includes('/availability'))}>
              Explore Stays
            </Link>
            <Link to="/availability" className={navLinkClass(location.pathname.includes('/availability'))}>
              Availability
            </Link>

            {isAuthenticated && isStaffRole && (
              <Link
                to="/staff"
                className={`text-[13px] tracking-wide transition-colors flex items-center space-x-1 ${
                  isStartsWith('/staff')
                    ? activeLinkColor
                    : linkColor
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>Staff Portal</span>
              </Link>
            )}
            {isAuthenticated && isManagementRole && (
              <Link
                to="/management"
                className={`hidden lg:flex items-center space-x-1 text-[13px] tracking-wide transition-colors ${
                  isStartsWith('/management') ? activeLinkColor : linkColor
                }`}
              >
                <Settings className="w-3 h-3" />
                <span>Management</span>
              </Link>
            )}
            {isAuthenticated && isManagementRole && (
              <Link
                to="/analytics"
                className={`hidden xl:flex items-center space-x-1 text-[13px] tracking-wide transition-colors ${
                  isStartsWith('/analytics') ? activeLinkColor : linkColor
                }`}
              >
                <BarChart3 className="w-3 h-3" />
                <span>Analytics</span>
              </Link>
            )}
          </nav>

          {/* ── Desktop Auth Area ── */}
          <div className="hidden md:flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="relative" ref={accountRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountOpen((o) => !o)}
                  aria-expanded={isAccountOpen}
                  aria-haspopup="true"
                  aria-label="Account menu"
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                    transparent
                      ? 'text-white/90 hover:text-white hover:bg-white/10 border border-white/20'
                      : 'text-[#3D4640] hover:text-[#16231E] hover:bg-[#F4EFEA] border border-[#E6DFD5]'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    transparent ? 'bg-white/20 text-white' : 'bg-[#253B33]/10 text-[#253B33]'
                  }`}>
                    {user?.full_name?.charAt(0)?.toUpperCase() || <UserIcon className="w-3.5 h-3.5" />}
                  </div>
                  <span className="max-w-[80px] truncate">
                    {user?.full_name?.split(' ')[0] || 'Account'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAccountOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAccountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-[#FBF9F5] border border-[#E6DFD5] rounded-2xl shadow-lg shadow-black/8 overflow-hidden z-50">
                    {/* User info */}
                    <div className="px-4 py-3 border-b border-[#E6DFD5]">
                      <p className="text-xs font-semibold text-[#16231E] truncate">{user?.full_name}</p>
                      <p className="text-[11px] text-[#8A6240] truncate mt-0.5">{user?.email}</p>
                      <span className={`inline-block mt-1.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${getRoleBadgeStyle(user?.role)}`}>
                        {user?.role}
                      </span>
                    </div>

                    {/* Nav links */}
                    <div className="py-1.5">
                      <DropdownLink to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={isActive('/dashboard')} onClick={() => setIsAccountOpen(false)} />
                      <DropdownLink to="/my-bookings" icon={CalendarDays} label="My Bookings" active={isStartsWith('/my-bookings')} onClick={() => setIsAccountOpen(false)} />
                      <DropdownLink to="/my-payments" icon={CreditCard} label="My Payments" active={isStartsWith('/my-payments')} onClick={() => setIsAccountOpen(false)} />
                      <DropdownLink to="/my-reviews" icon={MessageSquare} label="My Reviews" active={isStartsWith('/my-reviews')} onClick={() => setIsAccountOpen(false)} />
                      {isManagementRole && (
                        <>
                          <div className="h-px bg-[#E6DFD5] mx-3 my-1" />
                          <DropdownLink to="/management" icon={Settings} label="Management" active={isStartsWith('/management')} onClick={() => setIsAccountOpen(false)} />
                          <DropdownLink to="/analytics" icon={BarChart3} label="Analytics" active={isStartsWith('/analytics')} onClick={() => setIsAccountOpen(false)} />
                        </>
                      )}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-[#E6DFD5] py-1.5">
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-[12px] text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`flex items-center space-x-1.5 text-[13px] font-medium transition-colors ${linkColor}`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all flex items-center space-x-1.5 ${
                    transparent
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-[#16231E] hover:bg-[#253B33] text-white shadow-sm'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Reserve</span>
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile Hamburger ── */}
          <button
            type="button"
            onClick={() => setIsMenuOpen((o) => !o)}
            aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={isMenuOpen}
            className={`md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg transition-colors cursor-pointer ${
              transparent
                ? 'text-white hover:bg-white/10 border border-white/25'
                : 'text-[#3D4640] hover:bg-[#F4EFEA] border border-[#E6DFD5]'
            }`}
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* ── Mobile Menu ── */}
        {isMenuOpen && (
          <nav
            className="md:hidden border-t border-[#E6DFD5] bg-[#FBF9F5] pb-4 pt-2 space-y-0.5 overflow-hidden"
            aria-label="Mobile navigation"
          >
            <MobileLink to="/" label="Home" active={isActive('/')} onClick={() => setIsMenuOpen(false)} />
            <MobileLink to="/properties" label="Explore Stays" active={isStartsWith('/properties') && !location.pathname.includes('/availability')} onClick={() => setIsMenuOpen(false)} />
            <MobileLink to="/availability" label="Availability" active={location.pathname.includes('/availability')} onClick={() => setIsMenuOpen(false)} />

            {isAuthenticated && (
              <>
                <div className="pt-2 pb-1 px-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#8A6240]">My Account</span>
                </div>
                <MobileLink to="/dashboard" label="Dashboard" active={isActive('/dashboard')} onClick={() => setIsMenuOpen(false)} />
                <MobileLink to="/my-bookings" label="My Bookings" active={isStartsWith('/my-bookings')} onClick={() => setIsMenuOpen(false)} />
                <MobileLink to="/my-payments" label="My Payments" active={isStartsWith('/my-payments')} onClick={() => setIsMenuOpen(false)} />
                <MobileLink to="/my-reviews" label="My Reviews" active={isStartsWith('/my-reviews')} onClick={() => setIsMenuOpen(false)} />
              </>
            )}

            {isAuthenticated && isStaffRole && (
              <>
                <div className="pt-2 pb-1 px-4">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-[#8A6240]">Operations</span>
                </div>
                <MobileLink to="/staff" label="Staff Portal" active={isStartsWith('/staff')} onClick={() => setIsMenuOpen(false)} />
              </>
            )}

            {isAuthenticated && isManagementRole && (
              <>
                <MobileLink to="/management" label="Management" active={isStartsWith('/management')} onClick={() => setIsMenuOpen(false)} />
                <MobileLink to="/analytics" label="Analytics" active={isStartsWith('/analytics')} onClick={() => setIsMenuOpen(false)} />
              </>
            )}

            {/* Auth footer area */}
            <div className="pt-3 mt-2 border-t border-[#E6DFD5] px-4">
              {isAuthenticated ? (
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-[#16231E] truncate">{user?.full_name || user?.email}</p>
                    <span className={`inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border ${getRoleBadgeStyle(user?.role)}`}>
                      {user?.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex items-center space-x-1.5 px-3 py-2 rounded-lg text-[12px] font-medium text-rose-700 hover:bg-rose-50 border border-rose-100 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 rounded-lg text-[12px] font-semibold text-[#16231E] border border-[#E6DFD5] hover:bg-[#F4EFEA] transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex-1 text-center px-4 py-2.5 rounded-lg text-[12px] font-semibold text-white bg-[#16231E] hover:bg-[#253B33] transition-colors"
                  >
                    Reserve
                  </Link>
                </div>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────────

const DropdownLink = ({ to, icon: Icon, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`flex items-center space-x-2.5 px-4 py-2 text-[12px] transition-colors ${
      active
        ? 'text-[#16231E] font-semibold bg-[#F4EFEA]'
        : 'text-[#5A635F] hover:text-[#16231E] hover:bg-[#F4EFEA]'
    }`}
  >
    <Icon className="w-3.5 h-3.5 shrink-0" />
    <span>{label}</span>
  </Link>
);

const MobileLink = ({ to, label, active, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`block px-4 py-2.5 text-[13px] font-medium rounded-lg mx-2 transition-colors ${
      active
        ? 'text-[#16231E] font-semibold bg-[#EDE8E1]'
        : 'text-[#5A635F] hover:text-[#16231E] hover:bg-[#F4EFEA]'
    }`}
  >
    {label}
  </Link>
);

export default Navbar;
