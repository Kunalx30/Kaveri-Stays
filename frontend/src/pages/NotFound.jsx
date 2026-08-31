import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Home, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NotFound = () => {
  const { isAuthenticated } = useAuth();

  const homeRoute = isAuthenticated ? '/dashboard' : '/';
  const homeLabel = isAuthenticated ? 'Go to Dashboard' : 'Back to Home';
  const HomeIcon = isAuthenticated ? LayoutDashboard : Home;

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto shadow-xs">
          <Compass className="w-8 h-8 animate-spin" style={{ animationDuration: '8s' }} />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-black text-[#16231E] tracking-tight block">404</span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Page Not Found</h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            The page or route you are looking for does not exist or may have moved.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <Link
            to={homeRoute}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-[#16231E] hover:bg-[#253B33] shadow-sm transition-colors cursor-pointer"
          >
            <HomeIcon className="w-4 h-4" />
            <span>{homeLabel}</span>
          </Link>

          {isAuthenticated && (
            <Link
              to="/"
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl font-bold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>Public Site</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
