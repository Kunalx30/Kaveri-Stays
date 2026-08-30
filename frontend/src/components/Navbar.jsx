import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Hotel, User as UserIcon, LogOut, LogIn, UserPlus,
  Calendar, CreditCard, MessageSquare, LayoutDashboard,
  Building2, BarChart3, ChevronDown, X, Menu,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'manager':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'staff':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default:
        return 'bg-amber-100 text-amber-700 border-amber-200';
    }
  };

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const linkClass = (path) =>
    `flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(path)
        ? 'text-brand-600 bg-brand-50'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  const isStaff = ['staff', 'manager', 'owner'].includes(user?.role);
  const isManagement = ['owner', 'manager'].includes(user?.role);

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center space-x-3 group shrink-0">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center shadow-md shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Hotel className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                Kaveri<span className="text-brand-600">Stays</span>
              </span>
              <span className="block text-[10px] font-semibold text-slate-400 -mt-1 tracking-widest uppercase">
                Luxury &amp; Comfort
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center space-x-1">
            <Link to="/" className={linkClass('/__home__')}>
              <Hotel className="w-4 h-4" />
              <span>Home</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/my-bookings" className={linkClass('/my-bookings')}>
                  <Calendar className="w-4 h-4" />
                  <span>Bookings</span>
                </Link>
                <Link to="/my-payments" className={linkClass('/my-payments')}>
                  <CreditCard className="w-4 h-4" />
                  <span>Payments</span>
                </Link>
                <Link to="/my-reviews" className={linkClass('/my-reviews')}>
                  <MessageSquare className="w-4 h-4" />
                  <span>Reviews</span>
                </Link>

                {isStaff && (
                  <Link to="/staff" className={linkClass('/staff')}>
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Operations</span>
                  </Link>
                )}

                {isManagement && (
                  <>
                    <Link to="/management" className={linkClass('/management')}>
                      <Building2 className="w-4 h-4" />
                      <span>Manage</span>
                    </Link>
                    <Link to="/analytics" className={linkClass('/analytics')}>
                      <BarChart3 className="w-4 h-4" />
                      <span>Analytics</span>
                    </Link>
                  </>
                )}
              </>
            )}
          </div>

          {/* Right side — user info + auth */}
          <div className="flex items-center space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3 pl-4 border-l border-slate-200">
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-semibold text-xs">
                    {user?.full_name?.charAt(0) || <UserIcon className="w-4 h-4" />}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {user?.full_name}
                    </p>
                    <span
                      className={`inline-block px-1.5 py-0.5 text-[9px] font-bold uppercase rounded-md border ${getRoleBadgeColor(
                        user?.role
                      )}`}
                    >
                      {user?.role}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-transparent hover:border-red-200"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 pl-4 border-l border-slate-200">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-700 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Sign In</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 px-4 py-2 rounded-lg text-sm font-semibold text-white gradient-brand hover:opacity-95 shadow-sm shadow-brand-500/20 transition-all hover:shadow"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register</span>
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-slate-100 py-3 space-y-1 animate-fadeIn">
            <Link
              to="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Hotel className="w-4 h-4 text-slate-400" />
              <span>Home</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link to="/my-bookings" onClick={() => setMobileOpen(false)} className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>My Bookings</span>
                </Link>
                <Link to="/my-payments" onClick={() => setMobileOpen(false)} className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <CreditCard className="w-4 h-4 text-slate-400" />
                  <span>My Payments</span>
                </Link>
                <Link to="/my-reviews" onClick={() => setMobileOpen(false)} className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                  <MessageSquare className="w-4 h-4 text-slate-400" />
                  <span>My Reviews</span>
                </Link>

                {isStaff && (
                  <Link to="/staff" onClick={() => setMobileOpen(false)} className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    <span>Staff Operations</span>
                  </Link>
                )}

                {isManagement && (
                  <>
                    <Link to="/management" onClick={() => setMobileOpen(false)} className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <Building2 className="w-4 h-4 text-slate-400" />
                      <span>Management</span>
                    </Link>
                    <Link to="/analytics" onClick={() => setMobileOpen(false)} className="flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
                      <BarChart3 className="w-4 h-4 text-slate-400" />
                      <span>Analytics</span>
                    </Link>
                  </>
                )}

                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                    className="w-full flex items-center space-x-2 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
