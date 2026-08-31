import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, LayoutDashboard, Home } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Unauthorized = () => {
  const { user, isAuthenticated } = useAuth();

  // Send authenticated users to their dashboard, unauthenticated to login
  const safeRoute = isAuthenticated ? '/dashboard' : '/login';
  const safeLabel = isAuthenticated ? 'Go to Dashboard' : 'Sign In';
  const SafeIcon = isAuthenticated ? LayoutDashboard : Home;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto shadow-xs">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Access Denied
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
            You do not have sufficient permissions to view this resource.
            {user?.role && (
              <>
                {' '}Your current role is{' '}
                <strong className="text-slate-800 uppercase font-bold">{user.role}</strong>.
              </>
            )}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to={safeRoute}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-[#16231E] hover:bg-[#253B33] shadow-sm transition-colors cursor-pointer"
          >
            <SafeIcon className="w-4 h-4" />
            <span>{safeLabel}</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Home</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
